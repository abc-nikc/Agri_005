import { Request, Response, NextFunction } from 'express';

/**
 * 🔴 边缘场景：并发编辑冲突处理
 * 捕获 TypeORM 乐观锁异常（OptimisticLockVersionMismatchError），返回冲突提示
 */
export function conflictHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // TypeORM 乐观锁冲突：version 不匹配
  if (err.name === 'OptimisticLockVersionMismatchError' ||
      err.message?.includes('version') && err.message?.includes('conflict')) {
    return res.status(409).json({
      error: '编辑冲突',
      code: 'CONCURRENT_EDIT_CONFLICT',
      message: '该数据已被他人编辑，请刷新后重新提交。系统将展示最新数据与您的差异。',
      suggestion: '重新获取最新数据后再次编辑',
    });
  }
  next(err);
}
