import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('planting_plans')
export class PlantingPlan extends BaseEntity {
  @Column({ name: 'plot_id', length: 36 })
  @Index()
  plotId!: string;

  @Column({ name: 'plot_name', length: 100 })
  plotName!: string;

  @Column({ name: 'variety_id', length: 36 })
  varietyId!: string;

  @Column({ name: 'variety_name', length: 100 })
  varietyName!: string;

  @Column({ name: 'planned_sow_date', type: 'date' })
  plannedSowDate!: string;

  @Column({ name: 'planned_harvest_date', type: 'date' })
  plannedHarvestDate!: string;

  @Column({ name: 'status', type: 'enum', enum: ['待执行', '执行中', '已完成', '已调整'] })
  @Index()
  status!: string;

  @Column({ name: 'solar_term', length: 20, nullable: true })
  solarTerm?: string;

  @Column({ name: 'area', type: 'decimal', precision: 10, scale: 2 })
  area!: number;

  @Column({ name: 'adjust_reason', type: 'text', nullable: true })
  adjustReason?: string;

  @Column({ name: 'adjust_date', type: 'timestamp', nullable: true })
  adjustDate?: Date;

  @Column({ name: 'batch_id', length: 36, nullable: true })
  batchId?: string;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;
}
