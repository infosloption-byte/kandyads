import 'dotenv/config';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return `${salt}$${hash}`;
}

async function main() {
  const permissions = [
    'dashboard.view','clients.read','clients.write','leads.read','leads.write',
    'enquiries.read','enquiries.write','quotes.read','quotes.write',
    'projects.read','projects.write','jobs.read','jobs.write','tasks.read','tasks.write',
    'employees.read','employees.write','time.read','time.write',
    'materials.read','materials.write','inventory.read','inventory.write',
    'purchasing.read','purchasing.write','outsourcing.read','outsourcing.write',
    'installations.read','installations.write','expenses.read','expenses.write',
    'invoices.read','invoices.write','payments.read','payments.write','reports.read','settings.write'
  ];
  for (const key of permissions) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key, description: `Permission: ${key}` } });
  }

  const role = await prisma.role.upsert({ where: { name: 'Administrator' }, update: {}, create: { name: 'Administrator' } });
  const allPermissions = await prisma.permission.findMany({ select: { id: true } });
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
  }

  await prisma.user.upsert({
    where: { email: 'admin@kandyads.lk' },
    update: { name: 'Kandy Ads Admin', roleId: role.id, status: 'ACTIVE' },
    create: {
      name: 'Kandy Ads Admin',
      email: 'admin@kandyads.lk',
      passwordHash: hashPassword('ChangeMe!123'),
      roleId: role.id,
      status: 'ACTIVE',
    },
  });

  console.log('Seed complete. Initial admin: admin@kandyads.lk / ChangeMe!123');
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
