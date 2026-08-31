import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import { randomUUID } from 'node:crypto';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { clientsRoutes } from './modules/clients/clients.routes.js';
import { enquiriesRoutes } from './modules/enquiries/enquiries.routes.js';
import { quotesRoutes } from './modules/quotes/quotes.routes.js';
import { projectsRoutes } from './modules/projects/projects.routes.js';

export function buildApp(){
  const app=Fastify({logger:true,requestIdHeader:'x-request-id',genReqId:()=>randomUUID()});
  app.register(cors,{origin:env.CORS_ORIGIN,credentials:true});
  app.register(sensible);
  app.register(jwt,{secret:env.JWT_SECRET});
  app.get('/health',async()=>({status:'ok',service:'kandy-ads-backend',environment:env.NODE_ENV,timestamp:new Date().toISOString()}));
  app.get('/api/v1',async()=>({name:'Kandy Ads Operations API',version:'v1'}));
  app.register(authRoutes);
  app.register(dashboardRoutes);
  app.register(clientsRoutes);
  app.register(enquiriesRoutes);
  app.register(quotesRoutes);
  app.register(projectsRoutes);
  app.setErrorHandler((error,request,reply)=>{request.log.error(error);const status=error.statusCode&&error.statusCode>=400?error.statusCode:500;return reply.status(status).send({error:{code:error.code??'INTERNAL_ERROR',message:error.message??'Unexpected server error',requestId:request.id}})});
  return app;
}
