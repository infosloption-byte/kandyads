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
  const original = process.env.NOTIFICATION_EMAIL_ENABLED;
  const originalKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.NOTIFICATION_EMAIL_FROM;
  process.env.NOTIFICATION_EMAIL_ENABLED = 'true';
  process.env.RESEND_API_KEY = 'test-key';
  process.env.NOTIFICATION_EMAIL_FROM = 'notifications@example.com';

  globalThis.fetch = (async () => new Response('failure', { status: 500 })) as typeof fetch;

  try {
    const { sendNotificationDelivery } = await import(`../src/lib/notification-delivery.js?test=${Date.now()}`);
    const result = await sendNotificationDelivery({
      title: 'Test notification',
      message: 'Hello',
      email: 'user@example.com',
    });
    assert.equal(result.email, 'failed');
  } finally {
    if (original === undefined) delete process.env.NOTIFICATION_EMAIL_ENABLED;
    else process.env.NOTIFICATION_EMAIL_ENABLED = original;
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
    if (originalFrom === undefined) delete process.env.NOTIFICATION_EMAIL_FROM;
    else process.env.NOTIFICATION_EMAIL_FROM = originalFrom;
    globalThis.fetch = originalFetch;
  }
});
