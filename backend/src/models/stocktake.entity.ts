import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('stocktakes')
export class Stocktake extends BaseEntity {
  @Column({ name: 'type', length: 20 })
  type!: string; // 月度/季度/年度/循环

  @Column({ name: 'executor', length: 100 })
  executor!: string;

  @Column({ name: 'inventory_id', length: 36 })
  @Index()
  inventoryId!: string;

  @Column({ name: 'item_name', length: 100 })
  itemName!: string;

  @Column({ name: 'system_quantity', type: 'decimal', precision: 12, scale: 2 })
  systemQuantity!: number;

  @Column({ name: 'actual_quantity', type: 'decimal', precision: 12, scale: 2 })
  actualQuantity!: number;

  @Column({ name: 'unit', length: 20 })
  unit!: string;

  @Column({ name: 'discrepancy', type: 'decimal', precision: 12, scale: 2 })
  discrepancy!: number;

  @Column({ name: 'discrepancy_rate', type: 'decimal', precision: 8, scale: 4 })
  discrepancyRate!: number;

  @Column({ name: 'result', length: 50 })
  @Index()
  result!: string; // 正常/盘盈/盘亏/已调整

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;
}
