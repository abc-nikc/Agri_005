import { Request, Response, NextFunction } from 'express';
import { cache } from '../config/redis';

/**
 * 缓存中间件 - 缓存 GET 请求结果
 * @param prefix 缓存键前缀
 * @param ttl 过期时间（秒），默认 5 分钟
 */
export function cacheMiddleware(prefix: string, ttl: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();

    const key = `${prefix}:${req.originalUrl}`;

    try {
      const cached = await cache.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json({ data: cached, cached: true });
      }
    } catch { /* cache miss, continue */ }

    // 包装 res.json 以自动缓存
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode === 200 && body?.data && !body.cached) {
        cache.set(key, body.data, ttl).catch(() => {});
      }
      return originalJson(body);
    };
    res.setHeader('X-Cache', 'MISS');
    return next();
  };
}
