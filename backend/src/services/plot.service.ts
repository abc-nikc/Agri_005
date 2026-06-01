import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Plot } from '../models/plot.entity';

export class PlotService {
  private plotRepository: Repository<Plot>;

  constructor() {
    this.plotRepository = AppDataSource.getRepository(Plot);
  }

  /**
   * 获取所有地块
   */
  async findAll(): Promise<Plot[]> {
    return await this.plotRepository.find({
      order: { plotNumber: 'ASC' },
    });
  }

  /**
   * 根据 ID 获取地块
   */
  async findById(id: string): Promise<Plot | null> {
    return await this.plotRepository.findOne({
      where: { id },
    });
  }

  /**
   * 创建地块
   */
  async create(plotData: Partial<Plot>): Promise<Plot> {
    // 验证面积
    if (plotData.area !== undefined && plotData.area <= 0) {
      throw new Error('面积必须大于 0');
    }

    // 检查地块编号唯一性
    const existing = await this.plotRepository.findOne({
      where: { plotNumber: plotData.plotNumber },
    });

    if (existing) {
      throw new Error(`地块编号 ${plotData.plotNumber} 已存在`);
    }

    const plot = this.plotRepository.create(plotData);
    return await this.plotRepository.save(plot);
  }

  /**
   * 更新地块
   */
  async update(id: string, plotData: Partial<Plot>): Promise<Plot> {
    const plot = await this.findById(id);
    
    if (!plot) {
      throw new Error('地块不存在');
    }

    // 验证面积
    if (plotData.area !== undefined && plotData.area <= 0) {
      throw new Error('面积必须大于 0');
    }

    // 检查地块编号唯一性（如果修改了编号）
    if (plotData.plotNumber && plotData.plotNumber !== plot.plotNumber) {
      const existing = await this.plotRepository.findOne({
        where: { plotNumber: plotData.plotNumber },
      });
      if (existing) throw new Error(`地块编号 ${plotData.plotNumber} 已存在`);
    }

    Object.assign(plot, plotData);
    return await this.plotRepository.save(plot);
  }

  /**
   * 删除地块
   */
  async delete(id: string): Promise<void> {
    const result = await this.plotRepository.delete(id);
    
    if (result.affected === 0) {
      throw new Error('地块不存在');
    }
  }

  /**
   * 获取地块统计信息（用于仪表盘）
   */
  async getStatistics(): Promise<{
    totalArea: number;
    plantedArea: number;
    idleArea: number;
    plotCount: number;
  }> {
    const plots = await this.plotRepository.find();
    
    const totalArea = plots.reduce((sum, plot) => sum + Number(plot.area), 0);
    const plantedArea = plots
      .filter(plot => plot.status === '已种植')
      .reduce((sum, plot) => sum + Number(plot.area), 0);
    const idleArea = totalArea - plantedArea;
    const plotCount = plots.length;

    return {
      totalArea,
      plantedArea,
      idleArea,
      plotCount,
    };
  }
}
