import { Router, Response } from 'express';
import prisma from '../../common/prisma';
import { authenticate, authorize, AuthRequest } from '../../common/middleware';

const router = Router();
router.use(authenticate);

const log = async (req: AuthRequest, action: string, module: string, target?: string, details?: string) => {
  await prisma.activityLog.create({
    data: { clientId: req.user!.clientId, userId: req.user!.id, userName: req.user!.name, action, module, target, details, ip: req.ip },
  }).catch(() => {});
};

// GET /api/dispatch
router.get('/', async (req: AuthRequest, res: Response) => {
  const { factoryId } = req.query;
  const factories = await prisma.factory.findMany({ where: { clientId: req.user!.clientId } });
  const where: any = { factoryId: { in: factories.map(f => f.id) } };
  if (factoryId) where.factoryId = factoryId as string;

  const dispatches = await prisma.dispatch.findMany({
    where,
    include: { customer: true },
    orderBy: { date: 'desc' },
    take: 200,
  });
  res.json(dispatches);
});

// POST /api/dispatch
router.post('/', async (req: AuthRequest, res: Response) => {
  const { factoryId, customerId, date, truckNo, driverName, driverMobile, brickType, quantity, rate, paymentStatus, amountReceived, remarks, fileUrl, ticketNo } = req.body;
  if (!factoryId || !customerId || !brickType || !quantity || !rate) {
    return res.status(400).json({ error: 'factoryId, customerId, brickType, quantity, rate required' });
  }

  const amount = quantity * rate;
  const balanceDue = amount - (amountReceived || 0);
  const count = await prisma.dispatch.count({ where: { factoryId } });
  const challanNo = ticketNo || `${factoryId.slice(0, 4).toUpperCase()}-${new Date(date || Date.now()).toISOString().slice(0, 10)}-${(count + 1).toString().padStart(3, '0')}`;

  const status = amountReceived >= amount ? 'PAID' : amountReceived > 0 ? 'PARTIAL' : (paymentStatus || 'CREDIT');

  const dispatch = await prisma.dispatch.create({
    data: {
      factoryId, customerId, date: new Date(date || Date.now()), truckNo, driverName, driverMobile,
      brickType, quantity, rate, amount, challanNo,
      paymentStatus: status, amountReceived: amountReceived || 0, balanceDue,
      remarks, fileUrl, enteredBy: req.user!.id,
    },
    include: { customer: true },
  });

  await log(req, 'DISPATCH_CREATED', 'dispatch', dispatch.customer?.name, `${quantity} ${brickType} @ ₹${rate} = ₹${amount}, Challan: ${challanNo}`);
  res.status(201).json(dispatch);
});

// PATCH /api/dispatch/:id/payment
router.patch('/:id/payment', async (req: AuthRequest, res: Response) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'amount required' });

  const dispatch = await prisma.dispatch.findUnique({ where: { id: req.params.id }, include: { customer: true } });
  if (!dispatch) return res.status(404).json({ error: 'Not found' });

  const newReceived = dispatch.amountReceived + amount;
  const newBalance = dispatch.amount - newReceived;
  const status = newBalance <= 0 ? 'PAID' : 'PARTIAL';

  const updated = await prisma.dispatch.update({
    where: { id: req.params.id },
    data: { amountReceived: newReceived, balanceDue: Math.max(0, newBalance), paymentStatus: status },
  });

  await log(req, 'DISPATCH_PAYMENT', 'dispatch', (dispatch as any).customer?.name || dispatch.challanNo, `₹${amount} received, Balance: ₹${Math.max(0, newBalance)}`);
  res.json(updated);
});

// PUT /api/dispatch/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const data = req.body;
  if (data.date) data.date = new Date(data.date);
  if (data.quantity && data.rate) {
    data.amount = data.quantity * data.rate;
    data.balanceDue = data.amount - (data.amountReceived || 0);
  }
  const dispatch = await prisma.dispatch.update({ where: { id: req.params.id }, data, include: { customer: true } });
  await log(req, 'DISPATCH_UPDATED', 'dispatch', dispatch.customer?.name || dispatch.challanNo);
  res.json(dispatch);
});

// DELETE /api/dispatch/:id
router.delete('/:id', authorize('OWNER'), async (req: AuthRequest, res: Response) => {
  const dispatch = await prisma.dispatch.findUnique({ where: { id: req.params.id }, include: { customer: true } });
  await prisma.dispatch.delete({ where: { id: req.params.id } });
  await log(req, 'DISPATCH_DELETED', 'dispatch', (dispatch as any)?.customer?.name || req.params.id, `Challan: ${dispatch?.challanNo}, Amount: ₹${dispatch?.amount}`);
  res.json({ message: 'Deleted' });
});

export default router;
