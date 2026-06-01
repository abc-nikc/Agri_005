import { Router } from 'express';
import {
  getAllVarieties,
  getVarietyById,
  createVariety,
  batchImportVarieties,
  updateVariety,
  deleteVariety,
  getRecommendationsBySeason,
} from '../controllers/variety.controller';

const router = Router();

// 获取所有品种
router.get('/', ...getAllVarieties);

// 根据季节获取推荐品种
router.get('/recommendations/:season', ...getRecommendationsBySeason);

// 根据 ID 获取品种
router.get('/:id', ...getVarietyById);

// 创建品种
router.post('/', ...createVariety);

// 批量导入品种
router.post('/batch-import', ...batchImportVarieties);

// 更新品种
router.put('/:id', ...updateVariety);

// 删除品种
router.delete('/:id', ...deleteVariety);

export default router;
