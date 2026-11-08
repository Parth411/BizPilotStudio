import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { sql } from '@/lib/db';

export type EmailType = 'verify_email' | 'password_reset' | 'order_confirmation' | 'refund_confirmation';

type EmailMessage = {
  type: EmailType;
  to: string;
  subject: string;
  html: string;
  text: string;
  dedupeKey: string;
  expiresAt?: Date;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
}

function emailLayout(title: string, content: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#27384d"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(title)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6fa;padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e5ebf1;border-radius:12px;overflow:hidden"><tr><td style="background:#142b49;padding:22px 30px;color:#fff;font-size:18px;font-weight:700">BizPilot <span style="color:#78a8ff">Studio</span></td></tr><tr><td style="padding:32px 30px 28px">${content}</td></tr><tr><td style="border-top:1px solid #edf0f4;padding:18px 30px;color:#8391a0;font-size:12px;line-height:1.6">BizPilot Studio · Practical tools for your business<br>Need help? Reply to this email or contact <a href="mailto:${escapeHtml(process.env.SUPPORT_EMAIL || 'support@bizpilotstudio.com')}" style="color:#3478f6">${escapeHtml(process.env.SUPPORT_EMAIL || 'support@bizpilotstudio.com')}</a>.</td></tr></table></td></tr></table></body></html>`;
}

function button(url: string, label: string) {
  return `<p style="margin:26px 0"><a href="${escapeHtml(url)}" style="display:inline-block;background:#3478f6;color:#fff;text-decoration:none;padding:13px 20px;border-radius:6px;font-size:14px;font-weight:700">${escapeHtml(label)}</a></p>`;
}

function appUrl(path: string) {
  const configured = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const base = new URL(configured);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) {
    throw new Error('APP_BASE_URL must be an absolute HTTP(S) URL.');
  }
  if (process.env.NODE_ENV === 'production' && base.protocol !== 'https:') {
    throw new Error('APP_BASE_URL must use HTTPS in production.');
  }
  return new URL(path, base).toString();
}

export function createActionToken() {
  return randomBytes(32).toString('base64url');
}

export async function issueActionToken(customerId: string, purpose: 'verify_email' | 'reset_password') {
  const token = createActionToken();
  const hash = await hashToken(token);
  const expirationHours = purpose === 'verify_email' ? 24 : 1;
  await sql`UPDATE customer_action_tokens SET consumed_at = NOW() WHERE customer_id = ${customerId} AND purpose = ${purpose} AND consumed_at IS NULL`;
  await sql`INSERT INTO customer_action_tokens (token_hash, customer_id, purpose, expires_at) VALUES (${hash}, ${customerId}, ${purpose}, NOW() + (${expirationHours} * INTERVAL '1 hour'))`;
  return token;
}

export async function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function enqueue(message: EmailMessage) {
  const rows = await sql`
    INSERT INTO email_outbox (dedupe_key, email_type, recipient, subject, html, text, expires_at)
    VALUES (${message.dedupeKey}, ${message.type}, ${message.to}, ${message.subject}, ${message.html}, ${message.text}, ${message.expiresAt?.toISOString() ?? null})
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING id
  `;
  const id = rows[0]?.id ?? (await sql`SELECT id FROM email_outbox WHERE dedupe_key = ${message.dedupeKey} LIMIT 1`)[0]?.id;
  if (!id) return false;
  return deliverEmailJob(String(id));
}

