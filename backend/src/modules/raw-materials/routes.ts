import { Router, Response } from 'express';
import prisma from '../../common/prisma';
import { authenticate, AuthRequest } from '../../common/middleware';

const router = Router();
router.use(authenticate);

// === Raw Materials Master ===
router.get('/materials', async (req: AuthRequest, res: Response) => {
  const materials = await prisma.rawMaterial.findMany({ where: { clientId: req.user!.clientId }, orderBy: { name: 'asc' } });
  res.json(materials);
});

router.post('/materials', async (req: AuthRequest, res: Response) => {
  const material = await prisma.rawMaterial.create({ data: { ...req.body, clientId: req.user!.clientId } });
  res.status(201).json(material);
});

router.put('/materials/:id', async (req: AuthRequest, res: Response) => {
  const material = await prisma.rawMaterial.update({ where: { id: req.params.id }, data: req.body });
  res.json(material);
});

router.patch('/materials/:id/toggle', async (req: AuthRequest, res: Response) => {
  const material = await prisma.rawMaterial.findUnique({ where: { id: req.params.id } });
  if (!material) return res.status(404).json({ error: 'Not found' });
  const updated = await prisma.rawMaterial.update({ where: { id: req.params.id }, data: { active: !material.active } });
  res.json(updated);
});

router.delete('/materials/:id', async (req: AuthRequest, res: Response) => {
  await prisma.rawMaterial.update({ where: { id: req.params.id }, data: { active: false } });
  res.json({ message: 'Deactivated' });
});

// === Suppliers ===
router.get('/suppliers', async (req: AuthRequest, res: Response) => {
  const suppliers = await prisma.supplier.findMany({ where: { clientId: req.user!.clientId }, orderBy: { name: 'asc' } });
  res.json(suppliers);
});

router.post('/suppliers', async (req: AuthRequest, res: Response) => {
  const supplier = await prisma.supplier.create({ data: { ...req.body, clientId: req.user!.clientId } });
  res.status(201).json(supplier);
});

router.put('/suppliers/:id', async (req: AuthRequest, res: Response) => {
  const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
  res.json(supplier);
});

// === Purchases ===
router.get('/purchases', async (req: AuthRequest, res: Response) => {
  const { factoryId } = req.query;
  const factories = await prisma.factory.findMany({ where: { clientId: req.user!.clientId } });
  const fIds = factoryId ? [factoryId as string] : factories.map(f => f.id);
  const purchases = await prisma.rawMaterialPurchase.findMany({
    where: { factoryId: { in: fIds } },
    include: { material: { select: { id: true, name: true, unit: true } }, supplier: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' },
    take: 200,
  });
  res.json(purchases);
});

router.post('/purchases', async (req: AuthRequest, res: Response) => {
  const { factoryId, materialId, supplierId, date, quantity, rate, invoiceNo, paymentStatus, paymentTerms, amountPaid, fileUrl } = req.body;
  const totalCost = quantity * rate;
  const balanceDue = totalCost - (amountPaid || 0);
  const status = amountPaid >= totalCost ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : (paymentStatus || 'CREDIT');

  // Track price change
  const lastPurchase = await prisma.rawMaterialPurchase.findFirst({
    where: { materialId, supplierId },
    orderBy: { date: 'desc' },
  });
  if (lastPurchase && lastPurchase.rate !== rate) {
    await prisma.rawMaterialPriceHistory.create({
      data: { materialId, oldRate: lastPurchase.rate, newRate: rate, effectiveFrom: new Date(date), changedBy: req.user!.id },
    });
  }

  const purchase = await prisma.rawMaterialPurchase.create({
    data: { factoryId, materialId, supplierId, date: new Date(date), quantity, rate, totalCost, invoiceNo, paymentStatus: status, paymentTerms: paymentTerms || null, amountPaid: amountPaid || 0, balanceDue: Math.max(0, balanceDue), fileUrl, enteredBy: req.user!.id },
  });
  res.status(201).json(purchase);
});

// PATCH /api/raw-materials/purchases/:id/payment — Record partial payment
router.patch('/purchases/:id/payment', async (req: AuthRequest, res: Response) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'amount required' });

  const purchase = await prisma.rawMaterialPurchase.findUnique({ where: { id: req.params.id } });
  if (!purchase) return res.status(404).json({ error: 'Not found' });

  const newPaid = purchase.amountPaid + amount;
  const newBalance = purchase.totalCost - newPaid;
  const status = newBalance <= 0 ? 'PAID' : 'PARTIAL';

  const updated = await prisma.rawMaterialPurchase.update({
    where: { id: req.params.id },
    data: { amountPaid: newPaid, balanceDue: Math.max(0, newBalance), paymentStatus: status },
  });
  res.json(updated);
});

// === Consumption ===
router.post('/consumption', async (req: AuthRequest, res: Response) => {
  const { factoryId, materialId, date, quantity } = req.body;
  const consumption = await prisma.rawMaterialConsumption.create({
    data: { factoryId, materialId, date: new Date(date), quantity, enteredBy: req.user!.id },
  });
  res.status(201).json(consumption);
});

// === Stock (calculated) ===
router.get('/stock', async (req: AuthRequest, res: Response) => {
  const { factoryId } = req.query;
  const factories = await prisma.factory.findMany({ where: { clientId: req.user!.clientId } });
  const fIds = factoryId ? [factoryId as string] : factories.map(f => f.id);

  const materials = await prisma.rawMaterial.findMany({ where: { clientId: req.user!.clientId, active: true } });
  const stock = await Promise.all(
    materials.map(async (m) => {
      const purchased = await prisma.rawMaterialPurchase.aggregate({ where: { materialId: m.id, factoryId: { in: fIds } }, _sum: { quantity: true } });
      const consumed = await prisma.rawMaterialConsumption.aggregate({ where: { materialId: m.id, factoryId: { in: fIds } }, _sum: { quantity: true } });
      const currentStock = (purchased._sum.quantity || 0) - (consumed._sum.quantity || 0);
      return { ...m, currentStock, lowStock: m.lowStockThreshold ? currentStock <= m.lowStockThreshold : false };
    })
  );
  res.json(stock);
});

// === Price History ===
router.get('/price-history/:materialId', async (req: AuthRequest, res: Response) => {
  const history = await prisma.rawMaterialPriceHistory.findMany({
    where: { materialId: req.params.materialId },
    orderBy: { effectiveFrom: 'desc' },
  });
  res.json(history);
});

export default router;
