import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { sendVerificationEmail } from '../services/email.js';

const router = Router();

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(user, tenantId) {
  return jwt.sign(
    {
      id: user.id,
      tenantId,
      email: user.email,
      role: user.role,
      name: user.name,
      emailVerified: user.emailVerified,
      onboardingCompleted: user.onboardingCompleted,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

// POST /api/v1/auth/register — self-service tenant signup
router.post('/register', async (req, res, next) => {
  try {
    const { companyName, name, email, password } = req.body;

    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ error: true, message: 'All fields are required', code: 'VALIDATION_ERROR' });
    }

    // Check if email already taken
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: true, message: 'Email already registered', code: 'EMAIL_EXISTS' });
    }

    // Generate slug from company name
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      return res.status(409).json({ error: true, message: 'Company name already taken', code: 'SLUG_EXISTS' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = generateCode();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create tenant + admin user in a single transaction
    const { tenant, user } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: companyName, slug },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          password: hashedPassword,
          name,
          role: 'ADMIN',
          verificationCode: code,
          verificationCodeExpiresAt: codeExpiry,
        },
      });

      return { tenant, user };
    });

    // Send verification email (non-blocking — don't fail registration if email fails)
    sendVerificationEmail(email, code).catch((err) => {
      console.error('[Auth] Failed to send verification email:', err.message);
    });

    const token = generateToken(user, tenant.id);

    res.status(201).json({
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: false, onboardingCompleted: false },
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: true, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: true, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const token = generateToken(user, user.tenantId);

    res.json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          onboardingCompleted: user.onboardingCompleted,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/send-verification — send/resend verification code
router.post('/send-verification', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found', code: 'NOT_FOUND' });
    }

    if (user.emailVerified) {
      return res.json({ data: { message: 'Email already verified' } });
    }

    const code = generateCode();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: code, verificationCodeExpiresAt: codeExpiry },
    });

    await sendVerificationEmail(user.email, code);

    res.json({ data: { message: 'Verification code sent' } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/verify-email — verify the 6-digit code
router.post('/verify-email', authenticate, async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: true, message: 'Verification code is required', code: 'VALIDATION_ERROR' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found', code: 'NOT_FOUND' });
    }

    if (user.emailVerified) {
      return res.json({ data: { message: 'Email already verified', emailVerified: true } });
    }

    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      return res.status(400).json({ error: true, message: 'No verification code found. Request a new one.', code: 'NO_CODE' });
    }

    if (new Date() > user.verificationCodeExpiresAt) {
      return res.status(400).json({ error: true, message: 'Verification code has expired. Request a new one.', code: 'CODE_EXPIRED' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ error: true, message: 'Invalid verification code', code: 'INVALID_CODE' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });

    // Generate a new token with emailVerified: true
    const token = generateToken(updated, updated.tenantId);

    res.json({ data: { message: 'Email verified successfully', emailVerified: true, token } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/complete-onboarding — mark onboarding as done
router.post('/complete-onboarding', authenticate, async (req, res, next) => {
  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { onboardingCompleted: true },
    });

    const token = generateToken(updated, updated.tenantId);

    res.json({ data: { message: 'Onboarding completed', onboardingCompleted: true, token } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, tenantId: true, emailVerified: true, onboardingCompleted: true, createdAt: true },
    });
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

export default router;
