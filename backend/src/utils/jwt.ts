import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN: any = process.env.JWT_ACCESS_TOKEN_EXPIRY || process.env.JWT_EXPIRES_IN || '2h';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-super-secret-refresh-key';
const REFRESH_TOKEN_EXPIRES_IN: any = process.env.REFRESH_TOKEN_EXPIRY || process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export interface JwtPayload { id: string; username: string; role: string; division?: string; }

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN } as any);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try { return jwt.verify(token, JWT_SECRET) as JwtPayload; }
  catch (error) { throw new Error('Invalid access token'); }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try { return jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload; }
  catch (error) { throw new Error('Invalid refresh token'); }
};

export const decodeToken = (token: string): any => jwt.decode(token);
