import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Staff } from '../models/staff.entity';
import { hashPassword, validatePasswordStrength } from '../utils/password';

export class StaffService {
  private staffRepository: Repository<Staff>;

  constructor() {
    this.staffRepository = AppDataSource.getRepository(Staff);
  }

  async findAll(includeInactive: boolean = false): Promise<Staff[]> {
    const where: any = {};
    if (!includeInactive) where.isActive = true;
    return await this.staffRepository.find({ where, order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Staff | null> {
    return await this.staffRepository.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<Staff | null> {
    return await this.staffRepository.findOne({ where: { username } });
  }

  async create(staffData: any): Promise<Staff> {
    const existing = await this.findByUsername(staffData.username);
    if (existing) throw new Error(`用户名 ${staffData.username} 已存在`);

    // 映射前端字段 password → passwordHash
    if (staffData.password && !staffData.passwordHash) {
      staffData.passwordHash = staffData.password;
      delete staffData.password;
    }

    if (staffData.passwordHash && !validatePasswordStrength(staffData.passwordHash)) {
      throw new Error('密码至少6位');
    }

    const staff = this.staffRepository.create(staffData);
    return await this.staffRepository.save(staff);
  }

  async update(id: string, staffData: any): Promise<Staff> {
    const staff = await this.findById(id);
    if (!staff) throw new Error('员工不存在');

    if (staffData.username && staffData.username !== staff.username) {
      const existing = await this.findByUsername(staffData.username);
      if (existing) throw new Error(`用户名 ${staffData.username} 已存在`);
    }

    // 映射 password → passwordHash
    if (staffData.password && !staffData.passwordHash) {
      staffData.passwordHash = staffData.password;
      delete staffData.password;
    }

    Object.assign(staff, staffData);
    return await this.staffRepository.save(staff);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    if (!validatePasswordStrength(newPassword)) throw new Error('密码至少6位');
    await this.staffRepository.update(id, { passwordHash: await hashPassword(newPassword) });
  }

  async delete(id: string): Promise<void> {
    const staff = await this.findById(id);
    if (!staff) throw new Error('员工不存在');
    staff.isActive = false;
    await this.staffRepository.save(staff);
  }

  async getStatistics(): Promise<any> {
    const all = await this.staffRepository.find();
    const totalStaff = all.length;
    const activeStaff = all.filter(s => s.isActive).length;
    const roleCounts = new Map<string, number>();
    for (const s of all) roleCounts.set(s.systemRole, (roleCounts.get(s.systemRole) || 0) + 1);
    return { totalStaff, activeStaff, byRole: Array.from(roleCounts.entries()).map(([role, count]) => ({ role, count })) };
  }
}
