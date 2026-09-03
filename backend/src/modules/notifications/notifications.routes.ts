import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

type NotificationRow={id:number;userId:number;type:string;title:string;message:string;entityType:string|null;entityId:number|null;dedupeKey:string;readAt:Date|null;createdAt:Date};

export async function notificationsRoutes(app:FastifyInstance){
  app.get('/api/v1/notifications',async(request)=>{
    const q=z.object({unreadOnly:z.coerce.boolean().default(false),limit:z.coerce.number().int().min(1).max(100).default(50)}).parse(request.query);
    const userId=Number((request.user as {id?:number}).id);
    const rows=await prisma.$queryRaw<NotificationRow[]>`SELECT id,userId,type,title,message,entityType,entityId,dedupeKey,readAt,createdAt FROM Notification WHERE userId=${userId} ${q.unreadOnly?prisma.$queryRawUnsafe('AND readAt IS NULL'):prisma.$queryRawUnsafe('')} ORDER BY createdAt DESC LIMIT ${q.limit}`;
    const [{count}]=await prisma.$queryRaw<{count:bigint}[]>`SELECT COUNT(*) as count FROM Notification WHERE userId=${userId} AND readAt IS NULL`;
    return {data:rows.map(r=>({...r,id:Number(r.id),userId:Number(r.userId),entityId:r.entityId==null?null:Number(r.entityId)})),meta:{unreadCount:Number(count)}};
  });

  app.post('/api/v1/notifications/:id/read',async(request)=>{
    const params=z.object({id:z.coerce.number().int().positive()}).parse(request.params);const userId=Number((request.user as {id?:number}).id);
    const result=await prisma.$executeRaw`UPDATE Notification SET readAt=COALESCE(readAt,CURRENT_TIMESTAMP(3)) WHERE id=${params.id} AND userId=${userId}`;
    if(!result)return app.httpErrors.notFound('Notification not found');
    return {data:{id:params.id,read:true}};
  });

  app.post('/api/v1/notifications/read-all',async(request)=>{const userId=Number((request.user as {id?:number}).id);const result=await prisma.$executeRaw`UPDATE Notification SET readAt=CURRENT_TIMESTAMP(3) WHERE userId=${userId} AND readAt IS NULL`;return {data:{updated:Number(result)}};});

  app.post('/api/v1/notifications/generate',async()=>{
    const users=await prisma.user.findMany({where:{status:'ACTIVE'},select:{id:true,employee:{select:{id:true}}}});
    let created=0;
    for(const user of users){
      if(!user.employee)continue;
      const employeeId=user.employee.id;
      const assignments=await prisma.jobAssignment.findMany({where:{employeeId},include:{job:{select:{id:true,number:true,title:true}}}});
      for(const assignment of assignments){const key=`JOB_ASSIGNMENT:${user.id}:${assignment.jobId}:${assignment.id}`;created+=Number(await prisma.$executeRaw`INSERT IGNORE INTO Notification (userId,type,title,message,entityType,entityId,dedupeKey) VALUES (${user.id},'JOB_ASSIGNMENT','Job assigned',${`You have been assigned to ${assignment.job.number} · ${assignment.job.title}.`},'JOB',${assignment.jobId},${key})`);}
      const tasks=await prisma.task.findMany({where:{employeeId,status:{notIn:['COMPLETED','CANCELLED']},dueDate:{not:null}},select:{id,title,dueDate,jobId,job:{select:{number:true}}}});
      for(const task of tasks){if(!task.dueDate)continue;const overdue=task.dueDate<new Date();const key=`TASK_DUE:${user.id}:${task.id}:${overdue?'OVERDUE':'DUE'}`;created+=Number(await prisma.$executeRaw`INSERT IGNORE INTO Notification (userId,type,title,message,entityType,entityId,dedupeKey) VALUES (${user.id},${overdue?'TASK_OVERDUE':'TASK_DUE'},${overdue?'Task overdue':'Task due soon'},${overdue?`Task ${task.title} for ${task.job.number} is overdue.`:`Task ${task.title} for ${task.job.number} is due on ${task.dueDate.toISOString().slice(0,10)}.`},'TASK',${task.id},${key})`);}
    }
    const materials=await prisma.material.findMany({where:{active:true},select:{id:true,sku:true,name:true,reorderLevel:true,movements:{select:{type:true,quantity:true}}}});
    for(const material of materials){const stock=material.movements.reduce((s,m)=>s+(m.type==='ISSUE'||m.type==='WASTE'?-Number(m.quantity):m.type==='TRANSFER'?0:Number(m.quantity)),0);if(Number(material.reorderLevel)<=0||stock>Number(material.reorderLevel))continue;for(const user of users){const key=`LOW_STOCK:${user.id}:${material.id}`;created+=Number(await prisma.$executeRaw`INSERT IGNORE INTO Notification (userId,type,title,message,entityType,entityId,dedupeKey) VALUES (${user.id},'LOW_STOCK','Low stock',${`${material.sku} · ${material.name} is at ${stock}, at or below reorder level ${material.reorderLevel}.`},'MATERIAL',${material.id},${key})`);}}
    return {data:{created}};
  });
}
