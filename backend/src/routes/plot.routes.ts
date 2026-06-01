import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import {
  getAllPlots,
  getPlotById,
  createPlot,
  updatePlot,
  deletePlot,
  getPlotStatistics,
} from '../controllers/plot.controller';
import { validateRequest, schemas } from '../middlewares/validation.middleware';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 获取所有地块（需要相应权限）
router.get(
  '/',
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  getAllPlots
);

// 获取地块统计信息
router.get(
  '/statistics',
  authorize(['系统管理员', '农艺师', '操作员']),
  getPlotStatistics
);

// 获取单个地块
router.get(
  '/:id',
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  validateRequest(schemas.uuidParam, 'params'),
  getPlotById
);

// 创建地块（需要系统管理员或农艺师权限）
router.post(
  '/',
  authorize(['系统管理员', '农艺师']),
  validateRequest(schemas.createPlot),
  createPlot
);

// 更新地块
router.put(
  '/:id',
  authorize(['系统管理员', '农艺师']),
  validateRequest(schemas.uuidParam, 'params'),
  validateRequest(schemas.createPlot),
  updatePlot
);

// 删除地块（仅系统管理员）
router.delete(
  '/:id',
  authorize(['系统管理员']),
  validateRequest(schemas.uuidParam, 'params'),
  deletePlot
);

export default router;
