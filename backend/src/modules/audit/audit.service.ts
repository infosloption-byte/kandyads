import type { FastifyRequest } from 'fastify';

export type AuditClient = {
  auditLog: {
    create: (args: any) => Promise<any>;
  };
};

export function actorId(request: FastifyRequest) {
  const id = Number((request.user as { sub?: string }).sub);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function writeAudit(
  client: AuditClient,
  input: {
    userId?: number | null;
    action: string;
    entity: string;
    entityId: string | number;
    beforeJson?: unknown;
    afterJson?: unknown;
  },
) {
  return client.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: String(input.entityId),
      beforeJson: input.beforeJson === undefined ? undefined : input.beforeJson as any,
      afterJson: input.afterJson === undefined ? undefined : input.afterJson as any,
    },
  });
}
