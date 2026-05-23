const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const ids = JSON.parse(fs.readFileSync('prisma/seed-ids.json', 'utf8'));

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Generate dates for last 2 months (approx 60 days)
function getDates() {
  const dates = [];
  const now = new Date();
  for (let i = 60; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dates.push(d);
  }
  return dates;
}

async function seed() {
  console.log('Step 3: Production, Dispatches, Fuel, Labour, Attendance...');
  const dates = getDates();
  const shifts = ['MORNING', 'EVENING', 'NIGHT'];
  const brickTypes1 = ['Red Brick (1st Class)', 'Red Brick (2nd Class)', 'Fly Ash Brick'];
  const brickTypes2 = ['Red Brick (A Grade)', 'Red Brick (B Grade)', 'Clay Brick'];
  const factories = [
    { id: ids.f1a, bricks: brickTypes1, enteredBy: ids.u3 || 'system' },
    { id: ids.f1b, bricks: brickTypes1, enteredBy: ids.u4 || 'system' },
    { id: ids.f2a, bricks: brickTypes2, enteredBy: ids.u6 || 'system' },
    { id: ids.f2b, bricks: brickTypes2, enteredBy: ids.u8 || 'system' },
  ];

  // PRODUCTION - 3 entries per day per factory
  console.log('  Creating production entries...');
  const prodData = [];
  for (const f of factories) {
    for (const date of dates) {
      for (let i = 0; i < 3; i++) {
        const raw = randomInt(3000, 8000);
        const fired = randomInt(2500, raw - 200);
        prodData.push({
          factoryId: f.id, date, brickType: f.bricks[i % 3], shift: shifts[i],
          rawCount: raw, firedCount: fired, scrapCount: randomInt(50, 300),
          enteredBy: f.enteredBy,
        });
      }
    }
  }
  await prisma.productionEntry.createMany({ data: prodData });
  console.log(`  ✓ ${prodData.length} production entries`);

  // DISPATCHES - ~3 per day per factory (every 2 days to keep realistic)
  console.log('  Creating dispatches...');
  let challanCounter = 1000;
  const dispatchData = [];
  const truckNos = ['HR55A1234', 'HR55B5678', 'RJ14C9012', 'RJ14D3456', 'HR26E7890', 'RJ27F2345'];
  const drivers = ['Raju', 'Pappu', 'Kalu', 'Bhola', 'Sonu', 'Monu'];

  for (const date of dates) {
    // Client 1 factories
    for (let i = 0; i < 3; i++) {
      const qty = randomInt(3000, 8000);
      const rate = randomPick([7, 7.5, 8, 8.5]);
      const amount = qty * rate;
      const received = Math.random() > 0.3 ? randomInt(Math.floor(amount * 0.5), amount) : 0;
      dispatchData.push({
        factoryId: randomPick([ids.f1a, ids.f1b]), customerId: randomPick(ids.c1Customers), date,
        truckNo: randomPick(truckNos), driverName: randomPick(drivers), driverMobile: '98' + randomInt(10000000, 99999999),
        brickType: randomPick(brickTypes1), quantity: qty, rate, amount,
        challanNo: `SH-${challanCounter++}`,
        paymentStatus: received >= amount ? 'PAID' : received > 0 ? 'PARTIAL' : 'CREDIT',
        amountReceived: received, balanceDue: amount - received, enteredBy: ids.u2 || 'system',
      });
    }
    // Client 2 factories
    for (let i = 0; i < 3; i++) {
      const qty = randomInt(4000, 10000);
      const rate = randomPick([6.5, 7, 7.5, 8]);
      const amount = qty * rate;
      const received = Math.random() > 0.3 ? randomInt(Math.floor(amount * 0.5), amount) : 0;
      dispatchData.push({
        factoryId: randomPick([ids.f2a, ids.f2b]), customerId: randomPick(ids.c2Customers), date,
        truckNo: randomPick(truckNos), driverName: randomPick(drivers), driverMobile: '98' + randomInt(10000000, 99999999),
        brickType: randomPick(brickTypes2), quantity: qty, rate, amount,
        challanNo: `GU-${challanCounter++}`,
        paymentStatus: received >= amount ? 'PAID' : received > 0 ? 'PARTIAL' : 'CREDIT',
        amountReceived: received, balanceDue: amount - received, enteredBy: ids.u6 || 'system',
      });
    }
  }
  await prisma.dispatch.createMany({ data: dispatchData });
  console.log(`  ✓ ${dispatchData.length} dispatches`);

  // FUEL ENTRIES - every 3-4 days per factory
  console.log('  Creating fuel entries...');
  const fuelData = [];
  const fuelTypes = ['Coal', 'Wood', 'Diesel'];
  for (const f of factories) {
    for (let i = 0; i < dates.length; i += randomInt(3, 5)) {
      const fuelType = randomPick(fuelTypes);
      const qty = fuelType === 'Coal' ? randomInt(5, 20) : fuelType === 'Wood' ? randomInt(2, 10) : randomInt(50, 200);
      const unit = fuelType === 'Diesel' ? 'litre' : 'ton';
      const rate = fuelType === 'Coal' ? randomInt(8000, 12000) : fuelType === 'Wood' ? randomInt(4000, 6000) : randomInt(85, 95);
      fuelData.push({
        factoryId: f.id, date: dates[i], fuelType, quantity: qty, unit, rate, totalCost: qty * rate,
        supplier: randomPick(['Balaji Fuels', 'RCA Fuels', 'Local Dealer']),
        enteredBy: f.enteredBy,
      });
    }
  }
  await prisma.fuelEntry.createMany({ data: fuelData });
  console.log(`  ✓ ${fuelData.length} fuel entries`);

  // LABOUR - 5 per factory
  console.log('  Creating labour...');
  const labourNames = ['Ramu', 'Shyamu', 'Gopal', 'Hari', 'Mohan', 'Sohan', 'Kishan', 'Lakhan', 'Bhagwan', 'Tulsi',
    'Chhotu', 'Bablu', 'Pappu', 'Kallu', 'Munna', 'Guddu', 'Pintu', 'Rinku', 'Tinku', 'Chintu'];
  const labourTypes = ['PERMANENT', 'DAILY', 'PER_BRICK'];
  const allLabour = [];

  for (const fId of [ids.f1a, ids.f1b, ids.f2a, ids.f2b]) {
    for (let i = 0; i < 5; i++) {
      const type = labourTypes[i % 3];
      const l = await prisma.labour.create({
        data: {
          factoryId: fId, name: labourNames.shift() || `Worker ${i}`, mobile: '97' + randomInt(10000000, 99999999),
          type, dailyRate: type === 'DAILY' ? randomInt(400, 600) : null,
          monthlySalary: type === 'PERMANENT' ? randomInt(12000, 18000) : null,
          perBrickRate: type === 'PER_BRICK' ? randomInt(1, 3) * 0.5 : null,
          joiningDate: new Date('2025-01-01'), active: true,
        }
      });
      allLabour.push(l);
    }
  }
  console.log(`  ✓ ${allLabour.length} labourers`);

  // ATTENDANCE - daily for all labour
  console.log('  Creating attendance...');
  const attData = [];
  const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'HALF']; // 67% present
  for (const l of allLabour) {
    for (const date of dates) {
      if (date.getDay() === 0) continue; // Skip Sundays
      attData.push({
        labourId: l.id, date, status: randomPick(statuses), workType: 'brick_making', enteredBy: 'system',
      });
    }
  }
  await prisma.attendance.createMany({ data: attData });
  console.log(`  ✓ ${attData.length} attendance records`);

  // LABOUR PAYMENTS - 2 per labour (monthly)
  console.log('  Creating labour payments...');
  const lpData = [];
  for (const l of allLabour) {
    const amt = l.monthlySalary || (l.dailyRate ? l.dailyRate * 26 : 8000);
    lpData.push({ labourId: l.id, amount: amt, date: new Date('2026-04-01'), mode: 'cash' });
    lpData.push({ labourId: l.id, amount: amt, date: new Date('2026-05-01'), mode: randomPick(['cash', 'upi', 'bank']) });
  }
  await prisma.labourPayment.createMany({ data: lpData });
  console.log(`  ✓ ${lpData.length} labour payments`);

  // Save labour IDs
  ids.allLabour = allLabour.map(l => l.id);
  fs.writeFileSync('prisma/seed-ids.json', JSON.stringify(ids));
  console.log('✅ Step 3 done!');
}

seed().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });
