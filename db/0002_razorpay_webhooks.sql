-- Additive migration. Keeps the existing customer/order/payment tables intact.
ALTER TABLE customer_payments ALTER COLUMN signature DROP NOT NULL;

ALTER TABLE customer_orders
  ADD COLUMN IF NOT EXISTS refunded_amount INTEGER NOT NULL DEFAULT 0
  CHECK (refunded_amount >= 0);

CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS razorpay_webhook_events_created_idx
  ON razorpay_webhook_events(created_at DESC);

CREATE TABLE IF NOT EXISTS customer_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_refund_id TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES customer_orders(id) ON DELETE RESTRICT,
  razorpay_payment_id TEXT NOT NULL REFERENCES customer_payments(razorpay_payment_id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('processed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS customer_refunds_order_id_idx ON customer_refunds(order_id);
