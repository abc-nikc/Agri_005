import { Entity, Column, CreateDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * 传感器告警记录
 * 每次检测到异常时自动生成一条记录
 */
@Entity('alert_records')
export class AlertRecord extends BaseEntity {
  @Column({ name: 'plot_id', length: 50, nullable: true })
  plotId?: string;

  @Column({ name: 'device_id', length: 50 })
  deviceId!: string;

  @Column({ name: 'sensor_type', length: 50, nullable: true })
  sensorType?: string;

  @Column({ name: 'sensor_name', length: 50, nullable: true })
  sensorName?: string;

  @Column('decimal', { precision: 10, scale: 3, nullable: true })
  value?: number;

  @Column({ length: 20, nullable: true })
  unit?: string;

  @Column({ name: 'anomaly_type', length: 50 })
  anomalyType!: string; // out_of_bounds, out_of_range, offline, dead_value

  @Column('text')
  message!: string;

  @Column({ length: 20, default: 'warning' })
  severity!: string; // warning, critical

  @Column({ name: 'threshold', length: 100, nullable: true })
  threshold?: string;

  @Column({ default: false })
  resolved!: boolean;

  @Column({ name: 'resolved_at', type: 'datetime', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'resolved_by', length: 100, nullable: true })
  resolvedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
