import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { convertAcceptedQuoteToProject, QuoteConversionError } from './quote-conversion.service.js';
import { buildQuotePdf } from './quote-pdf.js';
import { canTransition, quoteTransitions } from '../workflow/workflow.rules.js';

const itemSchema=z.object({serviceId:z.coerce.number().int().positive().optional(),description:z.string().min(1).max(1000),quantity:z.coerce.number().positive(),unit:z.string().min(1).max(30),rate:z.coerce.number().nonnegative(),discount:z.coerce.number().nonnegative().default(0),tax:z.coerce.number().nonnegative().default(0)});
const createSchema=z.object({number:z.string().trim().min(2).max(50),clientId:z.coerce.number().int().positive(),enquiryId:z.coerce.number().int().positive().optional().nullable(),validUntil:z.coerce.date().optional().nullable(),expectedMaterial:z.coerce.number().nonnegative().default(0),expectedLabour:z.coerce.number().nonnegative().default(0),expectedOutsource:z.coerce.number().nonnegative().default(0),expectedExpense:z.coerce.number().nonnegative().default(0),items:z.array(itemSchema).min(1)});
const updateSchema=createSchema;
const statusSchema=z.object({status:z.enum(['DRAFT','SENT','VIEWED','ACCEPTED','REJECTED','EXPIRED','CANCELLED']),reason:z.string().trim().max(500).optional()});
const conversionSchema=z.object({number:z.string().trim().min(2).max(50).optional(),name:z.string().trim().min(2).max(200).optional(),ownerId:z.coerce.number().int().positive().optional(),startDate:z.coerce.date().optional(),dueDate:z.coerce.date().optional()}).default({});

function actorId(request:FastifyRequest){const sub=(request.user as {sub?:string}).sub;const id=Number(sub);return Number.isInteger(id)&&id>0?id:null;}

function calculateQuote(input:z.infer<typeof createSchema>){
  const items=input.items.map(i=>{const net=i.quantity*i.rate-i.discount;const total=net+i.tax;return {...i,total};});
  const subtotal=items.reduce((s,i)=>s+i.quantity*i.rate-i.discount,0);
  const discount=items.reduce((s,i)=>s+i.discount,0);
  const tax=items.reduce((s,i)=>s+i.tax,0);
  const total=subtotal+tax;
  const expectedCost=input.expectedMaterial+input.expectedLabour+input.expectedOutsource+input.expectedExpense;
  return {items,subtotal,discount,tax,total,expectedMargin:total-expectedCost};
}

