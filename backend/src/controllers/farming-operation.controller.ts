import { Request, Response } from 'express';
import { FarmingOperationService } from '../services/farming-operation.service';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const service = new FarmingOperationService();

// 获取所有农事操作记录
export const getOperations = [
  authenticate,
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try {
      const filters = {
        plotId: req.query.plotId as string,
        batchId: req.query.batchId as string,
        operationType: req.query.operationType as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      const operations = await service.findAll(filters);
      res.json({ data: operations });
    } catch (error: any) {
      res.status(500).json({ error: error.message, code: 'OPERATIONS_FETCH_ERROR' });
    }
  },
];

// 获取单条记录
export const getOperationById = [
  authenticate,
  authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try {
      const operation = await service.findById(req.params.id);
      if (!operation) return res.status(404).json({ error: '记录不存在', code: 'NOT_FOUND' });
      res.json({ data: operation });
    } catch (error: any) {
      res.status(500).json({ error: error.message, code: 'OPERATION_FETCH_ERROR' });
    }
  },
];

// 创建农事操作记录
export const createOperation = [
  authenticate,
  authorize(['系统管理员', '农艺师', '操作员']),
  async (req: Request, res: Response) => {
    try {
      const operation = await service.create(req.body);
      res.status(201).json({ data: operation });
    } catch (error: any) {
      const status = error.message.includes('重复提交') ? 409 : 400;
      res.status(status).json({ error: error.message, code: 'OPERATION_CREATE_ERROR' });
    }
  },
];

// 更新记录
export const updateOperation = [
  authenticate,
  authorize(['系统管理员', '农艺师', '操作员']),
  async (req: Request, res: Response) => {
    try {
      const operation = await service.update(req.params.id, req.body);
      res.json({ data: operation });
    } catch (error: any) {
      res.status(400).json({ error: error.message, code: 'OPERATION_UPDATE_ERROR' });
    }
  },
];

// 删除记录（管理员）
export const deleteOperation = [
  authenticate,
  authorize(['系统管理员', '农艺师']),
  async (req: Request, res: Response) => {
    try {
      await service.delete(req.params.id);
      res.json({ message: '删除成功' });
    } catch (error: any) {
      res.status(400).json({ error: error.message, code: 'OPERATION_DELETE_ERROR' });
    }
  },
];
