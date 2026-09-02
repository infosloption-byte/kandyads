import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const money = (value:number) => Number(value.toFixed(2));

export async function dashboardRoutes(app:FastifyInstance){
  app.get('/api/v1/dashboard/summary',async()=>{const [projects,jobs,quotes,clients]=await Promise.all([prisma.project.count({where:{status:{in:['PLANNED','ACTIVE','ON_HOLD']}}}),prisma.job.count({where:{status:{in:['READY','IN_PROGRESS','BLOCKED','REVIEW']}}}),prisma.quote.count({where:{status:{in:['DRAFT','SENT','VIEWED']}}}),prisma.client.count({where:{active:true}})]);return {data:{activeProjects:projects,jobsNeedingAttention:jobs,pendingQuotes:quotes,activeClients:clients}}});

  app.get('/api/v1/dashboard/operational',async(request)=>{
    const q=z.object({days:z.coerce.number().int().min(1).max(90).default(14)}).parse(request.query);
    const now=new Date(); const horizon=new Date(now.getTime()+q.days*86400000);
    const [jobs, reorderAlerts, purchaseOrders, installations, employees, invoices, expenses, timeEntries, movements, outsourceOrders]=await Promise.all([
      prisma.job.findMany({where:{status:{notIn:['COMPLETED','CANCELLED']},dueDate:{not:null}},include:{project:{select:{number:true,name:true}}},orderBy:{dueDate:'asc'},take:50}),
      prisma.material.findMany({where:{active:true},include:{category:true,preferredVendor:true,movements:{select:{type:true,quantity:true}}},orderBy:{name:'asc'}}),
      prisma.purchaseOrder.findMany({where:{status:{notIn:['RECEIVED','CANCELLED']},expectedDate:{not:null}},include:{vendor:true,project:{select:{number:true,name:true}}},orderBy:{expectedDate:'asc'},take:50}),
      prisma.installation.findMany({where:{scheduledAt:{gte:now,lte:horizon}},include:{project:{select:{number:true,name:true,client:{select:{companyName:true}}}},job:{select:{number:true,title:true}}},orderBy:{scheduledAt:'asc'},take:50}),
      prisma.employee.findMany({where:{status:'ACTIVE'},select:{id:true,code:true,name:true,department:true,tasks:{where:{status:{notIn:['COMPLETED','CANCELLED'] as any}},select:{estimatedHours:true,actualHours:true,dueDate:true}}},orderBy:{name:'asc'}}),
      prisma.invoice.findMany({where:{status:{not:'CANCELLED'}},select:{total:true,balance:true,status:true,dueDate:true}}),
      prisma.expense.findMany({where:{status:{in:['APPROVED','PAID']}},select:{amount:true}}),
      prisma.timeEntry.findMany({include:{employee:{select:{hourlyCost:true}},job:{select:{revenue:true}}}}),
      prisma.stockMovement.findMany({where:{jobId:{not:null}},include:{material:{select:{standardCost:true}}},select:{type:true,quantity:true,unitCost:true,material:{select:{standardCost:true}}}}),
      prisma.outsourceOrder.findMany({where:{status:'RECEIVED'},select:{agreedCost:true}}),
    ]);

    const dueJobs=jobs.filter(j=>j.dueDate && j.dueDate<now); const upcomingJobs=jobs.filter(j=>j.dueDate && j.dueDate>=now && j.dueDate<=horizon);
    const liveAlerts=reorderAlerts.map(m=>{const onHand=m.movements.reduce((sum,row)=>{const n=Number(row.quantity);return sum+(row.type==='ISSUE'||row.type==='WASTE'?-n:row.type==='TRANSFER'?0:n)},0);return {...m,movements:undefined,stockOnHand:money(onHand),availableQty:money(onHand),reorderAlert:Number(m.reorderLevel)>0&&onHand<=Number(m.reorderLevel)}}).filter(m=>m.reorderAlert);
    const duePurchases=purchaseOrders.filter(po=>po.expectedDate&&po.expectedDate<=horizon).map(po=>({id:po.id,number:po.number,vendor:po.vendor.companyName,expectedDate:po.expectedDate,status:po.status,total:money(Number(po.total)),project:po.project?{number:po.project.number,name:po.project.name}:null,overdue:po.expectedDate<now}));
    const revenue=invoices.reduce((sum,i)=>sum+Number(i.total),0); const receivables=invoices.reduce((sum,i)=>sum+Number(i.balance),0); const overdueReceivables=invoices.filter(i=>i.dueDate<now&&Number(i.balance)>0).reduce((sum,i)=>sum+Number(i.balance),0);
    const labour=timeEntries.reduce((sum,e)=>sum+Number(e.hours)*Number(e.employee.hourlyCost),0); const material=movements.reduce((sum,m)=>{const cost=Number(m.quantity)*Number(m.unitCost??m.material.standardCost);return m.type==='RETURN'?sum-cost:(m.type==='ISSUE'||m.type==='WASTE')?sum+cost:sum},0); const outsource=outsourceOrders.reduce((sum,o)=>sum+Number(o.agreedCost),0); const expenseTotal=expenses.reduce((sum,e)=>sum+Number(e.amount),0); const profit=revenue-labour-material-outsource-expenseTotal;
    const workload=employees.map(e=>{const planned=e.tasks.reduce((s,t)=>s+Number(t.estimatedHours??0),0);const actual=e.tasks.reduce((s,t)=>s+Number(t.actualHours??0),0);const overdue=e.tasks.filter(t=>t.dueDate&&t.dueDate<now).length;return {id:e.id,code:e.code,name:e.name,department:e.department,assignedTaskCount:e.tasks.length,plannedHours:money(planned),actualHours:money(actual),remainingHours:money(Math.max(0,planned-actual)),overdueTasks:overdue}});
    return {data:{window:{days:q.days,from:now,to:horizon},jobs:{due:dueJobs.map(j=>({id:j.id,number:j.number,title:j.title,status:j.status,dueDate:j.dueDate,project:j.project,overdue:true})),upcoming:upcomingJobs.map(j=>({id:j.id,number:j.number,title:j.title,status:j.status,dueDate:j.dueDate,project:j.project,overdue:false}))},purchasing:{due:duePurchases},inventory:{reorderAlerts:liveAlerts},finance:{revenue:money(revenue),expenses:money(expenseTotal),profit:money(profit),receivables:money(receivables),overdueReceivables:money(overdueReceivables)},workload,installations:installations.map(i=>({id:i.id,number:i.number,scheduledAt:i.scheduledAt,status:i.status,siteAddress:i.siteAddress,team:i.team,vehicle:i.vehicle,project:{number:i.project.number,name:i.project.name,clientName:i.project.client.companyName},job:i.job?{number:i.job.number,title:i.job.title}:null}))}};
  });
}
