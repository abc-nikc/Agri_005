import { Repository, LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '../config/database';
import { FarmingOperation, OperationType } from '../models/farming-operation.entity';
import { Plot } from '../models/plot.entity';
import { Variety } from '../models/variety.entity';
import { Staff } from '../models/staff.entity';
import { systemSettingsService } from './system-settings.service';
import { NotificationService } from './notification.service';

interface CreateOperationDto {
  operationType: OperationType;
  plotId: string;
  varietyId?: string;
  batchId?: string;
  area?: number;
  fertilizerName?: string;
  fertilizerAmount?: number;
  fertilizerUnit?: string;
  pesticideName?: string;
  pesticideAmount?: number;
  pesticideUnit?: string;
  waterAmount?: number;
  waterUnit?: string;
  waterDuration?: number;
  waterDurationUnit?: string;
  workDescription?: string;
  harvestYield?: number;
  yieldUnit?: string;
  qualityGrade?: string;
  harvestDestination?: string;
  operatorName: string;
  operationDate: string;
  weather?: string;
  temperature?: number;
  remark?: string;
  cropStage?: string;
  // 🔴 边缘场景：离线补录
  isSupplemental?: boolean;
  supplementalOperationDate?: string;
}

export class FarmingOperationService {
  private repo: Repository<FarmingOperation>;
  private plotRepo: Repository<Plot>;
  private varietyRepo: Repository<Variety>;

  constructor() {
    this.repo = AppDataSource.getRepository(FarmingOperation);
    this.plotRepo = AppDataSource.getRepository(Plot);
    this.varietyRepo = AppDataSource.getRepository(Variety);
  }

  async findAll(filters?: { plotId?: string; batchId?: string; operationType?: string; startDate?: string; endDate?: string }): Promise<FarmingOperation[]> {
    const where: any = {};
    if (filters?.plotId) where.plotId = filters.plotId;
    if (filters?.batchId) where.batchId = filters.batchId;
    if (filters?.operationType) where.operationType = filters.operationType;
    if (filters?.startDate || filters?.endDate) {
      const start = filters.startDate ? new Date(filters.startDate) : new Date(0);
      const end = filters.endDate ? new Date(filters.endDate) : new Date();
      where.operationDate = LessThanOrEqual(end);
      where.operationDate = { ...where.operationDate, ...{ '@gte': start } };
    }

    return await this.repo.find({ where, order: { operationDate: 'DESC' } });
  }

  async findById(id: string): Promise<FarmingOperation | null> {
    return await this.repo.findOne({ where: { id } });
  }

  async create(data: CreateOperationDto): Promise<FarmingOperation> {
    // 1. 验证地块存在
    const plot = await this.plotRepo.findOne({ where: { id: data.plotId } });
    if (!plot) throw new Error('地块不存在');

    // 2. 必填字段校验
    this.validateRequiredFields(data);

    // 3. 防重复提交检查（5分钟内同一人相同操作记录）
    await this.checkDuplicate(data);

    // 4. 打药安全间隔期校验
    if (data.operationType === '打药' && data.varietyId) {
      await this.checkSafetyInterval(data);
    }

    // 5. 地块名称补充
    const operationData: any = { ...data, plotName: plot.plotNumber };
    if (data.varietyId) {
      const variety = await this.varietyRepo.findOne({ where: { id: data.varietyId } });
      if (variety) operationData.varietyName = variety.name;
    }

    // 🔴 边缘场景：设备离线补录 — 标记isSupplemental并记录原始操作时间
    if (data.isSupplemental) {
      operationData.isSupplemental = true;
      operationData.supplementalOperationDate = data.supplementalOperationDate
        ? new Date(data.supplementalOperationDate)
        : new Date(data.operationDate);
    }

    const operation = this.repo.create(operationData as any);
    const saved = await this.repo.save(operation) as unknown as FarmingOperation;

    // 🟢 通知管理员关键操作
    try {
      const notifier = new NotificationService();
      const admins = await AppDataSource.getRepository(Staff).find({ where: { systemRole: '系统管理员', isActive: true } });
      for (const admin of admins) {
        if (data.operationType === '采收') {
          await notifier.sendNotification(admin.id, `${plot.plotNumber} ${operationData.varietyName || ''} 采收完成：${data.harvestYield || '已采收'}${data.yieldUnit || ''}（${data.qualityGrade || '未分级'}）→ ${data.harvestDestination || '未指定去向'}`, { type: 'harvest', link: '/farming-operations' });
        } else if (data.operationType === '播种') {
          await notifier.sendNotification(admin.id, `${plot.plotNumber} ${operationData.varietyName || ''} 已播种，面积 ${data.area || '未知'}亩`, { type: 'info', link: '/farming-operations' });
        } else if (data.operationType === '打药') {
          await notifier.sendNotification(admin.id, `${plot.plotNumber} ${operationData.varietyName || ''} 施用农药 ${data.pesticideName || ''} ${data.pesticideAmount || ''}${data.pesticideUnit || ''}`, { type: 'warning', link: '/farming-operations' });
        }
      }
    } catch (e) { /* 非阻塞 */ }

    // 6. 采收后自动释放地块 + 更新地块状态
    if (data.operationType === '采收') {
      plot.status = '闲置';
      plot.currentVarietyId = undefined;
      await this.plotRepo.save(plot);
    } else if (data.operationType === '播种' || data.operationType === '移栽') {
      plot.status = '已种植';
      if (data.varietyId) plot.currentVarietyId = data.varietyId;
      await this.plotRepo.save(plot);
    }

    return saved;
  }

  async update(id: string, data: Partial<CreateOperationDto>): Promise<FarmingOperation> {
    const operation = await this.findById(id);
    if (!operation) throw new Error('农事操作记录不存在');
    Object.assign(operation, data);
    return await this.repo.save(operation);
  }

  async delete(id: string): Promise<void> {
    const operation = await this.findById(id);
    if (!operation) throw new Error('农事操作记录不存在');
    await this.repo.remove(operation);
  }

  // ===== 业务校验方法 =====

  private validateRequiredFields(data: CreateOperationDto): void {
    const { operationType, operatorName, plotId } = data;
    if (!operatorName) throw new Error('操作人不能为空');
    if (!plotId) throw new Error('地块不能为空');

    switch (operationType) {
      case '播种':
      case '移栽':
        if (!data.varietyId) throw new Error('品种不能为空');
        if (!data.area || data.area <= 0) throw new Error('面积必须大于0');
        break;
      case '施肥':
        if (!data.fertilizerName) throw new Error('肥料品类不能为空');
        if (!data.fertilizerAmount || data.fertilizerAmount <= 0) throw new Error('用量必须大于0');
        break;
      case '打药':
        if (!data.pesticideName) throw new Error('农药品类不能为空');
        if (!data.pesticideAmount || data.pesticideAmount <= 0) throw new Error('用量必须大于0');
        break;
      case '灌溉':
      case '排水':
        if (!data.waterAmount && !data.waterDuration) throw new Error('水量或时长至少填写一项');
        break;
      case '除草':
      case '整枝':
        if (!data.workDescription) throw new Error('操作内容不能为空');
        break;
      case '采收':
        if (!data.harvestYield || data.harvestYield <= 0) throw new Error('产量必须大于0');
        if (!data.qualityGrade) throw new Error('品质等级不能为空');
        if (!data.harvestDestination) throw new Error('去向不能为空');
        break;
    }
  }

  private async checkDuplicate(data: CreateOperationDto): Promise<void> {
    // FR-017: 防重复窗口从系统设置读取（默认5分钟）
    const windowMinutes = await systemSettingsService.getNumber('duplicate_window_minutes', 5);
    const windowMs = windowMinutes * 60 * 1000;
    const windowStart = new Date(Date.now() - windowMs);
    
    const recent = await this.repo
      .createQueryBuilder('op')
      .where('op.operator_name = :operator', { operator: data.operatorName })
      .andWhere('op.plot_id = :plotId', { plotId: data.plotId })
      .andWhere('op.operation_type = :type', { type: data.operationType })
      .andWhere('op.created_at > :windowStart', { windowStart })
      .getCount();

    if (recent > 0) {
      throw new Error(`重复提交，请勿在${windowMinutes}分钟内重复提交相同记录`);
    }
  }

  private async checkSafetyInterval(data: CreateOperationDto): Promise<void> {
    if (!data.varietyId) return;
    const variety = await this.varietyRepo.findOne({ where: { id: data.varietyId } });
    if (!variety || !variety.safetyInterval) return;

    // 获取最近采收日期，计算到当前的天数
    const lastHarvest = await this.repo.findOne({
      where: { plotId: data.plotId, operationType: '采收' },
      order: { operationDate: 'DESC' },
    });

    if (!lastHarvest) return; // 没有采收记录，无法判断

    const daysSinceHarvest = Math.floor((Date.now() - new Date(lastHarvest.operationDate).getTime()) / (1000 * 60 * 60 * 24));
    const safetyDays = variety.safetyInterval!;

    if (daysSinceHarvest < safetyDays) {
      const remaining = safetyDays - daysSinceHarvest;
      throw new Error(`安全间隔期不足！该农药安全间隔期为${safetyDays}天，距上次采收仅${daysSinceHarvest}天，还需${remaining}天方可施用`);
    }
  }
}
