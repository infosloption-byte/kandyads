import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const currentUserId=(request:unknown)=>Number((request as {user?:{sub?:string}}).user?.sub);

export async function notificationsRoutes(app:FastifyInstance){
  app.get('/api/v1/notifications',async(request)=>{
    const q=z.object({unreadOnly:z.coerce.boolean().default(false),limit:z.coerce.number().int().min(1).max(100).default(50)}).parse(request.query);
    const userId=currentUserId(request);
    const rows=q.unreadOnly
      ? await prisma.$queryRaw<any[]>`SELECT id,userId,type,title,message,entityType,entityId,dedupeKey,readAt,createdAt FROM Notification WHERE userId=${userId} AND readAt IS NULL ORDER BY createdAt DESC LIMIT ${q.limit}`
      : await prisma.$queryRaw<any[]>`SELECT id,userId,type,title,message,entityType,entityId,dedupeKey,readAt,createdAt FROM Notification WHERE userId=${userId} ORDER BY createdAt DESC LIMIT ${q.limit}`;
    const [{count}]=await prisma.$queryRaw<{count:bigint}[]>`SELECT COUNT(*) AS count FROM Notification WHERE userId=${userId} AND readAt IS NULL`;
    return {data:rows.map(r=>({...r,id:Number(r.id),userId:Number(r.userId),entityId:r.entityId==null?null:Number(r.entityId)})),meta:{unreadCount:Number(count)}};
  });

  app.post('/api/v1/notifications/:id/read',async(request)=>{
    const rawId=(request.params as {id?:unknown})?.id;
    const notificationId=Number(rawId);
    if(!Number.isSafeInteger(notificationId)||notificationId<=0)throw app.httpErrors.badRequest('Invalid notification id');
    const userId=currentUserId(request);
    const result=await prisma.$executeRaw`UPDATE Notification SET readAt=COALESCE(readAt,CURRENT_TIMESTAMP(3)) WHERE id=${notificationId} AND userId=${userId}`;
    if(!result)return app.httpErrors.notFound('Notification not found');
    return {data:{id:notificationId,read:true}};
  });

  app.post('/api/v1/notifications/read-all',async(request)=>{
    const result=await prisma.$executeRaw`UPDATE Notification SET readAt=CURRENT_TIMESTAMP(3) WHERE userId=${currentUserId(request)} AND readAt IS NULL`;
    return {data:{updated:Number(result)}};
  });

  app.post('/api/v1/notifications/generate',async(request)=>{
    const userId=currentUserId(request);
    const user=await prisma.user.findUnique({where:{id:userId},select:{id:true,employee:{select:{id:true}}}});
    if(!user)return app.httpErrors.unauthorized('Authenticated user not found');
    if(!user.employee)return {data:{created:0}};
    let created=0;

    const assignments=await prisma.jobAssignment.findMany({where:{employeeId:user.employee.id},include:{job:{select:{number:true,title:true}}}});
    for(const assignment of assignments){
      const key=`JOB_ASSIGNMENT:${user.id}:${assignment.jobId}:${assignment.id}`;
      created+=Number(await prisma.$executeRaw`INSERT IGNORE INTO Notification (userId,type,title,message,entityType,entityId,dedupeKey) VALUES (${user.id},'JOB_ASSIGNMENT','Job assigned',${`You have been assigned to ${assignment.job.number} · ${assignment.job.title}.`},'JOB',${assignment.jobId},${key})`);
    }

    const tasks=await prisma.task.findMany({where:{employeeId:user.employee.id,status:{notIn:['COMPLETED','CANCELLED']},dueDate:{not:null}},select:{id:true,title:true,dueDate:true,jobId:true,job:{select:{number:true}}}});
    for(const task of tasks){
      if(task.dueDate===null)continue;
      const overdue=task.dueDate<new Date();
      const key=`TASK_DUE:${user.id}:${task.id}:${overdue?'OVERDUE':'DUE'}`;
      created+=Number(await prisma.$executeRaw`INSERT IGNORE INTO Notification (userId,type,title,message,entityType,entityId,dedupeKey) VALUES (${user.id},${overdue?'TASK_OVERDUE':'TASK_DUE'},${overdue?'Task overdue':'Task due soon'},${overdue?`Task ${task.title} for ${task.job.number} is overdue.`:`Task ${task.title} for ${task.job.number} is due on ${task.dueDate.toISOString().slice(0,10)}.`},'TASK',${task.id},${key})`);
    }

    const materials=await prisma.material.findMany({where:{active:true},select:{id:true,sku:true,name:true,reorderLevel:true,movements:{select:{type:true,quantity:true}}}});
    for(const material of materials){
      const stock=material.movements.reduce((sum,movement)=>sum+(movement.type==='ISSUE'||movement.type==='WASTE'?-Number(movement.quantity):movement.type==='TRANSFER'?0:Number(movement.quantity)),0);
      if(Number(material.reorderLevel)<=0||stock>Number(material.reorderLevel))continue;
      const key=`LOW_STOCK:${user.id}:${material.id}`;
      created+=Number(await prisma.$executeRaw`INSERT IGNORE INTO Notification (userId,type,title,message,entityType,entityId,dedupeKey) VALUES (${user.id},'LOW_STOCK','Low stock',${`${material.sku} · ${material.name} is at ${stock}, at or below reorder level ${material.reorderLevel}.`},'MATERIAL',${material.id},${key})`);
    }
    return {data:{created}};
  });
}
