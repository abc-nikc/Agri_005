import { Request, Response } from 'express';
import { PlantingPlanService } from '../services/planting-plan.service';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const service = new PlantingPlanService();

export const getPlans = [
  authenticate, authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try {
      const plans = await service.findAll(req.query as any);
      res.json({ data: plans });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
];

export const getPlanById = [
  authenticate, authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try {
      const plan = await service.findById(req.params.id);
      if (!plan) return res.status(404).json({ error: '计划不存在' });
      res.json({ data: plan, standardProcess: PlantingPlanService.getStandardProcess(plan.varietyName) });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
];

export const createPlan = [
  authenticate, authorize(['系统管理员', '农艺师']),
  async (req: Request, res: Response) => {
    try {
      const plan = await service.create(req.body);
      res.status(201).json({ data: plan });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
];

export const updatePlan = [
  authenticate, authorize(['系统管理员', '农艺师']),
  async (req: Request, res: Response) => {
    try {
      const plan = await service.update(req.params.id, req.body);
      res.json({ data: plan });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
];

export const deletePlan = [
  authenticate, authorize(['系统管理员', '农艺师']),
  async (req: Request, res: Response) => {
    try {
      await service.delete(req.params.id);
      res.json({ message: '删除成功' });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
];

export const getTermRecommendations = [
  authenticate, authorize(['系统管理员', '农艺师', '操作员']),
  async (_req: Request, res: Response) => {
    const result = service.getCurrentTermRecommendations();
    console.log('[DEBUG] SolarTerm:', result, 'Date:', new Date().toISOString());
    res.json({ data: result });
  },
];
