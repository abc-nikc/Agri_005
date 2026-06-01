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

  /** 获取品种标准流程 */
  static getStandardProcess(varietyName: string): string[] {
    const processes: Record<string, string[]> = {
      '番茄': ['播种', '育苗', '移栽', '施肥', '打药', '灌溉', '整枝', '采收'],
      '黄瓜': ['播种', '育苗', '移栽', '搭架', '施肥', '灌溉', '采收'],
      '土豆': ['切种', '播种', '施肥', '灌溉', '培土', '采收'],
      '胡萝卜': ['整地', '播种', '间苗', '施肥', '灌溉', '采收'],
      '小白菜': ['整地', '播种', '间苗', '施肥', '灌溉', '采收'],
      '菠菜': ['整地', '播种', '施肥', '灌溉', '采收'],
      '西兰花': ['播种', '育苗', '移栽', '施肥', '灌溉', '采收'],
      '花椰菜': ['播种', '育苗', '移栽', '施肥', '灌溉', '采收'],
      '香菜': ['整地', '播种', '间苗', '灌溉', '采收'],
      '薄荷': ['整地', '定植', '施肥', '灌溉', '采收'],
    };
    return processes[varietyName] || ['播种', '田间管理', '采收'];
  }
}
