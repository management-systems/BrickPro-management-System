const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const ids = JSON.parse(fs.readFileSync('prisma/seed-ids.json', 'utf8'));

async function seed() {
  console.log('Step 2: BrickTypes, Customers, Suppliers, Raw Materials...');

  // BrickTypes for Client 1
  await prisma.brickType.createMany({ data: [
    { clientId: ids.client1, name: 'Red Brick (1st Class)', nameHindi: 'लाल ईंट (प्रथम श्रेणी)' },
    { clientId: ids.client1, name: 'Red Brick (2nd Class)', nameHindi: 'लाल ईंट (द्वितीय श्रेणी)' },
    { clientId: ids.client1, name: 'Fly Ash Brick', nameHindi: 'फ्लाई ऐश ईंट' },
  ]});

  // BrickTypes for Client 2
  await prisma.brickType.createMany({ data: [
    { clientId: ids.client2, name: 'Red Brick (A Grade)', nameHindi: 'लाल ईंट (A ग्रेड)' },
    { clientId: ids.client2, name: 'Red Brick (B Grade)', nameHindi: 'लाल ईंट (B ग्रेड)' },
    { clientId: ids.client2, name: 'Clay Brick', nameHindi: 'मिट्टी ईंट' },
  ]});

  // 5 Customers for Client 1
  const c1Customers = await Promise.all([
    prisma.customer.create({ data: { clientId: ids.client1, name: 'Ravi Builders', firm: 'Ravi Construction Pvt Ltd', mobile: '9111111101', address: 'Sector 14, Gurgaon', gstin: '06AABCR1234A1Z5', creditLimit: 500000, type: 'dealer' } }),
    prisma.customer.create({ data: { clientId: ids.client1, name: 'Mohan Traders', firm: 'Mohan Building Materials', mobile: '9111111102', address: 'Main Market, Rewari', creditLimit: 300000, type: 'dealer' } }),
    prisma.customer.create({ data: { clientId: ids.client1, name: 'Sanjay Contractor', firm: 'Sanjay & Sons', mobile: '9111111103', address: 'Industrial Area, Bhiwani', creditLimit: 200000, type: 'contractor' } }),
    prisma.customer.create({ data: { clientId: ids.client1, name: 'Deepak Cement House', firm: 'Deepak Enterprises', mobile: '9111111104', address: 'GT Road, Dharuhera', gstin: '06AABCD5678B1Z3', creditLimit: 400000, type: 'dealer' } }),
    prisma.customer.create({ data: { clientId: ids.client1, name: 'Anil Real Estate', firm: 'Anil Properties', mobile: '9111111105', address: 'Civil Lines, Narnaul', creditLimit: 250000, type: 'contractor' } }),
  ]);

  // 5 Customers for Client 2
  const c2Customers = await Promise.all([
    prisma.customer.create({ data: { clientId: ids.client2, name: 'Patel Construction', firm: 'Patel Infra Ltd', mobile: '9222222201', address: 'Malviya Nagar, Jaipur', gstin: '08AABCP9876C1Z1', creditLimit: 600000, type: 'dealer' } }),
    prisma.customer.create({ data: { clientId: ids.client2, name: 'Joshi Hardware', firm: 'Joshi & Brothers', mobile: '9222222202', address: 'Station Road, Alwar', creditLimit: 350000, type: 'dealer' } }),
    prisma.customer.create({ data: { clientId: ids.client2, name: 'Meena Builders', firm: 'Meena Construction Co', mobile: '9222222203', address: 'Tonk Road, Jaipur', creditLimit: 450000, type: 'contractor' } }),
    prisma.customer.create({ data: { clientId: ids.client2, name: 'Sharma Cement Store', firm: 'Sharma Trading Co', mobile: '9222222204', address: 'Nehru Bazaar, Alwar', creditLimit: 200000, type: 'dealer' } }),
    prisma.customer.create({ data: { clientId: ids.client2, name: 'Rajput Developers', firm: 'Rajput Group', mobile: '9222222205', address: 'Vaishali Nagar, Jaipur', gstin: '08AABCR5432D1Z7', creditLimit: 500000, type: 'contractor' } }),
  ]);

  // Suppliers for Client 1
  const s1 = await Promise.all([
    prisma.supplier.create({ data: { clientId: ids.client1, name: 'Balaji Coal Depot', firm: 'Balaji Fuels', mobile: '9333333301', address: 'Jhajjar Road, Rewari' } }),
    prisma.supplier.create({ data: { clientId: ids.client1, name: 'Krishna Clay Suppliers', firm: 'Krishna Minerals', mobile: '9333333302', address: 'Village Khol, Rewari' } }),
    prisma.supplier.create({ data: { clientId: ids.client1, name: 'Om Sand Traders', firm: 'Om Enterprises', mobile: '9333333303', address: 'Kosli, Rewari' } }),
  ]);

  // Suppliers for Client 2
  const s2 = await Promise.all([
    prisma.supplier.create({ data: { clientId: ids.client2, name: 'Rajasthan Coal Agency', firm: 'RCA Fuels', mobile: '9444444401', address: 'Sikar Road, Jaipur' } }),
    prisma.supplier.create({ data: { clientId: ids.client2, name: 'Aravali Clay Works', firm: 'Aravali Minerals', mobile: '9444444402', address: 'Behror, Alwar' } }),
    prisma.supplier.create({ data: { clientId: ids.client2, name: 'Ganesh Sand Supply', firm: 'Ganesh Traders', mobile: '9444444403', address: 'Chomu, Jaipur' } }),
  ]);

  // Raw Materials for Client 1
  const rm1 = await Promise.all([
    prisma.rawMaterial.create({ data: { clientId: ids.client1, name: 'Clay', nameHindi: 'मिट्टी', unit: 'trolley', lowStockThreshold: 5, consumptionPer1000: 2 } }),
    prisma.rawMaterial.create({ data: { clientId: ids.client1, name: 'Sand', nameHindi: 'रेत', unit: 'trolley', lowStockThreshold: 3, consumptionPer1000: 0.5 } }),
    prisma.rawMaterial.create({ data: { clientId: ids.client1, name: 'Fly Ash', nameHindi: 'फ्लाई ऐश', unit: 'ton', lowStockThreshold: 10, consumptionPer1000: 1.5 } }),
  ]);

  // Raw Materials for Client 2
  const rm2 = await Promise.all([
    prisma.rawMaterial.create({ data: { clientId: ids.client2, name: 'Clay', nameHindi: 'मिट्टी', unit: 'trolley', lowStockThreshold: 8, consumptionPer1000: 2.5 } }),
    prisma.rawMaterial.create({ data: { clientId: ids.client2, name: 'Sand', nameHindi: 'रेत', unit: 'trolley', lowStockThreshold: 4, consumptionPer1000: 0.6 } }),
    prisma.rawMaterial.create({ data: { clientId: ids.client2, name: 'Coal Ash', nameHindi: 'कोयला राख', unit: 'ton', lowStockThreshold: 5, consumptionPer1000: 1 } }),
  ]);

  // Save customer/supplier/material IDs
  ids.c1Customers = c1Customers.map(c => c.id);
  ids.c2Customers = c2Customers.map(c => c.id);
  ids.s1 = s1.map(s => s.id);
  ids.s2 = s2.map(s => s.id);
  ids.rm1 = rm1.map(r => r.id);
  ids.rm2 = rm2.map(r => r.id);
  fs.writeFileSync('prisma/seed-ids.json', JSON.stringify(ids));

  console.log('✅ Step 2 done: BrickTypes + 10 Customers + 6 Suppliers + 6 Raw Materials');
}

seed().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });
