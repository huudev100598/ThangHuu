import { query } from './db';
import {
  AuthUser,
  hashPassword,
  publicUser,
  UserRole,
  UserStatus,
  verifyPassword,
} from './auth';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export async function findUserByEmail(email: string): Promise<(AuthUser & { passwordHash: string }) | null> {
  const rows = (await query(
    `SELECT id, email, password_hash, full_name, role, status FROM users WHERE email = ? LIMIT 1`,
    [email.toLowerCase().trim()]
  )) as RowDataPacket[];
  if (!rows.length) return null;
  const r = rows[0];
  return {
    ...publicUser(r as any),
    passwordHash: r.password_hash,
  };
}

export async function findUserById(id: number): Promise<AuthUser | null> {
  const rows = (await query(
    `SELECT id, email, full_name, role, status FROM users WHERE id = ? LIMIT 1`,
    [id]
  )) as RowDataPacket[];
  if (!rows.length) return null;
  return publicUser(rows[0] as any);
}

export async function createUser(input: {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}): Promise<AuthUser> {
  const email = input.email.toLowerCase().trim();
  const passwordHash = await hashPassword(input.password);
  const role = input.role || 'user';

  const result = (await query(
    `INSERT INTO users (email, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, 'active')`,
    [email, passwordHash, input.fullName.trim(), role]
  )) as ResultSetHeader;

  return {
    id: result.insertId,
    email,
    fullName: input.fullName.trim(),
    role,
    status: 'active',
  };
}

export async function authenticate(email: string, password: string): Promise<AuthUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  if (user.status !== 'active') return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  const { passwordHash: _, ...rest } = user;
  return rest;
}

export async function listUsers(): Promise<AuthUser[]> {
  const rows = (await query(
    `SELECT id, email, full_name, role, status, created_at, updated_at
     FROM users ORDER BY created_at DESC`
  )) as RowDataPacket[];
  return rows.map((r) => publicUser(r as any));
}

export async function updateUserStatus(id: number, status: UserStatus): Promise<boolean> {
  const result = (await query(`UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?`, [
    status,
    id,
  ])) as ResultSetHeader;
  return (result.affectedRows || 0) > 0;
}

export async function updateUserRole(id: number, role: UserRole): Promise<boolean> {
  const result = (await query(`UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?`, [
    role,
    id,
  ])) as ResultSetHeader;
  return (result.affectedRows || 0) > 0;
}

export async function countAdmins(): Promise<number> {
  const rows = (await query(
    `SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND status = 'active'`
  )) as RowDataPacket[];
  return Number(rows[0]?.c || 0);
}

/** Seed default admin if none exists */
export async function ensureDefaultAdmin(): Promise<void> {
  const admins = await countAdmins();
  if (admins > 0) return;

  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME;

  if (!email || !password || !fullName) {
    console.warn('[auth] ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME environment variables must be set');
    return;
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    await query(`UPDATE users SET role = 'admin', status = 'active', updated_at = NOW() WHERE id = ?`, [
      existing.id,
    ]);
    console.log(`[auth] Promoted existing user to admin: ${email}`);
    return;
  }

  await createUser({ email, password, fullName, role: 'admin' });
  console.log(`[auth] Seeded default admin: ${email}`);
}
