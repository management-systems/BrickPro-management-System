import { Router, Response } from 'express';
import prisma from '../../common/prisma';
import { authenticate, AuthRequest } from '../../common/middleware';

const router = Router();
router.use(authenticate);

// GET /api/reports/stock — Brick stock per type (production - dispatched)
router.get('/stock', async (req: AuthRequest, res: Response) => {
  const { factoryId } = req.query;
  const factories = await prisma.factory.findMany({ where: { clientId: req.user!.clientId } });
  const fIds = factoryId ? [factoryId as string] : factories.map(f => f.id);

  const [productions, dispatches] = await Promise.all([
    prisma.productionEntry.findMany({ where: { factoryId: { in: fIds } }, select: { brickType: true, firedCount: true } }),
    prisma.dispatch.findMany({ where: { factoryId: { in: fIds } }, select: { brickType: true, quantity: true } }),
  ]);

  const stock: Record<string, { produced: number; sold: number; stock: number }> = {};
  productions.forEach(p => {
    if (!stock[p.brickType]) stock[p.brickType] = { produced: 0, sold: 0, stock: 0 };
    stock[p.brickType].produced += p.firedCount;
  });
  dispatches.forEach(d => {
    if (!stock[d.brickType]) stock[d.brickType] = { produced: 0, sold: 0, stock: 0 };
    stock[d.brickType].sold += d.quantity;
  });
  Object.keys(stock).forEach(k => { stock[k].stock = stock[k].produced - stock[k].sold; });

  res.json(stock);
});

