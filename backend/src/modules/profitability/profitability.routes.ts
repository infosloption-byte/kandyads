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
  const job = await prisma.job.findFirst({
    where: { id: jobId, project: { is: {} } },
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
  const outsourceCost = outsourceOrders.filter((order) => order.status === 'RECEIVED').reduce((sum, order) => sum + Number(order.agreedCost), 0);
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
    actual: { material: money(materialCost), labour: money(labourCost), outsource: money(outsourceCost), expense: money(directExpense), total: money(actualCost) },
    grossProfit: money(grossProfit),
    marginPercent: margin === null ? null : money(margin),
    hours: money(timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0)),
    counts: { timeEntries: timeEntries.length, stockMovements: stockMovements.length, outsourceOrders: outsourceOrders.length, expenses: expenses.length },
  };
}

function variance(estimated: number, actual: number) {
  const amount = money(actual - estimated);
  return { estimated: money(estimated), actual: money(actual), variance: amount, variancePercent: estimated > 0 ? money((amount / estimated) * 100) : null };
}

export async function profitabilityRoutes(app: FastifyInstance) {
  app.get('/api/v1/profitability/jobs', async () => {
    const jobs = await prisma.job.findMany({ where: { project: { is: {} } }, select: { id: true }, orderBy: { createdAt: 'desc' } });
    const data = (await Promise.all(jobs.map((job) => calculateJob(job.id)))).filter(Boolean);
    return { data };
  });

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
      results.push({ id: project.id, number: project.number, name: project.name, clientName: project.client.companyName, status: project.status, revenue: money(revenue), estimatedCost: money(estimatedCost), actualCost: money(actualCost), grossProfit: money(grossProfit), marginPercent: revenue > 0 ? money((grossProfit / revenue) * 100) : null, jobs: jobs.length });
    }
    return { data: results };
  });

  app.get('/api/v1/profitability/estimate-vs-actual', async (request) => {
    const query = z.object({ projectId: z.coerce.number().int().positive().optional(), jobId: z.coerce.number().int().positive().optional() }).parse(request.query);
    const where = { project: { is: {} }, ...(query.projectId ? { projectId: query.projectId } : {}), ...(query.jobId ? { id: query.jobId } : {}) };
    const jobs = await prisma.job.findMany({ where, select: { id: true }, orderBy: { createdAt: 'desc' } });
    const details = (await Promise.all(jobs.map((job) => calculateJob(job.id)))).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof calculateJob>>>[];
    const rows = details.map((detail) => ({
      job: detail.job,
      revenue: detail.revenue,
      material: variance(detail.estimated.material, detail.actual.material),
      labour: variance(detail.estimated.labour, detail.actual.labour),
      outsource: variance(detail.estimated.outsource, detail.actual.outsource),
      expense: variance(detail.estimated.expense, detail.actual.expense),
      total: variance(detail.estimated.total, detail.actual.total),
    }));
    const totals = rows.reduce((sum, row) => ({
      material: { estimated: sum.material.estimated + row.material.estimated, actual: sum.material.actual + row.material.actual },
      labour: { estimated: sum.labour.estimated + row.labour.estimated, actual: sum.labour.actual + row.labour.actual },
      outsource: { estimated: sum.outsource.estimated + row.outsource.estimated, actual: sum.outsource.actual + row.outsource.actual },
      expense: { estimated: sum.expense.estimated + row.expense.estimated, actual: sum.expense.actual + row.expense.actual },
      total: { estimated: sum.total.estimated + row.total.estimated, actual: sum.total.actual + row.total.actual },
    }), { material: { estimated: 0, actual: 0 }, labour: { estimated: 0, actual: 0 }, outsource: { estimated: 0, actual: 0 }, expense: { estimated: 0, actual: 0 }, total: { estimated: 0, actual: 0 } });
    return { data: { rows, totals: { material: variance(totals.material.estimated, totals.material.actual), labour: variance(totals.labour.estimated, totals.labour.actual), outsource: variance(totals.outsource.estimated, totals.outsource.actual), expense: variance(totals.expense.estimated, totals.expense.actual), total: variance(totals.total.estimated, totals.total.actual) } } };
  });

  app.get('/api/v1/profitability/summary', async () => {
    const projectRows = await prisma.project.findMany({ select: { id: true, value: true } });
    const jobRows = await prisma.job.findMany({ where: { project: { is: {} } }, select: { id: true } });
    const [projects, jobs, details] = await Promise.all([
      prisma.project.count(),
      prisma.job.count({ where: { project: { is: {} } } }),
      Promise.all(jobRows.map((job) => calculateJob(job.id))),
    ]);
    const validDetails = details.filter(Boolean) as NonNullable<Awaited<ReturnType<typeof calculateJob>>>[];
    const revenue = validDetails.length ? validDetails.reduce((sum, item) => sum + item.revenue, 0) : projectRows.reduce((sum, item) => sum + Number(item.value), 0);
    const actualCost = validDetails.reduce((sum, item) => sum + item.actual.total, 0);
    const grossProfit = revenue - actualCost;
    return { data: { projects, jobs, revenue: money(revenue), actualCost: money(actualCost), grossProfit: money(grossProfit), marginPercent: revenue > 0 ? money((grossProfit / revenue) * 100) : null } };
  });
}
