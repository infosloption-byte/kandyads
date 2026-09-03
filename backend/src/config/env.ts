import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  // Comma-separated browser origins. The default matches the Vite admin dev server.
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  NOTIFICATION_EMAIL_ENABLED: z.coerce.boolean().default(false),
  NOTIFICATION_EMAIL_FROM: z.string().email().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_API_URL: z.string().url().default('https://api.resend.com/emails'),
  NOTIFICATION_WHATSAPP_ENABLED: z.coerce.boolean().default(false),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_API_URL: z.string().url().default('https://graph.facebook.com/v23.0'),
});

export const env = schema.parse(process.env);
export const corsOrigins = env.CORS_ORIGIN
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
