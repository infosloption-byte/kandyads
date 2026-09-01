import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const statusSchema = z.object({
  status: z.enum(['DRAFT','READY','IN_PROGRESS','BLOCKED','REVIEW','COMPLETED','CANCELLED']),
});
const assignmentSchema = z.object({
  employeeId: z.coerce.number().int().positive().optional().nullable(),
  vendorId: z.coerce.number().int().positive().optional().nullable(),
  estimatedHours: z.coerce.number().nonnegative().optional().nullable(),
  agreedCost: z.coerce.number().nonnegative().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
}).refine(v => !!v.employeeId || !!v.vendorId, { message: 'Employee or vendor is required' });
const materialReqSchema = z.object({
  materialId: z.coerce.number().int().positive(),
  requiredQty: z.coerce.number().positive(),
});

export async function jobOperationsRoutes(app: FastifyInstance) {
  app.patch('/api/v1/jobs/:id/status', async (request, reply) => {
    const id = z.coerce.number().int().positive().parse((request.params as any).id);
    const input = statusSchema.parse(request.body);
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return reply.notFound('Job not found');
    const data = await prisma.job.update({ where: { id }, data: { status: input.status }, include: { project: true, service: true } });
    return { data };
  });

  app.post('/api/v1/jobs/:id/assignments', async (request, reply) => {
    const jobId = z.coerce.number().int().positive().parse((request.params as any).id);
    const input = assignmentSchema.parse(request.body);
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return reply.notFound('Job not found');
    if (input.employeeId) {
      const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
      if (!employee) return reply.badRequest('Employee not found');
    }
    if (input.vendorId) {
      const vendor = await prisma.vendor.findUnique({ where: { id: input.vendorId } });
      if (!vendor) return reply.badRequest('Vendor not found');
    }
    const data = await prisma.jobAssignment.create({ data: { jobId, ...input }, include: { employee: true, vendor: true } });
    return reply.code(201).send({ data });
  });

  app.post('/api/v1/jobs/:id/material-requirements', async (request, reply) => {
    const jobId = z.coerce.number().int().positive().parse((request.params as any).id);
    const input = materialReqSchema.parse(request.body);
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return reply.notFound('Job not found');
    const material = await prisma.material.findUnique({ where: { id: input.materialId } });
    if (!material) return reply.badRequest('Material not found');
    const data = await prisma.materialRequirement.create({ data: { jobId, materialId: input.materialId, requiredQty: input.requiredQty }, include: { material: true } });
    return reply.code(201).send({ data });
  });
}
