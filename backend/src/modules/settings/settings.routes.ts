import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createPasswordHash } from '../auth/auth.routes.js';
import { prisma } from '../../lib/prisma.js';
import { actorId, writeAudit } from '../audit/audit.service.js';

const userCreateSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email().max(191),
  password: z.string().min(8).max(200),
  roleId: z.coerce.number().int().positive(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const userUpdateSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  email: z.string().email().max(191).optional(),
  password: z.string().min(8).max(200).optional(),
  roleId: z.coerce.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const roleCreateSchema = z.object({ name: z.string().min(2).max(100) });
const permissionUpdateSchema = z.object({ permissionIds: z.array(z.coerce.number().int().positive()) });
const companySettingsSchema = z.object({
  companyName: z.string().min(2).max(200),
  legalName: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().max(191).optional().nullable(),
  address: z.string().max(5000).optional().nullable(),
  website: z.string().url().max(255).optional().nullable(),
  taxNumber: z.string().max(100).optional().nullable(),
});

type RawDbClient = Pick<typeof prisma, '$queryRaw' | '$executeRaw'>;

async function getCompanySettings(client: RawDbClient) {
  const rows = await client.$queryRaw<Array<{
    id: number;
    companyName: string;
    legalName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    website: string | null;
    taxNumber: string | null;
    updatedAt: Date;
  }>>`SELECT id, companyName, legalName, phone, email, address, website, taxNumber, updatedAt FROM CompanySetting WHERE id = 1 LIMIT 1`;
  return rows[0] ?? null;
}

export async function settingsRoutes(app: FastifyInstance) {
  app.get('/api/v1/settings/company', async (request, reply) => {
    const company = await getCompanySettings(prisma);
    if (!company) return reply.notFound('Company settings not found');
    return { data: company };
  });

  app.put('/api/v1/settings/company', async (request) => {
    const input = companySettingsSchema.parse(request.body);
    const userId = actorId(request);
    return prisma.$transaction(async (tx) => {
      const before = await getCompanySettings(tx);
      await tx.$executeRaw`
        INSERT INTO CompanySetting (id, companyName, legalName, phone, email, address, website, taxNumber)
        VALUES (1, ${input.companyName}, ${input.legalName ?? null}, ${input.phone ?? null}, ${input.email ?? null}, ${input.address ?? null}, ${input.website ?? null}, ${input.taxNumber ?? null})
        ON DUPLICATE KEY UPDATE
          companyName = VALUES(companyName),
          legalName = VALUES(legalName),
          phone = VALUES(phone),
          email = VALUES(email),
          address = VALUES(address),
          website = VALUES(website),
          taxNumber = VALUES(taxNumber)
      `;
      const after = await getCompanySettings(tx);
      await writeAudit(tx, {
        userId,
        action: 'COMPANY_SETTINGS_UPDATED',
        entity: 'CompanySetting',
        entityId: '1',
        beforeJson: before,
        afterJson: after,
      });
      return { data: after };
    });
  });

  app.get('/api/v1/settings/users', async (request) => {
    const query = z.object({ status: z.string().optional(), q: z.string().optional() }).parse(request.query);
    const users = await prisma.user.findMany({
      where: {
        ...(query.status ? { status: query.status as any } : {}),
        ...(query.q ? { OR: [{ name: { contains: query.q } }, { email: { contains: query.q } }] } : {}),
      },
      select: {
        id: true, name: true, email: true, status: true, roleId: true, createdAt: true, updatedAt: true,
        role: { select: { id: true, name: true } },
        employee: { select: { id: true, code: true, department: true } },
      },
      orderBy: { name: 'asc' },
    });
    return { data: users };
  });

  app.post('/api/v1/settings/users', async (request, reply) => {
    const input = userCreateSchema.parse(request.body);
    const role = await prisma.role.findUnique({ where: { id: input.roleId } });
    if (!role) return reply.badRequest('Role not found');
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return reply.conflict('Email is already in use');
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: createPasswordHash(input.password),
        roleId: input.roleId,
        status: input.status ?? 'ACTIVE',
      },
      select: { id: true, name: true, email: true, status: true, roleId: true, role: { select: { id: true, name: true } } },
    });
    return reply.code(201).send({ data: user });
  });

  app.patch('/api/v1/settings/users/:id', async (request, reply) => {
    const id = z.coerce.number().int().positive().parse((request.params as any).id);
    const input = userUpdateSchema.parse(request.body);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return reply.notFound('User not found');
    if (input.roleId) {
      const role = await prisma.role.findUnique({ where: { id: input.roleId } });
      if (!role) return reply.badRequest('Role not found');
    }
    if (input.email && input.email !== existing.email) {
      const duplicate = await prisma.user.findUnique({ where: { email: input.email } });
      if (duplicate) return reply.conflict('Email is already in use');
    }
    const data: any = { ...input };
    if (input.password) data.passwordHash = createPasswordHash(input.password);
    delete data.password;
    const user = await prisma.user.update({
      where: { id }, data,
      select: { id: true, name: true, email: true, status: true, roleId: true, role: { select: { id: true, name: true } } },
    });
    return { data: user };
  });

  app.get('/api/v1/settings/roles', async () => {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
    });
    return { data: roles };
  });

  app.post('/api/v1/settings/roles', async (request, reply) => {
    const input = roleCreateSchema.parse(request.body);
    const existing = await prisma.role.findUnique({ where: { name: input.name } });
    if (existing) return reply.conflict('Role already exists');
    const role = await prisma.role.create({ data: { name: input.name } });
    return reply.code(201).send({ data: role });
  });

  app.get('/api/v1/settings/permissions', async () => {
    const permissions = await prisma.permission.findMany({ orderBy: { key: 'asc' } });
    return { data: permissions };
  });

  app.put('/api/v1/settings/roles/:id/permissions', async (request, reply) => {
    const roleId = z.coerce.number().int().positive().parse((request.params as any).id);
    const input = permissionUpdateSchema.parse(request.body);
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return reply.notFound('Role not found');
    const permissions = await prisma.permission.findMany({ where: { id: { in: input.permissionIds } }, select: { id: true } });
    if (permissions.length !== new Set(input.permissionIds).size) return reply.badRequest('One or more permissions were not found');
    const updated = await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (input.permissionIds.length) {
        await tx.rolePermission.createMany({ data: input.permissionIds.map((permissionId) => ({ roleId, permissionId })) });
      }
      return tx.role.findUnique({ where: { id: roleId }, include: { permissions: { include: { permission: true } } } });
    });
    return { data: updated };
  });
}
