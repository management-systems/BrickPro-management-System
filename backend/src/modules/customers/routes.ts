import { Router, Response } from 'express';
import prisma from '../../common/prisma';
import { authenticate, AuthRequest } from '../../common/middleware';

const router = Router();
router.use(authenticate);

const log = async (req: AuthRequest, action: string, module: string, target?: string, details?: string) => {
  await prisma.activityLog.create({
    data: { clientId: req.user!.clientId, userId: req.user!.id, userName: req.user!.name, action, module, target, details, ip: req.ip },
  }).catch(() => {});
};

router.get('/', async (req: AuthRequest, res: Response) => {
  const { factoryId } = req.query;
  if (factoryId) {
    // Only customers who have dispatches in this factory
    const dispatches = await prisma.dispatch.findMany({ where: { factoryId: factoryId as string }, select: { customerId: true }, distinct: ['customerId'] });
    const customerIds = dispatches.map(d => d.customerId);
    const customers = await prisma.customer.findMany({ where: { clientId: req.user!.clientId, id: { in: customerIds } }, orderBy: { name: 'asc' } });
    return res.json(customers);
  }
  const customers = await prisma.customer.findMany({ where: { clientId: req.user!.clientId }, orderBy: { name: 'asc' } });
  res.json(customers);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, firm, mobile, address, gstin, creditLimit, type } = req.body;
  const customer = await prisma.customer.create({
    data: { clientId: req.user!.clientId, name, firm, mobile, address, gstin, creditLimit, type },
  });
  await log(req, 'CUSTOMER_CREATED', 'customers', name, `Firm: ${firm || '-'}, Mobile: ${mobile || '-'}, Type: ${type || 'dealer'}`);
  res.status(201).json(customer);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const customer = await prisma.customer.update({ where: { id: req.params.id }, data: req.body });
  await log(req, 'CUSTOMER_UPDATED', 'customers', customer.name, JSON.stringify(req.body));
  res.json(customer);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
  await prisma.customer.delete({ where: { id: req.params.id } });
  await log(req, 'CUSTOMER_DELETED', 'customers', customer?.name || req.params.id);
  res.json({ message: 'Deleted' });
});

// GET /api/customers/:id/outstanding
router.get('/:id/outstanding', async (req: AuthRequest, res: Response) => {
  const { factoryId } = req.query;
  const where: any = { customerId: req.params.id, balanceDue: { gt: 0 } };
  if (factoryId) where.factoryId = factoryId as string;
  const dispatches = await prisma.dispatch.findMany({ where, orderBy: { date: 'desc' } });
  const total = dispatches.reduce((sum, d) => sum + d.balanceDue, 0);
  res.json({ total, dispatches });
});

// GET /api/customers/:id/details — all dispatches + summary
router.get('/:id/details', async (req: AuthRequest, res: Response) => {
  const { factoryId } = req.query;
  const where: any = { customerId: req.params.id };
  if (factoryId) where.factoryId = factoryId as string;
  const dispatches = await prisma.dispatch.findMany({ where, orderBy: { date: 'desc' } });
  const totalSold = dispatches.reduce((s, d) => s + d.quantity, 0);
  const totalAmount = dispatches.reduce((s, d) => s + d.amount, 0);
  const totalReceived = dispatches.reduce((s, d) => s + d.amountReceived, 0);
  const totalDue = dispatches.reduce((s, d) => s + d.balanceDue, 0);
  res.json({ dispatches, totalSold, totalAmount, totalReceived, totalDue });
});

// POST /api/customers/:id/payment — record direct payment against oldest dues
router.post('/:id/payment', async (req: AuthRequest, res: Response) => {
  const { amount, mode, factoryId } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'amount required' });

  const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
  const where: any = { customerId: req.params.id, balanceDue: { gt: 0 } };
  if (factoryId) where.factoryId = factoryId;
  const dispatches = await prisma.dispatch.findMany({ where, orderBy: { date: 'asc' } });

  let remaining = amount;
  for (const d of dispatches) {
    if (remaining <= 0) break;
    const pay = Math.min(remaining, d.balanceDue);
    const newReceived = d.amountReceived + pay;
    const newBalance = d.amount - newReceived;
    await prisma.dispatch.update({
      where: { id: d.id },
      data: { amountReceived: newReceived, balanceDue: Math.max(0, newBalance), paymentStatus: newBalance <= 0 ? 'PAID' : 'PARTIAL' },
    });
    remaining -= pay;
  }

  await log(req, 'PAYMENT_RECEIVED', 'customers', customer?.name || req.params.id, `₹${amount} via ${mode || 'cash'}`);
  res.json({ message: 'Payment recorded', applied: amount - remaining, remaining });
});

export default router;
