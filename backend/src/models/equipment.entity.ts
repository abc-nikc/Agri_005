import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('equipment')
export class Equipment extends BaseEntity {
  @Column({ name: 'equipment_number', length: 50, unique: true })
  equipmentNumber!: string;

  @Column({ name: 'type', type: 'varchar', length: 50 })
  type!: string;

  @Column({ name: 'status', type: 'varchar', length: 20 })
  @Index()
  status!: string;

  @Column({ name: 'associated_plot_id', nullable: true })
  associatedPlotId?: string;

  @Column({ name: 'next_maintenance_date', type: 'date', nullable: true })
  nextMaintenanceDate?: Date;

  @Column({ name: 'mqtt_topic', length: 255, nullable: true })
  mqttTopic?: string;
}
