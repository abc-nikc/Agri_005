import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { CostRecord } from '../models/cost-record.entity';
import { SalesRecord } from '../models/sales-record.entity';
import { ProductionBatch } from '../models/production-batch.entity';
import { Plot } from '../models/plot.entity';

export class CostService {
  private costRepo: Repository<CostRecord>;
  private salesRepo: Repository<SalesRecord>;
  private batchRepo: Repository<ProductionBatch>;
  private plotRepo: Repository<Plot>;

  constructor() {
    this.costRepo = AppDataSource.getRepository(CostRecord);
    this.salesRepo = AppDataSource.getRepository(SalesRecord);
    this.batchRepo = AppDataSource.getRepository(ProductionBatch);
    this.plotRepo = AppDataSource.getRepository(Plot);
  }

  // ===== 成本记录 CRUD =====
  async addCost(data: Partial<CostRecord>): Promise<CostRecord> {
    const r = this.costRepo.create(data);
    return await this.costRepo.save(r);
  }

  async getCosts(filters?: { plotId?: string; batchId?: string; type?: string }): Promise<CostRecord[]> {
    const where: any = {};
    if (filters?.plotId) where.plotId = filters.plotId;
    if (filters?.batchId) where.batchId = filters.batchId;
    if (filters?.type) where.type = filters.type;
    return await this.costRepo.find({ where, order: { date: 'DESC' } });
  }

  // ===== 销售记录 CRUD =====
  async addSale(data: Partial<SalesRecord>): Promise<SalesRecord> {
    const r = this.salesRepo.create(data);
    return await this.salesRepo.save(r);
  }

  async getSales(filters?: { batchId?: string; paymentStatus?: string }): Promise<SalesRecord[]> {
    const where: any = {};
    if (filters?.batchId) where.batchId = filters.batchId;
    if (filters?.paymentStatus) where.paymentStatus = filters.paymentStatus;
    return await this.salesRepo.find({ where, order: { saleDate: 'DESC' } });
  }

  // ===== FR-032/033: 成本核算 =====
  async costByPlot(plotId: string) {
    const costs = await this.costRepo.find({ where: { plotId } });
    const plot = await this.plotRepo.findOne({ where: { id: plotId } });
    return this.groupCosts(costs, '地块', plot?.plotNumber, Number(plot?.area || 0));
  }

  async costByBatch(batchId: string) {
    const costs = await this.costRepo.find({ where: { batchId } });
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    return this.groupCosts(costs, '批次', batch?.batchNumber, Number(batch?.area || 0));
  }

  // ===== FR-034: 单位成本 =====
  async unitCost(batchId: string) {
    const costs = await this.costRepo.find({ where: { batchId } });
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    const totalCost = costs.reduce((s, c) => s + Number(c.amount), 0);
    const area = Number(batch?.area || 0);
    const yield_ = Number(batch?.estimatedHarvestDate ? 0 : 0);

    // Calculate yield from harvest operations
    const { FarmingOperation } = await import('../models/farming-operation.entity');
    const opRepo = AppDataSource.getRepository(FarmingOperation);
    const harvests = await opRepo.find({ where: { plotId: batch?.plotId, operationType: '采收' } });
    const totalYield = harvests.reduce((s, h) => s + Number(h.harvestYield || 0), 0);

    return {
      batchNumber: batch?.batchNumber,
      area,
      totalCost,
      totalYield,
      costPerMu: area > 0 ? totalCost / area : 0,
      costPerKg: totalYield > 0 ? totalCost / totalYield : 0,
      breakdown: this.breakdownByType(costs),
    };
  }

