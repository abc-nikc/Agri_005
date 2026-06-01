import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export type CostType = '种子' | '肥料' | '农药' | '人工' | '机械' | '其他';

@Entity('cost_records')
export class CostRecord extends BaseEntity {
  @Column({ name: 'plot_id', length: 36, nullable: true })
  @Index()
  plotId?: string;

  @Column({ name: 'batch_id', length: 36, nullable: true })
  batchId?: string;

  @Column({ name: 'type', length: 20 })
  type!: CostType;

  @Column({ name: 'description', length: 200 })
  description!: string;

  @Column({ name: 'amount', type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ name: 'date', type: 'date' })
  date!: string;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;
}
