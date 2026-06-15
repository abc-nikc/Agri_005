import { Request, Response } from 'express';
import { ProductionBatchService } from '../services/production-batch.service';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const service = new ProductionBatchService();

export const getBatches = [
  authenticate, authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try {
      const batches = await service.findAll(req.query as any);
      res.json({ data: batches });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
];

export const getBatchById = [
  authenticate, authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try {
      const batch = await service.findById(req.params.id);
      if (!batch) return res.status(404).json({ error: '批次不存在' });
      res.json({ data: batch });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
];

export const createBatch = [
  authenticate, authorize(['系统管理员', '农艺师', '操作员']),
  async (req: Request, res: Response) => {
    try {
      const batch = await service.create(req.body);
      res.status(201).json({ data: batch });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
];

export const completeBatch = [
  authenticate, authorize(['系统管理员', '农艺师', '操作员']),
  async (req: Request, res: Response) => {
    try {
      const batch = await service.completeBatch(req.params.id, req.body.actualHarvestDate);
      res.json({ data: batch });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
];

export const deleteBatch = [
  authenticate, authorize(['系统管理员', '农艺师']),
  async (req: Request, res: Response) => {
    try {
      await service.delete(req.params.id);
      res.json({ message: '删除成功' });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
];

// 🔴 边缘场景：按品质等级拆分子批次
export const splitBatchByQuality = [
  authenticate, authorize(['系统管理员', '农艺师']),
  async (req: Request, res: Response) => {
    try {
      const subBatches = await service.splitByQualityGrade(req.params.id, req.body.grades);
      res.status(201).json({ data: subBatches, message: `已按 ${req.body.grades.length} 个品质等级拆分为子批次` });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
];
