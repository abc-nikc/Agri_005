import { Request, Response } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { systemSettingsService } from '../services/system-settings.service';

const adminOnly = ['系统管理员'];

export const getAll = [authorize(adminOnly), async (_req: Request, res: Response) => {
  try { res.json({ data: await systemSettingsService.getAll() }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
}];

export const getValue = [authorize(adminOnly), async (req: Request, res: Response) => {
  try {
    const val = await systemSettingsService.getValue(req.params.key);
    if (val === null) return res.status(404).json({ error: '配置项不存在' });
    res.json({ key: req.params.key, value: val });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
}];

export const updateSetting = [authorize(adminOnly), async (req: Request, res: Response) => {
  try {
    const result = await systemSettingsService.upsert(req.params.key, req.body.value, (req as any).user?.username);
    res.json({ data: result });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
}];

export const batchUpdate = [authorize(adminOnly), async (req: Request, res: Response) => {
  try {
    await systemSettingsService.batchUpdate(req.body.settings, (req as any).user?.username);
    res.json({ message: '批量更新成功' });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
}];
