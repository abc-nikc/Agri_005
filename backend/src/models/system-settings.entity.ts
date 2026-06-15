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
  stocktaking_locked: { value: 'false', type: 'boolean', description: '盘点期间是否锁定出入库操作' },
  // IoT 传感器阈值配置
  threshold_temperature_min: { value: '8', type: 'number', description: '温度正常范围下限 (°C)' },
  threshold_temperature_max: { value: '42', type: 'number', description: '温度正常范围上限 (°C)' },
  threshold_humidity_min: { value: '25', type: 'number', description: '湿度正常范围下限 (%)' },
  threshold_humidity_max: { value: '92', type: 'number', description: '湿度正常范围上限 (%)' },
  threshold_soil_moisture_min: { value: '18', type: 'number', description: '土壤湿度正常范围下限 (%)' },
  threshold_soil_moisture_max: { value: '82', type: 'number', description: '土壤湿度正常范围上限 (%)' },
  threshold_light_min: { value: '500', type: 'number', description: '光照正常范围下限 (lux)' },
  threshold_light_max: { value: '150000', type: 'number', description: '光照正常范围上限 (lux)' },
  threshold_ph_min: { value: '4', type: 'number', description: 'pH值正常范围下限' },
  threshold_ph_max: { value: '9', type: 'number', description: 'pH值正常范围上限' },
  threshold_co2_min: { value: '250', type: 'number', description: 'CO₂正常范围下限 (ppm)' },
  threshold_co2_max: { value: '1200', type: 'number', description: 'CO₂正常范围上限 (ppm)' },
  alert_max_count: { value: '20', type: 'number', description: '异常检测最大返回条数（0表示不限制）' },
  alert_auto_notify: { value: 'true', type: 'boolean', description: '检测到异常时是否自动创建通知' },
};
