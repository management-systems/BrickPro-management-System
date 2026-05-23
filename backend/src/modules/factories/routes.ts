import { Router, Response } from 'express';
import prisma from '../../common/prisma';
import { authenticate, authorize, AuthRequest } from '../../common/middleware';

const router = Router();
router.use(authenticate);

// GET /api/factories — Returns factories based on user role
// OWNER sees all factories under their client
// Other roles see only assigned factories
router.get('/', async (req: AuthRequest, res: Response) => {
  if (req.user!.role === 'OWNER') {
    const factories = await prisma.factory.findMany({ where: { clientId: req.user!.clientId } });
    return res.json(factories);
  }

  const assignments = await prisma.userFactory.findMany({
    where: { userId: req.user!.id, active: true },
    include: { factory: true },
  });
  res.json(assignments.map((a) => ({ ...a.factory, userRole: a.role, permissions: a.permissions })));
});

// POST /api/factories — OWNER creates a new factory
router.post('/', authorize('OWNER'), async (req: AuthRequest, res: Response) => {
  const { name, location, capacityPerDay } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const factory = await prisma.factory.create({
    data: { name, location, capacityPerDay, clientId: req.user!.clientId },
  });
  res.status(201).json(factory);
});

// PUT /api/factories/:id
router.put('/:id', authorize('OWNER', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  const factory = await prisma.factory.findFirst({ where: { id: req.params.id, clientId: req.user!.clientId } });
  if (!factory) return res.status(404).json({ error: 'Factory not found' });

  const updated = await prisma.factory.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});

// PATCH /api/factories/:id/toggle — Enable/disable factory
router.patch('/:id/toggle', authorize('OWNER'), async (req: AuthRequest, res: Response) => {
  const factory = await prisma.factory.findFirst({ where: { id: req.params.id, clientId: req.user!.clientId } });
  if (!factory) return res.status(404).json({ error: 'Factory not found' });

  const updated = await prisma.factory.update({ where: { id: req.params.id }, data: { active: !factory.active } });
  res.json(updated);
});

export default router;
