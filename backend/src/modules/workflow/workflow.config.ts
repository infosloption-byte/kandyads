import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { enquiryTransitions, jobTransitions, projectTransitions, quoteTransitions, taskTransitions } from './workflow.rules.js';

export const workflowEntities = ['QUOTE', 'ENQUIRY', 'PROJECT', 'JOB', 'TASK'] as const;
export type WorkflowEntity = typeof workflowEntities[number];

export const workflowStatuses: Record<WorkflowEntity, readonly string[]> = {
  QUOTE: ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
  ENQUIRY: ['OPEN', 'QUOTING', 'CONVERTED', 'CLOSED'],
  PROJECT: ['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
  JOB: ['DRAFT', 'READY', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'COMPLETED', 'CANCELLED'],
  TASK: ['PENDING', 'READY', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'COMPLETED', 'CANCELLED'],
};

function mapFor(entity: WorkflowEntity): Record<string, string[]> {
  switch (entity) {
    case 'QUOTE': return quoteTransitions;
    case 'ENQUIRY': return enquiryTransitions;
    case 'PROJECT': return projectTransitions;
    case 'JOB': return jobTransitions;
    case 'TASK': return taskTransitions;
  }
}

export function workflowRows(entity: WorkflowEntity) {
  const map = mapFor(entity);
  return workflowStatuses[entity].flatMap((from) =>
    (map[from] ?? []).map((to) => ({ fromStatus: from, toStatus: String(to), active: true }))
  );
}

export async function loadWorkflowConfiguration(client: Pick<PrismaClient, '$queryRaw'> = prisma) {
  const rows = await client.$queryRaw<Array<{ entity: WorkflowEntity; fromStatus: string; toStatus: string; active: boolean }>>(Prisma.sql`
    SELECT entity, fromStatus, toStatus, active
    FROM WorkflowTransition
    WHERE active = true
    ORDER BY entity ASC, id ASC
  `);
  const grouped = new Map<WorkflowEntity, Array<{ fromStatus: string; toStatus: string }>>();
  for (const row of rows) {
    const list = grouped.get(row.entity) ?? [];
    list.push({ fromStatus: row.fromStatus, toStatus: row.toStatus });
    grouped.set(row.entity, list);
  }
  for (const entity of workflowEntities) {
    const map = mapFor(entity);
    for (const status of workflowStatuses[entity]) map[status] = [];
    for (const row of grouped.get(entity) ?? []) (map[row.fromStatus] ??= []).push(row.toStatus);
  }
}

export async function replaceWorkflowConfiguration(entity: WorkflowEntity, transitions: Array<{ fromStatus: string; toStatus: string; active: boolean }>) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`DELETE FROM WorkflowTransition WHERE entity = ${entity}`);
    for (const transition of transitions) {
      if (!transition.active) continue;
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO WorkflowTransition (entity, fromStatus, toStatus, active)
        VALUES (${entity}, ${transition.fromStatus}, ${transition.toStatus}, true)
      `);
    }
  });
  await loadWorkflowConfiguration();
}
