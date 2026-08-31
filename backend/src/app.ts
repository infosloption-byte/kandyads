import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import { randomUUID } from 'node:crypto';
import { env } from './config/env.js';
import { authRoutes } from './routes/auth.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { registerClientRoutes } from './routes/clients.js';
import { registerEnquiryRoutes } from './routes/enquiries.js';
import { registerQuoteRoutes } from './routes/quotes.js';
import { registerProjectRoutes } from './routes/projects.js';

export function buildApp(){
  const app = Fastify({ logger: true, requestIdHeader: 'x-request-id', genReqId: () => randomUUID() });
  app.register(cors,{ origin: env.CORS_ORIGIN, credentials:true });
  app.register(sensible);
  app.register(jwt,{ secret: env.JWT_SECRET });

  app.get('/health', async()=>({ status:'ok', service:'kandy-ads-backend', environment:env.NODE_ENV, timestamp:new Date().toISOString() }));
  app.get('/api/v1', async()=>({ name:'Kandy Ads Operations API', version:'v1' }));

  app.register(authRoutes);
  app.register(dashboardRoutes);
  app.register(registerClientRoutes);
  app.register(registerEnquiryRoutes);
  app.register(registerQuoteRoutes);
  app.register(registerProjectRoutes);

  app.setErrorHandler((error,request,reply)=>{
    request.log.error(error);
    const status = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    return reply.status(status).send({ error:{ code:error.code ?? 'INTERNAL_ERROR', message: error.message ?? 'Unexpected server error', requestId: request.id } });
  });
  return app;
}
