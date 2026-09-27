import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * 密码哈希
 * @param password 明文密码
 * @returns 哈希后的密码
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * 验证密码
 * @param password 明文密码
 * @param hash 哈希后的密码
 * @returns 是否匹配
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * 验证密码强度
 * 要求：至少8位，且同时包含字母和数字
 * @param password 密码
 * @returns 是否有效
 */
export const validatePasswordStrength = (password: string): boolean => {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
};
