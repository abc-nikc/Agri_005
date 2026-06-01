import { Request, Response } from 'express';
import { sensorService } from '../services/sensor.service';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const roles = ['系统管理员', '农艺师', '操作员', '只读观察者'];
const writeRoles = ['系统管理员', '农艺师', '操作员'];

export const getLatest = [authenticate, authorize(roles), async (req: Request, res: Response) => {
  try { res.json({ data: await sensorService.latest(req.query.plotId as string) }); } catch (e: any) { res.status(500).json({ error: e.message }); }
}];

export const query = [authenticate, authorize(roles), async (req: Request, res: Response) => {
  try { res.json({ data: await sensorService.query(req.query as any) }); } catch (e: any) { res.status(500).json({ error: e.message }); }
}];

export const getStats = [authenticate, authorize(roles), async (req: Request, res: Response) => {
  try { res.json({ data: await sensorService.stats(req.query.plotId as string, Number(req.query.hours) || 24) }); } catch (e: any) { res.status(500).json({ error: e.message }); }
}];

export const sendControl = [authenticate, authorize(writeRoles), async (req: Request, res: Response) => {
  try { res.json({ data: await sensorService.sendControl(req.body.plotId, req.body.deviceId, req.body.command, req.body.params) }); } catch (e: any) { res.status(400).json({ error: e.message }); }
}];

export const getAnomalies = [authenticate, authorize(roles), async (req: Request, res: Response) => {
  try {
    const result = await sensorService.detectAnomalies(req.query.plotId as string);
    res.json({ data: result.anomalies, summary: result.summary });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}];
