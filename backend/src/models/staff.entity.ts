import { Entity, Column, Index, BeforeInsert } from 'typeorm';
import { hashPassword } from '../utils/password';
import { BaseEntity } from './base.entity';

@Entity('staff')
export class Staff extends BaseEntity {
  @Column({ name: 'name', length: 100 })
  name!: string;

  @Column({ name: 'username', length: 50, unique: true })
  @Index()
  username!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({ name: 'system_role', type: 'varchar', length: 50 })
  @Index()
  systemRole!: string;

  @Column({ name: 'business_division', length: 50, nullable: true })
  businessDivision?: string;

  @Column({ name: 'total_work_hours', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalWorkHours!: number;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt?: Date;

  // 保存前自动哈希密码
  @BeforeInsert()
  async hashPassword() {
    if (this.passwordHash && !this.passwordHash.startsWith('$2b$')) {
      this.passwordHash = await hashPassword(this.passwordHash);
    }
  }
}
