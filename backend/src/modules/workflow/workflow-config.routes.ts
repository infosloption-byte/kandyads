import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { actorId, writeAudit } from '../audit/audit.service.js';
import { loadWorkflowConfiguration, replaceWorkflowConfiguration, workflowEntities, workflowRows, workflowStatuses, type WorkflowEntity } from './workflow.config.js';

const transitionSchema = z.object({
  fromStatus: z.string().min(1).max(50),
  toStatus: z.string().min(1).max(50),
  active: z.boolean().default(true),
});
const updateSchema = z.object({ transitions: z.array(transitionSchema).max(100) });
const entitySchema = z.enum(workflowEntities);

export async function workflowConfigRoutes(app: FastifyInstance) {
  app.get('/api/v1/settings/workflows', async () => {
    const rows = await prisma.$queryRaw<Array<any>>`
      SELECT id, entity, fromStatus, toStatus, active, updatedAt
      FROM WorkflowTransition
      ORDER BY entity ASC, fromStatus ASC, toStatus ASC
    `;
    return {
      data: workflowEntities.map((entity) => ({
        entity,
        statuses: workflowStatuses[entity],
        transitions: rows.filter((row) => row.entity === entity).map((row) => ({
          id: Number(row.id), fromStatus: row.fromStatus, toStatus: row.toStatus, active: Boolean(row.active), updatedAt: row.updatedAt,
        })),
      })),
    };
  });

  app.get('/api/v1/settings/workflows/:entity', async (request, reply) => {
    const entity = entitySchema.parse((request.params as any).entity);
    const rows = await prisma.$queryRaw<Array<any>>`
      SELECT id, entity, fromStatus, toStatus, active, updatedAt
      FROM WorkflowTransition
      WHERE entity = ${entity}
      ORDER BY fromStatus ASC, toStatus ASC
    `;
    return { data: { entity, statuses: workflowStatuses[entity], transitions: rows.map((row) => ({ id: Number(row.id), fromStatus: row.fromStatus, toStatus: row.toStatus, active: Boolean(row.active), updatedAt: row.updatedAt })) } };
  });

  app.put('/api/v1/settings/workflows/:entity', async (request, reply) => {
    const entity = entitySchema.parse((request.params as any).entity);
    const input = updateSchema.parse(request.body);
    const allowed = new Set(workflowStatuses[entity]);
    const seen = new Set<string>();
    for (const row of input.transitions) {
      if (!allowed.has(row.fromStatus) || !allowed.has(row.toStatus)) return reply.badRequest(`Invalid ${entity} workflow status`);
      if (row.fromStatus === row.toStatus) return reply.badRequest('A workflow transition cannot target the same status');
      const key = `${row.fromStatus}->${row.toStatus}`;
      if (seen.has(key)) return reply.conflict(`Duplicate workflow transition: ${key}`);
      seen.add(key);
    }
    const before = await prisma.$queryRaw<Array<any>>`
      SELECT id, entity, fromStatus, toStatus, active, updatedAt
      FROM WorkflowTransition
      WHERE entity = ${entity}
      ORDER BY fromStatus ASC, toStatus ASC
    `;
    await replaceWorkflowConfiguration(entity as WorkflowEntity, input.transitions);
    await writeAudit(prisma, {
      userId: actorId(request),
      action: 'WORKFLOW_CONFIGURATION_UPDATED',
      entity: 'WorkflowTransition',
      entityId: entity,
      beforeJson: before,
      afterJson: input.transitions,
    });
    await loadWorkflowConfiguration();
    return { data: { entity, statuses: workflowStatuses[entity], transitions: workflowRows(entity) } };
  });
}
