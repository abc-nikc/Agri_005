import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export type InventoryType = '农产品' | '农资';

@Entity('inventory')
export class Inventory extends BaseEntity {
  @Column({ name: 'type', length: 20 })
  @Index()
  type!: InventoryType;

  @Column({ name: 'name', length: 100 })
  @Index()
  name!: string;

  @Column({ name: 'spec', length: 100, nullable: true })
  spec?: string;

  @Column({ name: 'quantity', type: 'decimal', precision: 12, scale: 2 })
  quantity!: number;

  @Column({ name: 'unit', length: 20 })
  unit!: string;

  @Column({ name: 'batch_number', length: 100, nullable: true })
  batchNumber?: string;

  @Column({ name: 'location', length: 100, nullable: true })
  location?: string;

  @Column({ name: 'quality_grade', length: 20, nullable: true })
  qualityGrade?: string;

  @Column({ name: 'quality_passed', nullable: true })
  qualityPassed?: boolean;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate?: string;

  @Column({ name: 'min_stock', type: 'decimal', precision: 10, scale: 2, default: 0 })
  minStock!: number;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;
}
