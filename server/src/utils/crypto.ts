import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { PlatformRoleType } from '@edunexa/shared';

export interface TokenPayload {
  userId: string;
  email: string;
  membershipId?: string;
  schoolId?: string;
  role: PlatformRoleType;
  studentProfileId?: string;
  staffProfileId?: string;
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function generateAccessToken(payload: TokenPayload, expiresIn: string | number = '1h'): string {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn } as jwt.SignOptions);
}

export function generateRefreshToken(payload: TokenPayload, expiresIn: string | number = '7d'): string {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as TokenPayload;
}
