import { Request, Response, NextFunction } from 'express';
import { cache } from '../config/redis';

const memoryAttempts = new Map<string, { count: number; firstAttempt: number; lockedUntil?: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60; // 15分钟（秒）
const ATTEMPT_WINDOW = 15 * 60;   // 窗口期（秒）

export const loginRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `login:${username}@${ip}`;

    // 优先 Redis
    const count = await cache.incr(key);
    if (count >= MAX_ATTEMPTS) {
      return res.status(403).json({
        error: `登录失败次数过多，请 ${Math.ceil(LOCKOUT_DURATION / 60)} 分钟后重试`,
        code: 'ACCOUNT_LOCKED',
      });
    }

    (req as any).loginAttemptKey = key;
    next();
  } catch {
    // Redis 不可用时降级到内存
    const { username } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${username}@${ip}`;
    const now = Date.now();
    const attempt = memoryAttempts.get(key);

    if (attempt?.lockedUntil && attempt.lockedUntil > now) {
      return res.status(403).json({ error: '登录失败次数过多，请稍后重试', code: 'ACCOUNT_LOCKED' });
    }
    if (attempt && now - attempt.firstAttempt < ATTEMPT_WINDOW * 1000 && attempt.count >= MAX_ATTEMPTS) {
      attempt.lockedUntil = now + LOCKOUT_DURATION * 1000;
      memoryAttempts.set(key, attempt);
      return res.status(403).json({ error: '登录失败次数过多，账户已锁定', code: 'ACCOUNT_LOCKED' });
    }
    if (!attempt || now - attempt.firstAttempt >= ATTEMPT_WINDOW * 1000) {
      memoryAttempts.set(key, { count: 0, firstAttempt: now });
    }
    (req as any).loginAttemptKey = key;
    next();
  }
};

export const recordFailedLogin = async (key: string) => {
  // Redis 已自动计数，内存降级
  const attempt = memoryAttempts.get(key) || { count: 0, firstAttempt: Date.now() };
  attempt.count += 1;
  memoryAttempts.set(key, attempt);
};

export const clearLoginAttempts = async (key: string) => {
  await cache.del(key);
  memoryAttempts.delete(key);
};
