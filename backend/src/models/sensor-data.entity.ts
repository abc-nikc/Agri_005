import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('sensor_data')
export class SensorData extends BaseEntity {
  @Column({ name: 'plot_id', length: 36 })
  @Index()
  plotId!: string;

  @Column({ name: 'device_id', length: 100 })
  @Index()
  deviceId!: string;

  @Column({ name: 'sensor_type', length: 30 })
  sensorType!: string; // temperature/humidity/soil_moisture/light/ph/co2

  @Column({ name: 'value', type: 'decimal', precision: 10, scale: 3 })
  value!: number;

  @Column({ name: 'unit', length: 20 })
  unit!: string;

  @Column({ name: 'recorded_at', type: 'datetime' })
  @Index()
  recordedAt!: Date;

  @Column({ name: 'equipment_id', length: 36, nullable: true })
  equipmentId?: string;
}