export async function deliverEmailJob(id: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    await sql`UPDATE email_outbox SET status = 'failed', last_error = 'Email provider is not configured.', updated_at = NOW() WHERE id = ${id} AND status <> 'sent'`;
    return false;
  }

  const claimed = await sql`
    UPDATE email_outbox
    SET status = 'sending', attempts = attempts + 1, updated_at = NOW(), last_error = NULL
    WHERE id = ${id}
      AND attempts < 8
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (status IN ('queued', 'failed') OR (status = 'sending' AND updated_at < NOW() - INTERVAL '5 minutes'))
    RETURNING id, dedupe_key, recipient, subject, html, text
  `;
  const job = claimed[0];
  if (!job) {
    const status = await sql`SELECT status FROM email_outbox WHERE id = ${id} LIMIT 1`;
    return status[0]?.status === 'sent';
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': String(job.dedupe_key),
      },
      body: JSON.stringify({
        from,
        to: [job.recipient],
        reply_to: process.env.SUPPORT_EMAIL || 'vichhiparth2@gmail.com',
        subject: job.subject,
        html: job.html,
        text: job.text,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const responseBody: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorBody = responseBody && typeof responseBody === 'object'
        ? responseBody as { name?: unknown; message?: unknown }
        : {};
      const providerName = typeof errorBody.name === 'string' ? errorBody.name : '';
      const providerMessage = typeof errorBody.message === 'string'
        ? errorBody.message.replace(/[\r\n\t]/g, ' ').slice(0, 240)
        : '';
      const providerReason = [providerName, providerMessage].filter(Boolean).join(': ') || 'No provider detail returned.';
      console.error('[email] Provider rejected a message.', { status: response.status, providerReason });
      throw new Error(`Email provider returned HTTP ${response.status}: ${providerReason}`);
    }
    const providerMessageId = responseBody && typeof responseBody === 'object' && 'id' in responseBody
      ? String((responseBody as { id?: unknown }).id ?? '') || null
      : null;
    await sql`UPDATE email_outbox SET status = 'sent', provider_message_id = ${providerMessageId}, sent_at = NOW(), updated_at = NOW(), html = NULL, text = NULL, last_error = NULL WHERE id = ${id}`;
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 180) : 'Email delivery failed.';
    await sql`UPDATE email_outbox SET status = 'failed', last_error = ${message}, updated_at = NOW() WHERE id = ${id}`;
    console.error('[email] Delivery failed.', { jobId: id, reason: message });
    return false;
  }
}

