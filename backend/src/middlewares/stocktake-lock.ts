import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { SystemSettings } from '../models/system-settings.entity';

/**
 * 盘点锁定中间件 — 盘点进行中时禁止出入库操作
 */
export const checkStocktakeLock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = AppDataSource.getRepository(SystemSettings);
    const setting = await repo.findOne({ where: { settingKey: 'stocktaking_locked' } });
    if (setting?.settingValue === 'true') {
      return res.status(423).json({
        error: '盘点进行中，出入库操作已暂停，请等待盘点完成后重试',
        code: 'STOCKTAKE_LOCKED',
      });
    }
    next();
  } catch { next(); /* 查询失败不阻塞 */ }
};
