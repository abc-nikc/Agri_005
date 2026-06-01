import { Request, Response, NextFunction, Errback } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

/**
 * 全局错误处理中间件
 * 必须放在所有路由之后、服务器启动之前
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 记录错误日志
  console.error('[ERROR]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // TypeORM 错误处理
  if (err instanceof QueryFailedError) {
    return res.status(400).json({
      error: '数据库查询失败',
      code: 'DB_QUERY_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  if (err instanceof EntityNotFoundError) {
    return res.status(404).json({
      error: '请求的资源不存在',
      code: 'ENTITY_NOT_FOUND',
    });
  }

  // JWT 错误处理
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: '无效的认证令牌',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: '认证令牌已过期',
      code: 'TOKEN_EXPIRED',
    });
  }

  // 验证错误
  if (err.name === 'ValidationError' || err.name === 'BadRequestError') {
    return res.status(400).json({
      error: err.message || '请求参数验证失败',
      code: 'VALIDATION_ERROR',
      details: err.details || undefined,
    });
  }

  // 自定义业务错误
  if (err.code && err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details || undefined,
    });
  }

  // 默认服务器错误
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? '服务器内部错误' : err.message;

  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 创建自定义业务错误
 */
export class BusinessError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

/**
 * 404 错误处理
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: `无法找到 ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method,
  });
};
