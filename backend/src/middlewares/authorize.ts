import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';

/**
 * RBAC 授权中间件工厂函数
 * @param allowedRoles 允许访问的角色数组
 * @param allowedDivisions 允许访问的业务分工数组（可选）
 */
export const authorize = (
  allowedRoles: string[],
  allowedDivisions?: string[]
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // 检查用户是否已认证
      if (!req.user) {
        return res.status(401).json({
          error: '用户未认证',
          code: 'USER_NOT_AUTHENTICATED'
        });
      }
      
      // 检查角色权限
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: '权限不足，无法访问此资源',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      // 检查业务分工权限（如果指定了）
      if (allowedDivisions && allowedDivisions.length > 0) {
        if (!req.user.division || !allowedDivisions.includes(req.user.division)) {
          return res.status(403).json({
            error: '业务分工权限不足',
            code: 'DIVISION_PERMISSION_DENIED'
          });
        }
      }
      
      // 记录授权日志（审计）
      console.log(`[AUTH] User ${req.user.username} (${req.user.role}) accessed ${req.method} ${req.path}`);
      
      next();
    } catch (error) {
      return res.status(500).json({
        error: '授权过程中发生错误',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
};
