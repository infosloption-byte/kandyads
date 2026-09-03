import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const currentUserId=(request:unknown)=>Number((request as {user?:{sub?:string}}).user?.sub);

async function insertNotification(userId:number,type:string,title:string,message:string,entityType:string,entityId:number,key:string){
  return Number(await prisma.$executeRaw`INSERT IGNORE INTO Notification (userId,type,title,message,entityType,entityId,dedupeKey) VALUES (${userId},${type},${title},${message},${entityType},${entityId},${key})`);
}

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
    let created=0;

    if(user.employee){
      const assignments=await prisma.jobAssignment.findMany({where:{employeeId:user.employee.id},include:{job:{select:{number:true,title:true}}}});
      for(const assignment of assignments){
        created+=await insertNotification(user.id,'JOB_ASSIGNMENT','Job assigned',`You have been assigned to ${assignment.job.number} · ${assignment.job.title}.`,'JOB',assignment.jobId,`JOB_ASSIGNMENT:${user.id}:${assignment.jobId}:${assignment.id}`);
      }

      const tasks=await prisma.task.findMany({where:{employeeId:user.employee.id,status:{notIn:['COMPLETED','CANCELLED']},dueDate:{not:null}},select:{id:true,title:true,dueDate:true,jobId:true,job:{select:{number:true}}}});
      for(const task of tasks){
        if(task.dueDate===null)continue;
        const overdue=task.dueDate<new Date();
        created+=await insertNotification(user.id,overdue?'TASK_OVERDUE':'TASK_DUE',overdue?'Task overdue':'Task due soon',overdue?`Task ${task.title} for ${task.job.number} is overdue.`:`Task ${task.title} for ${task.job.number} is due on ${task.dueDate.toISOString().slice(0,10)}.`,'TASK',task.id,`TASK_DUE:${user.id}:${task.id}:${overdue?'OVERDUE':'DUE'}`);
      }
    }

    const materials=await prisma.material.findMany({where:{active:true},select:{id:true,sku:true,name:true,reorderLevel:true,movements:{select:{type:true,quantity:true}}}});
    for(const material of materials){
      const stock=material.movements.reduce((sum,movement)=>sum+(movement.type==='ISSUE'||movement.type==='WASTE'?-Number(movement.quantity):movement.type==='TRANSFER'?0:Number(movement.quantity)),0);
      if(Number(material.reorderLevel)<=0||stock>Number(material.reorderLevel))continue;
      created+=await insertNotification(user.id,'LOW_STOCK','Low stock',`${material.sku} · ${material.name} is at ${stock}, at or below reorder level ${material.reorderLevel}.`,'MATERIAL',material.id,`LOW_STOCK:${user.id}:${material.id}`);
    }

    const now=new Date();
    const reminderUntil=new Date(now.getTime()+7*24*60*60*1000);
    const purchaseOrders=await prisma.purchaseOrder.findMany({where:{status:{in:['SENT','PARTIALLY_RECEIVED']},expectedDate:{not:null,lte:reminderUntil}},select:{id:numberType(),number:true,expectedDate:true,vendor:{select:{companyName:true}}}});
    for(const order of purchaseOrders){
      if(!order.expectedDate)continue;
      const overdue=order.expectedDate<now;
      created+=await insertNotification(user.id,overdue?'PURCHASE_DELIVERY_OVERDUE':'PURCHASE_DELIVERY','Purchase delivery',overdue?`Purchase order ${order.number} from ${order.vendor.companyName} is overdue for delivery.`:`Purchase order ${order.number} from ${order.vendor.companyName} is due by ${order.expectedDate.toISOString().slice(0,10)}.`,'PURCHASE_ORDER',order.id,`PURCHASE_DELIVERY:${user.id}:${order.id}:${overdue?'OVERDUE':'DUE'}`);
    }

    const installations=await prisma.installation.findMany({where:{status:{notIn:['COMPLETED','CANCELLED']},scheduledAt:{not:null,lte:reminderUntil}},select:{id:true,number:true,scheduledAt:true,siteAddress:true}});
    for(const installation of installations){
      if(!installation.scheduledAt)continue;
      const overdue=installation.scheduledAt<now;
      created+=await insertNotification(user.id,'INSTALLATION_REMINDER','Installation reminder',overdue?`Installation ${installation.number} at ${installation.siteAddress} is overdue.`:`Installation ${installation.number} at ${installation.siteAddress} is scheduled for ${installation.scheduledAt.toISOString().slice(0,16).replace('T',' ')}.`,'INSTALLATION',installation.id,`INSTALLATION_REMINDER:${user.id}:${installation.id}:${overdue?'OVERDUE':'DUE'}`);
    }

    const quotes=await prisma.quote.findMany({where:{status:{in:['SENT','VIEWED']},validUntil:{not:null,lte:reminderUntil}},select:{id:true,number:true,validUntil:true,client:{select:{companyName:true}}}});
    for(const quote of quotes){
      if(!quote.validUntil)continue;
      const expired=quote.validUntil<now;
      created+=await insertNotification(user.id,expired?'QUOTE_FOLLOW_UP_OVERDUE':'QUOTE_FOLLOW_UP','Quote follow-up',expired?`Quote ${quote.number} for ${quote.client.companyName} has passed its validity date.`:`Quote ${quote.number} for ${quote.client.companyName} needs follow-up before ${quote.validUntil.toISOString().slice(0,10)}.`,'QUOTE',quote.id,`QUOTE_FOLLOW_UP:${user.id}:${quote.id}:${expired?'OVERDUE':'DUE'}`);
    }

    const invoices=await prisma.invoice.findMany({where:{status:{in:['ISSUED','PARTIALLY_PAID','OVERDUE']},dueDate:{lt:now},balance:{gt:0}},select:{id:true,number:true,dueDate:true,balance:true,client:{select:{companyName:true}}}});
    for(const invoice of invoices){
      created+=await insertNotification(user.id,'INVOICE_OVERDUE','Invoice overdue',`Invoice ${invoice.number} for ${invoice.client.companyName} is overdue with an outstanding balance of ${invoice.balance}.`,'INVOICE',invoice.id,`INVOICE_OVERDUE:${user.id}:${invoice.id}`);
    }

    const [purchaseRequests,purchaseOrdersPending,expenses,outsourcing,timeEntries]=await Promise.all([
      prisma.purchaseRequest.count({where:{status:'SUBMITTED'}}),
      prisma.purchaseOrder.count({where:{status:'DRAFT'}}),
      prisma.expense.count({where:{status:'SUBMITTED'}}),
      prisma.outsourceOrder.count({where:{status:'REQUESTED'}}),
      prisma.timeEntry.count(),
    ]);
    const pendingTotal=purchaseRequests+purchaseOrdersPending+expenses+outsourcing;
    if(pendingTotal>0){
      created+=await insertNotification(user.id,'APPROVAL_PENDING','Approvals pending',`${pendingTotal} approval item${pendingTotal===1?' is':'s are'} waiting for review.`,'APPROVAL',0,`APPROVAL_PENDING:${user.id}:${purchaseRequests}:${purchaseOrdersPending}:${expenses}:${outsourcing}`);
    }

    return {data:{created}};
  });
}

function numberType(){return true as const;}
