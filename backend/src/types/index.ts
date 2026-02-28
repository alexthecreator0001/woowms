import type { PrismaClient } from '@prisma/client';
import type { Role } from '@prisma/client';

// JWT payload stored in tokens and attached to req.user
export interface JwtPayload {
  id: number;
  tenantId: number;
  email: string;
  role: Role;
  name: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  iat?: number;
  exp?: number;
}

// Standard API response shapes
export interface ApiError {
  error: true;
  message: string;
  code: string;
  stack?: string;
}

export interface ApiSuccess<T = unknown> {
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// App error with status code
export interface AppError extends Error {
  status?: number;
  code?: string;
}

// Express Request augmentation
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      tenantId?: number;
      prisma?: ReturnType<typeof import('../lib/prisma.js').tenantPrisma>;
    }
  }
}
