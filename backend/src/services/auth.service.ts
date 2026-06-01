import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Staff } from '../models/staff.entity';
import { comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/authenticate';

export class AuthService {
  private staffRepository: Repository<Staff>;

  constructor() {
    this.staffRepository = AppDataSource.getRepository(Staff);
  }

  /**
   * 用户登录
   * @param username 用户名
   * @param password 密码
   * @param ipAddress 用户 IP 地址
   * @returns 登录结果
   */
  async login(
    username: string,
    password: string,
    ipAddress: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Partial<Staff>;
  }> {
    // 查找用户
    const user = await this.staffRepository.findOne({
      where: { username, isActive: true },
    });

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }

    // 生成 JWT payload
    const payload = {
      id: user.id,
      username: user.username,
      role: user.systemRole,
      division: user.businessDivision,
    };

    // 生成 Access Token 和 Refresh Token
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // 更新最后登录时间
    await this.staffRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // 记录审计日志
    await this.logAuditLog(user.id, ipAddress, 'LOGIN', '成功');

    // 返回结果（不包含密码哈希）
    const { passwordHash, ...userWithoutPassword } = user;
    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  /**
   * 刷新 Access Token
   * @param refreshToken Refresh Token
   * @returns 新的 Access Token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // 验证 Refresh Token
      const payload = verifyRefreshToken(refreshToken);

      // 检查用户是否仍然有效
      const user = await this.staffRepository.findOne({
        where: { id: payload.id, isActive: true },
      });

      if (!user) {
        throw new Error('用户不存在或已被禁用');
      }

      // 生成新的 Access Token
      const newPayload = {
        id: user.id,
        username: user.username,
        role: user.systemRole,
        division: user.businessDivision,
      };

      const accessToken = generateAccessToken(newPayload);

      return { accessToken };
    } catch (error) {
      throw new Error('Refresh Token 无效或已过期');
    }
  }

  /**
   * 用户登出
   * @param userId 用户 ID
   * @param ipAddress 用户 IP 地址
   */
  async logout(userId: string, ipAddress: string): Promise<void> {
    // 记录审计日志
    await this.logAuditLog(userId, ipAddress, 'LOGOUT', '成功');
  }

  /**
   * 记录审计日志
   * @param userId 用户 ID
   * @param ipAddress IP 地址
   * @param actionType 操作类型
   * @param result 结果
   */
  private async logAuditLog(
    userId: string,
    ipAddress: string,
    actionType: string,
    result: string
  ): Promise<void> {
    // 这里应该调用审计日志服务
    // 为了简化，这里只打印日志
    console.log(
      `[AUDIT] User ${userId} from ${ipAddress} performed ${actionType}: ${result}`
    );
  }
}
