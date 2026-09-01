import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  // Comma-separated browser origins. The default matches the Vite admin dev server.
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export const env = schema.parse(process.env);
export const corsOrigins = env.CORS_ORIGIN
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
