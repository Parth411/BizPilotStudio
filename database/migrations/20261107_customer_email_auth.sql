-- Email verification, password recovery, and durable transactional email delivery.
-- Existing customers are treated as verified to preserve access after rollout.
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

UPDATE customers
SET email_verified_at = created_at
WHERE email_verified_at IS NULL;

-- Keep a brief rolling deployment compatible with the previous registration handler.
-- The new handler explicitly inserts NULL for accounts that still need verification.
ALTER TABLE customers ALTER COLUMN email_verified_at SET DEFAULT NOW();

CREATE TABLE IF NOT EXISTS customer_action_tokens (
  token_hash TEXT PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_action_tokens_customer_purpose_idx
  ON customer_action_tokens(customer_id, purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS customer_action_tokens_expiry_idx
  ON customer_action_tokens(expires_at);

CREATE TABLE IF NOT EXISTS email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT NOT NULL UNIQUE,
  email_type TEXT NOT NULL CHECK (email_type IN ('verify_email', 'password_reset', 'order_confirmation', 'refund_confirmation')),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT,
  text TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  provider_message_id TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS email_outbox_queue_idx
  ON email_outbox(status, updated_at)
  WHERE status IN ('queued', 'failed', 'sending');
