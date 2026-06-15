import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('plots')
export class Plot extends BaseEntity {
  @Column({ name: 'plot_number', length: 50, unique: true })
  plotNumber!: string;

  @Column({ name: 'area', type: 'decimal', precision: 10, scale: 2 })
  area!: number;

  @Column({ name: 'current_variety_id', nullable: true })
  currentVarietyId?: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: '闲置' })
  @Index()
  status!: string;

  @Column({ name: 'soil_type', length: 50, nullable: true })
  soilType?: string;

  @Column({ name: 'region', length: 50 })
  @Index()
  region!: string;
}
