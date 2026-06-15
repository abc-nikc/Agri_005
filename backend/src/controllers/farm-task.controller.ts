import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { FarmTask } from '../models/farm-task.entity';
import { aiService } from '../services/ai.service';
import { getCurrentSolarTerm } from '../utils/solar-term';

const repo = () => AppDataSource.getRepository(FarmTask);

export class FarmTaskController {

  /** 获取任务列表 */
  async list(req: Request, res: Response) {
    try {
      const { status, priority, category, assigneeId, plotId, page = 1, limit = 20 } = req.query;
      const qb = repo().createQueryBuilder('t');
      if (status) qb.andWhere('t.status = :status', { status });
      if (priority) qb.andWhere('t.priority = :priority', { priority });
      if (category) qb.andWhere('t.category = :category', { category });
      if (assigneeId) qb.andWhere('t.assignee_id = :assigneeId', { assigneeId });
      if (plotId) qb.andWhere('t.plot_id = :plotId', { plotId });
      qb.orderBy('t.scheduled_date', 'ASC').addOrderBy('t.priority', 'DESC').addOrderBy('t.createdAt', 'DESC');
      const total = await qb.getCount();
      const items = await qb.skip((Number(page) - 1) * Number(limit)).take(Number(limit)).getMany();
      res.json({ success: true, data: { items, total, page: Number(page), limit: Number(limit) } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** 获取单个任务 */
  async get(req: Request, res: Response) {
    try {
      const task = await repo().findOne({ where: { id: req.params.id } });
      if (!task) return res.status(404).json({ success: false, error: '任务不存在' });
      res.json({ success: true, data: task });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** 创建任务 */
  async create(req: Request, res: Response) {
    try {
      const data = { ...req.body, createdBy: (req as any).user?.id };
      const task = repo().create(data);
      await repo().save(task);
      res.json({ success: true, data: task });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** 更新任务 */
  async update(req: Request, res: Response) {
    try {
      const task = await repo().findOne({ where: { id: req.params.id } });
      if (!task) return res.status(404).json({ success: false, error: '任务不存在' });
      Object.assign(task, req.body);
      // 状态变更时记录完成时间
      if (req.body.status === '已完成' && !task.completedDate) {
        task.completedDate = new Date();
      }
      await repo().save(task);
      res.json({ success: true, data: task });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** 删除任务 */
  async delete(req: Request, res: Response) {
    try {
      await repo().delete(req.params.id);
      res.json({ success: true, message: '任务已删除' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** 任务统计 */
  async stats(req: Request, res: Response) {
    try {
      const all = await repo().find();
      const stats = {
        total: all.length,
        pending: all.filter(t => t.status === '待执行').length,
        inProgress: all.filter(t => t.status === '执行中').length,
        completed: all.filter(t => t.status === '已完成').length,
        overdue: all.filter(t => t.status === '已逾期').length,
        highPriority: all.filter(t => t.priority === 'high' && t.status !== '已完成' && t.status !== '已取消').length,
        aiGenerated: all.filter(t => t.aiGenerated).length,
        byCategory: {} as Record<string, number>,
        byAssignee: {} as Record<string, number>,
      };
      for (const t of all) {
        stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + 1;
        if (t.assigneeName) stats.byAssignee[t.assigneeName] = (stats.byAssignee[t.assigneeName] || 0) + 1;
      }
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** AI 智能排程 — 自动生成农事任务建议 */
  async aiSchedule(req: Request, res: Response) {
    try {
      const schedule = await aiService.smartSchedule();
      res.json({ success: true, data: { schedule } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** AI 根据建议创建任务 */
  async aiCreateTasks(req: Request, res: Response) {
    try {
      const { tasks } = req.body; // [{title, category, priority, plotId, plotName, varietyName, assigneeName, scheduledDate, aiReason}]
      if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ success: false, error: '请提供任务列表' });
      }
      const created = [];
      for (const t of tasks) {
        const task = repo().create({
          ...t,
          status: '待执行',
          aiGenerated: true,
          createdBy: (req as any).user?.id,
        });
        await repo().save(task);
        created.push(task);
      }
      res.json({ success: true, data: created, message: `成功创建 ${created.length} 个AI推荐任务` });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
