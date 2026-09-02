import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const installationSchema = z.object({
  number: z.string().min(2).max(50),
  projectId: z.coerce.number().int().positive(),
  jobId: z.coerce.number().int().positive().optional().nullable(),
  siteAddress: z.string().min(2),
  siteContact: z.string().max(150).optional().nullable(),
  scheduledAt: z.coerce.date().optional().nullable(),
  team: z.string().max(200).optional().nullable(),
  vehicle: z.string().max(100).optional().nullable(),
  status: z.string().max(50).optional().default('SCHEDULED'),
  requirements: z.string().max(5000).optional().nullable(),
  beforePhotoUrl: z.string().url().max(1000).optional().nullable(),
  afterPhotoUrl: z.string().url().max(1000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  completedAt: z.coerce.date().optional().nullable(),
});

const statusSchema = z.object({
  status: z.string().min(2).max(50),
  completedAt: z.coerce.date().optional().nullable(),
  beforePhotoUrl: z.string().url().max(1000).optional().nullable(),
  afterPhotoUrl: z.string().url().max(1000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

function includeRelations() {
  return { project: { include: { client: true } }, job: true } as const;
}

export async function installationsRoutes(app: FastifyInstance) {
  app.get('/api/v1/installations', async (request) => {
    const query = z.object({ q: z.string().optional(), status: z.string().optional(), projectId: z.coerce.number().int().positive().optional() }).parse(request.query);
    const data = await prisma.installation.findMany({
      where: {
        status: query.status,
        projectId: query.projectId,
        ...(query.q ? { OR: [{ number: { contains: query.q } }, { siteAddress: { contains: query.q } }, { team: { contains: query.q } }] } : {}),
      },
      include: includeRelations(),
      orderBy: [{ scheduledAt: 'asc' }, { id: 'desc' }],
    });
    return { data };
  });

  app.get('/api/v1/installations/:id', async (request, reply) => {
    const id = z.coerce.number().int().positive().parse((request.params as any).id);
    const installation = await prisma.installation.findUnique({ where: { id }, include: includeRelations() });
    if (!installation) return reply.notFound('Installation not found');
    const attachments = await prisma.attachment.findMany({
      where: { entityType: 'INSTALLATION', entityId: id },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { data: { ...installation, attachments } };
  });

  app.post('/api/v1/installations', async (request, reply) => {
    const input = installationSchema.parse(request.body);
    const project = await prisma.project.findUnique({ where: { id: input.projectId } });
    if (!project) return reply.badRequest('Project not found');
    if (input.jobId) {
      const job = await prisma.job.findUnique({ where: { id: input.jobId } });
      if (!job || job.projectId !== input.projectId) return reply.badRequest('Job does not belong to selected project');
    }
    if (input.status === 'COMPLETED' && (!input.beforePhotoUrl || !input.afterPhotoUrl)) {
      return reply.badRequest('Completed installations require both before and after photo URLs');
    }
    const data = await prisma.installation.create({ data: input, include: includeRelations() });
    return reply.code(201).send({ data });
  });

  app.patch('/api/v1/installations/:id/status', async (request, reply) => {
    const id = z.coerce.number().int().positive().parse((request.params as any).id);
    const input = statusSchema.parse(request.body);
    const existing = await prisma.installation.findUnique({ where: { id } });
    if (!existing) return reply.notFound('Installation not found');

    const beforePhotoUrl = input.beforePhotoUrl ?? existing.beforePhotoUrl;
    const afterPhotoUrl = input.afterPhotoUrl ?? existing.afterPhotoUrl;
    if (input.status === 'COMPLETED' && (!beforePhotoUrl || !afterPhotoUrl)) {
      return reply.badRequest('Completed installations require both before and after photo URLs');
    }

    const data = await prisma.installation.update({
      where: { id },
      data: {
        status: input.status,
        completedAt: input.completedAt ?? (input.status === 'COMPLETED' ? new Date() : existing.completedAt),
        beforePhotoUrl,
        afterPhotoUrl,
        notes: input.notes ?? existing.notes,
      },
      include: includeRelations(),
    });
    return { data };
  });
}
