import { Router, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../../common/prisma';
import { config } from '../../config';

const router = Router();
const tokenOptions: SignOptions = { expiresIn: 86400 };

// In-memory settings (in production, store in DB)
let appSettings: any = {
  planName: 'Premium',
  originalPrice: 2999,
  discountedPrice: 999,
  paymentDueDay: 25,
  contactName: 'Mandeep',
  contactPhone: '9992662555',
  contactEmail: 'admin@managementsystems.in',
  upiId: '',
  upiName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  appName: 'BrickPro',
};

// Middleware: verify super admin token
function superAdminAuth(req: Request, res: Response, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    if (decoded.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    (req as any).admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Helper: log admin action
async function logAction(adminId: string, action: string, req: Request, target?: string, targetId?: string, details?: string) {
  await prisma.adminLog.create({
    data: { adminId, action, target, targetId, details, ip: req.ip || req.headers['x-forwarded-for'] as string || 'unknown' },
  });
}

// In-memory OTP store for super admin
const adminOtpStore = new Map<string, { otp: string; expiresAt: Date }>();

// POST /api/super-admin/seed
router.post('/seed', async (_req: Request, res: Response) => {
  const existing = await prisma.superAdmin.findFirst();
  if (existing) {
    // Update email if needed
    await prisma.superAdmin.update({ where: { id: existing.id }, data: { email: 'admin@managementsystems.in' } });
    return res.json({ message: 'Super admin email updated', email: 'admin@managementsystems.in' });
  }

  const password = await bcrypt.hash('BrickPro@2024', 10);
  const admin = await prisma.superAdmin.create({
    data: { email: 'admin@managementsystems.in', password, name: 'Super Admin' },
  });
  res.status(201).json({ message: 'Super admin created', email: admin.email });
});

// POST /api/super-admin/send-otp
router.post('/send-otp', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  const admin = await prisma.superAdmin.findUnique({ where: { email } });
  if (!admin) return res.status(401).json({ error: 'Invalid email' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  adminOtpStore.set(email, { otp, expiresAt: new Date(Date.now() + 5 * 60000) });

  // Send OTP in background
  res.json({ message: 'OTP sent to email' });
  const { sendOtpEmail } = require('../../common/email');
  sendOtpEmail(email, otp)
    .then(() => console.log(`Admin OTP sent to ${email}`))
    .catch((err: any) => console.error('Failed to send admin OTP:', err));
});

// POST /api/super-admin/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password, otp } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  const admin = await prisma.superAdmin.findUnique({ where: { email } });
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

  // OTP-based login
  if (otp) {
    const stored = adminOtpStore.get(email);
    if (!stored || stored.otp !== otp || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }
    adminOtpStore.delete(email);
  } else if (password) {
    // Password-based login (fallback)
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  } else {
    return res.status(400).json({ error: 'password or otp required' });
  }

  const token = jwt.sign({ id: admin.id, role: 'SUPER_ADMIN' }, config.jwtSecret, tokenOptions);
  await logAction(admin.id, 'LOGIN', req);
  res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } });
});

// GET /api/super-admin/dashboard
router.get('/dashboard', superAdminAuth, async (_req: Request, res: Response) => {
  const [totalClients, activeClients, trialClients, premiumClients, expiredClients, totalFactories, totalUsers] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { active: true } }),
    prisma.client.count({ where: { subscriptionStatus: 'TRIAL' } }),
    prisma.client.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    prisma.client.count({ where: { subscriptionStatus: 'EXPIRED' } }),
    prisma.factory.count(),
    prisma.user.count(),
  ]);
  res.json({ totalClients, activeClients, trialClients, premiumClients, expiredClients, totalFactories, totalUsers });
});

