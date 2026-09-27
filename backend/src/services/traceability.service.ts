import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { TraceabilityRecord } from '../models/traceability-record.entity';
import { ProductionBatch } from '../models/production-batch.entity';
import { FarmingOperation } from '../models/farming-operation.entity';
import { StockTransaction } from '../models/stock-transaction.entity';
import { Inventory } from '../models/inventory.entity';
import * as QRCode from 'qrcode';

export class TraceabilityService {
  private repo: Repository<TraceabilityRecord>;
  private batchRepo: Repository<ProductionBatch>;
  private opRepo: Repository<FarmingOperation>;
  private txnRepo: Repository<StockTransaction>;
  private invRepo: Repository<Inventory>;

  constructor() {
    this.repo = AppDataSource.getRepository(TraceabilityRecord);
    this.batchRepo = AppDataSource.getRepository(ProductionBatch);
    this.opRepo = AppDataSource.getRepository(FarmingOperation);
    this.txnRepo = AppDataSource.getRepository(StockTransaction);
    this.invRepo = AppDataSource.getRepository(Inventory);
  }

  // FR-027: 为批次聚合全链条数据
  async generateTrace(batchId: string, operator: string): Promise<TraceabilityRecord> {
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) throw new Error('批次不存在');
    if (batch.status !== '已完成') throw new Error('只有已完成的批次才能生成追溯码');

    // 检查是否已生成
    const existing = await this.repo.findOne({ where: { batchId } });
    if (existing) {
      // 已生成的追溯记录在补录质检后同步质量快照，保证公开扫码页展示最新结果。
      existing.qualityData = {
        status: batch.qualityStatus,
        grade: batch.qualityGrade,
        actualYield: batch.actualYield,
        notes: batch.inspectionNotes,
        inspectedAt: batch.inspectedAt,
        inspectedBy: batch.inspectedBy,
      };
      if (!existing.qrCodeUrl) {
        existing.qrCodeUrl = await QRCode.toDataURL(this.getScanUrl(existing.traceCode));
      }
      return await this.repo.save(existing);
    }

    // 聚合农事操作数据
    const operations = await this.opRepo.find({
      where: { plotId: batch.plotId },
      order: { operationDate: 'ASC' },
    });

    // 聚合投入品（施肥+打药）
    const inputs = operations
      .filter(o => o.fertilizerName || o.pesticideName)
      .map(o => ({
        type: o.fertilizerName ? '肥料' : '农药',
        name: o.fertilizerName || o.pesticideName,
        amount: o.fertilizerAmount || o.pesticideAmount,
        unit: o.fertilizerUnit || o.pesticideUnit,
        date: o.operationDate,
      }));

    // 聚合库存记录（同品种）
    const inventory = await this.invRepo.find({ where: { name: batch.varietyName } });

    // 聚合销售记录
    const sales = await this.txnRepo.find({
      where: { subType: '销售出库' },
      order: { transactionDate: 'DESC' },
    });

    // 生成追溯码
    const traceCode = `TRACE-${batch.batchNumber}-${Date.now().toString(36)}`;

    const record = this.repo.create({
      traceCode, batchId: batch.id, batchNumber: batch.batchNumber,
      plotName: batch.plotName, varietyName: batch.varietyName,
      sowDate: batch.sowDate, harvestDate: batch.actualHarvestDate, area: Number(batch.area),
      operationsData: operations.map(op => ({
        type: op.operationType, date: op.operationDate,
        operator: op.operatorName, detail: this.getOpDetail(op),
      })),
      inputsData: inputs,
      inventoryData: inventory.map(i => ({
        name: i.name, quantity: i.quantity, unit: i.unit,
        qualityGrade: i.qualityGrade, location: i.location,
      })),
      salesData: sales.filter(s => s.itemName === batch.varietyName).map(s => ({
        date: s.transactionDate, quantity: s.quantity, unit: s.unit,
        destination: s.sourceOrDest, operator: s.operator,
      })),
      qualityData: {
        status: batch.qualityStatus,
        grade: batch.qualityGrade,
        actualYield: batch.actualYield,
        notes: batch.inspectionNotes,
        inspectedAt: batch.inspectedAt,
        inspectedBy: batch.inspectedBy,
      },
    });

    const saved = await this.repo.save(record);

    // 更新批次追溯码
    batch.traceabilityCode = traceCode;
    await this.batchRepo.save(batch);

    // FR-028: 生成二维码
    saved.qrCodeUrl = await QRCode.toDataURL(this.getScanUrl(traceCode));
    await this.repo.save(saved);

