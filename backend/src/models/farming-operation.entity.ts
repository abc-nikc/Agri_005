import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export type OperationType = '播种' | '移栽' | '施肥' | '打药' | '灌溉' | '排水' | '除草' | '整枝' | '采收';

@Entity('farming_operations')
export class FarmingOperation extends BaseEntity {
  @Column({ name: 'operation_type', length: 20 })
  @Index()
  operationType!: OperationType;

  @Column({ name: 'plot_id', length: 36 })
  @Index()
  plotId!: string;

  @Column({ name: 'plot_name', length: 100, nullable: true })
  plotName?: string;

  @Column({ name: 'variety_id', length: 36, nullable: true })
  varietyId?: string;

  @Column({ name: 'variety_name', length: 100, nullable: true })
  varietyName?: string;

  @Column({ name: 'batch_id', length: 36, nullable: true })
  @Index()
  batchId?: string;

  // === 播种/移栽 ===
  @Column({ name: 'area', type: 'decimal', precision: 10, scale: 2, nullable: true })
  area?: number;

  // === 施肥 ===
  @Column({ name: 'fertilizer_name', length: 100, nullable: true })
  fertilizerName?: string;

  @Column({ name: 'fertilizer_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  fertilizerAmount?: number;

  @Column({ name: 'fertilizer_unit', length: 20, nullable: true })
  fertilizerUnit?: string;

  // === 打药 ===
  @Column({ name: 'pesticide_name', length: 100, nullable: true })
  pesticideName?: string;

  @Column({ name: 'pesticide_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pesticideAmount?: number;

  @Column({ name: 'pesticide_unit', length: 20, nullable: true })
  pesticideUnit?: string;

  // === 灌溉/排水 ===
  @Column({ name: 'water_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  waterAmount?: number;

  @Column({ name: 'water_unit', length: 20, nullable: true })
  waterUnit?: string;

  @Column({ name: 'water_duration', nullable: true })
  waterDuration?: number;

  @Column({ name: 'water_duration_unit', length: 20, nullable: true })
  waterDurationUnit?: string;

  // === 除草/整枝 ===
  @Column({ name: 'work_description', type: 'text', nullable: true })
  workDescription?: string;

  // === 采收 ===
  @Column({ name: 'harvest_yield', type: 'decimal', precision: 10, scale: 2, nullable: true })
  harvestYield?: number;

  @Column({ name: 'yield_unit', length: 20, nullable: true })
  yieldUnit?: string;

  @Column({ name: 'quality_grade', length: 20, nullable: true })
  qualityGrade?: string;

  @Column({ name: 'harvest_destination', length: 100, nullable: true })
  harvestDestination?: string;

  // === 通用字段 ===
  @Column({ name: 'operator_name', length: 100 })
  operatorName!: string;

  @Column({ name: 'operation_date', type: 'datetime' })
  @Index()
  operationDate!: Date;

  @Column({ name: 'weather', length: 50, nullable: true })
  weather?: string;

  @Column({ name: 'temperature', type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperature?: number;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark?: string;

  @Column({ name: 'crop_stage', length: 50, nullable: true })
  cropStage?: string;

  // 🔴 边缘场景：离线补录标记
  @Column({ name: 'is_supplemental', default: false })
  isSupplemental!: boolean;

  @Column({ name: 'supplemental_operation_date', type: 'datetime', nullable: true })
  supplementalOperationDate?: Date;
}