// GET /api/super-admin/clients
router.get('/clients', superAdminAuth, async (_req: Request, res: Response) => {
  const clients = await prisma.client.findMany({
    include: { factories: true, users: true, payments: { orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(clients);
});

// GET /api/super-admin/clients/:id
router.get('/clients/:id', superAdminAuth, async (req: Request, res: Response) => {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id },
    include: { factories: true, users: true, payments: { orderBy: { createdAt: 'desc' } } },
  });
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(client);
});

// PATCH /api/super-admin/clients/:id/toggle
router.patch('/clients/:id/toggle', superAdminAuth, async (req: Request, res: Response) => {
  const client = await prisma.client.findUnique({ where: { id: req.params.id } });
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const updated = await prisma.client.update({
    where: { id: req.params.id },
    data: { active: !client.active },
  });
  await logAction((req as any).admin.id, updated.active ? 'ENABLE_SERVICE' : 'DISABLE_SERVICE', req, 'client', client.id, client.name);
  res.json({ id: updated.id, active: updated.active, message: updated.active ? 'Service enabled' : 'Service disabled' });
});

// PATCH /api/super-admin/clients/:id/status
router.patch('/clients/:id/status', superAdminAuth, async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const client = await prisma.client.findUnique({ where: { id: req.params.id } });
  const updated = await prisma.client.update({
    where: { id: req.params.id },
    data: { subscriptionStatus: status },
  });
  await logAction((req as any).admin.id, 'CHANGE_STATUS', req, 'client', req.params.id, `${client?.subscriptionStatus} → ${status}`);
  res.json(updated);
});

// POST /api/super-admin/clients/:id/payments
router.post('/clients/:id/payments', superAdminAuth, async (req: Request, res: Response) => {
  const { amount, month, year, status, remarks } = req.body;
  if (!amount || !month || !year) return res.status(400).json({ error: 'amount, month, year required' });

  const payment = await prisma.payment.create({
    data: {
      clientId: req.params.id, amount, month, year,
      status: status || 'pending', remarks,
      collectedAt: status === 'collected' ? new Date() : null,
    },
  });
  await logAction((req as any).admin.id, 'ADD_PAYMENT', req, 'client', req.params.id, `₹${amount} - ${month} ${year}`);
  res.json(payment);
});

// PATCH /api/super-admin/payments/:id
router.patch('/payments/:id', superAdminAuth, async (req: Request, res: Response) => {
  const { status, remarks } = req.body;
  const payment = await prisma.payment.update({
    where: { id: req.params.id },
    data: { status, remarks, collectedAt: status === 'collected' ? new Date() : null },
  });
  await logAction((req as any).admin.id, 'UPDATE_PAYMENT', req, 'payment', req.params.id, `Status: ${status}`);
  res.json(payment);
});

