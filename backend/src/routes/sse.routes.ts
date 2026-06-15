import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { smartSuggestions } from '../services/smart-suggestions.service';
import { NotificationService } from '../services/notification.service';
import { sensorService } from '../services/sensor.service';

const router = Router();

/** SSE 实时推送端点 — 支持 query token 认证（EventSource 不支持自定义 header） */
router.get('/stream', (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || '';
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key') as any;
    const userId = decoded.id;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const notifier = new NotificationService();

    const push = async () => {
      try {
        // 并行获取所有数据
        const [suggestions, unreadCount, sensorLatest] = await Promise.all([
          smartSuggestions.getAllSuggestions(),
          notifier.getUnreadCount(userId),
          sensorService.latest(),
        ]);

        res.write(`data: ${JSON.stringify({
          suggestions,
          unreadCount,
          sensorData: sensorLatest,
          timestamp: Date.now(),
        })}\n\n`);
      } catch {
        res.write(`data: ${JSON.stringify({ suggestions: [], unreadCount: 0, sensorData: [] })}\n\n`);
      }
    };

    push();
    const timer = setInterval(push, 10000); // 每10秒推送一次
    req.on('close', () => clearInterval(timer));
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
