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

// ====== 告警记录 ======

export const getAlertHistory = [authenticate, authorize(roles), async (req: Request, res: Response) => {
  try {
    const result = await sensorService.getAlertHistory(req.query as any);
    res.json({ data: result.records, total: result.total, page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 20 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}];

export const getAlertStats = [authenticate, authorize(roles), async (req: Request, res: Response) => {
  try { res.json({ data: await sensorService.getAlertStatistics() }); } catch (e: any) { res.status(500).json({ error: e.message }); }
}];

export const resolveAlert = [authenticate, authorize(writeRoles), async (req: Request, res: Response) => {
  try {
    await sensorService.resolveAlert(req.params.id, (req as any).user?.username || 'system');
    res.json({ message: '告警已处理' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}];

// ====== 阈值配置 ======

export const getThresholds = [authenticate, authorize(roles), async (req: Request, res: Response) => {
  try { res.json({ data: await sensorService.getThresholdsConfig() }); } catch (e: any) { res.status(500).json({ error: e.message }); }
}];

export const updateThreshold = [authenticate, authorize(['系统管理员', '农艺师']), async (req: Request, res: Response) => {
  try {
    const { sensorType, min, max } = req.body;
    if (!sensorType || min === undefined || max === undefined) {
      return res.status(400).json({ error: '缺少 sensorType, min 或 max 参数' });
    }
    await sensorService.updateThreshold(sensorType, Number(min), Number(max), (req as any).user?.username);
    res.json({ message: '阈值已更新' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}];
