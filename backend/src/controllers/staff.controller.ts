import { Request, Response } from 'express';
import { StaffService } from '../services/staff.service';
import { validateRequest, schemas } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const staffService = new StaffService();

export const getAllStaff = [
  authenticate, authorize(['系统管理员', '农艺师']),
  async (req: Request, res: Response) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      res.json({ data: await staffService.findAll(includeInactive) });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
];

export const getStaffById = [
  authenticate, authorize(['系统管理员', '农艺师']),
  async (req: Request, res: Response) => {
    try {
      const staff = await staffService.findById(req.params.id);
      if (!staff) return res.status(404).json({ error: '员工不存在' });
      res.json({ data: staff });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
];

export const createStaff = [
  authenticate, authorize(['系统管理员']),
  async (req: Request, res: Response) => {
    try {
      const staff = await staffService.create(req.body);
      res.status(201).json({ message: '员工创建成功', data: staff });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  },
];

export const updateStaff = [
  authenticate, authorize(['系统管理员']),
  async (req: Request, res: Response) => {
    try {
      const staff = await staffService.update(req.params.id, req.body);
      res.json({ message: '员工更新成功', data: staff });
    } catch (e: any) { res.status(e.message.includes('不存在') ? 404 : 400).json({ error: e.message }); }
  },
];

export const updateStaffPassword = [
  authenticate, authorize(['系统管理员']),
  async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      if (!password) return res.status(400).json({ error: '密码不能为空' });
      await staffService.updatePassword(req.params.id, password);
      res.json({ message: '密码更新成功' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
];

export const deleteStaff = [
  authenticate, authorize(['系统管理员']),
  async (req: Request, res: Response) => {
    try {
      await staffService.delete(req.params.id);
      res.json({ message: '员工删除成功' });
    } catch (e: any) { res.status(e.message.includes('不存在') ? 404 : 500).json({ error: e.message }); }
  },
];

export const getStaffStatistics = [
  authenticate, authorize(['系统管理员', '农艺师']),
  async (_req: Request, res: Response) => {
    try { res.json({ data: await staffService.getStatistics() }); } catch (e: any) { res.status(500).json({ error: e.message }); }
  },
];
