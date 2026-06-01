import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export type TransactionType = '入库' | '出库';

@Entity('stock_transactions')
export class StockTransaction extends BaseEntity {
  @Column({ name: 'type', length: 10 })
  @Index()
  type!: TransactionType;

  @Column({ name: 'sub_type', length: 30 })
  subType!: string; // 农产品入库/农资采购入库/销售出库/农资领用出库

  @Column({ name: 'inventory_id', length: 36 })
  @Index()
  inventoryId!: string;

  @Column({ name: 'item_name', length: 100 })
  itemName!: string;

  @Column({ name: 'quantity', type: 'decimal', precision: 12, scale: 2 })
  quantity!: number;

  @Column({ name: 'unit', length: 20 })
  unit!: string;

  @Column({ name: 'operator', length: 100 })
  operator!: string;

  @Column({ name: 'approver', length: 100, nullable: true })
  approver?: string;

  @Column({ name: 'source_or_dest', length: 200, nullable: true })
  sourceOrDest?: string;

  @Column({ name: 'plot_id', length: 36, nullable: true })
  plotId?: string;

  @Column({ name: 'batch_number', length: 100, nullable: true })
  batchNumber?: string;

  @Column({ name: 'transaction_date', type: 'timestamp' })
  @Index()
  transactionDate!: Date;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;
}
