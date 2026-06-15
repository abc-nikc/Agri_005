import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Staff } from '../models/staff.entity';
import { hashPassword, validatePasswordStrength } from '../utils/password';

export class StaffService {
  private staffRepository: Repository<Staff>;

  constructor() {
    this.staffRepository = AppDataSource.getRepository(Staff);
  }

  async findAll(includeInactive: boolean = false, filters?: { search?: string; systemRole?: string; isActive?: boolean }): Promise<Staff[]> {
    const qb = this.staffRepository.createQueryBuilder('staff');

    if (filters?.search) {
      qb.andWhere('staff.name LIKE :search OR staff.username LIKE :search', { search: `%${filters.search}%` });
    }
    if (filters?.systemRole) {
      qb.andWhere('staff.systemRole = :role', { role: filters.systemRole });
    }
    if (filters?.isActive !== undefined) {
      qb.andWhere('staff.isActive = :isActive', { isActive: filters.isActive });
    } else if (!includeInactive) {
      qb.andWhere('staff.isActive = 1');
    }

    return await qb.orderBy('staff.name', 'ASC').getMany();
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

    // 密码哈希处理
    const plainPassword = staffData.password || staffData.passwordHash;
    if (!plainPassword) throw new Error('密码不能为空');
    if (!validatePasswordStrength(plainPassword)) throw new Error('密码至少6位');

    staffData.passwordHash = await hashPassword(plainPassword);
    delete staffData.password;

    const staff = this.staffRepository.create(staffData as any);
    return await this.staffRepository.save(staff) as unknown as Promise<Staff>;
  }

  async update(id: string, staffData: any): Promise<Staff> {
    const staff = await this.findById(id);
    if (!staff) throw new Error('员工不存在');

    if (staffData.username && staffData.username !== staff.username) {
      const existing = await this.findByUsername(staffData.username);
      if (existing) throw new Error(`用户名 ${staffData.username} 已存在`);
    }

    // 如果有新密码，进行哈希
    if (staffData.password || staffData.passwordHash) {
      const plainPassword = staffData.password || staffData.passwordHash;
      if (!validatePasswordStrength(plainPassword)) throw new Error('密码至少6位');
      staffData.passwordHash = await hashPassword(plainPassword);
    }
    delete staffData.password;

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
