import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { PlantingPlan } from '../models/planting-plan.entity';
import { Variety } from '../models/variety.entity';
import { Plot } from '../models/plot.entity';
import { getCurrentSolarTerm, getRecommendedVarietiesForCurrentTerm } from '../utils/solar-term';

export class PlantingPlanService {
  private repo: Repository<PlantingPlan>;
  private varietyRepo: Repository<Variety>;
  private plotRepo: Repository<Plot>;

  constructor() {
    this.repo = AppDataSource.getRepository(PlantingPlan);
    this.varietyRepo = AppDataSource.getRepository(Variety);
    this.plotRepo = AppDataSource.getRepository(Plot);
  }

  async findAll(filters?: { plotId?: string; varietyId?: string; status?: string }): Promise<PlantingPlan[]> {
    const where: any = {};
    if (filters?.plotId) where.plotId = filters.plotId;
    if (filters?.varietyId) where.varietyId = filters.varietyId;
    if (filters?.status) where.status = filters.status;
    return await this.repo.find({ where, order: { plannedSowDate: 'DESC' } });
  }

  async findById(id: string): Promise<PlantingPlan | null> {
    return await this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<PlantingPlan>): Promise<PlantingPlan> {
    // 验证品种存在
    const variety = await this.varietyRepo.findOne({ where: { id: data.varietyId } });
    if (!variety) throw new Error('品种不存在');

    // 验证地块存在且未同时段冲突
    const plot = await this.plotRepo.findOne({ where: { id: data.plotId } });
    if (!plot) throw new Error('地块不存在');

    // 检查同地块同时段冲突
    const conflict = await this.repo
      .createQueryBuilder('plan')
      .where('plan.plot_id = :plotId', { plotId: data.plotId })
      .andWhere('plan.status IN (:...statuses)', { statuses: ['待执行', '执行中'] })
      .andWhere('plan.planned_sow_date <= :endDate', { endDate: data.plannedHarvestDate })
      .andWhere('plan.planned_harvest_date >= :startDate', { startDate: data.plannedSowDate })
      .getOne();
    if (conflict) throw new Error('该地块在此时间段已有种植计划，请勿重叠安排');

    const plan = this.repo.create({
      ...data,
      status: '待执行',
      solarTerm: getCurrentSolarTerm(),
    });
    return await this.repo.save(plan);
  }

  async update(id: string, data: Partial<PlantingPlan>): Promise<PlantingPlan> {
    const plan = await this.findById(id);
    if (!plan) throw new Error('种植计划不存在');

    // 记录调整信息
    if (data.plannedSowDate || data.plannedHarvestDate) {
      data.adjustDate = new Date();
    }

    Object.assign(plan, data);
    if (data.adjustReason) plan.status = '已调整';
    return await this.repo.save(plan);
  }

  async delete(id: string): Promise<void> {
    const plan = await this.findById(id);
    if (!plan) throw new Error('种植计划不存在');
    if (plan.status === '执行中') throw new Error('执行中的计划不能删除');
    await this.repo.remove(plan);
  }

  /** 当前节气推荐 */
  getCurrentTermRecommendations(): { term: string; recommendedNames: string[] } {
    const term = getCurrentSolarTerm();
    const recommendedNames = getRecommendedVarietiesForCurrentTerm();
    return { term, recommendedNames };
  }

  /** 获取品种标准流程（基于品种类别和生长周期动态生成） */
  static getStandardProcess(varietyName: string, varietyCategory?: string, growthCycle?: number): string[] {
    // 按类别生成流程基准
    const baseByCategory: Record<string, string[]> = {
      '果菜类':   ['播种', '育苗', '移栽', '施肥', '打药', '灌溉', '整枝', '采收'],
      '叶菜类':   ['整地', '播种', '间苗', '施肥', '灌溉', '采收'],
      '瓜果类':   ['播种', '育苗', '移栽', '搭架', '施肥', '灌溉', '采收'],
      '粮食':     ['整地', '播种', '施肥', '灌溉', '打药', '采收'],
      '根茎类':   ['整地', '播种', '间苗', '施肥', '灌溉', '培土', '采收'],
      '花菜类':   ['播种', '育苗', '移栽', '施肥', '灌溉', '采收'],
      '浆果类':   ['育苗', '定植', '施肥', '灌溉', '打药', '采收'],
      '香料类':   ['整地', '播种', '间苗', '灌溉', '采收'],
      '豆类':     ['整地', '播种', '搭架', '施肥', '灌溉', '采收'],
      '食用菌类': ['备料', '接种', '发菌', '出菇', '采收'],
    };

    const base = baseByCategory[varietyCategory || ''] || ['播种', '田间管理', '采收'];

    // 根据生长周期追加额外步骤
    if (growthCycle && growthCycle > 90) {
      const idx = base.indexOf('采收');
      const extraSteps = ['追加施肥', '整枝'];
      if (idx >= 0) base.splice(idx, 0, ...extraSteps);
      else base.push(...extraSteps, '采收');
    }

    return base;
  }
}
