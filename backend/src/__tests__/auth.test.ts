import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

describe('认证模块', () => {
  describe('密码工具', () => {
    it('密码哈希应生成与原文不同的字符串', async () => {
      const hash = await hashPassword('admin123');
      expect(hash).not.toBe('admin123');
      expect(hash).toMatch(/^\$2[ab]\$/);
    });

    it('正确密码验证通过', async () => {
      const hash = await hashPassword('mypassword');
      expect(await comparePassword('mypassword', hash)).toBe(true);
    });

    it('错误密码验证失败', async () => {
      const hash = await hashPassword('correct');
      expect(await comparePassword('wrong', hash)).toBe(false);
    });

    it('空密码验证失败', async () => {
      const hash = await hashPassword('correct');
      expect(await comparePassword('', hash)).toBe(false);
    });
  });

  describe('密码强度校验', () => {
    it('8位含字母+数字=合法', () => expect(validatePasswordStrength('abcd1234')).toBe(true));
    it('纯数字=不合法', () => expect(validatePasswordStrength('12345678')).toBe(false));
    it('纯字母=不合法', () => expect(validatePasswordStrength('abcdefgh')).toBe(false));
    it('7位=不合法', () => expect(validatePasswordStrength('abc1234')).toBe(false));
  });

  describe('JWT Token', () => {
    const payload = { id: 'test-id', username: 'admin', role: '系统管理员' };

    it('生成并验证 Access Token', () => {
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded.username).toBe('admin');
      expect(decoded.role).toBe('系统管理员');
    });

    it('生成并验证 Refresh Token', () => {
      const token = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(token);
      expect(decoded.username).toBe('admin');
    });

    it('无效 Token 抛出异常', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('空 Token 抛出异常', () => {
      expect(() => verifyAccessToken('')).toThrow();
    });
  });
});
