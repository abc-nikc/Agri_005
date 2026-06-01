import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('varieties')
export class Variety extends BaseEntity {
  @Column({ name: 'name', length: 100, unique: true })
  name!: string;

  @Column({ name: 'category', length: 50 })
  category!: string;

  @Column({ name: 'sowing_season', type: 'jsonb', nullable: true })
  sowingSeason?: string[];

  @Column({ name: 'planting_density', type: 'int', nullable: true })
  plantingDensity?: number;

  @Column({ name: 'fertilization_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  fertilizationRate?: number;

  @Column({ name: 'watering_frequency', type: 'int', nullable: true })
  wateringFrequency?: number;

  @Column({ name: 'growth_cycle', type: 'int', nullable: true })
  growthCycle?: number;

  @Column({ name: 'safety_interval', type: 'int', nullable: true })
  safetyInterval?: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
