import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import { env } from './config/env.js';
import { dashboardRoutes } from './routes/dashboard.js';

export function buildApp(){
  const app = Fastify({ logger: true });
  app.register(cors,{ origin: env.CORS_ORIGIN, credentials:true });
  app.register(sensible);
  app.register(jwt,{ secret: env.JWT_SECRET });

  app.get('/health', async()=>({ status:'ok', service:'kandy-ads-backend', environment:env.NODE_ENV, timestamp:new Date().toISOString() }));
  app.get('/api/v1', async()=>({ name:'Kandy Ads Operations API', version:'v1' }));
  app.register(dashboardRoutes);

  app.setErrorHandler((error,request,reply)=>{
    request.log.error(error);
    return reply.status(error.statusCode && error.statusCode >= 400 ? error.statusCode : 500).send({ error:{ code:error.code ?? 'INTERNAL_ERROR', message: error.message ?? 'Unexpected server error' } });
  });
  return app;
}
