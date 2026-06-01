import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { cache } from '../config/redis';

config();

export interface AuthRequest extends Request {
  user?: { id: string; username: string; role: string; division?: string; };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: '未提供认证令牌', code: 'TOKEN_MISSING' });

    const token = authHeader.split(' ')[1];

    // Redis 黑名单检查
    if (await cache.sismember('token:blacklist', token)) {
      return res.status(401).json({ error: '令牌已失效', code: 'TOKEN_BLACKLISTED' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key') as any;
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role, division: decoded.division };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) return res.status(401).json({ error: '令牌已过期', code: 'TOKEN_EXPIRED' });
    if (error instanceof jwt.JsonWebTokenError) return res.status(401).json({ error: '无效令牌', code: 'TOKEN_INVALID' });
    return res.status(500).json({ error: '认证错误', code: 'AUTH_ERROR' });
  }
};
