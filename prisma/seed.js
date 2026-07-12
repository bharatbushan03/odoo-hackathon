const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@assetflow.com' } });
  if (existing) {
    console.log('Seed user already exists, skipping...');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 12);

  await prisma.user.create({
    data: {
      employeeId: 'EMP-001',
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@assetflow.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Seed user created: admin@assetflow.com / admin123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
