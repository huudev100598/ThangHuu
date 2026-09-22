import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me-mosh-mode-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'disabled';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: AuthUser): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function publicUser(row: {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
}): AuthUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
  };
}
