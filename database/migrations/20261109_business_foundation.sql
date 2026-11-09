-- Add the multi-business ownership foundation without changing customer or
-- commerce records. Safe to run again if a deployment is retried.
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  business_type TEXT NOT NULL DEFAULT 'general',
  country CHAR(2),
  currency CHAR(3),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_by UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS businesses_one_default_per_creator_idx
  ON businesses(created_by)
  WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS businesses_creator_updated_idx
  ON businesses(created_by, updated_at DESC);

CREATE TABLE IF NOT EXISTS business_members (
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited', 'active', 'suspended')),
  invited_by UUID REFERENCES customers(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (business_id, customer_id)
);

CREATE INDEX IF NOT EXISTS business_members_customer_status_idx
  ON business_members(customer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS business_members_business_status_idx
  ON business_members(business_id, status);

-- Every existing customer receives one default business. The partial unique
-- index makes concurrent/retried migration execution safe.
INSERT INTO businesses (name, created_by, is_default)
SELECT COALESCE(NULLIF(BTRIM(c.first_name || ' ' || c.last_name), ''), 'My') || '''s business',
       c.id,
       TRUE
FROM customers c
WHERE NOT EXISTS (
  SELECT 1
  FROM businesses b
  WHERE b.created_by = c.id AND b.is_default = TRUE
)
ON CONFLICT (created_by) WHERE is_default = TRUE DO NOTHING;

-- Make each default business owner an active member. Existing memberships are
-- preserved so rerunning this migration does not reset a later status change.
INSERT INTO business_members (
  business_id, customer_id, role, status, joined_at
)
SELECT b.id, b.created_by, 'owner', 'active', NOW()
FROM businesses b
WHERE b.is_default = TRUE
ON CONFLICT (business_id, customer_id) DO NOTHING;