export async function quotesRoutes(app:FastifyInstance){
  app.get('/api/v1/quotes',async request=>{const q=z.object({search:z.string().optional(),status:z.string().optional(),page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20)}).parse(request.query);const where={...(q.status?{status:q.status as any}:{}),...(q.search?{OR:[{number:{contains:q.search}},{client:{companyName:{contains:q.search}}}]}:{})};const [items,total]=await Promise.all([prisma.quote.findMany({where,include:{client:true,items:true,enquiry:true,project:true},orderBy:{createdAt:'desc'},skip:(q.page-1)*q.pageSize,take:q.pageSize}),prisma.quote.count({where})]);return {data:items,meta:{page:q.page,pageSize:q.pageSize,total}};});

  app.get('/api/v1/quotes/:id',async(request,reply)=>{const id=z.coerce.number().int().positive().parse((request.params as any).id);const data=await prisma.quote.findUnique({where:{id},include:{client:true,enquiry:true,items:{include:{service:true},orderBy:{id:'asc'}},project:true}});if(!data)return reply.notFound('Quote not found');return {data};});

  app.post('/api/v1/quotes',async(request,reply)=>{const input=createSchema.parse(request.body);const calculated=calculateQuote(input);const quote=await prisma.quote.create({data:{number:input.number,clientId:input.clientId,enquiryId:input.enquiryId||undefined,validUntil:input.validUntil||undefined,subtotal:calculated.subtotal,discount:calculated.discount,tax:calculated.tax,total:calculated.total,expectedMaterial:input.expectedMaterial,expectedLabour:input.expectedLabour,expectedOutsource:input.expectedOutsource,expectedExpense:input.expectedExpense,expectedMargin:calculated.expectedMargin,items:{create:calculated.items}} ,include:{items:true,client:true}});return reply.code(201).send({data:quote});});

  app.patch('/api/v1/quotes/:id',async(request,reply)=>{
    const id=z.coerce.number().int().positive().parse((request.params as any).id);
    const input=updateSchema.parse(request.body);
    const existing=await prisma.quote.findUnique({where:{id},include:{items:true,project:true}});
    if(!existing)return reply.notFound('Quote not found');
    if(!['DRAFT','SENT','VIEWED'].includes(existing.status))return reply.badRequest(`Quote cannot be edited from ${existing.status}`);
    const client=await prisma.client.findUnique({where:{id:input.clientId}});
    if(!client)return reply.badRequest('Client not found');
    if(input.enquiryId){
      const enquiry=await prisma.enquiry.findUnique({where:{id:input.enquiryId}});
      if(!enquiry)return reply.badRequest('Enquiry not found');
      const conflicting=await prisma.quote.findFirst({where:{enquiryId:input.enquiryId,id:{not:id}}});
      if(conflicting)return reply.conflict('That enquiry already has a quotation.');
    }
    const calculated=calculateQuote(input);
    const updated=await prisma.$transaction(async tx=>{
      const row=await tx.quote.update({where:{id},data:{number:input.number,clientId:input.clientId,enquiryId:input.enquiryId||null,validUntil:input.validUntil||null,subtotal:calculated.subtotal,discount:calculated.discount,tax:calculated.tax,total:calculated.total,expectedMaterial:input.expectedMaterial,expectedLabour:input.expectedLabour,expectedOutsource:input.expectedOutsource,expectedExpense:input.expectedExpense,expectedMargin:calculated.expectedMargin,items:{deleteMany:{},create:calculated.items}},include:{client:true,enquiry:true,items:{include:{service:true}},project:true}});
      await tx.auditLog.create({data:{userId:actorId(request),action:'UPDATE',entity:'Quote',entityId:String(id),beforeJson:{number:existing.number,clientId:existing.clientId,status:existing.status,total:Number(existing.total),itemCount:existing.items.length},afterJson:{number:row.number,clientId:row.clientId,status:row.status,total:Number(row.total),itemCount:row.items.length}}});
      return row;
    });
    return {data:updated};
  });

  app.patch('/api/v1/quotes/:id/status',async(request,reply)=>{
    const id=z.coerce.number().int().positive().parse((request.params as any).id);
    const input=statusSchema.parse(request.body);
    const existing=await prisma.quote.findUnique({where:{id},include:{items:true}});
    if(!existing)return reply.notFound('Quote not found');
    if(!canTransition(quoteTransitions,existing.status,input.status))return reply.badRequest(`Invalid quote transition: ${existing.status} -> ${input.status}`);
    if(input.status==='SENT'&&existing.items.length===0)return reply.badRequest('Quote must contain at least one item before sending');
    const item=await prisma.$transaction(async tx=>{
      const updated=await tx.quote.update({where:{id},data:{status:input.status},include:{client:true,items:true,project:true}});
      const action=input.status==='ACCEPTED'?'CLIENT_ACCEPTED':input.status==='REJECTED'?'CLIENT_REJECTED':'STATUS_CHANGE';
      await tx.auditLog.create({data:{userId:actorId(request),action,entity:'Quote',entityId:String(id),beforeJson:{status:existing.status},afterJson:{status:updated.status,reason:input.reason||null}}});
      return updated;
    });
    return {data:item};
  });

  app.get('/api/v1/quotes/:id/pdf',async(request,reply)=>{const id=z.coerce.number().int().positive().parse((request.params as any).id);const quote=await prisma.quote.findUnique({where:{id},include:{client:true,items:true}});if(!quote)return reply.notFound('Quote not found');const pdf=buildQuotePdf({number:quote.number,status:quote.status,validUntil:quote.validUntil,client:quote.client,items:quote.items.map(item=>({description:item.description,quantity:Number(item.quantity),unit:item.unit,rate:Number(item.rate),discount:Number(item.discount),tax:Number(item.tax),total:Number(item.total)})),subtotal:Number(quote.subtotal),discount:Number(quote.discount),tax:Number(quote.tax),total:Number(quote.total),expectedMaterial:Number(quote.expectedMaterial),expectedLabour:Number(quote.expectedLabour),expectedOutsource:Number(quote.expectedOutsource),expectedExpense:Number(quote.expectedExpense),expectedMargin:Number(quote.expectedMargin||0)});return reply.header('Content-Type','application/pdf').header('Content-Disposition',`inline; filename="${quote.number.replace(/[^a-zA-Z0-9_-]/g,'_')}.pdf"`).send(pdf);});

  app.post('/api/v1/quotes/:id/convert-to-project',async(request,reply)=>{const id=z.coerce.number().int().positive().parse((request.params as any).id);const input=conversionSchema.parse(request.body??{});try{const project=await convertAcceptedQuoteToProject(id,{...input,actorId:actorId(request)});return reply.code(201).send({data:project});}catch(error){if(error instanceof QuoteConversionError)return reply.status(error.statusCode).send({error:{code:error.statusCode===409?'CONFLICT':'QUOTE_CONVERSION_ERROR',message:error.message,requestId:request.id}});throw error;}});
}
