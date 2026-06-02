import { Router, Response } from 'express';
import prisma from '../../common/prisma';
import { authenticate, AuthRequest } from '../../common/middleware';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { factoryId } = req.query;
  const factories = await prisma.factory.findMany({ where: { clientId: req.user!.clientId } });
  const fIds = factoryId ? [factoryId as string] : factories.map(f => f.id);
  const entries = await prisma.fuelEntry.findMany({
    where: { factoryId: { in: fIds } },
    orderBy: { date: 'desc' },
    take: 100,
  });
  res.json(entries);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { factoryId, date, fuelType, quantity, unit, rate, supplier, invoiceNo, fileUrl } = req.body;
  const totalCost = quantity * rate;
  const entry = await prisma.fuelEntry.create({
    data: { factoryId, date: new Date(date), fuelType, quantity, unit, rate, supplier, totalCost, invoiceNo, fileUrl, enteredBy: req.user!.id },
  });
  res.status(201).json(entry);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.fuelEntry.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

export default router;
