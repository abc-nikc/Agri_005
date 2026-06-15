import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';

// 导入路由
import plotRoutes from './plot.routes';
import varietyRoutes from './variety.routes';
import staffRoutes from './staff.routes';
import equipmentRoutes from './equipment.routes';
import dashboardRoutes from './dashboard.routes';
import notificationRoutes from './notification.routes';
import farmingOperationRoutes from './farming-operation.routes';
import plantingPlanRoutes from './planting-plan.routes';
import productionBatchRoutes from './production-batch.routes';
import inventoryRoutes from './inventory.routes';
import traceabilityRoutes from './traceability.routes';
import { publicTrace } from '../controllers/traceability.controller';
import costRoutes from './cost.routes';
import sensorRoutes from './sensor.routes';
import systemSettingsRoutes from './system-settings.routes';
import sseRoutes from './sse.routes';
import aiRoutes from './ai.routes';
import farmTaskRoutes from './farm-task.routes';
import newsRoutes from './news.routes';

const router = Router();

const protectedRouter = Router();
protectedRouter.use(authenticate);

protectedRouter.use('/plots', plotRoutes);
protectedRouter.use('/varieties', varietyRoutes);
protectedRouter.use('/staff', staffRoutes);
protectedRouter.use('/equipment', equipmentRoutes);
protectedRouter.use('/dashboard', dashboardRoutes);
protectedRouter.use('/farming-operations', farmingOperationRoutes);
protectedRouter.use('/planting-plans', plantingPlanRoutes);
protectedRouter.use('/production-batches', productionBatchRoutes);
protectedRouter.use('/inventory', inventoryRoutes);
protectedRouter.use('/traceability', traceabilityRoutes);
protectedRouter.use('/costs', costRoutes);
protectedRouter.use('/iot', sensorRoutes);
protectedRouter.use('/notifications', notificationRoutes);
protectedRouter.use('/settings', systemSettingsRoutes);
protectedRouter.use('/sse', sseRoutes);
protectedRouter.use('/ai', aiRoutes);
protectedRouter.use('/farm-tasks', farmTaskRoutes);
protectedRouter.use('/news', newsRoutes);

router.use('/', protectedRouter);
router.get('/api/v1/trace/:code', publicTrace);

export default router;
