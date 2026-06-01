import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('production_batches')
export class ProductionBatch extends BaseEntity {
  @Column({ name: 'batch_number', length: 100, unique: true })
  @Index()
  batchNumber!: string;

  @Column({ name: 'plot_id', length: 36 })
  @Index()
  plotId!: string;

  @Column({ name: 'plot_name', length: 100 })
  plotName!: string;

  @Column({ name: 'variety_id', length: 36 })
  varietyId!: string;

  @Column({ name: 'variety_name', length: 100 })
  varietyName!: string;

  @Column({ name: 'sow_date', type: 'date' })
  sowDate!: string;

  @Column({ name: 'estimated_harvest_date', type: 'date' })
  estimatedHarvestDate!: string;

  @Column({ name: 'status', type: 'enum', enum: ['进行中', '已完成'] })
  @Index()
  status!: string;

  @Column({ name: 'actual_harvest_date', type: 'date', nullable: true })
  actualHarvestDate?: string;

  @Column({ name: 'area', type: 'decimal', precision: 10, scale: 2 })
  area!: number;

  @Column({ name: 'traceability_code', length: 100, nullable: true })
  traceabilityCode?: string;

  @Column({ name: 'plan_id', length: 36, nullable: true })
  planId?: string;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;
}
