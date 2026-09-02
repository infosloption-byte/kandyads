import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

function actorId(request: FastifyRequest) {
  const id = Number((request.user as { sub?: string }).sub);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function jobApprovalsRoutes(app: FastifyInstance) {
  app.post('/api/v1/approvals/jobs/:id/complete', async (request, reply) => {
    const id = z.coerce.number().int().positive().parse((request.params as any).id);
    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.job.findFirst({
        where: { id, project: { is: {} } },
        include: { tasks: { select: { id: true, status: true } } },
      });
      if (!job) throw app.httpErrors.notFound('Job not found');
      if (job.status !== 'REVIEW') throw app.httpErrors.badRequest(`Job completion approval requires REVIEW status, current status is ${job.status}`);
      const openTasks = job.tasks.filter((task) => !['COMPLETED', 'CANCELLED'].includes(task.status));
      if (openTasks.length > 0) throw app.httpErrors.badRequest('Job cannot be approved while tasks are still open');
      const updated = await tx.job.update({ where: { id }, data: { status: 'COMPLETED' }, include: { project: true, service: true } });
      await tx.auditLog.create({
        data: {
          userId: actorId(request),
          action: 'COMPLETION_APPROVED',
          entity: 'Job',
          entityId: String(id),
          beforeJson: { status: job.status },
          afterJson: { status: updated.status, approved: true },
        },
      });
      return updated;
    });
    return { data: result };
  });
}