router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  const { factoryId } = req.query;
  const factories = await prisma.factory.findMany({ where: { clientId: req.user!.clientId } });
  const fIds = factoryId ? [factoryId as string] : factories.map(f => f.id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [monthProduction, monthRevenue, totalOutstanding, labourCount, monthExpenses] = await Promise.all([
    prisma.productionEntry.aggregate({ where: { factoryId: { in: fIds }, date: { gte: monthStart } }, _sum: { firedCount: true } }),
    prisma.dispatch.aggregate({ where: { factoryId: { in: fIds }, date: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.dispatch.aggregate({ where: { factoryId: { in: fIds }, balanceDue: { gt: 0 } }, _sum: { balanceDue: true } }),
    prisma.labour.count({ where: { factoryId: { in: fIds }, active: true } }),
    prisma.expenditure.aggregate({ where: { factoryId: { in: fIds }, date: { gte: monthStart } }, _sum: { amount: true } }),
  ]);

  res.json({
    todayProduction: monthProduction._sum.firedCount || 0,
    monthProduction: monthProduction._sum.firedCount || 0,
    monthRevenue: monthRevenue._sum.amount || 0,
    totalOutstanding: totalOutstanding._sum.balanceDue || 0,
    totalLabour: labourCount,
    monthExpenses: monthExpenses._sum.amount || 0,
    factories: factories.length,
  });
});

// GET /api/reports/calendar?date=2026-05-15 OR ?from=2026-05-10&to=2026-05-20
router.get('/calendar', async (req: AuthRequest, res: Response) => {
  const { factoryId } = req.query;
  const factories = await prisma.factory.findMany({ where: { clientId: req.user!.clientId } });
  const fIds = factoryId ? [factoryId as string] : factories.map(f => f.id);
  const { date, from, to, month, year } = req.query;

  // Single date
  if (date) {
    const d = new Date(date as string);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

    const [production, dispatches, expenditures, fuel] = await Promise.all([
      prisma.productionEntry.findMany({ where: { factoryId: { in: fIds }, date: { gte: start, lt: end } } }),
      prisma.dispatch.findMany({ where: { factoryId: { in: fIds }, date: { gte: start, lt: end } }, include: { customer: { select: { name: true } } } }),
      prisma.expenditure.findMany({ where: { factoryId: { in: fIds }, date: { gte: start, lt: end } } }),
      prisma.fuelEntry.findMany({ where: { factoryId: { in: fIds }, date: { gte: start, lt: end } } }),
    ]);

    return res.json({
      date: start.toISOString(),
      production,
      dispatches,
      expenditures,
      fuel,
      summary: {
        totalBricks: production.reduce((s, p) => s + (p.firedCount || p.rawCount), 0),
        totalSales: dispatches.reduce((s, d) => s + d.amount, 0),
        totalExpenses: expenditures.reduce((s, e) => s + e.amount, 0),
        totalFuel: fuel.reduce((s, f) => s + f.totalCost, 0),
        dispatchCount: dispatches.length,
      },
    });
  }

  // Date range
  if (from && to) {
    const start = new Date(from as string);
    const end = new Date(to as string);
    end.setDate(end.getDate() + 1);

    const [production, dispatches, expenditures, fuel] = await Promise.all([
      prisma.productionEntry.aggregate({ where: { factoryId: { in: fIds }, date: { gte: start, lt: end } }, _sum: { firedCount: true, rawCount: true } }),
      prisma.dispatch.findMany({ where: { factoryId: { in: fIds }, date: { gte: start, lt: end } }, include: { customer: { select: { name: true } } } }),
      prisma.expenditure.findMany({ where: { factoryId: { in: fIds }, date: { gte: start, lt: end } } }),
      prisma.fuelEntry.aggregate({ where: { factoryId: { in: fIds }, date: { gte: start, lt: end } }, _sum: { totalCost: true } }),
    ]);

    const totalSales = dispatches.reduce((s, d) => s + d.amount, 0);
    const totalReceived = dispatches.reduce((s, d) => s + d.amountReceived, 0);
    const totalExpenses = expenditures.reduce((s, e) => s + e.amount, 0);

    const expByCategory: Record<string, number> = {};
    expenditures.forEach(e => { expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount; });

    const custSales: Record<string, number> = {};
    dispatches.forEach(d => { const n = d.customer?.name || 'Unknown'; custSales[n] = (custSales[n] || 0) + d.amount; });
    const topCustomers = Object.entries(custSales).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, amount]) => ({ name, amount }));

    return res.json({
      from: start.toISOString(), to: end.toISOString(),
      summary: {
        totalBricks: (production._sum.firedCount || 0),
        totalSales,
        totalReceived,
        totalPending: totalSales - totalReceived,
        totalExpenses,
        totalFuel: fuel._sum.totalCost || 0,
        netProfit: totalSales - totalExpenses,
        dispatchCount: dispatches.length,
      },
      expByCategory,
      topCustomers,
    });
  }

  // Month overview — which dates have activity (dots on calendar)
  const m = parseInt(month as string || String(new Date().getMonth() + 1));
  const y = parseInt(year as string || String(new Date().getFullYear()));
  const mStart = new Date(y, m - 1, 1);
  const mEnd = new Date(y, m, 1);

  const [prodDates, dispDates, expDates] = await Promise.all([
    prisma.productionEntry.findMany({ where: { factoryId: { in: fIds }, date: { gte: mStart, lt: mEnd } }, select: { date: true, firedCount: true } }),
    prisma.dispatch.findMany({ where: { factoryId: { in: fIds }, date: { gte: mStart, lt: mEnd } }, select: { date: true, amount: true } }),
    prisma.expenditure.findMany({ where: { factoryId: { in: fIds }, date: { gte: mStart, lt: mEnd } }, select: { date: true, amount: true } }),
  ]);

  // Group by date
  const dateMap: Record<string, { production: number; sales: number; expenses: number }> = {};
  prodDates.forEach(p => { const k = p.date.toISOString().slice(0, 10); if (!dateMap[k]) dateMap[k] = { production: 0, sales: 0, expenses: 0 }; dateMap[k].production += p.firedCount; });
  dispDates.forEach(d => { const k = d.date.toISOString().slice(0, 10); if (!dateMap[k]) dateMap[k] = { production: 0, sales: 0, expenses: 0 }; dateMap[k].sales += d.amount; });
  expDates.forEach(e => { const k = e.date.toISOString().slice(0, 10); if (!dateMap[k]) dateMap[k] = { production: 0, sales: 0, expenses: 0 }; dateMap[k].expenses += e.amount; });

  res.json({ month: m, year: y, dates: dateMap });
});

