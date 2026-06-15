import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const dashboardService = new DashboardService();

/**
 * 获取仪表盘关键指标
 * GET /api/v1/dashboard/metrics
 */
export const getDashboardMetrics = [
  authenticate,
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try {
      const metrics = await dashboardService.getDashboardMetrics();
      res.json({ data: metrics });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || '获取仪表盘指标失败',
        code: 'DASHBOARD_METRICS_ERROR',
      });
    }
  },
];

/**
 * 获取地块状态分布
 * GET /api/v1/dashboard/plot-status
 */
export const getPlotStatusDistribution = [
  authenticate,
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try {
      const distribution = await dashboardService.getPlotStatusDistribution();
      res.json({ data: distribution });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || '获取地块状态分布失败',
        code: 'DASHBOARD_PLOT_STATUS_ERROR',
      });
    }
  },
];

/**
 * 获取品种类别分布
 * GET /api/v1/dashboard/variety-categories
 */
export const getVarietyCategoryDistribution = [
  authenticate,
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try {
      const distribution = await dashboardService.getVarietyCategoryDistribution();
      res.json({ data: distribution });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || '获取品种类别分布失败',
        code: 'DASHBOARD_VARIETY_CATEGORY_ERROR',
      });
    }
  },
];

/**
 * 获取最近活动记录
 * GET /api/v1/dashboard/recent-activities
 */
export const getRecentActivities = [
  authenticate,
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await dashboardService.getRecentActivities(limit);
      res.json({ data: activities });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || '获取最近活动失败',
        code: 'DASHBOARD_ACTIVITIES_ERROR',
      });
    }
  },
];

/**
 * 获取农事趋势数据
 * GET /api/v1/dashboard/trends
 */
export const getOperationTrends = [
  authenticate,
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (_req: Request, res: Response) => {
    try {
      const trends = await dashboardService.getOperationTrends();
      res.json({ data: trends });
    } catch (error: any) {
      res.status(500).json({ error: error.message || '获取趋势数据失败', code: 'TREND_ERROR' });
    }
  },
];
