import prisma from '../lib/prisma.js';

interface LogActivityInput {
  tenantId: number;
  userId?: number;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

export async function logActivity(input: LogActivityInput) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId ?? null,
        userName: input.userName ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        details: input.details ?? null,
      },
    });
  } catch (err) {
    console.error('[AuditLog] Failed to log:', (err as Error).message);
  }
}
