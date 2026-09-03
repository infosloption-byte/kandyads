import assert from 'node:assert/strict';
import { test } from 'node:test';

const originalFetch = globalThis.fetch;

test('notification delivery skips disabled providers without network calls', async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    throw new Error('network should not be called');
  }) as typeof fetch;

  try {
    const { sendNotificationDelivery } = await import('../src/lib/notification-delivery.js');
    const result = await sendNotificationDelivery({
      title: 'Test notification',
      message: 'Hello',
    });
    assert.equal(result.email, 'skipped');
    assert.equal(result.whatsapp, 'skipped');
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('delivery result exposes provider failure without throwing', async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return new Response('failure', { status: 500 });
  }) as typeof fetch;

  try {
    const { sendNotificationDelivery } = await import('../src/lib/notification-delivery.js');
    const result = await sendNotificationDelivery(
      {
        title: 'Test notification',
        message: 'Hello',
        email: 'user@example.com',
      },
      {
        NOTIFICATION_EMAIL_ENABLED: true,
        NOTIFICATION_EMAIL_FROM: 'notifications@example.com',
        RESEND_API_KEY: 'test-key',
        RESEND_API_URL: 'https://api.resend.test/emails',
        NOTIFICATION_WHATSAPP_ENABLED: false,
        WHATSAPP_ACCESS_TOKEN: undefined,
        WHATSAPP_PHONE_NUMBER_ID: undefined,
        WHATSAPP_API_URL: 'https://graph.facebook.com/v23.0',
      },
    );

    assert.equal(result.email, 'failed');
    assert.equal(result.whatsapp, 'skipped');
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
