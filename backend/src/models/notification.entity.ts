import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Staff } from './staff.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => Staff, { nullable: true })
  user?: Staff;

  @Column('text')
  message!: string;

  @Column({ name: 'is_read', default: false })
  isRead!: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({ name: 'type', length: 50, default: 'info' })
  type!: string; // info, warning, error, success

  @Column({ name: 'link', length: 255, nullable: true })
  link?: string; // 点击通知后跳转的链接

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