// GET /api/super-admin/payments
router.get('/payments', superAdminAuth, async (req: Request, res: Response) => {
  const { month, year, status } = req.query;
  const where: any = {};
  if (month) where.month = month;
  if (year) where.year = parseInt(year as string);
  if (status) where.status = status;

  const payments = await prisma.payment.findMany({
    where,
    include: { client: { select: { name: true, mobile: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(payments);
});

// GET /api/super-admin/logs — Admin action logs
router.get('/logs', superAdminAuth, async (req: Request, res: Response) => {
  const { page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      include: { admin: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string),
    }),
    prisma.adminLog.count(),
  ]);
  res.json({ logs, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
});

// GET /api/super-admin/activity — All user activity logs
router.get('/activity', superAdminAuth, async (req: Request, res: Response) => {
  const { page = '1', limit = '50', clientId, module } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const where: any = {};
  if (clientId) where.clientId = clientId;
  if (module) where.module = module;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit as string) }),
    prisma.activityLog.count({ where }),
  ]);
  res.json({ logs, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
});

// POST /api/super-admin/clients/:id/factories — Create factory under a client
router.post('/clients/:id/factories', superAdminAuth, async (req: Request, res: Response) => {
  const { name, location, capacityPerDay } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const client = await prisma.client.findUnique({ where: { id: req.params.id } });
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const factory = await prisma.factory.create({
    data: { name, location, capacityPerDay, clientId: req.params.id },
  });
  await logAction((req as any).admin.id, 'CREATE_FACTORY', req, 'client', req.params.id, `Factory: ${name}`);
  res.status(201).json(factory);
});

// GET /api/super-admin/clients/:id/reports — Full P&L report for a client
router.get('/clients/:id/reports', superAdminAuth, async (req: Request, res: Response) => {
  const { month, year } = req.query;
  const clientId = req.params.id;
  const client = await prisma.client.findUnique({ where: { id: clientId }, include: { factories: true } });
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const factoryIds = client.factories.map(f => f.id);
  let dateFilter: any = {};
  if (month && year) {
    const start = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const end = new Date(parseInt(year as string), parseInt(month as string), 1);
    dateFilter = { gte: start, lt: end };
  }

  const dispatchWhere: any = { factoryId: { in: factoryIds } };
  const prodWhere: any = { factoryId: { in: factoryIds } };
  const expWhere: any = { factoryId: { in: factoryIds } };
  if (dateFilter.gte) {
    dispatchWhere.date = dateFilter;
    prodWhere.date = dateFilter;
    expWhere.date = dateFilter;
  }

  const [dispatches, productions, expenditures, customers] = await Promise.all([
    prisma.dispatch.findMany({ where: dispatchWhere }),
    prisma.productionEntry.findMany({ where: prodWhere }),
    prisma.expenditure.findMany({ where: expWhere }),
    prisma.customer.findMany({ where: { clientId } }),
  ]);

  const totalSales = dispatches.reduce((s, d) => s + d.amount, 0);
  const totalReceived = dispatches.reduce((s, d) => s + d.amountReceived, 0);
  const totalOutstanding = dispatches.reduce((s, d) => s + d.balanceDue, 0);
  const totalBricksSold = dispatches.reduce((s, d) => s + d.quantity, 0);
  const totalExpenses = expenditures.reduce((s, e) => s + e.amount, 0);
  const totalRawProduced = productions.reduce((s, p) => s + p.rawCount, 0);
  const totalFiredProduced = productions.reduce((s, p) => s + p.firedCount, 0);

  const expenseByCategory: Record<string, number> = {};
  expenditures.forEach(e => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount; });

  const topCustomers = customers.map(c => {
    const cDispatches = dispatches.filter(d => d.customerId === c.id);
    return { name: c.name, totalAmount: cDispatches.reduce((s, d) => s + d.amount, 0), outstanding: cDispatches.reduce((s, d) => s + d.balanceDue, 0) };
  }).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 10);

  res.json({
    totalSales, totalReceived, totalOutstanding, totalBricksSold,
    totalExpenses, netProfit: totalSales - totalExpenses,
    totalRawProduced, totalFiredProduced,
    expenseByCategory, topCustomers,
    dispatchCount: dispatches.length, productionDays: productions.length,
  });
});

// GET /api/super-admin/clients/:id/users — All users with credentials
router.get('/clients/:id/users', superAdminAuth, async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { clientId: req.params.id },
    include: { factories: { include: { factory: { select: { name: true } } } } },
  });
  res.json(users);
});

// GET /api/super-admin/clients/:id/customers — All customers with sales data
router.get('/clients/:id/customers', superAdminAuth, async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany({
    where: { clientId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });

  // Get sales data for each customer
  const result = await Promise.all(customers.map(async (c) => {
    const agg = await prisma.dispatch.aggregate({
      where: { customerId: c.id },
      _sum: { amount: true, balanceDue: true },
    });
    return { ...c, _totalSales: agg._sum.amount || 0, _outstanding: agg._sum.balanceDue || 0 };
  }));

  res.json(result);
});

// POST /api/super-admin/clients — Create new client/admin
router.post('/clients', superAdminAuth, async (req: Request, res: Response) => {
  const { name, mobile, email, password, factoryName, factoryLocation, plan } = req.body;
  if (!name || !mobile || !password) return res.status(400).json({ error: 'name, mobile, password required' });

  const existing = await prisma.client.findUnique({ where: { mobile } });
  if (existing) return res.status(409).json({ error: 'Mobile already registered' });

  const hashedPw = await bcrypt.hash(password, 10);
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  const client = await prisma.client.create({
    data: { name, mobile, email, plan: plan || 'premium', trialEndsAt, subscriptionStatus: 'ACTIVE', active: true },
  });

  const factory = await prisma.factory.create({
    data: { name: factoryName || `${name}'s Factory`, location: factoryLocation, clientId: client.id },
  });

  const user = await prisma.user.create({
    data: { clientId: client.id, name, mobile, email, password: hashedPw, plainPassword: password, role: 'OWNER' },
  });

  await prisma.userFactory.create({
    data: { userId: user.id, factoryId: factory.id, role: 'OWNER', permissions: ['production','dispatch','customers','raw_materials','labour','expenditure','fuel','reports','users'] },
  });

  await logAction((req as any).admin.id, 'CREATE_CLIENT', req, 'client', client.id, `${name} - ${mobile}`);
  res.status(201).json({ client, factory, user: { id: user.id, name: user.name, mobile: user.mobile, email: user.email, role: user.role } });
});

