import { Router } from 'express';
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  updateStaffPassword,
  deleteStaff,
  getStaffStatistics,
} from '../controllers/staff.controller';

const router = Router();

// 获取所有员工
router.get('/', ...getAllStaff);

// 获取员工统计信息
router.get('/statistics', ...getStaffStatistics);

// 根据 ID 获取员工
router.get('/:id', ...getStaffById);

// 创建员工
router.post('/', ...createStaff);

// 更新员工信息
router.put('/:id', ...updateStaff);

// 更新员工密码
router.put('/:id/password', ...updateStaffPassword);

// 删除员工（软删除）
router.delete('/:id', ...deleteStaff);

export default router;
