import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { convertEnquiryToQuote, EnquiryQuoteConversionError } from './enquiry-quote-conversion.service.js';

const createSchema=z.object({number:z.string().min(2).max(50),clientId:z.coerce.number().int().positive(),source:z.string().max(80).optional(),requirement:z.string().min(2).max(5000),siteLocation:z.string().max(500).optional(),targetDate:z.coerce.date().optional(),priority:z.string().max(30).optional()});
const quoteItemSchema=z.object({serviceId:z.coerce.number().int().positive().optional(),description:z.string().min(1).max(1000),quantity:z.coerce.number().positive(),unit:z.string().min(1).max(30),rate:z.coerce.number().nonnegative(),discount:z.coerce.number().nonnegative().default(0),tax:z.coerce.number().nonnegative().default(0)});
const convertSchema=z.object({number:z.string().trim().min(2).max(50).optional(),validUntil:z.coerce.date().optional(),expectedMaterial:z.coerce.number().nonnegative().default(0),expectedLabour:z.coerce.number().nonnegative().default(0),expectedOutsource:z.coerce.number().nonnegative().default(0),expectedExpense:z.coerce.number().nonnegative().default(0),items:z.array(quoteItemSchema).min(1)});

function actorId(request:FastifyRequest){const sub=(request.user as {sub?:string}).sub;const id=Number(sub);return Number.isInteger(id)&&id>0?id:null;}

export async function enquiriesRoutes(app: FastifyInstance){
  app.get('/api/v1/enquiries',async request=>{const q=z.object({search:z.string().optional(),status:z.string().optional(),page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20)}).parse(request.query);const where={...(q.status?{status:q.status as any}:{}),...(q.search?{OR:[{number:{contains:q.search}},{requirement:{contains:q.search}}]}:{})};const [items,total]=await Promise.all([prisma.enquiry.findMany({where,include:{client:true,quote:true},orderBy:{createdAt:'desc'},skip:(q.page-1)*q.pageSize,take:q.pageSize}),prisma.enquiry.count({where})]);return {data:items,meta:{page:q.page,pageSize:q.pageSize,total}};});
  app.post('/api/v1/enquiries',async(request,reply)=>{const input=createSchema.parse(request.body);const item=await prisma.enquiry.create({data:input});return reply.code(201).send({data:item});});
  app.post('/api/v1/enquiries/:id/convert-to-quote',async(request,reply)=>{const id=z.coerce.number().int().positive().parse((request.params as any).id);const input=convertSchema.parse(request.body);try{const quote=await convertEnquiryToQuote(id,{...input,actorId:actorId(request)});return reply.code(201).send({data:quote});}catch(error){if(error instanceof EnquiryQuoteConversionError)return reply.status(error.statusCode).send({error:{code:error.statusCode===409?'CONFLICT':'ENQUIRY_QUOTE_CONVERSION_ERROR',message:error.message,requestId:request.id}});throw error;}});
}
