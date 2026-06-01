import { PlotService } from './plot.service';
import { VarietyService } from './variety.service';
import { StaffService } from './staff.service';

export class DashboardService {
  private plotService: PlotService;
  private varietyService: VarietyService;
  private staffService: StaffService;

  constructor() {
    this.plotService = new PlotService();
    this.varietyService = new VarietyService();
    this.staffService = new StaffService();
  }

  /**
   * 获取仪表盘关键指标
   * 返回：总面积、已种植面积、闲置面积、品种数量、员工数量
   */
  async getDashboardMetrics(): Promise<{
    totalArea: number;
    plantedArea: number;
    idleArea: number;
    varietyCount: number;
    staffCount: number;
    plotCount: number;
    activeStaffCount: number;
  }> {
    // 并行获取各项数据
    const [plotStats, varieties, staffStats] = await Promise.all([
      this.plotService.getStatistics(),
      this.varietyService.findAll(),
      this.staffService.getStatistics(),
    ]);

    return {
      totalArea: plotStats.totalArea,
      plantedArea: plotStats.plantedArea,
      idleArea: plotStats.idleArea,
      varietyCount: varieties.length,
      staffCount: staffStats.totalStaff,
      plotCount: plotStats.plotCount,
      activeStaffCount: staffStats.activeStaff,
    };
  }

  /**
   * 获取地块状态分布
   */
  async getPlotStatusDistribution(): Promise<{ status: string; count: number; area: number }[]> {
    const plots = await this.plotService.findAll();
    
    const distribution = new Map<string, { count: number; area: number }>();
    
    for (const plot of plots) {
      const status = plot.status;
      const existing = distribution.get(status) || { count: 0, area: 0 };
      
      distribution.set(status, {
        count: existing.count + 1,
        area: existing.area + Number(plot.area),
      });
    }

    return Array.from(distribution.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      area: data.area,
    }));
  }

  /**
   * 获取品种类别分布
   */
  async getVarietyCategoryDistribution(): Promise<{ category: string; count: number }[]> {
    const varieties = await this.varietyService.findAll();
    
    const distribution = new Map<string, number>();
    
    for (const variety of varieties) {
      if (!variety.isActive) {
        continue;
      }

      const count = distribution.get(variety.category) || 0;
      distribution.set(variety.category, count + 1);
    }

    return Array.from(distribution.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  }

  /**
   * 获取最近活动记录（从审计日志）
   * 简化版：返回模拟数据
   */
  async getRecentActivities(limit: number = 10): Promise<any[]> {
    // 实际应该从 audit_logs 表查询
    // 这里返回模拟数据
    return [
      {
        id: '1',
        action: '创建地块',
        user: '管理员',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        action: '记录农事操作',
        user: '操作员',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  }
}
