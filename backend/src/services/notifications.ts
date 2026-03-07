import prisma from '../lib/prisma.js';

interface CreateNotificationInput {
  tenantId: number;
  userId?: number;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    await prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId ?? null,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
      },
    });
  } catch (err) {
    console.error('[Notification] Failed to create:', (err as Error).message);
  }
}
