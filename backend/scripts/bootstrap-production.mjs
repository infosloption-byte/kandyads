import { createHash, randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const email = process.env.KANDYADS_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.KANDYADS_ADMIN_PASSWORD;

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  throw new Error('Pass a valid KANDYADS_ADMIN_EMAIL to initialize production access.');
}
if (!password || password.length < 16 || password === 'ChangeMe!123') {
  throw new Error('KANDYADS_ADMIN_PASSWORD must be at least 16 characters and not the demo password.');
}

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
  'reports.read', 'settings.write',
];

const serviceCatalog = [
  ['Signage & Signboards', 'signage'],
  ['Vehicle Branding', 'vehicle-branding'],
  ['Outdoor Advertising', 'outdoor-advertising'],
  ['Digital Printing & Displays', 'printing'],
  ['Retail & Commercial Branding', 'retail-branding'],
  ['Exhibitions & Promotional', 'events'],
];

function hashPassword(value) {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(`${salt}:${value}`).digest('hex');
  return `${salt}$${hash}`;
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Production admin account already exists. Password was NOT reset.');
  }

  const role = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: { name: 'Administrator' },
  });
  for (const key of permissionKeys) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: `Permission: ${key}` },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
  }
  for (const [name, slug] of serviceCatalog) {
    await prisma.service.upsert({
      where: { slug },
      update: { active: true },
      create: { name, slug, description: 'Public quotation service', active: true },
    });
  }

  await prisma.user.create({
    data: {
      name: 'Kandy Ads Administrator',
      email,
      passwordHash: hashPassword(password),
      roleId: role.id,
      status: 'ACTIVE',
    },
  });
  console.log('Production administrator and base service catalogue initialized.');
  console.log('No demo users or sample financial records were created.');
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
