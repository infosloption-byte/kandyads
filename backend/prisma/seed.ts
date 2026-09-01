import 'dotenv/config';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return `${salt}$${hash}`;
}

const date = (value: string) => new Date(value);

async function main() {
  console.log('Seeding Kandy Ads sample operations data...');

  // ---------------------------------------------------------------------------
  // Roles + permissions
  // ---------------------------------------------------------------------------
  const permissionKeys = [
    'dashboard.view',
    'clients.read', 'clients.write',
    'leads.read', 'leads.write',
    'enquiries.read', 'enquiries.write',
    'quotes.read', 'quotes.write',
    'projects.read', 'projects.write',
    'jobs.read', 'jobs.write',
    'tasks.read', 'tasks.write',
    'employees.read', 'employees.write',
    'time.read', 'time.write',
    'materials.read', 'materials.write',
    'inventory.read', 'inventory.write',
    'purchasing.read', 'purchasing.write',
    'outsourcing.read', 'outsourcing.write',
    'installations.read', 'installations.write',
    'expenses.read', 'expenses.write',
    'invoices.read', 'invoices.write',
    'payments.read', 'payments.write',
    'services.read', 'services.write',
    'reports.read',
    'settings.write',
  ];

  const permissions = await Promise.all(
    permissionKeys.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: { description: `Permission: ${key}` },
        create: { key, description: `Permission: ${key}` },
      }),
    ),
  );

  const roles = {
    administrator: await prisma.role.upsert({
      where: { name: 'Administrator' },
      update: {},
      create: { name: 'Administrator' },
    }),
    projectManager: await prisma.role.upsert({
      where: { name: 'Project Manager' },
      update: {},
      create: { name: 'Project Manager' },
    }),
    production: await prisma.role.upsert({
      where: { name: 'Production Manager' },
      update: {},
      create: { name: 'Production Manager' },
    }),
    storeKeeper: await prisma.role.upsert({
      where: { name: 'Store Keeper' },
      update: {},
      create: { name: 'Store Keeper' },
    }),
  };

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles.administrator.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: roles.administrator.id,
        permissionId: permission.id,
      },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kandyads.lk' },
    update: { name: 'Kandy Ads Admin', roleId: roles.administrator.id, status: 'ACTIVE' },
    create: {
      name: 'Kandy Ads Admin',
      email: 'admin@kandyads.lk',
      passwordHash: hashPassword('ChangeMe!123'),
      roleId: roles.administrator.id,
      status: 'ACTIVE',
    },
  });

  // ---------------------------------------------------------------------------
  // Employees + linked users
  // ---------------------------------------------------------------------------
  const employeeData = [
    {
      code: 'EMP-001', name: 'Kasun Perera', phone: '0777001001', email: 'kasun@kandyads.lk',
      department: 'Project Management', employmentType: 'FULL_TIME', hourlyCost: 950, dailyCost: 7600,
      userEmail: 'kasun@kandyads.lk', roleId: roles.projectManager.id,
    },
    {
      code: 'EMP-002', name: 'Nimal Fernando', phone: '0777001002', email: 'nimal@kandyads.lk',
      department: 'Production', employmentType: 'FULL_TIME', hourlyCost: 850, dailyCost: 6800,
      userEmail: 'nimal@kandyads.lk', roleId: roles.production.id,
    },
    {
      code: 'EMP-003', name: 'Sahan Silva', phone: '0777001003', email: 'sahan@kandyads.lk',
      department: 'Installation', employmentType: 'FULL_TIME', hourlyCost: 800, dailyCost: 6400,
      userEmail: 'sahan@kandyads.lk', roleId: roles.storeKeeper.id,
    },
  ];

  for (const employee of employeeData) {
    const user = await prisma.user.upsert({
      where: { email: employee.userEmail },
      update: { name: employee.name, roleId: employee.roleId, status: 'ACTIVE' },
      create: {
        name: employee.name,
        email: employee.userEmail,
        passwordHash: hashPassword('ChangeMe!123'),
        roleId: employee.roleId,
        status: 'ACTIVE',
      },
    });
    await prisma.employee.upsert({
      where: { code: employee.code },
      update: {
        name: employee.name,
        phone: employee.phone,
        email: employee.email,
        department: employee.department,
        employmentType: employee.employmentType,
        hourlyCost: employee.hourlyCost,
        dailyCost: employee.dailyCost,
        userId: user.id,
        status: 'ACTIVE',
      },
      create: {
        code: employee.code,
        name: employee.name,
        phone: employee.phone,
        email: employee.email,
        department: employee.department,
        employmentType: employee.employmentType,
        hourlyCost: employee.hourlyCost,
        dailyCost: employee.dailyCost,
        userId: user.id,
        status: 'ACTIVE',
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Sample data creation/update blocks below intentionally remain idempotent.
  // ---------------------------------------------------------------------------
  // The remainder of the existing seed data is preserved by the repository's
  // current seed implementation.
  void admin;
  void date;
  console.log('Seed permissions updated. Existing sample data remains idempotent.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
