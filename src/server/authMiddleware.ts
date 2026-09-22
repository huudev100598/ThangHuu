import { Request, Response, NextFunction } from 'express';
import { AuthUser, verifyToken } from './auth';
import { findUserById } from './userService';

export interface AuthedRequest extends Request {
  user?: AuthUser;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: missing token' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid or expired token' });
  }

  const user = await findUserById(payload.sub);
  if (!user || user.status !== 'active') {
    return res.status(401).json({ success: false, message: 'Unauthorized: user inactive or not found' });
  }

  req.user = user;
  next();
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: admin only' });
  }
  next();
}
