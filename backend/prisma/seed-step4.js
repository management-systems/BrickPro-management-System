const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const ids = JSON.parse(fs.readFileSync('prisma/seed-ids.json', 'utf8'));

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getDates() {
  const dates = [];
  const now = new Date();
  for (let i = 60; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    dates.push(d);
  }
  return dates;
}

async function seed() {
  console.log('Step 4: Raw Material Purchases, Consumption, Expenditures, Payments...');
  const dates = getDates();

  // RAW MATERIAL PURCHASES - every 5-7 days per factory
  console.log('  Creating raw material purchases...');
  const purchaseData = [];
  const factoryMaterials = [
    { fId: ids.f1a, materials: ids.rm1, suppliers: ids.s1 },
    { fId: ids.f1b, materials: ids.rm1, suppliers: ids.s1 },
    { fId: ids.f2a, materials: ids.rm2, suppliers: ids.s2 },
    { fId: ids.f2b, materials: ids.rm2, suppliers: ids.s2 },
  ];

  for (const fm of factoryMaterials) {
    for (let i = 0; i < dates.length; i += randomInt(5, 7)) {
      for (const matId of fm.materials) {
        const qty = randomInt(3, 15);
        const rate = randomInt(1500, 5000);
        const total = qty * rate;
        const paid = Math.random() > 0.4 ? total : randomInt(0, Math.floor(total * 0.7));
        purchaseData.push({
          factoryId: fm.fId, materialId: matId, supplierId: randomPick(fm.suppliers),
          date: dates[i], quantity: qty, rate, totalCost: total,
          invoiceNo: `INV-${randomInt(10000, 99999)}`,
          paymentStatus: paid >= total ? 'PAID' : paid > 0 ? 'PARTIAL' : 'CREDIT',
          amountPaid: paid, balanceDue: total - paid, enteredBy: 'system',
        });
      }
    }
  }
  await prisma.rawMaterialPurchase.createMany({ data: purchaseData });
  console.log(`  ✓ ${purchaseData.length} raw material purchases`);

  // RAW MATERIAL CONSUMPTION - daily per factory
  console.log('  Creating raw material consumption...');
  const consumeData = [];
  for (const fm of factoryMaterials) {
    for (const date of dates) {
      if (date.getDay() === 0) continue;
      const matId = randomPick(fm.materials);
      consumeData.push({
        factoryId: fm.fId, materialId: matId, date, quantity: randomInt(1, 5), enteredBy: 'system',
      });
    }
  }
  await prisma.rawMaterialConsumption.createMany({ data: consumeData });
  console.log(`  ✓ ${consumeData.length} consumption records`);

  // RAW MATERIAL PRICE HISTORY
  console.log('  Creating price history...');
  const priceData = [];
  for (const matId of [...ids.rm1, ...ids.rm2]) {
    priceData.push({ materialId: matId, oldRate: 2000, newRate: 2500, effectiveFrom: new Date('2026-03-15'), changedBy: 'system' });
    priceData.push({ materialId: matId, oldRate: 2500, newRate: 3000, effectiveFrom: new Date('2026-04-20'), changedBy: 'system' });
    priceData.push({ materialId: matId, oldRate: 3000, newRate: 2800, effectiveFrom: new Date('2026-05-10'), changedBy: 'system' });
  }
  await prisma.rawMaterialPriceHistory.createMany({ data: priceData });
  console.log(`  ✓ ${priceData.length} price history records`);

  // EXPENDITURES - 3 per day per factory (various categories)
  console.log('  Creating expenditures...');
  const expData = [];
  const categories = ['Electricity', 'Diesel', 'Repair & Maintenance', 'Transport', 'Miscellaneous', 'Water', 'Office', 'Labour Advance', 'Loading/Unloading'];
  const payModes = ['cash', 'upi', 'bank', 'cheque'];

  for (const fId of [ids.f1a, ids.f1b, ids.f2a, ids.f2b]) {
    for (const date of dates) {
      for (let i = 0; i < 3; i++) {
        const cat = randomPick(categories);
        const amount = cat === 'Electricity' ? randomInt(5000, 15000) :
                       cat === 'Diesel' ? randomInt(2000, 8000) :
                       cat === 'Repair & Maintenance' ? randomInt(1000, 10000) :
                       cat === 'Transport' ? randomInt(1500, 5000) :
                       randomInt(500, 3000);
        expData.push({
          factoryId: fId, date, category: cat, amount,
          description: `${cat} expense`, paymentMode: randomPick(payModes),
          paidTo: randomPick(['Local vendor', 'Electrician', 'Mechanic', 'Driver', 'Office']),
          enteredBy: 'system',
        });
      }
    }
  }
  await prisma.expenditure.createMany({ data: expData });
  console.log(`  ✓ ${expData.length} expenditure entries`);

  // PLATFORM PAYMENTS (SaaS subscription payments)
  console.log('  Creating platform payments...');
  await prisma.payment.createMany({ data: [
    { clientId: ids.client1, amount: 2999, month: 'Mar', year: 2026, status: 'collected', collectedAt: new Date('2026-03-05') },
    { clientId: ids.client1, amount: 2999, month: 'Apr', year: 2026, status: 'collected', collectedAt: new Date('2026-04-03') },
    { clientId: ids.client1, amount: 2999, month: 'May', year: 2026, status: 'pending' },
    { clientId: ids.client2, amount: 1999, month: 'Mar', year: 2026, status: 'collected', collectedAt: new Date('2026-03-10') },
    { clientId: ids.client2, amount: 1999, month: 'Apr', year: 2026, status: 'collected', collectedAt: new Date('2026-04-08') },
    { clientId: ids.client2, amount: 1999, month: 'May', year: 2026, status: 'pending' },
  ]});
  console.log('  ✓ 6 platform payments');

  // LABOUR PRODUCTION entries
  console.log('  Creating labour production...');
  const lprodData = [];
  const allLabour = ids.allLabour || [];
  for (const lId of allLabour.slice(0, 10)) { // first 10 labourers
    for (let i = 0; i < dates.length; i += randomInt(2, 4)) {
      if (dates[i].getDay() === 0) continue;
      const qty = randomInt(500, 2000);
      const rate = 0.5 + Math.random() * 1.5;
      lprodData.push({
        labourId: lId, date: dates[i], brickType: randomPick(['Red Brick (1st Class)', 'Red Brick (A Grade)']),
        quantity: qty, rate: parseFloat(rate.toFixed(2)), amount: parseFloat((qty * rate).toFixed(2)), enteredBy: 'system',
      });
    }
  }
  await prisma.labourProduction.createMany({ data: lprodData });
  console.log(`  ✓ ${lprodData.length} labour production records`);

  console.log('\n✅ Step 4 done! ALL SEED DATA COMPLETE.');
  console.log('\n========================================');
  console.log('📋 LOGIN CREDENTIALS');
  console.log('========================================');
  console.log('\n🔴 SUPER ADMIN (http://localhost:3001)');
  console.log('   Email:    admin@brickpro.in');
  console.log('   Password: BrickPro@2024');
  console.log('\n🟢 CLIENT 1: Sharma Brick Industries');
  console.log('   ┌──────────────────┬──────────────┬────────────┬───────────┐');
  console.log('   │ Name             │ Mobile       │ Role       │ Password  │');
  console.log('   ├──────────────────┼──────────────┼────────────┼───────────┤');
  console.log('   │ Rajesh Sharma    │ 9876543210   │ OWNER      │ Pass@123  │');
  console.log('   │ Amit Kumar       │ 9876543211   │ MANAGER    │ Pass@123  │');
  console.log('   │ Suresh Yadav     │ 9876543212   │ SUPERVISOR │ Pass@123  │');
  console.log('   │ Ramesh Operator  │ 9876543213   │ OPERATOR   │ Pass@123  │');
  console.log('   └──────────────────┴──────────────┴────────────┴───────────┘');
  console.log('   Factories: Sharma Kiln - Rewari, Sharma Kiln - Bhiwani');
  console.log('\n🟡 CLIENT 2: Gupta Brick Works');
  console.log('   ┌──────────────────┬──────────────┬────────────┬───────────┐');
  console.log('   │ Name             │ Mobile       │ Role       │ Password  │');
  console.log('   ├──────────────────┼──────────────┼────────────┼───────────┤');
  console.log('   │ Vikram Gupta     │ 9988776655   │ OWNER      │ Pass@123  │');
  console.log('   │ Pradeep Singh    │ 9988776656   │ MANAGER    │ Pass@123  │');
  console.log('   │ Manoj Verma      │ 9988776657   │ ACCOUNTANT │ Pass@123  │');
  console.log('   │ Dinesh Worker    │ 9988776658   │ OPERATOR   │ Pass@123  │');
  console.log('   └──────────────────┴──────────────┴────────────┴───────────┘');
  console.log('   Factories: Gupta Bhatta - Jaipur, Gupta Bhatta - Alwar');
  console.log('\n📱 OTP LOGIN: Use any mobile number above → OTP shown in server console');
  console.log('========================================\n');
}

seed().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });
