import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('equipment')
export class Equipment extends BaseEntity {
  @Column({ name: 'equipment_number', length: 50, unique: true })
  equipmentNumber!: string;

  @Column({ name: 'type', type: 'enum', enum: ['农机具', '灌溉设备', '物联网设备'] })
  type!: string;

  @Column({ name: 'status', type: 'enum', enum: ['正常', '维护中', '故障'] })
  @Index()
  status!: string;

  @Column({ name: 'associated_plot_id', nullable: true })
  associatedPlotId?: string;

  @Column({ name: 'next_maintenance_date', type: 'date', nullable: true })
  nextMaintenanceDate?: Date;

  @Column({ name: 'mqtt_topic', length: 255, nullable: true })
  mqttTopic?: string;
}
