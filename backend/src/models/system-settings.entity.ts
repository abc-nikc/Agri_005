import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * 系统配置项（键值对）
 * FR-017/024/025: 所有业务阈值可通过系统设置动态配置
 */
@Entity('system_settings')
export class SystemSettings extends BaseEntity {
  @Column({ name: 'setting_key', length: 100, unique: true })
  settingKey!: string;

  @Column({ name: 'setting_value', type: 'text' })
  settingValue!: string;

  @Column({ name: 'setting_type', length: 20, default: 'string' })
  settingType!: string; // 'number' | 'string' | 'boolean'

  @Column({ name: 'description', length: 255, nullable: true })
  description?: string;

  @Column({ name: 'updated_by', length: 100, nullable: true })
  updatedBy?: string;
}

/** 默认配置项 */
export const DEFAULT_SETTINGS: Record<string, { value: string; type: string; description: string }> = {
  duplicate_window_minutes: { value: '5', type: 'number', description: '农事操作防重复提交时间窗口（分钟）' },
  stocktake_discrepancy_threshold: { value: '2', type: 'number', description: '盘点误差率阈值（百分比，如 2 表示 ±2%）' },
  low_stock_threshold: { value: '100', type: 'number', description: '低库存预警阈值（低于此数量触发）' },
  expiry_alert_days: { value: '30', type: 'number', description: '效期预警天数（到期前 N 天触发）' },
  sensor_offline_minutes: { value: '30', type: 'number', description: '传感器离线检测阈值（分钟）' },
};
