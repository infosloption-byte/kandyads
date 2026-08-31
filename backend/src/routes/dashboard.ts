import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';

export async function dashboardRoutes(app: FastifyInstance){
  app.get('/api/v1/dashboard/summary', async()=>{
    const [projects,jobs,quotes,clients] = await Promise.all([
      prisma.project.count({where:{status:{in:['PLANNED','ACTIVE','ON_HOLD']}}}),
      prisma.job.count({where:{status:{in:['READY','IN_PROGRESS','BLOCKED','REVIEW']}}}),
      prisma.quote.count({where:{status:{in:['DRAFT','SENT','VIEWED']}}}),
      prisma.client.count({where:{active:true}}),
    ]);
    return {data:{activeProjects:projects,jobsNeedingAttention:jobs,pendingQuotes:quotes,activeClients:clients}};
  });
}
