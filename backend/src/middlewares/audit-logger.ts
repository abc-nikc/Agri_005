import { Request, Response, NextFunction } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { AuditLog } from '../models/audit-log.entity';

/**
 * 审计日志中间件
 * 记录所有关键操作（创建、更新、删除）
 */
export const auditLogger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 只记录写操作
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  const startTime = Date.now();
  const originalSend = res.send;

  // 拦截响应，记录操作结果
  res.send = function (body: any): any {
    const duration = Date.now() - startTime;
    
    // 异步记录审计日志（不阻塞响应）
    setImmediate(async () => {
      try {
        const user = (req as any).user;
        const auditLogRepository = AppDataSource.getRepository(AuditLog);

        await auditLogRepository.save({
          userId: user?.id,
          userIp: req.ip || req.socket.remoteAddress,
          actionType: `${req.method} ${req.path}`,
          actionParams: {
            query: req.query,
            params: req.params,
            body: sanitizeBody(req.body), // 脱敏处理
          },
          targetEntity: extractEntityFromPath(req.path),
          targetId: req.params.id || undefined,
          beforeState: null, // 需要在业务逻辑中填充
          afterState: null, // 需要在业务逻辑中填充
          result: res.statusCode < 400 ? '成功' : '失败',
          errorMessage: res.statusCode >= 400 ? body : undefined,
          createdAt: new Date(),
        });
      } catch (error) {
        console.error('[ERROR] Failed to save audit log:', error);
      }
    });

    return originalSend.call(this, body);
  };

  next();
};

/**
 * 脱敏处理：移除密码等敏感字段
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'cookie'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  }

  return sanitized;
}

/**
 * 从路径中提取实体名称
 */
function extractEntityFromPath(path: string): string {
  const matches = path.match(/\/api\/v1\/([^/]+)/);
  return matches ? matches[1] : 'unknown';
}

/**
 * 手动记录审计日志的辅助函数
 * 用于在业务逻辑中记录更详细的审计信息
 */
export const logAudit = async (
  userId: string,
  actionType: string,
  targetEntity: string,
  targetId: string,
  beforeState: any,
  afterState: any,
  req: Request
): Promise<void> => {
  try {
    const auditLogRepository = AppDataSource.getRepository(AuditLog);
    await auditLogRepository.save({
      userId,
      userIp: req.ip || req.socket.remoteAddress,
      actionType,
      actionParams: {
        method: req.method,
        path: req.path,
      },
      targetEntity,
      targetId,
      beforeState,
      afterState,
      result: '成功',
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('[ERROR] Failed to log audit:', error);
  }
};
