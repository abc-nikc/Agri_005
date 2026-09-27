import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Staff } from '../models/staff.entity';
import { AuditLog } from '../models/audit-log.entity';
import { comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/authenticate';

export class AuthService {
  private staffRepository: Repository<Staff>;
  private auditRepo: Repository<AuditLog>;

  constructor() {
    this.staffRepository = AppDataSource.getRepository(Staff);
    this.auditRepo = AppDataSource.getRepository(AuditLog);
  }

  async login(username: string, password: string, ipAddress: string): Promise<{
    accessToken: string; refreshToken: string; user: Partial<Staff>;
  }> {
    const user = await this.staffRepository.findOne({ where: { username, isActive: true } });
    if (!user) throw new Error('用户名或密码错误');

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) throw new Error('用户名或密码错误');

    const payload = { id: user.id, username: user.username, role: user.systemRole, division: user.businessDivision };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await this.staffRepository.update(user.id, { lastLoginAt: new Date() });
    await this.writeAudit(user.id, user.username, ipAddress, 'LOGIN', 'SUCCESS');

    const { passwordHash, ...userWithoutPassword } = user;
    return { accessToken, refreshToken, user: userWithoutPassword };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const payload = verifyRefreshToken(refreshToken);
    const user = await this.staffRepository.findOne({ where: { id: payload.id, isActive: true } });
    if (!user) throw new Error('用户不存在或已禁用');
    const accessToken = generateAccessToken({ id: user.id, username: user.username, role: user.systemRole, division: user.businessDivision });
    return { accessToken };
  }

  async logout(userId: string, ipAddress: string): Promise<void> {
    await this.writeAudit(userId, '', ipAddress, 'LOGOUT', 'SUCCESS');
  }

  /** 真实审计日志写入数据库 */
  private async writeAudit(userId: string, username: string, ipAddress: string, actionType: string, result: string): Promise<void> {
    try {
      const name = username || (await this.staffRepository.findOne({ where: { id: userId } }))?.username || 'unknown';
      await this.auditRepo.save({
        userId, username: name,
        actionType: actionType as any, actionParams: { ip: ipAddress },
        result: result as any, ipAddress,
        createdAt: new Date(),
      });
    } catch (e: any) {
      console.error('[AUDIT] DB write failed:', e.message);
    }
  }
}
