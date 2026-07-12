const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create default organization
  const org = await prisma.organization.upsert({
    where: { id: 'seed-org-main' },
    update: {},
    create: {
      id: 'seed-org-main',
      name: 'Main Organization',
      code: 'MAIN',
      email: 'admin@mainorg.com',
      isActive: true,
    },
  });

  console.log('Seeding complete.');
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