// GET /api/super-admin/overview — Global overview stats
router.get('/overview', superAdminAuth, async (_req: Request, res: Response) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalRevenue, monthRevenue, totalExpenses, monthExpenses, totalDispatches, monthDispatches] = await Promise.all([
    prisma.dispatch.aggregate({ _sum: { amount: true } }),
    prisma.dispatch.aggregate({ _sum: { amount: true }, where: { date: { gte: monthStart } } }),
    prisma.expenditure.aggregate({ _sum: { amount: true } }),
    prisma.expenditure.aggregate({ _sum: { amount: true }, where: { date: { gte: monthStart } } }),
    prisma.dispatch.count(),
    prisma.dispatch.count({ where: { date: { gte: monthStart } } }),
  ]);

  res.json({
    totalRevenue: totalRevenue._sum.amount || 0,
    monthRevenue: monthRevenue._sum.amount || 0,
    totalExpenses: totalExpenses._sum.amount || 0,
    monthExpenses: monthExpenses._sum.amount || 0,
    totalDispatches,
    monthDispatches,
    netProfit: (totalRevenue._sum.amount || 0) - (totalExpenses._sum.amount || 0),
    monthProfit: (monthRevenue._sum.amount || 0) - (monthExpenses._sum.amount || 0),
  });
});

// GET /api/super-admin/charts — Aggregated data for Power BI style charts (supports ?clientId filter)
router.get('/charts', superAdminAuth, async (req: Request, res: Response) => {
  const { clientId } = req.query;
  const now = new Date();

  // Get factory IDs (scoped to client if filter provided)
  let factoryFilter: any = undefined;
  if (clientId) {
    const clientFactories = await prisma.factory.findMany({ where: { clientId: clientId as string }, select: { id: true } });
    factoryFilter = { factoryId: { in: clientFactories.map(f => f.id) } };
  }

  // Last 12 months data
  const months: any[] = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = start.toLocaleString('en', { month: 'short', year: '2-digit' });

    const dispWhere: any = { date: { gte: start, lt: end }, ...factoryFilter };
    const expWhere: any = { date: { gte: start, lt: end }, ...factoryFilter };
    const prodWhere: any = { date: { gte: start, lt: end }, ...factoryFilter };

    const [revenue, expenses, production, dispatches] = await Promise.all([
      prisma.dispatch.aggregate({ _sum: { amount: true }, where: dispWhere }),
      prisma.expenditure.aggregate({ _sum: { amount: true }, where: expWhere }),
      prisma.productionEntry.aggregate({ _sum: { firedCount: true }, where: prodWhere }),
      prisma.dispatch.count({ where: dispWhere }),
    ]);

    months.push({
      month: label,
      revenue: revenue._sum.amount || 0,
      expenses: expenses._sum.amount || 0,
      profit: (revenue._sum.amount || 0) - (expenses._sum.amount || 0),
      production: production._sum.firedCount || 0,
      dispatches,
    });
  }

  // Revenue by client
  const clients = await prisma.client.findMany({ where: clientId ? { id: clientId as string } : undefined, include: { factories: true } });
  const clientRevenue: any[] = [];
  for (const client of clients) {
    const fIds = client.factories.map(f => f.id);
    if (fIds.length === 0) continue;
    const rev = await prisma.dispatch.aggregate({ _sum: { amount: true }, where: { factoryId: { in: fIds } } });
    const exp = await prisma.expenditure.aggregate({ _sum: { amount: true }, where: { factoryId: { in: fIds } } });
    clientRevenue.push({ name: client.name, revenue: rev._sum.amount || 0, expenses: exp._sum.amount || 0, profit: (rev._sum.amount || 0) - (exp._sum.amount || 0) });
  }

  // Expense by category
  const allExpenses = await prisma.expenditure.findMany({ where: factoryFilter || undefined, select: { category: true, amount: true } });
  const expByCategory: Record<string, number> = {};
  allExpenses.forEach(e => { expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount; });
  const categoryData = Object.entries(expByCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Payment status distribution
  const [paid, partial, credit] = await Promise.all([
    prisma.dispatch.count({ where: { paymentStatus: 'PAID', ...factoryFilter } }),
    prisma.dispatch.count({ where: { paymentStatus: 'PARTIAL', ...factoryFilter } }),
    prisma.dispatch.count({ where: { paymentStatus: 'CREDIT', ...factoryFilter } }),
  ]);

  // Production by brick type
  const prodEntries = await prisma.productionEntry.findMany({ where: factoryFilter || undefined, select: { brickType: true, firedCount: true } });
  const brickTypeData: Record<string, number> = {};
  prodEntries.forEach(p => { brickTypeData[p.brickType] = (brickTypeData[p.brickType] || 0) + p.firedCount; });
  const brickTypes = Object.entries(brickTypeData).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Client subscription status
  const [trial, active, expired, suspended] = await Promise.all([
    prisma.client.count({ where: { subscriptionStatus: 'TRIAL' } }),
    prisma.client.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    prisma.client.count({ where: { subscriptionStatus: 'EXPIRED' } }),
    prisma.client.count({ where: { subscriptionStatus: 'SUSPENDED' } }),
  ]);

  res.json({
    monthly: months,
    clientRevenue: clientRevenue.sort((a, b) => b.revenue - a.revenue),
    expenseByCategory: categoryData,
    paymentStatus: [{ name: 'Paid', value: paid }, { name: 'Partial', value: partial }, { name: 'Credit', value: credit }],
    brickTypes,
    subscriptionStatus: [{ name: 'Trial', value: trial }, { name: 'Active', value: active }, { name: 'Expired', value: expired }, { name: 'Suspended', value: suspended }],
  });
});

