import { Router } from 'express';
import {
  getDashboardMetrics,
  getPlotStatusDistribution,
  getVarietyCategoryDistribution,
  getRecentActivities,
} from '../controllers/dashboard.controller';
import { cacheMiddleware } from '../middlewares/cache';

const router = Router();

// 仪表盘数据缓存 5 分钟
router.get('/metrics', cacheMiddleware('dashboard:metrics', 300), ...getDashboardMetrics);
router.get('/plot-status', cacheMiddleware('dashboard:plotstatus', 300), ...getPlotStatusDistribution);
router.get('/variety-categories', cacheMiddleware('dashboard:categories', 300), ...getVarietyCategoryDistribution);
router.get('/recent-activities', cacheMiddleware('dashboard:activities', 60), ...getRecentActivities);

export default router;
