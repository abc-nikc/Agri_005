import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { PlotService } from './plot.service';
import { VarietyService } from './variety.service';
import { StaffService } from './staff.service';
import { AuditLog } from '../models/audit-log.entity';
import { FarmingOperation } from '../models/farming-operation.entity';
import { ProductionBatch } from '../models/production-batch.entity';
import { Equipment } from '../models/equipment.entity';

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
   */
  async getDashboardMetrics(): Promise<{
    totalArea: number;
    plantedArea: number;
    idleArea: number;
    varietyCount: number;
    staffCount: number;
    plotCount: number;
    activeStaffCount: number;
    equipmentCount: number;
    batchCount: number;
  }> {
    const [plotStats, varieties, staffStats] = await Promise.all([
      this.plotService.getStatistics(),
      this.varietyService.findAll(),
      this.staffService.getStatistics(),
    ]);

    const eqRepo = AppDataSource.getRepository(Equipment);
    const batchRepo = AppDataSource.getRepository(ProductionBatch);

    return {
      totalArea: plotStats.totalArea,
      plantedArea: plotStats.plantedArea,
      idleArea: plotStats.idleArea,
      varietyCount: varieties.length,
      staffCount: staffStats.totalStaff,
      plotCount: plotStats.plotCount,
      activeStaffCount: staffStats.activeStaff,
      equipmentCount: await eqRepo.count(),
      batchCount: await batchRepo.count(),
    };
  }

  /**
   * 获取地块状态分布
   */
  async getPlotStatusDistribution(): Promise<{ status: string; count: number; area: number }[]> {
    const plots = await this.plotService.findAll();
    const distribution = new Map<string, { count: number; area: number }>();
    for (const plot of plots) {
      const existing = distribution.get(plot.status) || { count: 0, area: 0 };
      distribution.set(plot.status, { count: existing.count + 1, area: existing.area + Number(plot.area) });
    }
    return Array.from(distribution.entries()).map(([status, data]) => ({ status, count: data.count, area: data.area }));
  }

  /**
   * 获取品种类别分布
   */
  async getVarietyCategoryDistribution(): Promise<{ category: string; count: number }[]> {
    const varieties = await this.varietyService.findAll();
    const distribution = new Map<string, number>();
    for (const variety of varieties) {
      if (!variety.isActive) continue;
      distribution.set(variety.category, (distribution.get(variety.category) || 0) + 1);
    }
    return Array.from(distribution.entries()).map(([category, count]) => ({ category, count }));
  }

  /**
   * 获取最近活动记录（从真实数据源）
   */
  async getRecentActivities(limit: number = 10): Promise<any[]> {
    const auditRepo = AppDataSource.getRepository(AuditLog);
    const opRepo = AppDataSource.getRepository(FarmingOperation);

    const activities: any[] = [];

    // 1. 从审计日志获取
    try {
      const logs = await auditRepo.find({ order: { createdAt: 'DESC' }, take: limit });
      for (const log of logs) {
        activities.push({
          id: log.id,
          action: String(log.actionType),
          user: log.username || '系统',
          timestamp: log.createdAt.toISOString(),
          source: 'audit',
        });
      }
    } catch {}

    // 2. 如果审计日志为空，从农事操作记录获取
    if (activities.length === 0) {
      try {
        const ops = await opRepo.find({ order: { operationDate: 'DESC' }, take: limit });
        for (const op of ops) {
          activities.push({
            id: op.id,
            action: `${op.operationType} - ${op.varietyName || op.plotName || ''}`,
            user: op.operatorName,
            timestamp: op.operationDate.toISOString(),
            source: 'operation',
          });
        }
      } catch {}
    }

    return activities.slice(0, limit);
  }

  /**
   * 获取近7天农事趋势数据（用于折线图）
   */
  async getOperationTrends(): Promise<{ dates: string[]; counts: number[] }> {
    const opRepo = AppDataSource.getRepository(FarmingOperation);
    const dates: string[] = [];
    const counts: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      dates.push(dateStr.slice(5)); // MM-DD

      try {
        const count = await opRepo
          .createQueryBuilder('o')
          .where('o.operation_date >= :start AND o.operation_date < :end', {
            start: dateStr + 'T00:00:00.000Z',
            end: new Date(d.getTime() + 86400000).toISOString().slice(0, 10) + 'T00:00:00.000Z',
          })
          .getCount();
        counts.push(count);
      } catch {
        counts.push(0);
      }
    }

    return { dates, counts };
  }
}
