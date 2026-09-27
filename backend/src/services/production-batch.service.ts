import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ProductionBatch } from '../models/production-batch.entity';
import { PlantingPlan } from '../models/planting-plan.entity';
import { Plot } from '../models/plot.entity';
import { NotificationService } from './notification.service';
import { Staff } from '../models/staff.entity';

export class ProductionBatchService {
  private repo: Repository<ProductionBatch>;
  private planRepo: Repository<PlantingPlan>;
  private plotRepo: Repository<Plot>;

  constructor() {
    this.repo = AppDataSource.getRepository(ProductionBatch);
    this.planRepo = AppDataSource.getRepository(PlantingPlan);
    this.plotRepo = AppDataSource.getRepository(Plot);
  }

  async findAll(filters?: { plotId?: string; varietyId?: string; status?: string }): Promise<ProductionBatch[]> {
    const where: any = {};
    if (filters?.plotId) where.plotId = filters.plotId;
    if (filters?.varietyId) where.varietyId = filters.varietyId;
    if (filters?.status) where.status = filters.status;
    return await this.repo.find({ where, order: { sowDate: 'DESC' } });
  }

  async findById(id: string): Promise<ProductionBatch | null> {
    return await this.repo.findOne({ where: { id } });
  }

  async create(data: {
    plotId: string;
    varietyId: string;
    varietyName: string;
    sowDate: string;
    estimatedHarvestDate: string;
    area: number;
    planId?: string;
    remark?: string;
    parentBatchId?: string;
    qualityGrade?: string;
  }): Promise<ProductionBatch> {
    const plot = await this.plotRepo.findOne({ where: { id: data.plotId } });
    if (!plot) throw new Error('地块不存在');

    // 🔴 边缘场景：地块时间冲突检测 — 同一地块同时段不能有两个活跃品种
    const overlapping = await this.repo
      .createQueryBuilder('b')
      .where('b.plot_id = :plotId', { plotId: data.plotId })
      .andWhere('b.status = :status', { status: '进行中' })
      .andWhere('b.sow_date <= :endDate', { endDate: data.estimatedHarvestDate })
      .andWhere('b.estimated_harvest_date >= :startDate', { startDate: data.sowDate })
      .getCount();

    if (overlapping > 0) {
      const existing = await this.repo.findOne({
        where: { plotId: data.plotId, status: '进行中' },
      });
      throw new Error(
        `地块 ${plot.plotNumber} 在 ${data.sowDate}~${data.estimatedHarvestDate} 期间已有进行中批次` +
        (existing ? `"${existing.batchNumber}"(${existing.varietyName})` : '') +
        `，同一地块同一时间段只能有一个活跃品种`
      );
    }

    // 生成批次号: P + 日期 + 地块编号 + 品种（+ 品质等级子批次后缀）
    const dateStr = data.sowDate.replace(/-/g, '');
    let batchNumber = `P${dateStr}-${plot.plotNumber}-${data.varietyName}`;
    if (data.qualityGrade) batchNumber += `-${data.qualityGrade}`;

    // 检查批次号唯一
    const existing = await this.repo.findOne({ where: { batchNumber } });
    if (existing) throw new Error('该批次号已存在');

    const batch = this.repo.create({
      ...data,
      batchNumber,
      plotName: plot.plotNumber,
      status: '进行中',
    });
    const saved = await this.repo.save(batch);

    // 关联计划->批次
    if (data.planId) {
      await this.planRepo.update(data.planId, {
        batchId: saved.id,
        status: '执行中',
      });
    }

    // 更新地块状态（仅主批次，子批次不重复更新地块）
    if (!data.parentBatchId) {
      plot.status = '已种植';
      plot.currentVarietyId = data.varietyId;
      await this.plotRepo.save(plot);
    }

    return saved;
  }

  // 🔴 边缘场景：按品质等级拆分子批次
  async splitByQualityGrade(
    parentBatchId: string,
    grades: { grade: string; quantity: number }[]
  ): Promise<ProductionBatch[]> {
    const parent = await this.findById(parentBatchId);
    if (!parent) throw new Error('父批次不存在');
    if (parent.status !== '已完成') throw new Error('只能对已完成的批次进行品质拆分');

    const subBatches: ProductionBatch[] = [];
    for (const g of grades) {
      const sub = await this.create({
        plotId: parent.plotId,
        varietyId: parent.varietyId,
        varietyName: parent.varietyName,
        sowDate: parent.sowDate,
        estimatedHarvestDate: parent.estimatedHarvestDate,
        area: g.quantity, // 用产量反推面积比例
        parentBatchId: parentBatchId,
        qualityGrade: g.grade,
        remark: `子批次(${g.grade}级，产量 ${g.quantity}kg) — 拆分自 ${parent.batchNumber}`,
      });
      subBatches.push(sub);
    }

    return subBatches;
  }

  async completeBatch(id: string, actualHarvestDate: string): Promise<ProductionBatch> {
    const batch = await this.findById(id);
    if (!batch) throw new Error('批次不存在');
    if (batch.status === '已完成') throw new Error('批次已完成，无法重复操作');

    batch.status = '已完成';
    batch.actualHarvestDate = actualHarvestDate;
    batch.qualityStatus = '待检';
    const saved = await this.repo.save(batch);

    // 🟢 通知管理员批次完成
    try {
      const notifier = new NotificationService();
      const admins = await AppDataSource.getRepository(Staff).find({ where: { systemRole: '系统管理员', isActive: true } });
      for (const admin of admins) {
        await notifier.sendNotification(admin.id, `批次 ${batch.batchNumber} 已完成采收（${batch.varietyName}，${actualHarvestDate}），请安排入库`, { type: 'success', link: '/planting-plans' });
      }
    } catch (e) { /* 非阻塞 */ }

    // 更新关联计划
    if (batch.planId) {
      await this.planRepo.update(batch.planId, { status: '已完成' });
    }

    // 释放地块
    const plot = await this.plotRepo.findOne({ where: { id: batch.plotId } });
    if (plot) {
      plot.status = '闲置';
      plot.currentVarietyId = undefined;
      await this.plotRepo.save(plot);
    }

    return saved;
  }

  async inspectQuality(id: string, data: {
    passed: boolean;
    grade?: string;
    actualYield?: number;
    notes?: string;
    inspector: string;
  }): Promise<ProductionBatch> {
    const batch = await this.findById(id);
    if (!batch) throw new Error('批次不存在');
    if (batch.status !== '已完成') throw new Error('只有已完成采收的批次才能进行质量检验');
    if (data.passed && !data.grade) throw new Error('检验合格时必须填写品质等级');
    if (data.actualYield !== undefined && data.actualYield <= 0) throw new Error('实际产量必须大于0');

    batch.qualityStatus = data.passed ? '合格' : '不合格';
    batch.qualityGrade = data.grade || undefined;
    batch.actualYield = data.actualYield;
    batch.inspectionNotes = data.notes;
    batch.inspectedAt = new Date();
    batch.inspectedBy = data.inspector;
    return await this.repo.save(batch);
  }

  async delete(id: string): Promise<void> {
    const batch = await this.findById(id);
    if (!batch) throw new Error('批次不存在');
    if (batch.status === '已完成') throw new Error('已完成的批次不能删除');
    await this.repo.remove(batch);
  }
}
