import { env } from '../config/env.js';

export type NotificationDelivery = {
  title: string;
  message: string;
  email?: string | null;
  whatsapp?: string | null;
};

export type DeliveryResult = {
  email: 'sent' | 'skipped' | 'failed';
  whatsapp: 'sent' | 'skipped' | 'failed';
};

function requireConfig(condition: boolean, name: string): void {
  if (!condition) throw new Error(`Notification provider is enabled but ${name} is missing`);
}

export async function sendNotificationDelivery(input: NotificationDelivery): Promise<DeliveryResult> {
  const result: DeliveryResult = { email: 'skipped', whatsapp: 'skipped' };

  if (env.NOTIFICATION_EMAIL_ENABLED && input.email) {
    try {
      requireConfig(Boolean(env.RESEND_API_KEY), 'RESEND_API_KEY');
      requireConfig(Boolean(env.NOTIFICATION_EMAIL_FROM), 'NOTIFICATION_EMAIL_FROM');

      const response = await fetch(env.RESEND_API_URL, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.RESEND_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: env.NOTIFICATION_EMAIL_FROM,
          to: [input.email],
          subject: input.title,
          text: input.message,
        }),
      });

      if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}`);
      result.email = 'sent';
    } catch {
      result.email = 'failed';
    }
  }

  if (env.NOTIFICATION_WHATSAPP_ENABLED && input.whatsapp) {
    try {
      requireConfig(Boolean(env.WHATSAPP_ACCESS_TOKEN), 'WHATSAPP_ACCESS_TOKEN');
      requireConfig(Boolean(env.WHATSAPP_PHONE_NUMBER_ID), 'WHATSAPP_PHONE_NUMBER_ID');

      const response = await fetch(
        `${env.WHATSAPP_API_URL}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: input.whatsapp,
            type: 'text',
            text: { preview_url: false, body: `${input.title}\n\n${input.message}` },
          }),
        },
      );

      if (!response.ok) throw new Error(`WhatsApp provider returned HTTP ${response.status}`);
      result.whatsapp = 'sent';
    } catch {
      result.whatsapp = 'failed';
    }
  }

  return result;
}