  // ===== FR-035/036: 收入与利润（多维度） =====
  async profitAnalysis(filters?: { batchId?: string; variety?: string; plotId?: string }) {
    const costWhere: any = {};
    const saleWhere: any = {};

    // 多维度过滤：支持批次、品种、地块
    if (filters?.batchId) {
      costWhere.batchId = filters.batchId;
      // sales doesn't have batchId; match by variety from batch
      const batch = await this.batchRepo.findOne({ where: { id: filters.batchId } });
      if (batch) saleWhere.varietyName = batch.varietyName;
    }
    if (filters?.variety) saleWhere.varietyName = filters.variety;
    if (filters?.plotId) {
      costWhere.plotId = filters.plotId;
      // get variety names for the plot's batches to filter sales
      const plotBatches = await this.batchRepo.find({ where: { plotId: filters.plotId } });
      const varNames = [...new Set(plotBatches.map(b => b.varietyName))];
      if (varNames.length) saleWhere.varietyName = { $in: varNames } as any;
    }

    const [costs, sales] = await Promise.all([
      this.costRepo.find({ where: costWhere }),
      this.salesRepo.find({ where: saleWhere }),
    ]);

    const totalCost = costs.reduce((s, c) => s + Number(c.amount), 0);
    const totalRevenue = sales.reduce((s, r) => s + Number(r.totalAmount), 0);
    const totalQuantity = sales.reduce((s, r) => s + Number(r.quantity), 0);
    const paidRevenue = sales.filter(s => s.paymentStatus === '已付款').reduce((s, r) => s + Number(r.totalAmount), 0);

    return {
      totalCost,
      totalRevenue,
      profit: totalRevenue - totalCost,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0,
      totalQuantity,
      paidRevenue,
      unpaidRevenue: totalRevenue - paidRevenue,
      costBreakdown: this.breakdownByType(costs),
      // 多维度明细
      costCount: costs.length,
      salesCount: sales.length,
      byType: this.breakdownByType(costs),
    };
  }

  // ===== FR-037: 产量预估 =====
  async yieldPredict(varietyName: string) {
    const batches = await this.batchRepo.find({ where: { varietyName, status: '已完成' } });
    if (batches.length === 0) return { prediction: null, message: '该品种暂无历史数据' };

    const yields = batches.map(b => Number(b.area || 0) > 0 ? 0 : 0);

    // 从采收记录取实际产量
    const { FarmingOperation } = await import('../models/farming-operation.entity');
    const opRepo = AppDataSource.getRepository(FarmingOperation);

    let totalYield = 0;
    let totalArea = 0;
    const batchYields: any[] = [];

    for (const batch of batches) {
      const harvests = await opRepo.find({ where: { operationType: '采收' }, order: { operationDate: 'DESC' } });
      const batchYield = harvests.filter(h => h.varietyName === varietyName).reduce((s, h) => s + Number(h.harvestYield || 0), 0);
      batchYields.push({ batchNumber: batch.batchNumber, yield: batchYield, area: Number(batch.area) });
      totalYield += batchYield;
      totalArea += Number(batch.area || 0);
    }

    const avgYieldPerMu = totalArea > 0 ? totalYield / totalArea : 0;
    const confidence = batches.length >= 3 ? '高' : batches.length >= 2 ? '中' : '低';

    return {
      varietyName,
      historicalBatches: batches.length,
      avgYieldPerMu: Math.round(avgYieldPerMu),
      totalHistoricalYield: totalYield,
      confidence,
      detail: batchYields,
      prediction: avgYieldPerMu > 0 ? `预计亩产约 ${Math.round(avgYieldPerMu)} kg（置信度：${confidence}）` : '数据不足',
    };
  }

  // ===== FR-038: 批次对比 + 效率排名 =====
  async batchCompare(varietyName: string) {
    const batches = await this.batchRepo.find({
      where: { varietyName },
      order: { sowDate: 'DESC' },
      take: 20,
    });

    const { FarmingOperation } = await import('../models/farming-operation.entity');
    const opRepo = AppDataSource.getRepository(FarmingOperation);

    const result = [];
    for (const b of batches) {
      const [costs, harvests] = await Promise.all([
        this.costRepo.find({ where: { batchId: b.id } }),
        opRepo.find({ where: { batchId: b.id, operationType: '采收' } }),
      ]);

      const totalCost = costs.reduce((s, c) => s + Number(c.amount), 0);
      const totalYield = harvests.reduce((s, h) => s + Number(h.harvestYield || 0), 0);
      const area = Number(b.area || 0);

      const costPerMu = area > 0 ? totalCost / area : 0;
      const efficiency = totalYield > 0 ? totalCost / totalYield : 0;
      const yieldPerMu = area > 0 ? totalYield / area : 0;

      result.push({
        batchId: b.id,
        batchNumber: b.batchNumber,
        sowDate: b.sowDate,
        status: b.status,
        area,
        totalCost: Math.round(totalCost),
        yield: totalYield,
        yieldPerMu: Math.round(yieldPerMu * 10) / 10,
        costPerMu: Math.round(costPerMu),
        efficiency: Math.round(efficiency * 100) / 100,
        fertilizerCost: costs.filter(c => c.type === '肥料').reduce((s, c) => s + Number(c.amount), 0),
        pesticideCost: costs.filter(c => c.type === '农药').reduce((s, c) => s + Number(c.amount), 0),
        laborCost: costs.filter(c => c.type === '人工').reduce((s, c) => s + Number(c.amount), 0),
        costCount: costs.length,
        harvestCount: harvests.length,
      });
    }

    // 按效率排序（每公斤成本越低越好）并标记最佳
    const sorted = [...result].sort((a, b) => a.efficiency - b.efficiency);
    const best = sorted[0];
    if (best && best.efficiency > 0) {
      result.forEach(r => { (r as any).isBest = r.batchNumber === best.batchNumber; });
    }

    return { items: result, best: best || null, count: result.length };
  }

