import { Router, Response } from 'express';
import prisma from '../../common/prisma';
import { authenticate, AuthRequest } from '../../common/middleware';

const router = Router();
router.use(authenticate);

const EDIT_LIMITS: Record<string, number> = {
  OWNER: Infinity,
  MANAGER: 1440,
  SUPERVISOR: 120,
  ACCOUNTANT: 1440,
  OPERATOR: 30,
  WORKER: 0,
};

function canEdit(role: string, createdAt: Date): { allowed: boolean; message?: string } {
  const limit = EDIT_LIMITS[role] ?? 0;
  if (limit === 0) return { allowed: false, message: 'Your role does not have edit permission' };
  if (limit === Infinity) return { allowed: true };
  const minutesAgo = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (minutesAgo > limit) return { allowed: false, message: `Edit window expired. ${role} can edit within ${limit} minutes only.` };
  return { allowed: true };
}

async function logEdit(clientId: string, userId: string, userName: string, userRole: string, module: string, recordId: string, changes: { field: string; oldValue: any; newValue: any }[], reason: string) {
  await prisma.editLog.createMany({
    data: changes.map(c => ({
      clientId, userId, userName, userRole, module, recordId,
      field: c.field, oldValue: String(c.oldValue ?? ''), newValue: String(c.newValue ?? ''), reason,
    })),
  });
}

