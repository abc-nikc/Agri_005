import { Request, Response } from 'express';
import { CostService } from '../services/cost.service';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const service = new CostService();
const roles = ['系统管理员', '农艺师', '操作员'];
const readRoles = ['系统管理员', '农艺师', '操作员', '只读观察者'];

const wrap = (fn: Function) => [authenticate, authorize(roles), async (req: Request, res: Response) => { try { const r = await fn(req); res.json({ data: r }); } catch (e: any) { res.status(400).json({ error: e.message }); } }];
const wrapRead = (fn: Function) => [authenticate, authorize(readRoles), async (req: Request, res: Response) => { try { const r = await fn(req); res.json({ data: r }); } catch (e: any) { res.status(400).json({ error: e.message }); } }];

export const addCost = wrap((r: Request) => service.addCost(r.body));
export const getCosts = wrapRead((r: Request) => service.getCosts(r.query as any));
export const addSale = wrap((r: Request) => service.addSale(r.body));
export const getSales = wrapRead((r: Request) => service.getSales(r.query as any));
export const costByPlot = wrapRead((r: Request) => service.costByPlot(r.params.id));
export const costByBatch = wrapRead((r: Request) => service.costByBatch(r.params.id));
export const unitCost = wrapRead((r: Request) => service.unitCost(r.params.id));
export const profitAnalysis = wrapRead((r: Request) => service.profitAnalysis(r.query as any));
export const yieldPredict = wrapRead((r: Request) => service.yieldPredict(r.params.variety as string));
export const batchCompare = wrapRead(async (r: Request) => service.batchCompare(r.params.variety as string));
export const generateReport = wrapRead((r: Request) => service.generateReport(r.query as any));