  // ===== FR-039: 综合报表（地块+批次+利润+产量四合一） =====
  async generateReport(filters?: { batchId?: string; plotId?: string }) {
    const costWhere: any = {};
    if (filters?.batchId) costWhere.batchId = filters.batchId;
    if (filters?.plotId) costWhere.plotId = filters.plotId;

    const [allCosts, allSales, allBatches, allPlots] = await Promise.all([
      this.costRepo.find({ where: costWhere }),
      this.salesRepo.find(),
      this.batchRepo.find(),
      this.plotRepo.find(),
    ]);

    // 总览
    const totalCost = allCosts.reduce((s, c) => s + Number(c.amount), 0);
    const totalRevenue = allSales.reduce((s, r) => s + Number(r.totalAmount), 0);
    const totalProfit = totalRevenue - totalCost;

    // 按地块
    const byPlot: Record<string, { plotNumber: string; area: number; cost: number; revenue: number; profit: number }> = {};
    for (const plot of allPlots) {
      const pCosts = allCosts.filter(c => c.plotId === plot.id);
      const pBatches = allBatches.filter(b => b.plotId === plot.id);
      const varNames = [...new Set(pBatches.map(b => b.varietyName))];
      const pSales = allSales.filter(s => varNames.includes(s.varietyName));
      byPlot[plot.id] = {
        plotNumber: plot.plotNumber,
        area: Number(plot.area),
        cost: pCosts.reduce((s, c) => s + Number(c.amount), 0),
        revenue: pSales.reduce((s, r) => s + Number(r.totalAmount), 0),
        profit: pSales.reduce((s, r) => s + Number(r.totalAmount), 0) - pCosts.reduce((s, c) => s + Number(c.amount), 0),
      };
    }

    // 按品种
    const byVariety: Record<string, { cost: number; revenue: number; profit: number; batchCount: number }> = {};
    for (const batch of allBatches) {
      const vn = batch.varietyName;
      if (!byVariety[vn]) byVariety[vn] = { cost: 0, revenue: 0, profit: 0, batchCount: 0 };
      byVariety[vn].batchCount++;
      const vSales = allSales.filter(s => s.varietyName === vn);
      byVariety[vn].revenue += vSales.reduce((s, r) => s + Number(r.totalAmount), 0);
    }
    for (const c of allCosts) {
      const batch = allBatches.find(b => b.id === c.batchId);
      if (batch && byVariety[batch.varietyName]) {
        byVariety[batch.varietyName].cost += Number(c.amount);
      }
    }
    for (const k of Object.keys(byVariety)) {
      byVariety[k].profit = byVariety[k].revenue - byVariety[k].cost;
    }

    return {
      overview: { totalCost, totalRevenue, totalProfit, profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0 },
      byPlot: Object.values(byPlot),
      byVariety: Object.entries(byVariety).map(([name, data]) => ({ varietyName: name, ...data })),
      costBreakdown: this.breakdownByType(allCosts),
    };
  }

  private groupCosts(costs: CostRecord[], scope: string, name?: string, area?: number) {
    const total = costs.reduce((s, c) => s + Number(c.amount), 0);
    return {
      scope, name, area: area || 0,
      totalCost: total,
      perMu: area && area > 0 ? total / area : 0,
      breakdown: this.breakdownByType(costs),
      items: costs,
    };
  }

  private breakdownByType(costs: CostRecord[]) {
    const map: Record<string, number> = {};
    for (const c of costs) { map[c.type] = (map[c.type] || 0) + Number(c.amount); }
    return Object.entries(map).map(([type, amount]) => ({ type, amount }));
  }
}
