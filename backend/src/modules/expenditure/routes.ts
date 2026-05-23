import { Router, Response } from 'express';
import prisma from '../../common/prisma';
import { authenticate, AuthRequest } from '../../common/middleware';

const router = Router();
router.use(authenticate);

// GET /api/expenditure
router.get('/', async (req: AuthRequest, res: Response) => {
  const { factoryId, category } = req.query;
  const factories = await prisma.factory.findMany({ where: { clientId: req.user!.clientId } });
  const where: any = { factoryId: { in: factories.map(f => f.id) } };
  if (factoryId) where.factoryId = factoryId as string;
  if (category) where.category = category as string;

  const entries = await prisma.expenditure.findMany({ where, orderBy: { date: 'desc' }, take: 200 });
  res.json(entries);
});

// POST /api/expenditure
router.post('/', async (req: AuthRequest, res: Response) => {
  const { factoryId, date, category, amount, description, paymentMode, paidTo, fuelType, fuelQty, fuelUnit, fuelRate } = req.body;
  if (!factoryId || !category || !amount) return res.status(400).json({ error: 'factoryId, category, amount required' });

  const entry = await prisma.expenditure.create({
    data: { factoryId, date: new Date(date || Date.now()), category, amount, description, paymentMode: paymentMode || 'cash', paidTo, enteredBy: req.user!.id },
  });

  // Also create fuel entry if category is Diesel/Fuel
  if (category === 'Diesel/Fuel' && fuelQty && fuelRate) {
    await prisma.fuelEntry.create({
      data: { factoryId, date: new Date(date || Date.now()), fuelType: fuelType || 'Diesel', quantity: +fuelQty, unit: fuelUnit || 'litre', rate: +fuelRate, totalCost: +fuelQty * +fuelRate, supplier: paidTo || null, enteredBy: req.user!.id },
    });
  }

  res.status(201).json(entry);
});

// PUT /api/expenditure/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const data = req.body;
  if (data.date) data.date = new Date(data.date);
  const entry = await prisma.expenditure.update({ where: { id: req.params.id }, data });
  res.json(entry);
});

// DELETE /api/expenditure/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.expenditure.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

// GET /api/expenditure/categories
router.get('/categories', (_req, res: Response) => {
  res.json([
    'Electricity', 'Diesel/Fuel', 'Repair & Maintenance', 'Transport',
    'Office/Stationery', 'Food/Tea', 'Rent', 'Insurance',
    'Miscellaneous', 'Other'
  ]);
});

export default router;
