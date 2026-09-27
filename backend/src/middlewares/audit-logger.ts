import { Request, Response, NextFunction } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { AuditActionType, AuditLog, AuditResult } from '../models/audit-log.entity';

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
          username: user?.username,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.get('user-agent'),
          actionType: actionTypeForRequest(req),
          actionParams: {
            targetEntity: extractEntityFromPath(req.path),
            targetId: req.params.id || undefined,
            query: req.query,
            params: req.params,
            body: sanitizeBody(req.body), // 脱敏处理
          },
          result: res.statusCode < 400 ? AuditResult.SUCCESS : AuditResult.FAILED,
          errorMessage: res.statusCode >= 400 ? String(body) : undefined,
        });
      } catch (error) {
        console.error('[ERROR] Failed to save audit log:', error);
      }
    });

    return originalSend.call(this, body);
  };

  return next();
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

function actionTypeForRequest(req: Request): AuditActionType {
  if (req.path.includes('/auth/login')) return AuditActionType.LOGIN;
  if (req.path.includes('/auth/logout')) return AuditActionType.LOGOUT;
  if (req.method === 'POST') return AuditActionType.CREATE;
  if (req.method === 'DELETE') return AuditActionType.DELETE;
  return AuditActionType.UPDATE;
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
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      actionType: actionType as AuditActionType,
      actionParams: {
        method: req.method,
        path: req.path,
        targetEntity,
        targetId,
        beforeState,
        afterState,
      },
      result: AuditResult.SUCCESS,
    });
  } catch (error) {
    console.error('[ERROR] Failed to log audit:', error);
  }
};
