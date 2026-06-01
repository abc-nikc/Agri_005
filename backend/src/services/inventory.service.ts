import { Repository, LessThanOrEqual, MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Inventory } from '../models/inventory.entity';
import { StockTransaction, TransactionType } from '../models/stock-transaction.entity';
import { Stocktake } from '../models/stocktake.entity';
import { systemSettingsService } from './system-settings.service';

export class InventoryService {
  private repo: Repository<Inventory>;
  private txnRepo: Repository<StockTransaction>;
  private stRepo: Repository<Stocktake>;

  constructor() {
    this.repo = AppDataSource.getRepository(Inventory);
    this.txnRepo = AppDataSource.getRepository(StockTransaction);
    this.stRepo = AppDataSource.getRepository(Stocktake);
  }

  // ===== 库存 CRUD =====
  async findAll(filters?: { type?: string; name?: string; location?: string }): Promise<Inventory[]> {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.name) where.name = filters.name;
    if (filters?.location) where.location = filters.location;
    return await this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Inventory | null> {
    return await this.repo.findOne({ where: { id } });
  }

  // ===== 入库 (FR-019, FR-020) =====
  async stockIn(data: {
    type: string;
    subType: string;
    name: string;
    spec?: string;
    quantity: number;
    unit: string;
    batchNumber?: string;
    location?: string;
    qualityGrade?: string;
    qualityPassed?: boolean;
    expiryDate?: string;
    operator: string;
    sourceOrDest?: string;
    remark?: string;
  }): Promise<Inventory> {
    // FR-026: 入库数量必须大于0
    if (data.quantity <= 0) throw new Error('入库数量必须大于0');
    // FR-019: 农产品入库须品质检测
    if (data.type === '农产品' && data.subType === '农产品入库' && data.qualityPassed !== true) {
      throw new Error('未通过品质检测，不得入库');
    }

    // 检查是否已有同批次同名称库存（合并或新建）
    let inv = await this.repo.findOne({ where: { name: data.name, batchNumber: data.batchNumber || null } });
    if (inv && inv.batchNumber) {
      // 同一批次追加数量
      inv.quantity = Number(inv.quantity) + data.quantity;
      await this.repo.save(inv);
    } else {
      inv = this.repo.create({
        type: data.type as any,
        name: data.name,
        spec: data.spec,
        quantity: data.quantity,
        unit: data.unit,
        batchNumber: data.batchNumber,
        location: data.location,
        qualityGrade: data.qualityGrade,
        qualityPassed: data.qualityPassed,
        expiryDate: data.expiryDate,
        remark: data.remark,
      });
      inv = await this.repo.save(inv);
    }

    // 记录交易
    await this.txnRepo.save(this.txnRepo.create({
      type: '入库', subType: data.subType, inventoryId: inv.id,
      itemName: data.name, quantity: data.quantity, unit: data.unit,
      operator: data.operator, sourceOrDest: data.sourceOrDest,
      batchNumber: data.batchNumber, transactionDate: new Date(), remark: data.remark,
    }));

    return inv;
  }

  // ===== 出库 (FR-021, FR-022) =====
  async stockOut(data: {
    inventoryId: string;
    subType: string; // 销售出库 / 农资领用出库
    quantity: number;
    operator: string;
    approver?: string;
    sourceOrDest?: string;
    plotId?: string;
    remark?: string;
  }): Promise<Inventory> {
    // FR-026: 出库数量不大于当前库存
    const inv = await this.findById(data.inventoryId);
    if (!inv) throw new Error('库存记录不存在');
    if (data.quantity > Number(inv.quantity)) {
      throw new Error(`库存不足，当前库存${inv.quantity}${inv.unit}`);
    }

    // FR-021: 销售出库须主管审批
    if (data.subType === '销售出库' && !data.approver) {
      throw new Error('销售出库须经主管审批');
    }

    inv.quantity = Number(inv.quantity) - data.quantity;
    await this.repo.save(inv);

    await this.txnRepo.save(this.txnRepo.create({
      type: '出库', subType: data.subType, inventoryId: inv.id,
      itemName: inv.name, quantity: data.quantity, unit: inv.unit,
      operator: data.operator, approver: data.approver,
      sourceOrDest: data.sourceOrDest, plotId: data.plotId,
      transactionDate: new Date(), remark: data.remark,
    }));

    return inv;
  }

  // ===== 交易记录 (FR-021 FIFO 查询) =====
  async getTransactions(filters?: { type?: string; inventoryId?: string; startDate?: string; endDate?: string }): Promise<StockTransaction[]> {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.inventoryId) where.inventoryId = filters.inventoryId;
    if (filters?.startDate || filters?.endDate) {
      const cond: any = {};
      if (filters.startDate) cond['$gte'] = new Date(filters.startDate);
      if (filters.endDate) cond['$lte'] = new Date(filters.endDate);
      where.transactionDate = cond;
    }
    return await this.txnRepo.find({ where, order: { transactionDate: 'DESC' } });
  }

  // ===== FIFO 库存查询 =====
  async getFIFOInventory(name: string): Promise<Inventory[]> {
    return await this.repo.find({
      where: { name },
      order: { createdAt: 'ASC' },
    });
  }

  // ===== 盘点 (FR-023) =====
  async stocktake(data: {
    type: string;
    executor: string;
    inventoryId: string;
    actualQuantity: number;
    remark?: string;
  }): Promise<Stocktake> {
    const inv = await this.findById(data.inventoryId);
    if (!inv) throw new Error('库存记录不存在');

    const systemQty = Number(inv.quantity);
    const actualQty = data.actualQuantity;
    const discrepancy = actualQty - systemQty;
    const rate = systemQty > 0 ? Math.abs(discrepancy) / systemQty : 0;

    // FR-024: 误差率阈值（从系统设置读取，默认2%）
    const thresholdPercent = await systemSettingsService.getNumber('stocktake_discrepancy_threshold', 2);
    const threshold = thresholdPercent / 100;
    let result = '正常';
    if (Math.abs(rate) > threshold) {
      result = discrepancy > 0 ? '盘盈' : '盘亏';
    }

    const st = this.stRepo.create({
      type: data.type, executor: data.executor, inventoryId: data.inventoryId,
      itemName: inv.name, systemQuantity: systemQty, actualQuantity: actualQty,
      unit: inv.unit, discrepancy, discrepancyRate: rate, result, remark: data.remark,
    });

    return await this.stRepo.save(st);
  }

  async getStocktakes(filters?: { inventoryId?: string }): Promise<Stocktake[]> {
    const where: any = {};
    if (filters?.inventoryId) where.inventoryId = filters.inventoryId;
    return await this.stRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  // ===== 预警 (FR-025) =====
  async getAlerts(): Promise<{ lowStock: Inventory[]; expiring: Inventory[] }> {
    const lowStockThreshold = await systemSettingsService.getNumber('low_stock_threshold', 100);
    const expiryDays = await systemSettingsService.getNumber('expiry_alert_days', 30);

    const lowStock = await this.repo.find({
      where: { quantity: LessThanOrEqual(lowStockThreshold) },
    });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    const expiring = await this.repo
      .createQueryBuilder('inv')
      .where('inv.expiry_date IS NOT NULL')
      .andWhere('inv.expiry_date <= :expiryDate', { expiryDate: expiryDate.toISOString().slice(0, 10) })
      .andWhere('inv.expiry_date > :today', { today: new Date().toISOString().slice(0, 10) })
      .getMany();

    return { lowStock, expiring };
  }
}
