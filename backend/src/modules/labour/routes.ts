import { Router, Response } from 'express';
import prisma from '../../common/prisma';
import { authenticate, AuthRequest } from '../../common/middleware';

const router = Router();
router.use(authenticate);

// GET /api/labour
router.get('/', async (req: AuthRequest, res: Response) => {
  const { factoryId } = req.query;
  const factories = await prisma.factory.findMany({ where: { clientId: req.user!.clientId } });
  const where: any = { factoryId: { in: factories.map(f => f.id) }, active: true };
  if (factoryId) where.factoryId = factoryId as string;

  const labour = await prisma.labour.findMany({ where, orderBy: { name: 'asc' } });
  res.json(labour);
});

// POST /api/labour
router.post('/', async (req: AuthRequest, res: Response) => {
  const { factoryId, name, mobile, type, dailyRate, perBrickRate, monthlySalary, aadhaar } = req.body;
  if (!factoryId || !name || !type) return res.status(400).json({ error: 'factoryId, name, type required' });

  const labour = await prisma.labour.create({
    data: { factoryId, name, mobile, type, dailyRate, perBrickRate, monthlySalary, aadhaar },
  });
  res.status(201).json(labour);
});

// PUT /api/labour/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const labour = await prisma.labour.update({ where: { id: req.params.id }, data: req.body });
  res.json(labour);
});

// PATCH /api/labour/:id/toggle
router.patch('/:id/toggle', async (req: AuthRequest, res: Response) => {
  const l = await prisma.labour.findUnique({ where: { id: req.params.id } });
  if (!l) return res.status(404).json({ error: 'Not found' });
  const updated = await prisma.labour.update({ where: { id: req.params.id }, data: { active: !l.active } });
  res.json(updated);
});

// === Attendance ===
router.post('/attendance', async (req: AuthRequest, res: Response) => {
  const { entries } = req.body; // [{labourId, date, status, workType}]
  const results = await prisma.$transaction(
    entries.map((e: any) =>
      prisma.attendance.upsert({
        where: { labourId_date: { labourId: e.labourId, date: new Date(e.date) } },
        update: { status: e.status, workType: e.workType },
        create: { labourId: e.labourId, date: new Date(e.date), status: e.status, workType: e.workType, enteredBy: req.user!.id },
      })
    )
  );
  res.json(results);
});

router.get('/attendance', async (req: AuthRequest, res: Response) => {
  const { factoryId, date } = req.query;
  const labour = await prisma.labour.findMany({
    where: { factoryId: factoryId as string, active: true },
    include: { attendance: { where: { date: new Date(date as string) } } },
  });
  res.json(labour);
});

// === Labour Production (per-brick workers) ===
router.get('/production', async (req: AuthRequest, res: Response) => {
  const { factoryId, labourId } = req.query;
  const where: any = {};
  if (factoryId) {
    const labourIds = await prisma.labour.findMany({ where: { factoryId: factoryId as string }, select: { id: true } });
    where.labourId = { in: labourIds.map(l => l.id) };
  }
  if (labourId) where.labourId = labourId as string;

  const entries = await prisma.labourProduction.findMany({ where, orderBy: { date: 'desc' }, take: 200, include: { labour: { select: { name: true } } } });
  res.json(entries);
});

router.post('/production', async (req: AuthRequest, res: Response) => {
  const { labourId, date, brickType, quantity, rate } = req.body;
  if (!labourId || !quantity) return res.status(400).json({ error: 'labourId, quantity required' });

  const labour = await prisma.labour.findUnique({ where: { id: labourId } });
  const finalRate = rate || labour?.perBrickRate || 0;
  const amount = quantity * finalRate;

  const entry = await prisma.labourProduction.create({
    data: { labourId, date: new Date(date || Date.now()), brickType: brickType || 'Red Brick', quantity, rate: finalRate, amount, enteredBy: req.user!.id },
  });
  res.status(201).json(entry);
});

// === Payments (advances, settlements) ===
router.get('/payments', async (req: AuthRequest, res: Response) => {
  const { labourId } = req.query;
  const where: any = {};
  if (labourId) where.labourId = labourId as string;
  const payments = await prisma.labourPayment.findMany({ where, orderBy: { date: 'desc' }, take: 200, include: { labour: { select: { name: true } } } });
  res.json(payments);
});

router.post('/payments', async (req: AuthRequest, res: Response) => {
  const { labourId, amount, date, mode, remarks } = req.body;
  if (!labourId || !amount) return res.status(400).json({ error: 'labourId, amount required' });

  const payment = await prisma.labourPayment.create({
    data: { labourId, amount, date: new Date(date || Date.now()), mode: mode || 'cash', remarks },
  });
  res.status(201).json(payment);
});

router.get('/:id/payments', async (req: AuthRequest, res: Response) => {
  const payments = await prisma.labourPayment.findMany({ where: { labourId: req.params.id }, orderBy: { date: 'desc' } });
  res.json(payments);
});

// === Labour Summary (earnings vs payments) ===
router.get('/:id/summary', async (req: AuthRequest, res: Response) => {
  const labour = await prisma.labour.findUnique({ where: { id: req.params.id } });
  if (!labour) return res.status(404).json({ error: 'Not found' });

  const totalEarned = await prisma.labourProduction.aggregate({ where: { labourId: req.params.id }, _sum: { amount: true } });
  const totalPaid = await prisma.labourPayment.aggregate({ where: { labourId: req.params.id }, _sum: { amount: true } });
  const totalBricks = await prisma.labourProduction.aggregate({ where: { labourId: req.params.id }, _sum: { quantity: true } });

  res.json({
    labour,
    totalEarned: totalEarned._sum.amount || 0,
    totalPaid: totalPaid._sum.amount || 0,
    balance: (totalEarned._sum.amount || 0) - (totalPaid._sum.amount || 0),
    totalBricks: totalBricks._sum.quantity || 0,
  });
});

export default router;