// POST /api/super-admin/notifications — Send notification
router.post('/notifications', superAdminAuth, async (req: Request, res: Response) => {
  const { title, message, type, clientId } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'title and message required' });

  const notification = await prisma.notification.create({
    data: { title, message, type: type || 'info', clientId: clientId || null, createdBy: (req as any).admin.id },
  });
  await logAction((req as any).admin.id, 'SEND_NOTIFICATION', req, 'notification', notification.id, `${title} → ${clientId || 'ALL'}`);
  res.status(201).json(notification);
});

// GET /api/super-admin/notifications — List all notifications
router.get('/notifications', superAdminAuth, async (_req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  res.json(notifications);
});

// DELETE /api/super-admin/notifications/:id
router.delete('/notifications/:id', superAdminAuth, async (req: Request, res: Response) => {
  await prisma.notification.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

// GET /api/super-admin/settings
router.get('/settings', superAdminAuth, async (_req: Request, res: Response) => {
  // In production, store in DB. For now, use a simple JSON file or env.
  // Using a static object that gets updated in memory (persists until restart)
  res.json(appSettings);
});

// PATCH /api/super-admin/settings
router.patch('/settings', superAdminAuth, async (req: Request, res: Response) => {
  const { originalPrice, discountedPrice, paymentDueDay, contactName, contactPhone, contactEmail, upiId, upiName, bankName, accountNumber, ifscCode } = req.body;
  Object.assign(appSettings, { originalPrice, discountedPrice, paymentDueDay, contactName, contactPhone, contactEmail, upiId, upiName, bankName, accountNumber, ifscCode });
  await logAction((req as any).admin.id, 'UPDATE_SETTINGS', req, 'settings', undefined, JSON.stringify(req.body));
  res.json(appSettings);
});

// GET /api/super-admin/public-settings (no auth - for user app)
router.get('/public-settings', async (_req: Request, res: Response) => {
  res.json(appSettings);
});

export default router;
