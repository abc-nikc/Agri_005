import Redis from 'ioredis';
import { config } from 'dotenv';

config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;
let enabled = true;

export function getRedis(): Redis | null {
  if (!enabled) return null;
  if (redis) return redis;

  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 2) { enabled = false; return null; }
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
    });

    redis.on('error', () => { enabled = false; redis = null; });
    redis.on('connect', () => console.log('[Redis] Connected to', REDIS_URL));

    return redis;
  } catch {
    enabled = false;
    return null;
  }
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const r = getRedis();
    if (!r) return null;
    try { const v = await r.get(key); return v ? JSON.parse(v) : null; } catch { return null; }
  },

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const r = getRedis();
    if (!r) return;
    try { await r.setex(key, ttlSeconds, JSON.stringify(value)); } catch { /* silently fail */ }
  },

  async del(key: string): Promise<void> {
    const r = getRedis();
    if (!r) return;
    try { await r.del(key); } catch { /* silently fail */ }
  },

  async incr(key: string, ttlSeconds: number = 900): Promise<number> {
    const r = getRedis();
    if (!r) return 0;
    try {
      const v = await r.incr(key);
      if (v === 1) await r.expire(key, ttlSeconds);
      return v;
    } catch { return 0; }
  },

  async sadd(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const r = getRedis();
    if (!r) return;
    try { await r.sadd(key, value); if (ttlSeconds) await r.expire(key, ttlSeconds); } catch { /* silently fail */ }
  },

  async sismember(key: string, value: string): Promise<boolean> {
    const r = getRedis();
    if (!r) return false;
    try { return (await r.sismember(key, value)) === 1; } catch { return false; }
  },
};

export const isRedisAvailable = () => enabled && redis !== null;
