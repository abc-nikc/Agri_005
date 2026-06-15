import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = '待执行' | '执行中' | '已完成' | '已取消' | '已逾期';
export type TaskCategory = '灌溉' | '施肥' | '打药' | '除草' | '采收' | '播种' | '移栽' | '整枝' | '巡检' | '维修' | '其他';

@Entity('farm_tasks')
export class FarmTask extends BaseEntity {
  @Column({ name: 'title', length: 200 })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'category', length: 20 })
  @Index()
  category!: TaskCategory;

  @Column({ name: 'priority', length: 10, default: 'medium' })
  @Index()
  priority!: TaskPriority;

  @Column({ name: 'status', length: 20, default: '待执行' })
  @Index()
  status!: TaskStatus;

  @Column({ name: 'plot_id', length: 36, nullable: true })
  @Index()
  plotId?: string;

  @Column({ name: 'plot_name', length: 100, nullable: true })
  plotName?: string;

  @Column({ name: 'variety_id', length: 36, nullable: true })
  varietyId?: string;

  @Column({ name: 'variety_name', length: 100, nullable: true })
  varietyName?: string;

  @Column({ name: 'batch_id', length: 36, nullable: true })
  batchId?: string;

  @Column({ name: 'assignee_id', length: 36, nullable: true })
  @Index()
  assigneeId?: string;

  @Column({ name: 'assignee_name', length: 100, nullable: true })
  assigneeName?: string;

  @Column({ name: 'scheduled_date', type: 'datetime', nullable: true })
  @Index()
  scheduledDate?: Date;

  @Column({ name: 'completed_date', type: 'datetime', nullable: true })
  completedDate?: Date;

  @Column({ name: 'estimated_duration', nullable: true })
  estimatedDuration?: number; // 分钟

  @Column({ name: 'actual_duration', nullable: true })
  actualDuration?: number;

  @Column({ name: 'created_by', length: 36, nullable: true })
  createdBy?: string;

  @Column({ name: 'ai_generated', default: false })
  aiGenerated!: boolean;

  @Column({ name: 'ai_reason', type: 'text', nullable: true })
  aiReason?: string;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;
}