export async function sendTransactionalEmail(message: EmailMessage) {
  try {
    return await enqueue(message);
  } catch (error) {
    console.error('[email] Could not enqueue a message.', { type: message.type, reason: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
}

export async function retryEmailOutbox(limit = 20) {
  await sql`UPDATE email_outbox SET status = 'failed', html = NULL, text = NULL, last_error = 'Email link expired before delivery.', updated_at = NOW() WHERE expires_at <= NOW() AND (status IN ('queued', 'failed') OR (status = 'sending' AND updated_at < NOW() - INTERVAL '5 minutes'))`;
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return { checked: 0, sent: 0 };
  const pending = await sql`
    SELECT id FROM email_outbox
    WHERE attempts < 8 AND (expires_at IS NULL OR expires_at > NOW())
      AND (status IN ('queued', 'failed') OR (status = 'sending' AND updated_at < NOW() - INTERVAL '5 minutes'))
    ORDER BY created_at ASC LIMIT ${Math.min(Math.max(limit, 1), 50)}
  `;
  let sent = 0;
  for (const job of pending) if (await deliverEmailJob(String(job.id))) sent += 1;
  return { checked: pending.length, sent };
}

export async function sendVerificationEmail(customer: { id: string; email: string; first_name: string }) {
  const token = await issueActionToken(customer.id, 'verify_email');
  const url = appUrl(`/account/verify-email?token=${encodeURIComponent(token)}`);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const name = escapeHtml(customer.first_name);
  return sendTransactionalEmail({
    type: 'verify_email', to: customer.email, dedupeKey: `verify-email:${randomBytes(16).toString('hex')}`, expiresAt,
    subject: 'Verify your BizPilot Studio email',
    html: emailLayout('Verify your email', `<h1 style="font-size:24px;color:#142b49">Welcome to BizPilot Studio, ${name}.</h1><p style="font-size:15px;line-height:1.7;color:#64758a">Confirm your email address to finish setting up your account and access your purchases.</p>${button(url, 'Verify email address')}<p style="font-size:12px;line-height:1.6;color:#8794a3">This link expires in 24 hours. If you did not create this account, you can ignore this message.</p>`),
    text: `Welcome to BizPilot Studio, ${customer.first_name}. Verify your email address: ${url}\n\nThis link expires in 24 hours. If you did not create this account, ignore this message.`,
  });
}

export async function sendPasswordResetEmail(customer: { id: string; email: string; first_name: string }) {
  const token = await issueActionToken(customer.id, 'reset_password');
  const url = appUrl(`/account/reset-password?token=${encodeURIComponent(token)}`);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const name = escapeHtml(customer.first_name);
  return sendTransactionalEmail({
    type: 'password_reset', to: customer.email, dedupeKey: `password-reset:${randomBytes(16).toString('hex')}`, expiresAt,
    subject: 'Reset your BizPilot Studio password',
    html: emailLayout('Reset your password', `<h1 style="font-size:24px;color:#142b49">Reset your password</h1><p style="font-size:15px;line-height:1.7;color:#64758a">Hi ${name}, use the secure link below to choose a new password.</p>${button(url, 'Choose a new password')}<p style="font-size:12px;line-height:1.6;color:#8794a3">This link expires in one hour. If you did not request a reset, you can ignore this message.</p>`),
    text: `Hi ${customer.first_name}, reset your BizPilot Studio password: ${url}\n\nThis link expires in one hour. If you did not request a reset, ignore this message.`,
  });
}

export async function sendOrderConfirmation(orderId: string) {
  const rows = await sql`
    SELECT o.id, o.product_name, o.amount, o.currency, o.paid_at, c.email, c.first_name
    FROM customer_orders o JOIN customers c ON c.id = o.customer_id
    WHERE o.id = ${orderId} AND o.status = 'paid' LIMIT 1
  `;
  const order = rows[0];
  if (!order) return false;
  const reference = String(order.id).slice(0, 8).toUpperCase();
  const amount = new Intl.NumberFormat('en', { style: 'currency', currency: String(order.currency).trim() }).format(Number(order.amount) / 100);
  const url = appUrl('/account#orders');
  const name = escapeHtml(String(order.first_name));
  const product = escapeHtml(String(order.product_name));
  return sendTransactionalEmail({
    type: 'order_confirmation', to: String(order.email), dedupeKey: `order-confirmation:${order.id}`,
    subject: `Your BizPilot Studio order is confirmed (${reference})`,
    html: emailLayout('Your order is confirmed', `<h1 style="font-size:24px;color:#142b49">Thanks for your purchase, ${name}.</h1><p style="font-size:15px;line-height:1.7;color:#64758a">Your payment is confirmed and your product is ready in your account.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f9fc;border-radius:8px;padding:16px;margin:20px 0"><tr><td style="font-size:14px;color:#142b49;font-weight:700">${product}</td><td align="right" style="font-size:14px;color:#142b49;font-weight:700">${escapeHtml(amount)}</td></tr><tr><td colspan="2" style="padding-top:9px;font-size:12px;color:#8391a0">Order ${escapeHtml(reference)}</td></tr></table>${button(url, 'View my account and downloads')}<p style="font-size:12px;line-height:1.6;color:#8794a3">Keep this email for your records. Your download remains protected in your account.</p>`),
    text: `Thanks for your purchase, ${String(order.first_name)}. Your payment is confirmed.\n\n${String(order.product_name)} — ${amount}\nOrder ${reference}\n\nView your account and downloads: ${url}`,
  });
}

export async function sendRefundConfirmation(orderId: string, refundId: string, refundAmount: number) {
  const rows = await sql`
    SELECT o.id, o.product_name, o.currency, c.email, c.first_name
    FROM customer_orders o JOIN customers c ON c.id = o.customer_id
    WHERE o.id = ${orderId} LIMIT 1
  `;
  const order = rows[0];
  if (!order) return false;
  const amount = new Intl.NumberFormat('en', { style: 'currency', currency: String(order.currency).trim() }).format(refundAmount / 100);
  const name = escapeHtml(String(order.first_name));
  const product = escapeHtml(String(order.product_name));
  return sendTransactionalEmail({
    type: 'refund_confirmation', to: String(order.email), dedupeKey: `refund-confirmation:${refundId}`,
    subject: 'Your BizPilot Studio refund has been processed',
    html: emailLayout('Refund processed', `<h1 style="font-size:24px;color:#142b49">Your refund is on its way, ${name}.</h1><p style="font-size:15px;line-height:1.7;color:#64758a">A refund for <strong>${escapeHtml(amount)}</strong> for ${product} has been processed by the payment provider. Your bank or card issuer may need additional time to post it.</p><p style="font-size:12px;color:#8794a3">Refund reference: ${escapeHtml(refundId)}</p>`),
    text: `Hi ${String(order.first_name)}, a refund of ${amount} for ${String(order.product_name)} has been processed. Your bank may need additional time to post it. Refund reference: ${refundId}`,
  });
}
