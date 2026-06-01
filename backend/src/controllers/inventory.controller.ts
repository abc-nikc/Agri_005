import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const service = new InventoryService();

export const getInventory = [
  authenticate, authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try { res.json({ data: await service.findAll(req.query as any) }); } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
];

export const getAlerts = [
  authenticate, authorize(['系统管理员', '农艺师', '操作员']),
  async (_req: Request, res: Response) => {
    try { res.json({ data: await service.getAlerts() }); } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
];

export const stockIn = [
  authenticate, authorize(['系统管理员', '农艺师', '操作员']),
  async (req: Request, res: Response) => {
    try { const r = await service.stockIn(req.body); res.status(201).json({ data: r }); } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
];

export const stockOut = [
  authenticate, authorize(['系统管理员', '农艺师', '操作员']),
  async (req: Request, res: Response) => {
    try { const r = await service.stockOut(req.body); res.json({ data: r }); } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
];

export const getTransactions = [
  authenticate, authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try { res.json({ data: await service.getTransactions(req.query as any) }); } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
];

export const stocktake = [
  authenticate, authorize(['系统管理员', '农艺师']),
  async (req: Request, res: Response) => {
    try { const r = await service.stocktake(req.body); res.status(201).json({ data: r }); } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
];

export const getStocktakes = [
  authenticate, authorize(['系统管理员', '农艺师', '操作员', '只读观察者']),
  async (req: Request, res: Response) => {
    try { res.json({ data: await service.getStocktakes(req.query as any) }); } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
];
