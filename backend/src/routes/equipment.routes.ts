import { Router } from 'express';
import { equipmentController } from '../controllers/equipment.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// 需要认证的中间件
router.use(authenticate);

// 获取设备列表
router.get(
  '/',
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  equipmentController.getEquipment.bind(equipmentController)
);

// 获取维护提醒（必须在 :id 之前）
router.get(
  '/maintenance-alerts',
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  equipmentController.getMaintenanceAlerts.bind(equipmentController)
);

// 获取单个设备
router.get(
  '/:id',
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  equipmentController.getEquipmentById.bind(equipmentController)
);

// 创建设备
router.post(
  '/',
  authorize(['系统管理员', '农艺师']),
  equipmentController.createEquipment.bind(equipmentController)
);

// 更新设备
router.put(
  '/:id',
  authorize(['系统管理员', '农艺师']),
  equipmentController.updateEquipment.bind(equipmentController)
);

// 删除设备
router.delete(
  '/:id',
  authorize(['系统管理员']),
  equipmentController.deleteEquipment.bind(equipmentController)
);

export default router;