// PATCH /api/edit/production/:id
router.patch('/production/:id', async (req: AuthRequest, res: Response) => {
  const { reason, ...updates } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason is required for editing' });

  const entry = await prisma.productionEntry.findUnique({ where: { id: req.params.id } });
  if (!entry) return res.status(404).json({ error: 'Not found' });

  const check = canEdit(req.user!.role, entry.createdAt);
  if (!check.allowed) return res.status(403).json({ error: check.message });

  const changes: any[] = [];
  if (updates.brickType && updates.brickType !== entry.brickType) changes.push({ field: 'brickType', oldValue: entry.brickType, newValue: updates.brickType });
  if (updates.shift && updates.shift !== entry.shift) changes.push({ field: 'shift', oldValue: entry.shift, newValue: updates.shift });
  if (updates.rawCount !== undefined && +updates.rawCount !== entry.rawCount) changes.push({ field: 'rawCount', oldValue: entry.rawCount, newValue: updates.rawCount });
  if (updates.firedCount !== undefined && +updates.firedCount !== entry.firedCount) changes.push({ field: 'firedCount', oldValue: entry.firedCount, newValue: updates.firedCount });
  if (updates.remarks !== undefined && updates.remarks !== entry.remarks) changes.push({ field: 'remarks', oldValue: entry.remarks, newValue: updates.remarks });

  if (changes.length === 0) return res.status(400).json({ error: 'No changes detected' });

  await logEdit(req.user!.clientId, req.user!.id, req.user!.name, req.user!.role, 'production', entry.id, changes, reason);

  const data: any = {};
  if (updates.brickType) data.brickType = updates.brickType;
  if (updates.shift) data.shift = updates.shift;
  if (updates.rawCount !== undefined) data.rawCount = +updates.rawCount;
  if (updates.firedCount !== undefined) data.firedCount = +updates.firedCount;
  if (updates.remarks !== undefined) data.remarks = updates.remarks;

  const updated = await prisma.productionEntry.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

// PATCH /api/edit/dispatch/:id
router.patch('/dispatch/:id', async (req: AuthRequest, res: Response) => {
  const { reason, ...updates } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason is required for editing' });

  const entry = await prisma.dispatch.findUnique({ where: { id: req.params.id } });
  if (!entry) return res.status(404).json({ error: 'Not found' });

  const check = canEdit(req.user!.role, entry.createdAt);
  if (!check.allowed) return res.status(403).json({ error: check.message });

  const changes: any[] = [];
  if (updates.quantity !== undefined && +updates.quantity !== entry.quantity) changes.push({ field: 'quantity', oldValue: entry.quantity, newValue: updates.quantity });
  if (updates.rate !== undefined && +updates.rate !== entry.rate) changes.push({ field: 'rate', oldValue: entry.rate, newValue: updates.rate });
  if (updates.truckNo && updates.truckNo !== entry.truckNo) changes.push({ field: 'truckNo', oldValue: entry.truckNo, newValue: updates.truckNo });
  if (updates.brickType && updates.brickType !== entry.brickType) changes.push({ field: 'brickType', oldValue: entry.brickType, newValue: updates.brickType });
  if (updates.remarks !== undefined && updates.remarks !== entry.remarks) changes.push({ field: 'remarks', oldValue: entry.remarks, newValue: updates.remarks });

  if (changes.length === 0) return res.status(400).json({ error: 'No changes detected' });

  await logEdit(req.user!.clientId, req.user!.id, req.user!.name, req.user!.role, 'dispatch', entry.id, changes, reason);

  const data: any = {};
  if (updates.quantity !== undefined) { data.quantity = +updates.quantity; data.amount = +updates.quantity * (updates.rate ? +updates.rate : entry.rate); data.balanceDue = data.amount - entry.amountReceived; }
  if (updates.rate !== undefined) { data.rate = +updates.rate; data.amount = (updates.quantity ? +updates.quantity : entry.quantity) * +updates.rate; data.balanceDue = data.amount - entry.amountReceived; }
  if (updates.truckNo) data.truckNo = updates.truckNo;
  if (updates.brickType) data.brickType = updates.brickType;
  if (updates.remarks !== undefined) data.remarks = updates.remarks;

  const updated = await prisma.dispatch.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

// PATCH /api/edit/expenditure/:id
router.patch('/expenditure/:id', async (req: AuthRequest, res: Response) => {
  const { reason, ...updates } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason is required for editing' });

  const entry = await prisma.expenditure.findUnique({ where: { id: req.params.id } });
  if (!entry) return res.status(404).json({ error: 'Not found' });

  const check = canEdit(req.user!.role, entry.createdAt);
  if (!check.allowed) return res.status(403).json({ error: check.message });

  const changes: any[] = [];
  if (updates.amount !== undefined && +updates.amount !== entry.amount) changes.push({ field: 'amount', oldValue: entry.amount, newValue: updates.amount });
  if (updates.category && updates.category !== entry.category) changes.push({ field: 'category', oldValue: entry.category, newValue: updates.category });
  if (updates.description !== undefined && updates.description !== entry.description) changes.push({ field: 'description', oldValue: entry.description, newValue: updates.description });
  if (updates.paidTo !== undefined && updates.paidTo !== entry.paidTo) changes.push({ field: 'paidTo', oldValue: entry.paidTo, newValue: updates.paidTo });

  if (changes.length === 0) return res.status(400).json({ error: 'No changes detected' });

  await logEdit(req.user!.clientId, req.user!.id, req.user!.name, req.user!.role, 'expenditure', entry.id, changes, reason);

  const data: any = { updatedAt: new Date() };
  if (updates.amount !== undefined) data.amount = +updates.amount;
  if (updates.category) data.category = updates.category;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.paidTo !== undefined) data.paidTo = updates.paidTo;

  const updated = await prisma.expenditure.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

// PATCH /api/edit/fuel/:id
router.patch('/fuel/:id', async (req: AuthRequest, res: Response) => {
  const { reason, ...updates } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason is required for editing' });

  const entry = await prisma.fuelEntry.findUnique({ where: { id: req.params.id } });
  if (!entry) return res.status(404).json({ error: 'Not found' });

  const check = canEdit(req.user!.role, entry.createdAt);
  if (!check.allowed) return res.status(403).json({ error: check.message });

  const changes: any[] = [];
  if (updates.quantity !== undefined && +updates.quantity !== entry.quantity) changes.push({ field: 'quantity', oldValue: entry.quantity, newValue: updates.quantity });
  if (updates.rate !== undefined && +updates.rate !== entry.rate) changes.push({ field: 'rate', oldValue: entry.rate, newValue: updates.rate });
  if (updates.fuelType && updates.fuelType !== entry.fuelType) changes.push({ field: 'fuelType', oldValue: entry.fuelType, newValue: updates.fuelType });

  if (changes.length === 0) return res.status(400).json({ error: 'No changes detected' });

  await logEdit(req.user!.clientId, req.user!.id, req.user!.name, req.user!.role, 'fuel', entry.id, changes, reason);

  const data: any = {};
  if (updates.quantity !== undefined) { data.quantity = +updates.quantity; data.totalCost = +updates.quantity * (updates.rate ? +updates.rate : entry.rate); }
  if (updates.rate !== undefined) { data.rate = +updates.rate; data.totalCost = (updates.quantity ? +updates.quantity : entry.quantity) * +updates.rate; }
  if (updates.fuelType) data.fuelType = updates.fuelType;

  const updated = await prisma.fuelEntry.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

// GET /api/edit/history — Edit history (Owner/Manager only)
router.get('/history', async (req: AuthRequest, res: Response) => {
  if (!['OWNER', 'MANAGER'].includes(req.user!.role)) return res.status(403).json({ error: 'Only Owner/Manager can view edit history' });

  const { module, page = '1' } = req.query;
  const where: any = { clientId: req.user!.clientId };
  if (module) where.module = module;

  const [logs, total] = await Promise.all([
    prisma.editLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (parseInt(page as string) - 1) * 50, take: 50 }),
    prisma.editLog.count({ where }),
  ]);

  res.json({ logs, total, totalPages: Math.ceil(total / 50) });
});

// GET /api/edit/can-edit/:module/:id — Check if user can edit this entry
router.get('/can-edit/:module/:id', async (req: AuthRequest, res: Response) => {
  const { module, id } = req.params;
  let createdAt: Date | null = null;

  if (module === 'production') { const e = await prisma.productionEntry.findUnique({ where: { id } }); createdAt = e?.createdAt || null; }
  else if (module === 'dispatch') { const e = await prisma.dispatch.findUnique({ where: { id } }); createdAt = e?.createdAt || null; }
  else if (module === 'expenditure') { const e = await prisma.expenditure.findUnique({ where: { id } }); createdAt = e?.createdAt || null; }
  else if (module === 'fuel') { const e = await prisma.fuelEntry.findUnique({ where: { id } }); createdAt = e?.createdAt || null; }

  if (!createdAt) return res.status(404).json({ error: 'Not found' });

  const check = canEdit(req.user!.role, createdAt);
  res.json(check);
});

export default router;
