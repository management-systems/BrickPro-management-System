import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../common/prisma';
import { authenticate, authorize, AuthRequest } from '../../common/middleware';

const router = Router();

// GET /api/users — List all users under this client
router.get('/', authenticate, authorize('OWNER', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { clientId: req.user!.clientId },
    include: { factories: { include: { factory: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users.map((u) => ({ ...u, password: undefined })));
});

// POST /api/users — Create user and assign to specific factories
router.post('/', authenticate, authorize('OWNER'), async (req: AuthRequest, res: Response) => {
  const { name, mobile, email, password, role, factories } = req.body;
  // factories: [{ factoryId, role?, permissions? }]
  if (!name || !password) return res.status(400).json({ error: 'name and password(pin) required' });
  if (!email && !mobile) return res.status(400).json({ error: 'email or mobile required' });

  // Check uniqueness across entire app
  const conditions: any[] = [];
  if (email) conditions.push({ email });
  if (mobile) conditions.push({ mobile });
  const existing = await prisma.user.findFirst({ where: { OR: conditions } });
  if (existing) {
    if (email && existing.email === email) return res.status(409).json({ error: 'Email already in use' });
    if (mobile && existing.mobile === mobile) return res.status(409).json({ error: 'Mobile already in use' });
  }

  // Verify factories belong to this client
  const factoryAssignments = factories || [];
  if (factoryAssignments.length) {
    const ids = factoryAssignments.map((f: any) => f.factoryId);
    const valid = await prisma.factory.findMany({ where: { id: { in: ids }, clientId: req.user!.clientId } });
    if (valid.length !== ids.length) return res.status(400).json({ error: 'Invalid factory IDs' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name, mobile: mobile || null, email, password: hashedPassword,
      role: role || 'WORKER', clientId: req.user!.clientId,
      factories: {
        create: factoryAssignments.map((f: any) => ({
          factoryId: f.factoryId,
          role: f.role || role || 'WORKER',
          permissions: f.permissions || [],
        })),
      },
    },
    include: { factories: { include: { factory: { select: { id: true, name: true } } } } },
  });
  res.status(201).json({ ...user, password: undefined });
});

// PATCH /api/users/:id — Update user details
router.patch('/:id', authenticate, authorize('OWNER'), async (req: AuthRequest, res: Response) => {
  const { name, email, mobile, role, active, password } = req.body;
  const user = await prisma.user.findFirst({ where: { id: req.params.id, clientId: req.user!.clientId } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const data: any = {};
  if (name) data.name = name;
  if (email !== undefined) data.email = email || null;
  if (mobile !== undefined) data.mobile = mobile || null;
  if (role) data.role = role;
  if (active !== undefined) data.active = active;
  if (password) data.password = await bcrypt.hash(password, 10);

  const updated = await prisma.user.update({
    where: { id: req.params.id }, data,
    include: { factories: { include: { factory: { select: { id: true, name: true } } } } },
  });
  res.json({ ...updated, password: undefined });
});

// PUT /api/users/:id/factories — Set factory assignments (replace all)
router.put('/:id/factories', authenticate, authorize('OWNER'), async (req: AuthRequest, res: Response) => {
  const { factories } = req.body;
  // factories: [{ factoryId, role, permissions }]
  const user = await prisma.user.findFirst({ where: { id: req.params.id, clientId: req.user!.clientId } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Delete existing assignments
  await prisma.userFactory.deleteMany({ where: { userId: req.params.id } });

  // Create new ones
  if (factories?.length) {
    await prisma.userFactory.createMany({
      data: factories.map((f: any) => ({
        userId: req.params.id,
        factoryId: f.factoryId,
        role: f.role || user.role,
        permissions: f.permissions || [],
      })),
    });
  }

  const updated = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { factories: { include: { factory: { select: { id: true, name: true } } } } },
  });
  res.json({ ...updated, password: undefined });
});

// DELETE /api/users/:id — Delete user
router.delete('/:id', authenticate, authorize('OWNER'), async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findFirst({ where: { id: req.params.id, clientId: req.user!.clientId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'OWNER') return res.status(400).json({ error: 'Cannot delete owner' });

  await prisma.userFactory.deleteMany({ where: { userId: req.params.id } });
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

export default router;
