import { Router, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../../common/prisma';
import { config } from '../../config';
import { authenticate, AuthRequest } from '../../common/middleware';
import { sendOtpEmail } from '../../common/email';

const tokenOptions: SignOptions = { expiresIn: config.jwtExpiry };
const refreshOptions: SignOptions = { expiresIn: config.refreshExpiry };

const router = Router();

// In-memory OTP store (use Redis in production)
const otpStore = new Map<string, { otp: string; expiresAt: Date }>();
const emailOtpStore = new Map<string, { otp: string; expiresAt: Date }>();

// POST /api/auth/send-email-otp
router.post('/send-email-otp', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  emailOtpStore.set(email, { otp, expiresAt: new Date(Date.now() + config.otpExpiryMinutes * 60000) });

  // Send email in background, respond immediately
  res.json({ message: 'OTP sent to email' });
  sendOtpEmail(email, otp)
    .then(() => console.log(`Email OTP sent to ${email}`))
    .catch((err) => console.error('Failed to send OTP email:', err));
});

// POST /api/auth/verify-email-otp
router.post('/verify-email-otp', async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const stored = emailOtpStore.get(email);

  if (!stored || stored.otp !== otp || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }
  emailOtpStore.delete(email);
  res.json({ verified: true });
});

// POST /api/auth/trial-signup
router.post('/trial-signup', async (req: Request, res: Response) => {
  const { name, mobile, factoryName, email, password, location } = req.body;
  if (!name || !mobile || !factoryName) {
    return res.status(400).json({ error: 'name, mobile, factoryName required' });
  }
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  const existing = await prisma.client.findUnique({ where: { mobile } });
  if (existing) return res.status(409).json({ error: 'Mobile already registered' });

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) return res.status(409).json({ error: 'Email already registered' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const client = await prisma.client.create({
    data: {
      name,
      mobile,
      plan: 'trial',
      trialEndsAt,
      users: { create: { name, mobile, email, password: hashedPassword, plainPassword: password, role: 'OWNER' } },
      factories: { create: { name: factoryName, location: location || null } },
    },
    include: { users: true, factories: true },
  });

  // Auto-send welcome notifications
  await prisma.notification.createMany({
    data: [
      { clientId: client.id, title: `Welcome ${name}! 🎉`, message: 'Your BrickPro account is ready. You have 7 days free trial. Explore all features!', type: 'info' },
      { clientId: client.id, title: '7 Days Free Trial ⏰', message: 'Your free trial is active for 7 days. After that, subscribe at ₹999/month to continue.', type: 'promo' },
      { clientId: client.id, title: 'Check Premium Plans 💎', message: 'Go to Settings to view premium plan details. Contact admin for yearly discounts!', type: 'info' },
    ],
  });

  const user = client.users[0];
  const token = jwt.sign({ id: user.id, clientId: client.id, role: user.role, name: user.name }, config.jwtSecret, tokenOptions);
  const refreshToken = jwt.sign({ id: user.id }, config.jwtRefreshSecret, refreshOptions);

  res.status(201).json({ token, refreshToken, user: { id: user.id, name: user.name, role: user.role }, client: { id: client.id, name: client.name }, factories: client.factories });
});

// POST /api/auth/login — Email/Password or Mobile/PIN login
router.post('/login', async (req: Request, res: Response) => {
  const { email, mobile, password } = req.body;
  if ((!email && !mobile) || !password) return res.status(400).json({ error: 'email or mobile, and password required' });

  const where = email ? { email } : { mobile };
  const user = await prisma.user.findUnique({ where, include: { client: true, factories: { where: { active: true }, include: { factory: true } } } });
  if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.active) return res.status(403).json({ error: 'Account disabled. Contact admin at admin@managementsystems.in', code: 'DISABLED' });
  if (!user.client.active) return res.status(403).json({ error: 'Service disabled. Contact admin at admin@managementsystems.in', code: 'DISABLED' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, clientId: user.clientId, role: user.role, name: user.name }, config.jwtSecret, tokenOptions);
  const refreshToken = jwt.sign({ id: user.id }, config.jwtRefreshSecret, refreshOptions);

  const factories = user.role === 'OWNER'
    ? await prisma.factory.findMany({ where: { clientId: user.clientId } })
    : user.factories.map((f) => ({ ...f.factory, userRole: f.role, permissions: f.permissions }));

  res.json({ token, refreshToken, user: { id: user.id, name: user.name, role: user.role }, client: { id: user.client.id, name: user.client.name }, factories });
});

// POST /api/auth/send-otp
router.post('/send-otp', async (req: Request, res: Response) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'mobile required' });

  const user = await prisma.user.findUnique({ where: { mobile } });
  if (!user || !user.email) return res.status(404).json({ error: 'No account found with this mobile or email not set.' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(mobile, { otp, expiresAt: new Date(Date.now() + config.otpExpiryMinutes * 60000) });

  const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  res.json({ message: `OTP sent to ${maskedEmail}` });

  sendOtpEmail(user.email, otp)
    .then(() => console.log(`OTP sent to ${maskedEmail} for mobile ${mobile}`))
    .catch((err) => console.error('Failed to send OTP email:', err));
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { mobile, otp } = req.body;
  const stored = otpStore.get(mobile);

  if (!stored || stored.otp !== otp || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }
  otpStore.delete(mobile);

  const user = await prisma.user.findUnique({ where: { mobile }, include: { client: true, factories: { where: { active: true }, include: { factory: true } } } });
  if (!user) return res.status(404).json({ error: 'User not found. Please sign up first.' });
  if (!user.active) return res.status(403).json({ error: 'Account disabled. Contact admin at admin@managementsystems.in', code: 'DISABLED' });
  if (!user.client.active) return res.status(403).json({ error: 'Service disabled. Contact admin at admin@managementsystems.in', code: 'DISABLED' });

  const token = jwt.sign({ id: user.id, clientId: user.clientId, role: user.role, name: user.name }, config.jwtSecret, tokenOptions);
  const refreshToken = jwt.sign({ id: user.id }, config.jwtRefreshSecret, refreshOptions);

  const factories = user.role === 'OWNER'
    ? await prisma.factory.findMany({ where: { clientId: user.clientId } })
    : user.factories.map((f) => ({ ...f.factory, userRole: f.role, permissions: f.permissions }));

  res.json({ token, refreshToken, user: { id: user.id, name: user.name, role: user.role }, client: { id: user.client.id, name: user.client.name }, factories });
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  try {
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    const token = jwt.sign({ id: user.id, clientId: user.clientId, role: user.role, name: user.name }, config.jwtSecret, tokenOptions);
    res.json({ token });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { client: true, factories: { where: { active: true }, include: { factory: true } } },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const factories = user.role === 'OWNER'
    ? await prisma.factory.findMany({ where: { clientId: user.clientId } })
    : user.factories.map((f) => ({ ...f.factory, userRole: f.role, permissions: f.permissions }));

  res.json({ ...user, password: undefined, factories });
});

export default router;
