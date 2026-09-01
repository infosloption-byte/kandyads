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
      department: 'Design & Artwork', employmentType: 'FULL_TIME', hourlyCost: 800, dailyCost: 6400,
      userEmail: 'sahan@kandyads.lk', roleId: roles.projectManager.id,
    },
    {
      code: 'EMP-004', name: 'Ruwan Jayasinghe', phone: '0777001004', email: 'ruwan@kandyads.lk',
      department: 'Installation', employmentType: 'FULL_TIME', hourlyCost: 750, dailyCost: 6000,
      userEmail: 'ruwan@kandyads.lk', roleId: roles.production.id,
    },
    {
      code: 'EMP-005', name: 'Dinesh Kumara', phone: '0777001005', email: 'dinesh@kandyads.lk',
      department: 'Stores', employmentType: 'FULL_TIME', hourlyCost: 700, dailyCost: 5600,
      userEmail: 'dinesh@kandyads.lk', roleId: roles.storeKeeper.id,
    },
  ];

  const employees: Record<string, { id: number; code: string; name: string }> = {};

  for (const item of employeeData) {
    const user = await prisma.user.upsert({
      where: { email: item.userEmail },
      update: { name: item.name, roleId: item.roleId, status: 'ACTIVE' },
      create: {
        name: item.name,
        email: item.userEmail,
        passwordHash: hashPassword('ChangeMe!123'),
        roleId: item.roleId,
        status: 'ACTIVE',
      },
    });

    const employee = await prisma.employee.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        phone: item.phone,
        email: item.email,
        department: item.department,
        employmentType: item.employmentType,
        hourlyCost: item.hourlyCost,
        dailyCost: item.dailyCost,
        status: 'ACTIVE',
        userId: user.id,
      },
      create: {
        code: item.code,
        name: item.name,
        phone: item.phone,
        email: item.email,
        department: item.department,
        employmentType: item.employmentType,
        hourlyCost: item.hourlyCost,
        dailyCost: item.dailyCost,
        status: 'ACTIVE',
        userId: user.id,
      },
    });

    employees[item.code] = employee;
  }

  // ---------------------------------------------------------------------------
  // Service catalogue
  // ---------------------------------------------------------------------------
  const servicesData = [
    ['SIGNAGE', 'signage', 'Signboards, fascia signs, 3D letters and illuminated signage'],
    ['VEHICLE BRANDING', 'vehicle-branding', 'Vehicle wraps, decals and fleet branding'],
    ['PRINTING', 'printing', 'Digital, UV, vinyl, flex and large-format printing'],
    ['INDOOR BRANDING', 'indoor-branding', 'Indoor signs, wall graphics and display systems'],
    ['INSTALLATION', 'installation', 'Site installation, removal and maintenance'],
    ['FABRICATION', 'fabrication', 'Metal, acrylic, ACM and custom fabrication'],
  ];

  const services: Record<string, { id: number; name: string; slug: string }> = {};
  for (const [name, slug, description] of servicesData) {
    const service = await prisma.service.upsert({
      where: { slug },
      update: { name, description, active: true },
      create: { name, slug, description, active: true },
    });
    services[name] = service;
  }

  // ---------------------------------------------------------------------------
  // Clients + leads + enquiries
  // ---------------------------------------------------------------------------
  const clientsData = [
    { code: 'CLI-001', companyName: 'Kandy City Centre', contactName: 'Amal Rodrigo', phone: '0812223001', whatsapp: '0771234501', email: 'amal@kcc.lk', address: 'Kandy, Sri Lanka', industry: 'Retail' },
    { code: 'CLI-002', companyName: 'Hilltop Hotels & Resorts', contactName: 'Tharindu Silva', phone: '0812223002', whatsapp: '0771234502', email: 'tharindu@hilltophotels.lk', address: 'Peradeniya, Kandy', industry: 'Hospitality' },
    { code: 'CLI-003', companyName: 'Lanka Motor Distributors', contactName: 'Chamari Jayasuriya', phone: '0812223003', whatsapp: '0771234503', email: 'chamari@lmd.lk', address: 'Katugastota, Kandy', industry: 'Automotive' },
    { code: 'CLI-004', companyName: 'Central Healthcare Group', contactName: 'Dr. Ravi Senanayake', phone: '0812223004', whatsapp: '0771234504', email: 'ravi@centralhealth.lk', address: 'Kandy, Sri Lanka', industry: 'Healthcare' },
    { code: 'CLI-005', companyName: 'Mountain Brew Coffee', contactName: 'Ishara De Silva', phone: '0812223005', whatsapp: '0771234505', email: 'ishara@mountainbrew.lk', address: 'Kandy, Sri Lanka', industry: 'Food & Beverage' },
  ];

  const clients: Record<string, { id: number; code: string; companyName: string }> = {};
  for (const item of clientsData) {
    const client = await prisma.client.upsert({
      where: { code: item.code },
      update: item,
      create: item,
    });
    clients[item.code] = client;
  }

  await prisma.lead.deleteMany({ where: { email: 'sample.lead@demo.kandyads.lk' } });
  await prisma.lead.create({
    data: {
      name: 'Rashmi Wijeratne',
      company: 'Sample New Retail Group',
      phone: '0775550101',
      email: 'sample.lead@demo.kandyads.lk',
      source: 'Website Quote',
      requirement: 'New branch signage and window graphics',
      estimatedValue: 450000,
      status: 'QUALIFIED',
      assignedToId: employees['EMP-001'].id,
      followUpAt: date('2026-09-04T10:00:00+05:30'),
    },
  });

  const enquiry1 = await prisma.enquiry.upsert({
    where: { number: 'ENQ-2026-001' },
    update: {},
    create: {
      number: 'ENQ-2026-001',
      clientId: clients['CLI-001'].id,
      source: 'Website',
      requirement: 'Full external signage package for a new retail branch',
      siteLocation: 'Kandy City Centre - New Wing',
      targetDate: date('2026-09-15T00:00:00+05:30'),
      priority: 'HIGH',
      status: 'QUOTING',
    },
  });

  const enquiry2 = await prisma.enquiry.upsert({
    where: { number: 'ENQ-2026-002' },
    update: {},
    create: {
      number: 'ENQ-2026-002',
      clientId: clients['CLI-002'].id,
      source: 'Referral',
      requirement: 'Hotel entrance sign, room direction signs and parking graphics',
      siteLocation: 'Peradeniya Hotel Site',
      targetDate: date('2026-09-28T00:00:00+05:30'),
      priority: 'MEDIUM',
      status: 'OPEN',
    },
  });

  // ---------------------------------------------------------------------------
  // Quotes
  // ---------------------------------------------------------------------------
  const quote1 = await prisma.quote.upsert({
    where: { number: 'QUO-2026-001' },
    update: {
      clientId: clients['CLI-001'].id,
      enquiryId: enquiry1.id,
      status: 'ACCEPTED',
      validUntil: date('2026-09-12T00:00:00+05:30'),
      subtotal: 780000,
      discount: 30000,
      tax: 0,
      total: 750000,
      expectedMaterial: 290000,
      expectedLabour: 95000,
      expectedOutsource: 50000,
      expectedExpense: 25000,
      expectedMargin: 290000,
    },
    create: {
      number: 'QUO-2026-001',
      clientId: clients['CLI-001'].id,
      enquiryId: enquiry1.id,
      status: 'ACCEPTED',
      validUntil: date('2026-09-12T00:00:00+05:30'),
      subtotal: 780000,
      discount: 30000,
      tax: 0,
      total: 750000,
      expectedMaterial: 290000,
      expectedLabour: 95000,
      expectedOutsource: 50000,
      expectedExpense: 25000,
      expectedMargin: 290000,
    },
  });

  const quote2 = await prisma.quote.upsert({
    where: { number: 'QUO-2026-002' },
    update: {},
    create: {
      number: 'QUO-2026-002',
      clientId: clients['CLI-002'].id,
      enquiryId: enquiry2.id,
      status: 'SENT',
      validUntil: date('2026-09-20T00:00:00+05:30'),
      subtotal: 420000,
      discount: 0,
      tax: 0,
      total: 420000,
      expectedMaterial: 155000,
      expectedLabour: 65000,
      expectedOutsource: 30000,
      expectedExpense: 15000,
      expectedMargin: 155000,
    },
  });

  await prisma.quoteItem.deleteMany({ where: { quoteId: quote1.id } });
  await prisma.quoteItem.createMany({
    data: [
      { quoteId: quote1.id, serviceId: services['SIGNAGE'].id, description: 'Illuminated fascia signboard', quantity: 2, unit: 'Nos', rate: 220000, total: 440000 },
      { quoteId: quote1.id, serviceId: services['INDOOR BRANDING'].id, description: 'Internal acrylic directional signage', quantity: 12, unit: 'Nos', rate: 9000, total: 108000 },
      { quoteId: quote1.id, serviceId: services['PRINTING'].id, description: 'Window vinyl graphics', quantity: 180, unit: 'sqft', rate: 800, total: 144000 },
      { quoteId: quote1.id, serviceId: services['INSTALLATION'].id, description: 'Installation and finishing', quantity: 1, unit: 'Job', rate: 88000, total: 88000 },
    ],
  });

  await prisma.quoteItem.deleteMany({ where: { quoteId: quote2.id } });
  await prisma.quoteItem.createMany({
    data: [
      { quoteId: quote2.id, serviceId: services['SIGNAGE'].id, description: 'Hotel entrance illuminated sign', quantity: 1, unit: 'Job', rate: 240000, total: 240000 },
      { quoteId: quote2.id, serviceId: services['INDOOR BRANDING'].id, description: 'Room and corridor wayfinding signs', quantity: 20, unit: 'Nos', rate: 7000, total: 140000 },
      { quoteId: quote2.id, serviceId: services['PRINTING'].id, description: 'Parking and safety graphics', quantity: 1, unit: 'Job', rate: 40000, total: 40000 },
    ],
  });

  // ---------------------------------------------------------------------------
  // Projects
  // ---------------------------------------------------------------------------
  const project1 = await prisma.project.upsert({
    where: { number: 'PRJ-2026-001' },
    update: {
      name: 'Kandy City Centre Branch Signage', clientId: clients['CLI-001'].id, quoteId: quote1.id,
      ownerId: employees['EMP-001'].id, startDate: date('2026-08-28T00:00:00+05:30'),
      dueDate: date('2026-09-15T00:00:00+05:30'), value: 750000, status: 'ACTIVE',
    },
    create: {
      number: 'PRJ-2026-001', name: 'Kandy City Centre Branch Signage', clientId: clients['CLI-001'].id, quoteId: quote1.id,
      ownerId: employees['EMP-001'].id, startDate: date('2026-08-28T00:00:00+05:30'),
      dueDate: date('2026-09-15T00:00:00+05:30'), value: 750000, status: 'ACTIVE',
    },
  });

  const project2 = await prisma.project.upsert({
    where: { number: 'PRJ-2026-002' },
    update: {},
    create: {
      number: 'PRJ-2026-002', name: 'Hilltop Hotel Rebrand', clientId: clients['CLI-002'].id, quoteId: quote2.id,
      ownerId: employees['EMP-001'].id, startDate: date('2026-09-05T00:00:00+05:30'),
      dueDate: date('2026-09-28T00:00:00+05:30'), value: 420000, status: 'PLANNED',
    },
  });

  // ---------------------------------------------------------------------------
  // Jobs + assignments + tasks
  // ---------------------------------------------------------------------------
  const jobs = {
    fascia: await prisma.job.upsert({
      where: { number: 'JOB-2026-001' },
      update: {},
      create: {
        number: 'JOB-2026-001', projectId: project1.id, serviceId: services['SIGNAGE'].id,
        title: 'Fabricate illuminated fascia signs', description: 'Two double-sided illuminated fascia signs with ACM and acrylic face.',
        priority: 'HIGH', startDate: date('2026-08-29T00:00:00+05:30'), dueDate: date('2026-09-10T00:00:00+05:30'),
        status: 'IN_PROGRESS', assignmentType: 'MIXED', revenue: 440000,
        estimatedMaterial: 185000, estimatedLabour: 65000, estimatedOutsource: 25000, estimatedExpense: 9000,
      },
    }),
    windows: await prisma.job.upsert({
      where: { number: 'JOB-2026-002' },
      update: {},
      create: {
        number: 'JOB-2026-002', projectId: project1.id, serviceId: services['PRINTING'].id,
        title: 'Produce window vinyl graphics', description: 'Print, laminate, cut and install window graphics.',
        priority: 'MEDIUM', startDate: date('2026-09-03T00:00:00+05:30'), dueDate: date('2026-09-12T00:00:00+05:30'),
        status: 'READY', assignmentType: 'INTERNAL', revenue: 144000,
        estimatedMaterial: 52000, estimatedLabour: 18000, estimatedOutsource: 0, estimatedExpense: 6000,
      },
    }),
    hotel: await prisma.job.upsert({
      where: { number: 'JOB-2026-003' },
      update: {},
      create: {
        number: 'JOB-2026-003', projectId: project2.id, serviceId: services['SIGNAGE'].id,
        title: 'Hotel entrance sign', description: 'Manufacture and install main hotel entrance sign.',
        priority: 'MEDIUM', startDate: date('2026-09-06T00:00:00+05:30'), dueDate: date('2026-09-20T00:00:00+05:30'),
        status: 'DRAFT', assignmentType: 'OUTSOURCED', revenue: 240000,
        estimatedMaterial: 85000, estimatedLabour: 20000, estimatedOutsource: 30000, estimatedExpense: 8000,
      },
    }),
  };

  await prisma.jobAssignment.deleteMany({ where: { jobId: jobs.fascia.id } });
  await prisma.jobAssignment.createMany({
    data: [
      { jobId: jobs.fascia.id, employeeId: employees['EMP-002'].id, estimatedHours: 48, agreedCost: 40800, startDate: date('2026-08-29T00:00:00+05:30'), dueDate: date('2026-09-07T00:00:00+05:30') },
      { jobId: jobs.fascia.id, vendorId: (await prisma.vendor.upsert({ where: { code: 'VEN-001' }, update: {}, create: { code: 'VEN-001', companyName: 'Kandy Metal Works', contactName: 'Pradeep', phone: '0778801101', whatsapp: '0778801101', email: 'sales@kandymetalworks.lk', address: 'Katugastota, Kandy', category: 'Metal Fabrication', capabilities: 'Stainless steel, mild steel, frames and custom fabrication', paymentTerms: '50% advance / balance on delivery' } })).id, estimatedHours: 0, agreedCost: 25000, startDate: date('2026-09-01T00:00:00+05:30'), dueDate: date('2026-09-05T00:00:00+05:30') },
    ],
  });

  const tasksData = [
    { jobId: jobs.fascia.id, title: 'Site measurement and verification', employeeId: employees['EMP-001'].id, priority: 'HIGH', status: 'COMPLETED', estimatedHours: 3, actualHours: 3 },
    { jobId: jobs.fascia.id, title: 'Prepare production artwork', employeeId: employees['EMP-003'].id, priority: 'HIGH', status: 'COMPLETED', estimatedHours: 6, actualHours: 7 },
    { jobId: jobs.fascia.id, title: 'Fabricate aluminium frame', employeeId: employees['EMP-002'].id, priority: 'HIGH', status: 'IN_PROGRESS', estimatedHours: 18 },
    { jobId: jobs.fascia.id, title: 'Install LED modules', employeeId: employees['EMP-002'].id, priority: 'MEDIUM', status: 'READY', estimatedHours: 10 },
    { jobId: jobs.fascia.id, title: 'Final site installation', employeeId: employees['EMP-004'].id, priority: 'HIGH', status: 'PENDING', estimatedHours: 8 },
    { jobId: jobs.windows.id, title: 'Finalize window artwork', employeeId: employees['EMP-003'].id, priority: 'MEDIUM', status: 'READY', estimatedHours: 5 },
    { jobId: jobs.windows.id, title: 'Print and laminate graphics', employeeId: employees['EMP-002'].id, priority: 'MEDIUM', status: 'PENDING', estimatedHours: 8 },
    { jobId: jobs.hotel.id, title: 'Confirm hotel branding specifications', employeeId: employees['EMP-001'].id, priority: 'MEDIUM', status: 'PENDING', estimatedHours: 4 },
  ];

  // Keep the sample set idempotent by removing/recreating tasks for these jobs.
  await prisma.task.deleteMany({ where: { jobId: { in: [jobs.fascia.id, jobs.windows.id, jobs.hotel.id] } } });
  for (const task of tasksData) {
    await prisma.task.create({ data: { ...task, dueDate: date('2026-09-10T00:00:00+05:30') } });
  }

  // ---------------------------------------------------------------------------
  // Vendors
  // ---------------------------------------------------------------------------
  const vendor2 = await prisma.vendor.upsert({
    where: { code: 'VEN-002' },
    update: {},
    create: {
      code: 'VEN-002', companyName: 'Central Print Partners', contactName: 'Mohan', phone: '0778801102', whatsapp: '0778801102',
      email: 'orders@centralprint.lk', address: 'Peradeniya, Kandy', category: 'Printing', capabilities: 'UV, latex and large-format printing',
      paymentTerms: '30 days',
    },
  });

  const vendor3 = await prisma.vendor.upsert({
    where: { code: 'VEN-003' },
    update: {},
    create: {
      code: 'VEN-003', companyName: 'Kandy Electrical Services', contactName: 'Ramesh', phone: '0778801103', whatsapp: '0778801103',
      email: 'ramesh@kandyelectrical.lk', address: 'Ampitiya, Kandy', category: 'Electrical', capabilities: 'LED wiring, transformers, electrical installation',
      paymentTerms: 'On completion',
    },
  });
  void vendor2;
  void vendor3;

  // ---------------------------------------------------------------------------
  // Inventory
  // ---------------------------------------------------------------------------
  const categories = {
    acrylic: await prisma.materialCategory.upsert({ where: { name: 'Acrylic' }, update: {}, create: { name: 'Acrylic' } }),
    vinyl: await prisma.materialCategory.upsert({ where: { name: 'Vinyl & Film' }, update: {}, create: { name: 'Vinyl & Film' } }),
    metals: await prisma.materialCategory.upsert({ where: { name: 'Metal & ACM' }, update: {}, create: { name: 'Metal & ACM' } }),
    electrical: await prisma.materialCategory.upsert({ where: { name: 'Electrical' }, update: {}, create: { name: 'Electrical' } }),
    consumables: await prisma.materialCategory.upsert({ where: { name: 'Consumables' }, update: {}, create: { name: 'Consumables' } }),
  };

  const warehouse = await prisma.warehouse.upsert({
    where: { name: 'Main Warehouse' },
    update: {},
    create: { name: 'Main Warehouse', address: '150/B, Kahatagoda Road, Pilimathalawa', active: true },
  });

  const materialsData = [
    { sku: 'MAT-ACR-001', name: 'Acrylic Sheet 3mm White', categoryId: categories.acrylic.id, unit: 'sheet', standardCost: 9800, sellingPrice: 13000, reorderLevel: 8, minimumStock: 4 },
    { sku: 'MAT-VIN-001', name: 'Oracal White Vinyl', categoryId: categories.vinyl.id, unit: 'sqm', standardCost: 950, sellingPrice: 1800, reorderLevel: 40, minimumStock: 20 },
    { sku: 'MAT-ACM-001', name: 'ACM Sheet 3mm White', categoryId: categories.metals.id, unit: 'sheet', standardCost: 14500, sellingPrice: 22000, reorderLevel: 10, minimumStock: 5 },
    { sku: 'MAT-LED-001', name: 'LED Module 12V White', categoryId: categories.electrical.id, unit: 'unit', standardCost: 320, sellingPrice: 650, reorderLevel: 100, minimumStock: 50 },
    { sku: 'MAT-LED-002', name: 'LED Transformer 12V 100W', categoryId: categories.electrical.id, unit: 'unit', standardCost: 4200, sellingPrice: 7000, reorderLevel: 8, minimumStock: 3 },
    { sku: 'MAT-TAP-001', name: 'Double Sided Mounting Tape', categoryId: categories.consumables.id, unit: 'roll', standardCost: 2800, sellingPrice: 4500, reorderLevel: 10, minimumStock: 5 },
  ];

  const materials: Record<string, { id: number; sku: string; name: string }> = {};
  for (const item of materialsData) {
    const material = await prisma.material.upsert({ where: { sku: item.sku }, update: item, create: item });
    materials[item.sku] = material;
  }

  await prisma.stockMovement.deleteMany({ where: { warehouseId: warehouse.id } });
  await prisma.stockMovement.createMany({
    data: [
      { materialId: materials['MAT-ACR-001'].id, warehouseId: warehouse.id, type: 'PURCHASE_RECEIPT', quantity: 30, unitCost: 9800, reference: 'PO-2026-001' },
      { materialId: materials['MAT-ACR-001'].id, warehouseId: warehouse.id, type: 'ISSUE', quantity: 8, unitCost: 9800, projectId: project1.id, jobId: jobs.fascia.id, reference: 'JOB-2026-001' },
      { materialId: materials['MAT-VIN-001'].id, warehouseId: warehouse.id, type: 'PURCHASE_RECEIPT', quantity: 120, unitCost: 950, reference: 'PO-2026-002' },
      { materialId: materials['MAT-VIN-001'].id, warehouseId: warehouse.id, type: 'ISSUE', quantity: 36, unitCost: 950, projectId: project1.id, jobId: jobs.windows.id, reference: 'JOB-2026-002' },
      { materialId: materials['MAT-ACM-001'].id, warehouseId: warehouse.id, type: 'PURCHASE_RECEIPT', quantity: 20, unitCost: 14500, reference: 'PO-2026-003' },
      { materialId: materials['MAT-ACM-001'].id, warehouseId: warehouse.id, type: 'ISSUE', quantity: 6, unitCost: 14500, projectId: project1.id, jobId: jobs.fascia.id, reference: 'JOB-2026-001' },
      { materialId: materials['MAT-LED-001'].id, warehouseId: warehouse.id, type: 'PURCHASE_RECEIPT', quantity: 500, unitCost: 320, reference: 'PO-2026-004' },
      { materialId: materials['MAT-LED-001'].id, warehouseId: warehouse.id, type: 'ISSUE', quantity: 120, unitCost: 320, projectId: project1.id, jobId: jobs.fascia.id, reference: 'JOB-2026-001' },
      { materialId: materials['MAT-LED-002'].id, warehouseId: warehouse.id, type: 'PURCHASE_RECEIPT', quantity: 20, unitCost: 4200, reference: 'PO-2026-005' },
      { materialId: materials['MAT-TAP-001'].id, warehouseId: warehouse.id, type: 'PURCHASE_RECEIPT', quantity: 20, unitCost: 2800, reference: 'PO-2026-006' },
    ],
  });

  await prisma.materialRequirement.deleteMany({ where: { jobId: { in: [jobs.fascia.id, jobs.windows.id, jobs.hotel.id] } } });
  await prisma.materialRequirement.createMany({
    data: [
      { jobId: jobs.fascia.id, materialId: materials['MAT-ACM-001'].id, requiredQty: 6, reservedQty: 0, issuedQty: 6, consumedQty: 5, returnedQty: 1, wastedQty: 0 },
      { jobId: jobs.fascia.id, materialId: materials['MAT-ACR-001'].id, requiredQty: 8, reservedQty: 0, issuedQty: 8, consumedQty: 7, returnedQty: 1, wastedQty: 0 },
      { jobId: jobs.fascia.id, materialId: materials['MAT-LED-001'].id, requiredQty: 140, reservedQty: 20, issuedQty: 120, consumedQty: 112, returnedQty: 4, wastedQty: 4 },
      { jobId: jobs.windows.id, materialId: materials['MAT-VIN-001'].id, requiredQty: 42, reservedQty: 42, issuedQty: 0, consumedQty: 0, returnedQty: 0, wastedQty: 0 },
      { jobId: jobs.windows.id, materialId: materials['MAT-TAP-001'].id, requiredQty: 2, reservedQty: 2, issuedQty: 0, consumedQty: 0, returnedQty: 0, wastedQty: 0 },
      { jobId: jobs.hotel.id, materialId: materials['MAT-ACM-001'].id, requiredQty: 4, reservedQty: 4, issuedQty: 0, consumedQty: 0, returnedQty: 0, wastedQty: 0 },
    ],
  });

  // ---------------------------------------------------------------------------
  // Outsourcing
  // ---------------------------------------------------------------------------
  const vendorMetal = await prisma.vendor.findUniqueOrThrow({ where: { code: 'VEN-001' } });
  await prisma.outsourceOrder.upsert({
    where: { number: 'OUT-2026-001' },
    update: {},
    create: {
      number: 'OUT-2026-001', jobId: jobs.fascia.id, vendorId: vendorMetal.id,
      scope: 'Mild steel rear support frames', specification: 'Powder-coated frame to approved drawing',
      quantity: 2, dueDate: date('2026-09-05T00:00:00+05:30'), agreedCost: 25000, status: 'IN_PROGRESS',
    },
  });

  // ---------------------------------------------------------------------------
  // Time tracking
  // ---------------------------------------------------------------------------
  await prisma.timeEntry.deleteMany({ where: { projectId: { in: [project1.id, project2.id] } } });
  const taskRecords = await prisma.task.findMany({ where: { jobId: jobs.fascia.id }, orderBy: { id: 'asc' } });
  await prisma.timeEntry.createMany({
    data: [
      { employeeId: employees['EMP-001'].id, projectId: project1.id, jobId: jobs.fascia.id, taskId: taskRecords[0]?.id, workDate: date('2026-08-29T00:00:00+05:30'), startTime: date('2026-08-29T09:00:00+05:30'), endTime: date('2026-08-29T12:00:00+05:30'), hours: 3, billable: false, notes: 'Site measurement' },
      { employeeId: employees['EMP-003'].id, projectId: project1.id, jobId: jobs.fascia.id, taskId: taskRecords[1]?.id, workDate: date('2026-08-30T00:00:00+05:30'), startTime: date('2026-08-30T09:00:00+05:30'), endTime: date('2026-08-30T16:00:00+05:30'), hours: 7, billable: false, notes: 'Production artwork' },
      { employeeId: employees['EMP-002'].id, projectId: project1.id, jobId: jobs.fascia.id, taskId: taskRecords[2]?.id, workDate: date('2026-09-01T00:00:00+05:30'), startTime: date('2026-09-01T08:30:00+05:30'), endTime: date('2026-09-01T14:30:00+05:30'), hours: 6, billable: false, notes: 'Frame fabrication' },
      { employeeId: employees['EMP-002'].id, projectId: project1.id, jobId: jobs.fascia.id, taskId: taskRecords[2]?.id, workDate: date('2026-09-02T00:00:00+05:30'), startTime: date('2026-09-02T08:30:00+05:30'), endTime: date('2026-09-02T13:30:00+05:30'), hours: 5, billable: false, notes: 'Frame fabrication' },
    ].filter((entry) => entry.taskId),
  });

  // ---------------------------------------------------------------------------
  // Expenses
  // ---------------------------------------------------------------------------
  const expenseCategory = await prisma.expenseCategory.upsert({ where: { name: 'Project Transport' }, update: {}, create: { name: 'Project Transport' } });
  const generalExpenseCategory = await prisma.expenseCategory.upsert({ where: { name: 'Office & Operations' }, update: {}, create: { name: 'Office & Operations' } });

  await prisma.expense.upsert({
    where: { number: 'EXP-2026-001' },
    update: {},
    create: {
      number: 'EXP-2026-001', categoryId: expenseCategory.id, projectId: project1.id, jobId: jobs.fascia.id,
      employeeId: employees['EMP-004'].id, amount: 6500, expenseDate: date('2026-09-02T00:00:00+05:30'),
      paymentMethod: 'CASH', direct: true, status: 'PAID', notes: 'Fuel and parking for site visit',
    },
  });
  await prisma.expense.upsert({
    where: { number: 'EXP-2026-002' },
    update: {},
    create: {
      number: 'EXP-2026-002', categoryId: generalExpenseCategory.id, amount: 18500,
      expenseDate: date('2026-09-01T00:00:00+05:30'), paymentMethod: 'BANK', direct: false, status: 'APPROVED', notes: 'Monthly office supplies',
    },
  });

  // ---------------------------------------------------------------------------
  // Installations
  // ---------------------------------------------------------------------------
  await prisma.installation.upsert({
    where: { number: 'INS-2026-001' },
    update: {},
    create: {
      number: 'INS-2026-001', projectId: project1.id, jobId: jobs.fascia.id,
      siteAddress: 'Kandy City Centre - New Wing, Kandy', siteContact: 'Amal Rodrigo - 0771234501',
      scheduledAt: date('2026-09-12T09:00:00+05:30'), team: 'Installation Team A', vehicle: 'KDY-4521',
      status: 'SCHEDULED', requirements: 'Tower access, electrical point and client representative on site',
    },
  });

  // ---------------------------------------------------------------------------
  // Invoices + payments
  // ---------------------------------------------------------------------------
  const invoice1 = await prisma.invoice.upsert({
    where: { number: 'INV-2026-001' },
    update: {},
    create: {
      number: 'INV-2026-001', clientId: clients['CLI-001'].id, projectId: project1.id,
      invoiceDate: date('2026-09-02T00:00:00+05:30'), dueDate: date('2026-09-16T00:00:00+05:30'),
      subtotal: 750000, discount: 0, tax: 0, total: 750000, amountPaid: 300000, balance: 450000, status: 'PARTIALLY_PAID',
    },
  });
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: invoice1.id } });
  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: invoice1.id, description: '50% advance - Kandy City Centre branch signage', quantity: 1, unit: 'Job', rate: 375000, total: 375000 },
      { invoiceId: invoice1.id, description: 'Production milestone invoice', quantity: 1, unit: 'Job', rate: 375000, total: 375000 },
    ],
  });
  await prisma.payment.deleteMany({ where: { invoiceId: invoice1.id } });
  await prisma.payment.create({
    data: { invoiceId: invoice1.id, amount: 300000, paidAt: date('2026-09-03T00:00:00+05:30'), method: 'BANK_TRANSFER', reference: 'KCC-ADV-0309', notes: 'Advance payment received' },
  });

  // ---------------------------------------------------------------------------
  // Sample admin activity log
  // ---------------------------------------------------------------------------
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SEED_SAMPLE_DATA',
      entity: 'SYSTEM',
      entityId: 'sample-dataset',
      afterJson: { description: 'Kandy Ads demo operations dataset seeded' },
    },
  });

  console.log('Sample data seed complete.');
  console.log('Admin: admin@kandyads.lk / ChangeMe!123');
  console.log('Employees: kasun@kandyads.lk, nimal@kandyads.lk, sahan@kandyads.lk, ruwan@kandyads.lk, dinesh@kandyads.lk');
  console.log('Employee user passwords: ChangeMe!123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
