import { Request, Response } from 'express';
import { VarietyService } from '../services/variety.service';
import { validateRequest, schemas } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const varietyService = new VarietyService();

/**
 * 获取所有品种
 * GET /api/v1/varieties
 */
export const getAllVarieties = [
  authenticate,
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const varieties = await varietyService.findAll(includeInactive);
      res.json({ data: varieties });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || '获取品种列表失败',
        code: 'VARIETY_FETCH_ERROR',
      });
    }
  },
];

/**
 * 根据 ID 获取品种
 * GET /api/v1/varieties/:id
 */
export const getVarietyById = [
  authenticate,
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  validateRequest(schemas.uuidParam, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const variety = await varietyService.findById(id);

      if (!variety) {
        return res.status(404).json({
          error: '品种不存在',
          code: 'VARIETY_NOT_FOUND',
        });
      }

      res.json({ data: variety });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || '获取品种失败',
        code: 'VARIETY_FETCH_ERROR',
      });
    }
  },
];

/**
 * 创建品种
 * POST /api/v1/varieties
 */
export const createVariety = [
  authenticate,
  authorize(['系统管理员', '农艺师']),
  validateRequest(schemas.createVariety),
  async (req: Request, res: Response) => {
    try {
      const varietyData = req.body;
      const variety = await varietyService.create(varietyData);

      res.status(201).json({
        message: '品种创建成功',
        data: variety,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || '创建品种失败',
        code: 'VARIETY_CREATE_ERROR',
      });
    }
  },
];

/**
 * 批量导入品种
 * POST /api/v1/varieties/batch-import
 */
export const batchImportVarieties = [
  authenticate,
  authorize(['系统管理员', '农艺师']),
  async (req: Request, res: Response) => {
    try {
      const { varieties } = req.body;

      if (!Array.isArray(varieties) || varieties.length === 0) {
        return res.status(400).json({
          error: '品种数据必须是非空数组',
          code: 'INVALID_INPUT',
        });
      }

      const result = await varietyService.batchImport(varieties);

      res.json({
        message: `导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || '批量导入失败',
        code: 'VARIETY_BATCH_IMPORT_ERROR',
      });
    }
  },
];

/**
 * 更新品种
 * PUT /api/v1/varieties/:id
 */
export const updateVariety = [
  authenticate,
  authorize(['系统管理员', '农艺师']),
  validateRequest(schemas.uuidParam, 'params'),
  validateRequest(schemas.createVariety),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const varietyData = req.body;
      const variety = await varietyService.update(id, varietyData);

      res.json({
        message: '品种更新成功',
        data: variety,
      });
    } catch (error: any) {
      if (error.message.includes('不存在')) {
        return res.status(404).json({
          error: error.message,
          code: 'VARIETY_NOT_FOUND',
        });
      }

      res.status(400).json({
        error: error.message || '更新品种失败',
        code: 'VARIETY_UPDATE_ERROR',
      });
    }
  },
];

/**
 * 删除品种（软删除）
 * DELETE /api/v1/varieties/:id
 */
export const deleteVariety = [
  authenticate,
  authorize(['系统管理员']),
  validateRequest(schemas.uuidParam, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await varietyService.delete(id);

      res.json({
        message: '品种删除成功',
      });
    } catch (error: any) {
      if (error.message.includes('不存在')) {
        return res.status(404).json({
          error: error.message,
          code: 'VARIETY_NOT_FOUND',
        });
      }

      res.status(500).json({
        error: error.message || '删除品种失败',
        code: 'VARIETY_DELETE_ERROR',
      });
    }
  },
];

/**
 * 根据季节获取推荐品种
 * GET /api/v1/varieties/recommendations/:season
 */
export const getRecommendationsBySeason = [
  authenticate,
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try {
      const { season } = req.params;
      const varieties = await varietyService.getRecommendationsBySeason(season);

      res.json({ data: varieties });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || '获取推荐品种失败',
        code: 'VARIETY_RECOMMENDATION_ERROR',
      });
    }
  },
];