    return saved;
  }

  // FR-028: 消费者扫码查询（无需认证）
  async getByCode(traceCode: string): Promise<TraceabilityRecord | null> {
    return await this.repo.findOne({ where: { traceCode } });
  }

  // FR-029: 导出PDF报告（管理员）
  async exportReport(traceCode: string, operator: string): Promise<string> {
    const record = await this.repo.findOne({ where: { traceCode } });
    if (!record) throw new Error('追溯记录不存在');

    // 生成HTML报告
    const html = this.buildReportHTML(record);
    
    // 记录导出日志
    record.exportedAt = new Date();
    record.exportedBy = operator;
    await this.repo.save(record);

    return html;
  }

  async findAll(): Promise<TraceabilityRecord[]> {
    return await this.repo.find({ order: { createdAt: 'DESC' } });
  }

  // FR-030: 不可删除（不提供delete方法）

  private getScanUrl(traceCode: string): string {
    const frontendOrigin = (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0].trim();
    return `${frontendOrigin}/trace/${traceCode}`;
  }

  private getOpDetail(op: FarmingOperation): string {
    const parts = [];
    if (op.fertilizerName) parts.push(`${op.fertilizerName}${op.fertilizerAmount}${op.fertilizerUnit || 'kg'}`);
    if (op.pesticideName) parts.push(`${op.pesticideName}${op.pesticideAmount}${op.pesticideUnit || 'ml'}`);
    if (op.workDescription) parts.push(op.workDescription);
    if (op.harvestYield) parts.push(`产量${op.harvestYield}kg`);
    if (op.waterAmount) parts.push(`${op.waterAmount}${op.waterUnit || 'm³'}`);
    if (op.area) parts.push(`${op.area}亩`);
    return parts.join('，') || '-';
  }

  private buildReportHTML(record: TraceabilityRecord): string {
    const ops = (record.operationsData || []).map((o: any) => `<tr><td>${o.type}</td><td>${new Date(o.date).toLocaleDateString('zh-CN')}</td><td>${o.operator}</td><td>${o.detail}</td></tr>`).join('');
    const inputs = (record.inputsData || []).map((i: any) => `<tr><td>${i.type}</td><td>${i.name}</td><td>${i.amount}${i.unit}</td><td>${new Date(i.date).toLocaleDateString('zh-CN')}</td></tr>`).join('');

    return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>追溯报告 - ${record.traceCode}</title>
<style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:2rem}h1{text-align:center;color:#2c3e50}h2{border-bottom:2px solid #409eff;padding-bottom:8px;color:#409eff}table{width:100%;border-collapse:collapse;margin:1rem 0}th{background:#f5f7fa;padding:8px;text-align:left}td{padding:8px;border-bottom:1px solid #ebeef5}.footer{text-align:center;color:#909399;margin-top:2rem;font-size:0.85rem}</style></head><body>
<h1>农产品质量追溯报告</h1>
<p>追溯码: <strong>${record.traceCode}</strong> | 批次号: ${record.batchNumber} | 生成时间: ${new Date().toLocaleString('zh-CN')}</p>
<h2>基本信息</h2>
<table><tr><th>地块</th><td>${record.plotName}</td><th>品种</th><td>${record.varietyName}</td></tr>
<tr><th>播种日期</th><td>${record.sowDate}</td><th>采收日期</th><td>${record.harvestDate || '-'}</td></tr><tr><th>面积</th><td colspan="3">${record.area}亩</td></tr></table>
<h2>质量检验</h2>
<table><tr><th>检验结论</th><td>${record.qualityData?.status || '待检'}</td><th>品质等级</th><td>${record.qualityData?.grade || '-'}</td></tr>
<tr><th>实际产量</th><td>${record.qualityData?.actualYield ? `${record.qualityData.actualYield}kg` : '-'}</td><th>检验员</th><td>${record.qualityData?.inspectedBy || '-'}</td></tr>
<tr><th>检验说明</th><td colspan="3">${record.qualityData?.notes || '-'}</td></tr></table>
<h2>农事操作记录</h2>
<table><thead><tr><th>操作类型</th><th>日期</th><th>操作人</th><th>详情</th></tr></thead><tbody>${ops || '<tr><td colspan="4">无记录</td></tr>'}</tbody></table>
<h2>投入品使用记录</h2>
<table><thead><tr><th>类型</th><th>名称</th><th>用量</th><th>日期</th></tr></thead><tbody>${inputs || '<tr><td colspan="4">无记录</td></tr>'}</tbody></table>
<p class="footer">本报告由农场管家系统自动生成 | 追溯记录永久保存，不可篡改</p></body></html>`;
  }
}
