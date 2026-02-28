import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import type { JwtPayload } from '../types/index.js';
import type { Role } from '@prisma/client';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: true, message: 'No token provided', code: 'NO_TOKEN' });
    return;
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: true, message: 'Invalid token', code: 'INVALID_TOKEN' });
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: true, message: 'Insufficient permissions', code: 'FORBIDDEN' });
      return;
    }
    next();
  };
}
