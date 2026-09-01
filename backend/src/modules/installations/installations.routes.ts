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
  beforePhotoUrl: z.string().max(500).optional().nullable(),
  afterPhotoUrl: z.string().max(500).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  completedAt: z.coerce.date().optional().nullable(),
});

export async function installationsRoutes(app: FastifyInstance) {
  app.get('/api/v1/installations', async (request) => {
    const query = z.object({ q: z.string().optional(), status: z.string().optional(), projectId: z.coerce.number().int().positive().optional() }).parse(request.query);
    const data = await prisma.installation.findMany({
      where: {
        status: query.status,
        projectId: query.projectId,
        ...(query.q ? { OR: [{ number: { contains: query.q } }, { siteAddress: { contains: query.q } }, { team: { contains: query.q } }] } : {}),
      },
      include: { project: { include: { client: true } }, job: true },
      orderBy: [{ scheduledAt: 'asc' }, { id: 'desc' }],
    });
    return { data };
  });

  app.post('/api/v1/installations', async (request, reply) => {
    const input = installationSchema.parse(request.body);
    const project = await prisma.project.findUnique({ where: { id: input.projectId } });
    if (!project) return reply.badRequest('Project not found');
    if (input.jobId) {
      const job = await prisma.job.findUnique({ where: { id: input.jobId } });
      if (!job || job.projectId !== input.projectId) return reply.badRequest('Job does not belong to selected project');
    }
    const data = await prisma.installation.create({ data: input, include: { project: { include: { client: true } }, job: true } });
    return reply.code(201).send({ data });
  });

  app.patch('/api/v1/installations/:id/status', async (request, reply) => {
    const id = z.coerce.number().int().positive().parse((request.params as any).id);
    const input = z.object({ status: z.string().min(2).max(50), completedAt: z.coerce.date().optional().nullable(), afterPhotoUrl: z.string().max(500).optional().nullable() }).parse(request.body);
    const existing = await prisma.installation.findUnique({ where: { id } });
    if (!existing) return reply.notFound('Installation not found');
    const data = await prisma.installation.update({
      where: { id },
      data: {
        status: input.status,
        completedAt: input.completedAt ?? (input.status === 'COMPLETED' ? new Date() : existing.completedAt),
        afterPhotoUrl: input.afterPhotoUrl ?? existing.afterPhotoUrl,
      },
      include: { project: { include: { client: true } }, job: true },
    });
    return { data };
  });
}
