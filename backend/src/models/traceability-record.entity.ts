import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('traceability_records')
export class TraceabilityRecord extends BaseEntity {
  @Column({ name: 'trace_code', length: 50, unique: true })
  traceCode!: string;

  @Column({ name: 'batch_id', length: 36 })
  @Index()
  batchId!: string;

  @Column({ name: 'batch_number', length: 100 })
  batchNumber!: string;

  @Column({ name: 'plot_name', length: 100 })
  plotName!: string;

  @Column({ name: 'variety_name', length: 100 })
  varietyName!: string;

  @Column({ name: 'sow_date', type: 'date' })
  sowDate!: string;

  @Column({ name: 'harvest_date', type: 'date', nullable: true })
  harvestDate?: string;

  @Column({ name: 'area', type: 'decimal', precision: 10, scale: 2 })
  area!: number;

  @Column({ name: 'operations_data', type: 'simple-json', nullable: true })
  operationsData?: any[];

  @Column({ name: 'inputs_data', type: 'simple-json', nullable: true })
  inputsData?: any[];

  @Column({ name: 'inventory_data', type: 'simple-json', nullable: true })
  inventoryData?: any[];

  @Column({ name: 'sales_data', type: 'simple-json', nullable: true })
  salesData?: any[];

  @Column({ name: 'qr_code_url', length: 500, nullable: true })
  qrCodeUrl?: string;

  @Column({ name: 'exported_at', type: 'datetime', nullable: true })
  exportedAt?: Date;

  @Column({ name: 'exported_by', length: 100, nullable: true })
  exportedBy?: string;
}
