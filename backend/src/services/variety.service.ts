import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Variety } from '../models/variety.entity';

export class VarietyService {
  private varietyRepository: Repository<Variety>;

  constructor() {
    this.varietyRepository = AppDataSource.getRepository(Variety);
  }

  /**
   * 获取所有品种
   */
  async findAll(includeInactive: boolean = false): Promise<Variety[]> {
    const where: any = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }

    return await this.varietyRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  /**
   * 根据 ID 获取品种
   */
  async findById(id: string): Promise<Variety | null> {
    return await this.varietyRepository.findOne({
      where: { id },
    });
  }

  /**
   * 创建品种
   */
  async create(varietyData: Partial<Variety>): Promise<Variety> {
    // 验证名称唯一性
    const existing = await this.varietyRepository.findOne({
      where: { name: varietyData.name },
    });

    if (existing) {
      throw new Error(`品种名称 ${varietyData.name} 已存在`);
    }

    // 验证种植密度
    if (varietyData.plantingDensity !== undefined && varietyData.plantingDensity <= 0) {
      throw new Error('种植密度必须大于 0');
    }

    // 验证施肥量
    if (varietyData.fertilizationRate !== undefined && varietyData.fertilizationRate <= 0) {
      throw new Error('施肥量必须大于 0');
    }

    const variety = this.varietyRepository.create(varietyData);
    return await this.varietyRepository.save(variety);
  }

  /**
   * 批量导入品种
   * @param varietiesData 品种数据数组
   * @returns 导入结果
   */
  async batchImport(varietiesData: Partial<Variety>[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const data of varietiesData) {
      try {
        await this.create(data);
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`品种 ${data.name}: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * 更新品种
   */
  async update(id: string, varietyData: Partial<Variety>): Promise<Variety> {
    const variety = await this.findById(id);
    
    if (!variety) {
      throw new Error('品种不存在');
    }

    // 验证名称唯一性（如果修改了名称）
    if (varietyData.name && varietyData.name !== variety.name) {
      const existing = await this.varietyRepository.findOne({
        where: { name: varietyData.name },
      });

      if (existing) {
        throw new Error(`品种名称 ${varietyData.name} 已存在`);
      }
    }

    // 验证种植密度
    if (varietyData.plantingDensity !== undefined && varietyData.plantingDensity <= 0) {
      throw new Error('种植密度必须大于 0');
    }

    // 验证施肥量
    if (varietyData.fertilizationRate !== undefined && varietyData.fertilizationRate <= 0) {
      throw new Error('施肥量必须大于 0');
    }

    Object.assign(variety, varietyData);
    return await this.varietyRepository.save(variety);
  }

  /**
   * 删除品种（软删除，设置为不活跃）
   */
  async delete(id: string): Promise<void> {
    const variety = await this.findById(id);
    
    if (!variety) {
      throw new Error('品种不存在');
    }

    // 软删除：设置为不活跃
    variety.isActive = false;
    await this.varietyRepository.save(variety);
  }

  /**
   * 获取播种季节对应的推荐品种
   * @param season 季节（如 "春季", "秋季"）
   */
  async getRecommendationsBySeason(season: string): Promise<Variety[]> {
    // 注意：sowingSeason 是 JSONB 字段，存储为数组
    // 需要使用 TypeORM 的 QueryBuilder 进行查询
    const queryBuilder = this.varietyRepository
      .createQueryBuilder('variety')
      .where('variety.is_active = :isActive', { isActive: true })
      .andWhere('variety.sowing_season::jsonb @> :season', {
        season: JSON.stringify([season]),
      });

    return await queryBuilder.getMany();
  }
}
