const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  console.log('Step 1: Creating Super Admin, Clients, Factories, Users...');

  // Super Admin
  const adminPw = await bcrypt.hash('BrickPro@2024', 10);
  await prisma.superAdmin.create({
    data: { email: 'admin@brickpro.in', password: adminPw, name: 'Super Admin' }
  });

  // Client 1 - Sharma Brick Industries
  const client1 = await prisma.client.create({
    data: {
      name: 'Sharma Brick Industries',
      mobile: '9876543210',
      email: 'sharma@brickpro.in',
      plan: 'premium',
      trialEndsAt: new Date('2026-06-15'),
      subscriptionStatus: 'ACTIVE',
      active: true,
    }
  });

  // Client 2 - Gupta Brick Works
  const client2 = await prisma.client.create({
    data: {
      name: 'Gupta Brick Works',
      mobile: '9988776655',
      email: 'gupta@brickpro.in',
      plan: 'premium',
      trialEndsAt: new Date('2026-06-20'),
      subscriptionStatus: 'ACTIVE',
      active: true,
    }
  });

  // Factories for Client 1
  const f1a = await prisma.factory.create({ data: { clientId: client1.id, name: 'Sharma Kiln - Rewari', location: 'Rewari, Haryana', capacityPerDay: 25000 } });
  const f1b = await prisma.factory.create({ data: { clientId: client1.id, name: 'Sharma Kiln - Bhiwani', location: 'Bhiwani, Haryana', capacityPerDay: 20000 } });

  // Factories for Client 2
  const f2a = await prisma.factory.create({ data: { clientId: client2.id, name: 'Gupta Bhatta - Jaipur', location: 'Jaipur, Rajasthan', capacityPerDay: 30000 } });
  const f2b = await prisma.factory.create({ data: { clientId: client2.id, name: 'Gupta Bhatta - Alwar', location: 'Alwar, Rajasthan', capacityPerDay: 18000 } });

  const pw = await bcrypt.hash('Pass@123', 10);
  const pin = '1234';

  // Users for Client 1 (4 users)
  const u1 = await prisma.user.create({ data: { clientId: client1.id, name: 'Rajesh Sharma', mobile: '9876543210', email: 'rajesh@sharma.in', password: pw, plainPassword: 'Pass@123', pin, role: 'OWNER' } });
  const u2 = await prisma.user.create({ data: { clientId: client1.id, name: 'Amit Kumar', mobile: '9876543211', email: 'amit@sharma.in', password: pw, plainPassword: 'Pass@123', pin, role: 'MANAGER' } });
  const u3 = await prisma.user.create({ data: { clientId: client1.id, name: 'Suresh Yadav', mobile: '9876543212', email: 'suresh@sharma.in', password: pw, plainPassword: 'Pass@123', pin, role: 'SUPERVISOR' } });
  const u4 = await prisma.user.create({ data: { clientId: client1.id, name: 'Ramesh Operator', mobile: '9876543213', email: 'ramesh@sharma.in', password: pw, plainPassword: 'Pass@123', pin, role: 'OPERATOR' } });

  // Users for Client 2 (4 users)
  const u5 = await prisma.user.create({ data: { clientId: client2.id, name: 'Vikram Gupta', mobile: '9988776655', email: 'vikram@gupta.in', password: pw, plainPassword: 'Pass@123', pin, role: 'OWNER' } });
  const u6 = await prisma.user.create({ data: { clientId: client2.id, name: 'Pradeep Singh', mobile: '9988776656', email: 'pradeep@gupta.in', password: pw, plainPassword: 'Pass@123', pin, role: 'MANAGER' } });
  const u7 = await prisma.user.create({ data: { clientId: client2.id, name: 'Manoj Verma', mobile: '9988776657', email: 'manoj@gupta.in', password: pw, plainPassword: 'Pass@123', pin, role: 'ACCOUNTANT' } });
  const u8 = await prisma.user.create({ data: { clientId: client2.id, name: 'Dinesh Worker', mobile: '9988776658', email: 'dinesh@gupta.in', password: pw, plainPassword: 'Pass@123', pin, role: 'OPERATOR' } });

  // UserFactory assignments
  // Client 1 users → both factories
  await prisma.userFactory.create({ data: { userId: u1.id, factoryId: f1a.id, role: 'OWNER', permissions: ['production','dispatch','customers','raw_materials','labour','expenditure','fuel','reports','users'] } });
  await prisma.userFactory.create({ data: { userId: u1.id, factoryId: f1b.id, role: 'OWNER', permissions: ['production','dispatch','customers','raw_materials','labour','expenditure','fuel','reports','users'] } });
  await prisma.userFactory.create({ data: { userId: u2.id, factoryId: f1a.id, role: 'MANAGER', permissions: ['production','dispatch','customers','raw_materials','labour','expenditure','fuel','reports'] } });
  await prisma.userFactory.create({ data: { userId: u3.id, factoryId: f1a.id, role: 'SUPERVISOR', permissions: ['production','dispatch','labour'] } });
  await prisma.userFactory.create({ data: { userId: u4.id, factoryId: f1b.id, role: 'OPERATOR', permissions: ['production'] } });

  // Client 2 users → both factories
  await prisma.userFactory.create({ data: { userId: u5.id, factoryId: f2a.id, role: 'OWNER', permissions: ['production','dispatch','customers','raw_materials','labour','expenditure','fuel','reports','users'] } });
  await prisma.userFactory.create({ data: { userId: u5.id, factoryId: f2b.id, role: 'OWNER', permissions: ['production','dispatch','customers','raw_materials','labour','expenditure','fuel','reports','users'] } });
  await prisma.userFactory.create({ data: { userId: u6.id, factoryId: f2a.id, role: 'MANAGER', permissions: ['production','dispatch','customers','raw_materials','labour','expenditure','fuel','reports'] } });
  await prisma.userFactory.create({ data: { userId: u7.id, factoryId: f2a.id, role: 'ACCOUNTANT', permissions: ['dispatch','customers','expenditure','reports'] } });
  await prisma.userFactory.create({ data: { userId: u8.id, factoryId: f2b.id, role: 'OPERATOR', permissions: ['production'] } });

  console.log('✅ Step 1 done: Super Admin + 2 Clients + 4 Factories + 8 Users');
  console.log('IDs:', { client1: client1.id, client2: client2.id, f1a: f1a.id, f1b: f1b.id, f2a: f2a.id, f2b: f2b.id });

  // Save IDs for next steps
  const fs = require('fs');
  fs.writeFileSync('prisma/seed-ids.json', JSON.stringify({ client1: client1.id, client2: client2.id, f1a: f1a.id, f1b: f1b.id, f2a: f2a.id, f2b: f2b.id, u1: u1.id, u2: u2.id, u3: u3.id, u5: u5.id, u6: u6.id }));
}

seed().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });
