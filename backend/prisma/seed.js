const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

async function main() {
  const dept = await prisma.department.upsert({
    where: { id: 'seed-dept-engineering' },
    update: {},
    create: {
      id: 'seed-dept-engineering',
      name: 'Engineering',
      status: 'ACTIVE',
    },
  });

  await prisma.employee.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@company.com',
      password: hashPassword('Admin@12345'),
      role: 'ADMIN',
      departmentId: dept.id,
    },
  });

  await prisma.employee.upsert({
    where: { email: 'employee@company.com' },
    update: {},
    create: {
      name: 'Demo Employee',
      email: 'employee@company.com',
      password: hashPassword('Employee@123'),
      role: 'EMPLOYEE',
      departmentId: dept.id,
    },
  });

  console.log('Seed complete.');
  console.log('  Admin:    admin@company.com / Admin@12345');
  console.log('  Employee: employee@company.com / Employee@123');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
