-- Persistent, cross-instance rate-limit buckets for customer authentication.
-- This table is independent of the customers/customer_sessions ID types.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key_hash TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_rate_limits_updated_at_idx
  ON auth_rate_limits (updated_at);

-- Optional maintenance: run periodically (e.g. daily) to remove old buckets.
-- DELETE FROM auth_rate_limits WHERE updated_at < NOW() - INTERVAL '7 days';
