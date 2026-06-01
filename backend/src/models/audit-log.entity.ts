import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AuditActionType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
}

export enum AuditResult {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('audit_logs')
@Index(['actionType', 'createdAt'])
@Index(['userId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  username?: string;

  @Column({
    type: 'enum',
    enum: AuditActionType,
  })
  actionType!: AuditActionType;

  @Column({ type: 'jsonb', nullable: true })
  actionParams?: Record<string, any>;

  @Column({
    type: 'enum',
    enum: AuditResult,
  })
  result!: AuditResult;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
