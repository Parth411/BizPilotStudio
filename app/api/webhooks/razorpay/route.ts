import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { sql } from '@/lib/db';
import { sendOrderConfirmation, sendRefundConfirmation } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeEqualHex(expectedHex: string, receivedHex: string) {
  if (!/^[a-f0-9]{64}$/i.test(receivedHex)) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const received = Buffer.from(receivedHex, 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Razorpay webhook rejected: RAZORPAY_WEBHOOK_SECRET is not configured.');
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 });
  }

  const rawBody = await request.text();
  const receivedSignature = request.headers.get('x-razorpay-signature') || '';
  const expectedSignature = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  if (!safeEqualHex(expectedSignature, receivedSignature)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const eventType = String(event?.event || '');
  const allowedEvents = new Set(['payment.captured', 'payment.failed', 'refund.processed']);
  if (!allowedEvents.has(eventType)) {
    // Acknowledge events we intentionally do not consume, so Razorpay does not retry them.
    return NextResponse.json({ received: true, ignored: true });
  }

  const eventId = request.headers.get('x-razorpay-event-id') || createHash('sha256').update(rawBody).digest('hex');

  try {
    const inserted = await sql`
      INSERT INTO razorpay_webhook_events (event_id, event_type, payload, status)
      VALUES (${eventId}, ${eventType}, ${rawBody}::jsonb, 'received')
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id
    `;
    if (!inserted.length) {
      const existing = await sql`SELECT status FROM razorpay_webhook_events WHERE event_id = ${eventId} LIMIT 1`;
      if (existing[0]?.status === 'processed') return NextResponse.json({ received: true, duplicate: true });
      // A prior attempt may have failed after storing the event. Re-run the idempotent handler below.
    }

    if (eventType === 'payment.captured') {
      const payment = event?.payload?.payment?.entity;
      const orderId = String(payment?.order_id || '');
      const paymentId = String(payment?.id || '');
      const amount = Number(payment?.amount);
      const currency = String(payment?.currency || '').toUpperCase();
      if (!orderId || !paymentId || !Number.isSafeInteger(amount) || amount <= 0 || !/^[A-Z]{3}$/.test(currency)) {
        return NextResponse.json({ error: 'Captured payment payload is incomplete.' }, { status: 400 });
      }
      const matched = await sql`
        SELECT id, amount, currency FROM customer_orders
        WHERE razorpay_order_id = ${orderId} LIMIT 1
      `;
      if (matched.length) {
        const saved = matched[0];
        if (Number(saved.amount) !== amount || String(saved.currency).trim() !== currency) {
          console.error('Razorpay webhook amount/currency mismatch', { orderId, paymentId });
          return NextResponse.json({ error: 'Payment does not match the stored order.' }, { status: 409 });
        }
        await sql`
          INSERT INTO customer_payments (order_id, razorpay_payment_id, signature, amount, currency, status)
          VALUES (${saved.id}, ${paymentId}, NULL, ${amount}, ${currency}, 'captured')
          ON CONFLICT (razorpay_payment_id) DO UPDATE SET status = 'captured'
        `;
        await sql`
          UPDATE customer_orders SET status = 'paid', paid_at = COALESCE(paid_at, NOW())
          WHERE id = ${saved.id} AND status IN ('pending', 'failed', 'paid')
        `;
        await sendOrderConfirmation(String(saved.id));
      } else {
        // Keep the webhook retryable if the corresponding order has not appeared yet.
        return NextResponse.json({ error: 'Order not found for captured payment.' }, { status: 404 });
      }
    }

    if (eventType === 'payment.failed') {
      const payment = event?.payload?.payment?.entity;
      const orderId = String(payment?.order_id || '');
      if (orderId) {
        await sql`
          UPDATE customer_orders SET status = 'failed'
          WHERE razorpay_order_id = ${orderId} AND status = 'pending'
        `;
      }
    }

    if (eventType === 'refund.processed') {
      const refund = event?.payload?.refund?.entity;
      const refundId = String(refund?.id || '');
      const paymentId = String(refund?.payment_id || '');
      const refundAmount = Number(refund?.amount);
      if (!refundId || !paymentId || !Number.isSafeInteger(refundAmount) || refundAmount <= 0) {
        return NextResponse.json({ error: 'Refund payload is incomplete.' }, { status: 400 });
      }
      const paymentRows = await sql`
        SELECT order_id FROM customer_payments WHERE razorpay_payment_id = ${paymentId} LIMIT 1
      `;
      if (!paymentRows.length) return NextResponse.json({ error: 'Payment not found for refund.' }, { status: 404 });
      await sql`
        INSERT INTO customer_refunds (razorpay_refund_id, order_id, razorpay_payment_id, amount, status)
        VALUES (${refundId}, ${paymentRows[0].order_id}, ${paymentId}, ${refundAmount}, 'processed')
        ON CONFLICT (razorpay_refund_id) DO NOTHING
      `;
      await sql`
        UPDATE customer_orders
        SET refunded_amount = COALESCE((SELECT SUM(amount) FROM customer_refunds WHERE order_id = customer_orders.id AND status = 'processed'), 0),
            status = CASE
              WHEN COALESCE((SELECT SUM(amount) FROM customer_refunds WHERE order_id = customer_orders.id AND status = 'processed'), 0) >= amount THEN 'refunded'
              ELSE 'paid'
            END
        WHERE id = ${paymentRows[0].order_id}
      `;
      await sendRefundConfirmation(String(paymentRows[0].order_id), refundId, refundAmount);
    }

    await sql`UPDATE razorpay_webhook_events SET status = 'processed', processed_at = NOW() WHERE event_id = ${eventId}`;
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook processing failed', error);
    // Non-2xx asks Razorpay to retry. Handlers are idempotent using unique event/payment/refund IDs.
    return NextResponse.json({ error: 'Webhook processing failed; retry is safe.' }, { status: 500 });
  }
}
