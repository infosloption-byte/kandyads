import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const money = (value: number) => Number(value.toFixed(2));

function calculateMaterialCost(movements: Array<{ type: string; quantity: unknown; unitCost: unknown; material: { standardCost: unknown } }>) {
  return movements.reduce((sum, movement) => {
    const cost = Number(movement.quantity) * Number(movement.unitCost ?? movement.material.standardCost);
    if (movement.type === 'RETURN') return sum - cost;
    if (movement.type === 'ISSUE' || movement.type === 'WASTE') return sum + cost;
    return sum;
  }, 0);
}

async function calculateJob(jobId: number) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { project: { include: { client: true } }, service: true },
  });
  if (!job) return null;

  const [timeEntries, stockMovements, outsourceOrders, expenses] = await Promise.all([
    prisma.timeEntry.findMany({ where: { jobId }, include: { employee: true } }),
    prisma.stockMovement.findMany({ where: { jobId }, include: { material: true } }),
    prisma.outsourceOrder.findMany({ where: { jobId } }),
    prisma.expense.findMany({ where: { jobId, status: { in: ['APPROVED', 'PAID'] } } }),
  ]);

  const labourCost = timeEntries.reduce((sum, entry) => sum + Number(entry.hours) * Number(entry.employee.hourlyCost), 0);
  const materialCost = calculateMaterialCost(stockMovements);
  const outsourceCost = outsourceOrders
    .filter((order) => order.status === 'RECEIVED')
    .reduce((sum, order) => sum + Number(order.agreedCost), 0);
  const directExpense = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const actualCost = labourCost + materialCost + outsourceCost + directExpense;
  const revenue = Number(job.revenue);
  const grossProfit = revenue - actualCost;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : null;

  return {
    job: { id: job.id, number: job.number, title: job.title, status: job.status, projectId: job.projectId, projectName: job.project.name, clientName: job.project.client.companyName, service: job.service?.name ?? null },
    revenue: money(revenue),
    estimated: {
      material: money(Number(job.estimatedMaterial)),
      labour: money(Number(job.estimatedLabour)),
      outsource: money(Number(job.estimatedOutsource)),
      expense: money(Number(job.estimatedExpense)),
      total: money(Number(job.estimatedMaterial) + Number(job.estimatedLabour) + Number(job.estimatedOutsource) + Number(job.estimatedExpense)),
    },
    actual: {
      material: money(materialCost),
      labour: money(labourCost),
      outsource: money(outsourceCost),
      expense: money(directExpense),
      total: money(actualCost),
    },
    grossProfit: money(grossProfit),
    marginPercent: margin === null ? null : money(margin),
    hours: money(timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0)),
    counts: { timeEntries: timeEntries.length, stockMovements: stockMovements.length, outsourceOrders: outsourceOrders.length, expenses: expenses.length },
  };
}

export async function profitabilityRoutes(app: FastifyInstance) {
  app.get('/api/v1/profitability/jobs/:id', async (request, reply) => {
    const id = z.coerce.number().int().positive().parse((request.params as any).id);
    const data = await calculateJob(id);
    if (!data) return reply.notFound('Job not found');
    return { data };
  });

  app.get('/api/v1/profitability/projects', async () => {
    const projects = await prisma.project.findMany({ include: { client: true, jobs: true }, orderBy: { createdAt: 'desc' } });
    const results = [];
    for (const project of projects) {
      const jobs = (await Promise.all(project.jobs.map((job) => calculateJob(job.id)))).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof calculateJob>>>[];

      const [projectTime, projectStock, projectExpenses] = await Promise.all([
        prisma.timeEntry.findMany({ where: { projectId: project.id, jobId: null }, include: { employee: true } }),
        prisma.stockMovement.findMany({ where: { projectId: project.id, jobId: null }, include: { material: true } }),
        prisma.expense.findMany({ where: { projectId: project.id, jobId: null, status: { in: ['APPROVED', 'PAID'] } } }),
      ]);

      const unassignedLabour = projectTime.reduce((sum, entry) => sum + Number(entry.hours) * Number(entry.employee.hourlyCost), 0);
      const unassignedMaterial = calculateMaterialCost(projectStock);
      const unassignedExpense = projectExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const revenue = jobs.length ? jobs.reduce((sum, item) => sum + item.revenue, 0) : Number(project.value);
      const estimatedCost = jobs.reduce((sum, item) => sum + item.estimated.total, 0);
      const actualCost = jobs.reduce((sum, item) => sum + item.actual.total, 0) + unassignedLabour + unassignedMaterial + unassignedExpense;
      const grossProfit = revenue - actualCost;
      results.push({
        id: project.id,
        number: project.number,
        name: project.name,
        clientName: project.client.companyName,
        status: project.status,
        revenue: money(revenue),
        estimatedCost: money(estimatedCost),
        actualCost: money(actualCost),
        grossProfit: money(grossProfit),
        marginPercent: revenue > 0 ? money((grossProfit / revenue) * 100) : null,
        jobs: jobs.length,
      });
    }
    return { data: results };
  });

  app.get('/api/v1/profitability/summary', async () => {
    const [jobs, projects] = await Promise.all([prisma.job.count(), prisma.project.count()]);
    const projectRows = await prisma.project.findMany({ select: { id: true, value: true } });
    const jobRows = await prisma.job.findMany({ select: { id: true } });
    const details = (await Promise.all(jobRows.map((job) => calculateJob(job.id)))).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof calculateJob>>>[];
    const revenue = details.length ? details.reduce((sum, item) => sum + item.revenue, 0) : projectRows.reduce((sum, item) => sum + Number(item.value), 0);
    const actualCost = details.reduce((sum, item) => sum + item.actual.total, 0);
    const grossProfit = revenue - actualCost;
    return { data: { projects, jobs, revenue: money(revenue), actualCost: money(actualCost), grossProfit: money(grossProfit), marginPercent: revenue > 0 ? money((grossProfit / revenue) * 100) : null } };
  });
}
