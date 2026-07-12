const assetService = require('./src/services/assetService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const cat = await prisma.assetCategory.findFirst();
    console.log('Category:', cat);
    
    const result = await assetService.create({
      name: 'Test Laptop',
      assetTag: 'AF-TEST-001',
      serialNumber: 'SN-12345',
      purchaseDate: new Date('2024-01-15'),
      purchaseCost: 1200,
      condition: 'GOOD',
      currentLocation: 'Office 101',
      categoryId: cat.id,
      organizationId: '54572cee-40f4-4705-a156-1a85ff886385'
    });
    console.log('Result:', result);
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    await prisma.$disconnect();
  }
}
test();