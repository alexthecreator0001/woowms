import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { authorize } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/team — list tenant users
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: { tenantId: req.user!.tenantId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/team — create a new team member (admin only)
router.post('/', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: true, message: 'Name, email, password, and role are required', code: 'VALIDATION_ERROR' });
    }

    if (role === 'ADMIN') {
      return res.status(400).json({ error: true, message: 'Cannot create a user with ADMIN role', code: 'VALIDATION_ERROR' });
    }

    if (!['MANAGER', 'STAFF', 'PICKER'].includes(role)) {
      return res.status(400).json({ error: true, message: 'Invalid role. Must be MANAGER, STAFF, or PICKER', code: 'VALIDATION_ERROR' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: true, message: 'Password must be at least 8 characters', code: 'VALIDATION_ERROR' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: true, message: 'Email already in use', code: 'EMAIL_EXISTS' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        tenantId: req.user!.tenantId,
        name,
        email,
        password: hashed,
        role,
        emailVerified: true,
        onboardingCompleted: true,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/team/:id — update team member (admin only)
router.patch('/:id', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberId = parseInt(req.params.id);
    const { role, name } = req.body;

    if (memberId === req.user!.id) {
      return res.status(400).json({ error: true, message: 'Cannot change your own role', code: 'VALIDATION_ERROR' });
    }

    if (role === 'ADMIN') {
      return res.status(400).json({ error: true, message: 'Cannot set ADMIN role', code: 'VALIDATION_ERROR' });
    }

    if (role && !['MANAGER', 'STAFF', 'PICKER'].includes(role)) {
      return res.status(400).json({ error: true, message: 'Invalid role', code: 'VALIDATION_ERROR' });
    }

    // Verify user belongs to the same tenant
    const member = await prisma.user.findFirst({
      where: { id: memberId, tenantId: req.user!.tenantId },
    });
    if (!member) {
      return res.status(404).json({ error: true, message: 'Team member not found', code: 'NOT_FOUND' });
    }

    const data: { role?: string; name?: string } = {};
    if (role) data.role = role;
    if (name) data.name = name;

    const updated = await prisma.user.update({
      where: { id: memberId },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/team/:id — remove team member (admin only)
router.delete('/:id', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberId = parseInt(req.params.id);

    if (memberId === req.user!.id) {
      return res.status(400).json({ error: true, message: 'Cannot delete yourself', code: 'VALIDATION_ERROR' });
    }

    // Verify user belongs to the same tenant
    const member = await prisma.user.findFirst({
      where: { id: memberId, tenantId: req.user!.tenantId },
    });
    if (!member) {
      return res.status(404).json({ error: true, message: 'Team member not found', code: 'NOT_FOUND' });
    }

    await prisma.user.delete({ where: { id: memberId } });
    res.json({ data: { message: 'Team member removed' } });
  } catch (err) {
    next(err);
  }
});

export default router;
