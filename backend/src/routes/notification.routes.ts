import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { NotificationService } from '../services/notification.service';
import { validateRequest, schemas } from '../middlewares/validation.middleware';

const router = Router();
const notificationService = new NotificationService();

/** 获取系统内、邮件、微信和 MQTT 渠道配置状态 */
router.get('/channels', authenticate, (_req: Request, res: Response) => {
  res.json({ data: notificationService.getChannelStatus() });
});

/** 管理员发送渠道测试通知 */
router.post('/test', authenticate, authorize(['系统管理员']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const channels = Array.isArray(req.body.channels) ? req.body.channels : ['in_app'];
    await notificationService.sendNotification(userId, req.body.message || '这是一条农场管家通知渠道测试消息', {
      type: 'info',
      link: '/notifications',
      channels,
      email: req.body.email,
    });
    res.json({ message: '通知发送任务已执行', data: notificationService.getChannelStatus() });
  } catch (error: any) {
    res.status(400).json({ error: error.message || '通知发送失败' });
  }
});

/**
 * 获取用户通知列表
 * GET /api/v1/notifications
 */
router.get(
  '/',
  authenticate,
  validateRequest(schemas.pagination, 'query'),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { page = 1, limit = 20 } = req.query;

      const { notifications, total } = await notificationService.getAllNotifications(
        userId,
        Number(page),
        Number(limit)
      );

      res.json({
        data: notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || '获取通知失败',
        code: 'NOTIFICATION_FETCH_ERROR',
      });
    }
  }
);

/**
 * 获取未读通知数量
 * GET /api/v1/notifications/unread-count
 */
router.get(
  '/unread-count',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const count = await notificationService.getUnreadCount(userId);

      res.json({ count });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || '获取未读数量失败',
        code: 'NOTIFICATION_COUNT_ERROR',
      });
    }
  }
);

/**
 * 标记通知为已读
 * PUT /api/v1/notifications/:id/read
 */
router.put(
  '/:id/read',
  authenticate,
  validateRequest(schemas.uuidParam, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      await notificationService.markAsRead(id, userId);

      res.json({ message: '标记成功' });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || '标记失败',
        code: 'NOTIFICATION_MARK_ERROR',
      });
    }
  }
);

/**
 * 标记所有通知为已读
 * PUT /api/v1/notifications/read-all
 */
router.put(
  '/read-all',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      await notificationService.markAllAsRead(userId);

      res.json({ message: '全部标记已读成功' });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || '标记失败',
        code: 'NOTIFICATION_MARK_ALL_ERROR',
      });
    }
  }
);

/**
 * 删除通知
 * DELETE /api/v1/notifications/:id
 */
router.delete(
  '/:id',
  authenticate,
  validateRequest(schemas.uuidParam, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      await notificationService.deleteNotification(id, userId);

      res.json({ message: '删除成功' });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || '删除失败',
        code: 'NOTIFICATION_DELETE_ERROR',
      });
    }
  }
);

export default router;
