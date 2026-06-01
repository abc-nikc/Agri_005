import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('sales_records')
export class SalesRecord extends BaseEntity {
  @Column({ name: 'customer', length: 100 })
  customer!: string;

  @Column({ name: 'product', length: 100 })
  product!: string;

  @Column({ name: 'variety_name', length: 100 })
  varietyName!: string;

  @Column({ name: 'quantity', type: 'decimal', precision: 12, scale: 2 })
  quantity!: number;

  @Column({ name: 'unit', length: 20 })
  unit!: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
  totalAmount!: number;

  @Column({ name: 'batch_id', length: 36, nullable: true })
  batchId?: string;

  @Column({ name: 'batch_number', length: 100, nullable: true })
  batchNumber?: string;

  @Column({ name: 'payment_status', length: 20 })
  @Index()
  paymentStatus!: string; // 已付款/未付款/部分付款

  @Column({ name: 'sale_date', type: 'date' })
  @Index()
  saleDate!: string;

  @Column({ name: 'salesperson', length: 100 })
  salesperson!: string;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;
}