// GET /api/reports/notifications — User's notifications (unread only by default)
router.get('/notifications', async (req: AuthRequest, res: Response) => {
  const showAll = req.query.all === 'true';
  const notifications = await prisma.notification.findMany({
    where: {
      OR: [{ clientId: req.user!.clientId }, { clientId: null }],
      ...(showAll ? {} : { read: false }),
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  res.json(notifications);
});

// PATCH /api/reports/notifications/:id/read
router.patch('/notifications/:id/read', async (req: AuthRequest, res: Response) => {
  await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
  res.json({ message: 'Marked read' });
});

// GET /api/reports/charts — User's own charts data (last 12 months)
router.get('/charts', async (req: AuthRequest, res: Response) => {
  const { factoryId } = req.query;
  const factories = await prisma.factory.findMany({ where: { clientId: req.user!.clientId } });
  const fIds = factoryId ? [factoryId as string] : factories.map(f => f.id);
  const now = new Date();

  // Last 12 months
  const monthly: any[] = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = start.toLocaleString('en', { month: 'short', year: '2-digit' });

    const [revenue, expenses, production, dispatchCount] = await Promise.all([
      prisma.dispatch.aggregate({ _sum: { amount: true }, where: { factoryId: { in: fIds }, date: { gte: start, lt: end } } }),
      prisma.expenditure.aggregate({ _sum: { amount: true }, where: { factoryId: { in: fIds }, date: { gte: start, lt: end } } }),
      prisma.productionEntry.aggregate({ _sum: { firedCount: true }, where: { factoryId: { in: fIds }, date: { gte: start, lt: end } } }),
      prisma.dispatch.count({ where: { factoryId: { in: fIds }, date: { gte: start, lt: end } } }),
    ]);

    monthly.push({
      month: label,
      revenue: revenue._sum.amount || 0,
      expenses: expenses._sum.amount || 0,
      profit: (revenue._sum.amount || 0) - (expenses._sum.amount || 0),
      production: production._sum.firedCount || 0,
      dispatches: dispatchCount,
    });
  }

  // Expense by category
  const allExp = await prisma.expenditure.findMany({ where: { factoryId: { in: fIds } }, select: { category: true, amount: true } });
  const expByCategory: Record<string, number> = {};
  allExp.forEach(e => { expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount; });
  const expenseByCategory = Object.entries(expByCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Payment status
  const [paid, partial, credit] = await Promise.all([
    prisma.dispatch.count({ where: { factoryId: { in: fIds }, paymentStatus: 'PAID' } }),
    prisma.dispatch.count({ where: { factoryId: { in: fIds }, paymentStatus: 'PARTIAL' } }),
    prisma.dispatch.count({ where: { factoryId: { in: fIds }, paymentStatus: 'CREDIT' } }),
  ]);

  // Brick types produced
  const prodEntries = await prisma.productionEntry.findMany({ where: { factoryId: { in: fIds } }, select: { brickType: true, firedCount: true } });
  const brickTypeMap: Record<string, number> = {};
  prodEntries.forEach(p => { brickTypeMap[p.brickType] = (brickTypeMap[p.brickType] || 0) + p.firedCount; });
  const brickTypes = Object.entries(brickTypeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Top customers
  const customers = await prisma.customer.findMany({ where: { clientId: req.user!.clientId } });
  const custDispatches = await prisma.dispatch.findMany({ where: { factoryId: { in: fIds } }, select: { customerId: true, amount: true, balanceDue: true } });
  const custMap: Record<string, { name: string; revenue: number; pending: number }> = {};
  customers.forEach(c => { custMap[c.id] = { name: c.name, revenue: 0, pending: 0 }; });
  custDispatches.forEach(d => { if (custMap[d.customerId]) { custMap[d.customerId].revenue += d.amount; custMap[d.customerId].pending += d.balanceDue; } });
  const topCustomers = Object.values(custMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  res.json({ monthly, expenseByCategory, paymentStatus: [{ name: 'Paid', value: paid }, { name: 'Partial', value: partial }, { name: 'Credit', value: credit }], brickTypes, topCustomers });
});

export default router;
