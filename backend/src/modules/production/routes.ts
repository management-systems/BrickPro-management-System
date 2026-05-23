import { Router, Response } from 'express';
import prisma from '../../common/prisma';
import { authenticate, authorize, AuthRequest } from '../../common/middleware';

const router = Router();
router.use(authenticate);

const log = async (req: AuthRequest, action: string, details?: string) => {
  await prisma.activityLog.create({
    data: { clientId: req.user!.clientId, userId: req.user!.id, userName: req.user!.name, action, module: 'production', details, ip: req.ip },
  }).catch(() => {});
};

// GET /api/production
router.get('/', async (req: AuthRequest, res: Response) => {
  const { factoryId, from, to } = req.query;
  const where: any = {};
  const factories = await prisma.factory.findMany({ where: { clientId: req.user!.clientId } });
  where.factoryId = { in: factories.map(f => f.id) };
  if (factoryId) where.factoryId = factoryId as string;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from as string);
    if (to) where.date.lte = new Date(to as string);
  }
  const entries = await prisma.productionEntry.findMany({ where, orderBy: { date: 'desc' }, take: 100 });
  res.json(entries);
});

// POST /api/production
router.post('/', async (req: AuthRequest, res: Response) => {
  const { factoryId, date, brickType, shift, rawCount, firedCount, scrapCount, remarks, fileUrl } = req.body;
  const entry = await prisma.productionEntry.create({
    data: { factoryId, date: new Date(date), brickType, shift, rawCount, firedCount, scrapCount: scrapCount || 0, remarks, fileUrl, enteredBy: req.user!.id },
  });
  await log(req, 'PRODUCTION_ENTRY', `${brickType}, Shift: ${shift}, Raw: ${rawCount}, Fired: ${firedCount}`);
  res.status(201).json(entry);
});

// PUT /api/production/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  if (data.date) data.date = new Date(data.date);
  const entry = await prisma.productionEntry.update({ where: { id }, data });
  res.json(entry);
});

// DELETE /api/production/:id
router.delete('/:id', authorize('OWNER', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  await prisma.productionEntry.delete({ where: { id: req.params.id } });
  await log(req, 'PRODUCTION_DELETED', `Entry ID: ${req.params.id}`);
  res.json({ message: 'Deleted' });
});

export default router;
