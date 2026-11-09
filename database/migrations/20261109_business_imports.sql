-- Requires 20261109_business_foundation.sql first.
-- Private import previews and normalized, business-scoped financial records.
CREATE TABLE IF NOT EXISTS business_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  source_filename TEXT NOT NULL CHECK (char_length(source_filename) BETWEEN 1 AND 255),
  source_format TEXT NOT NULL CHECK (source_format IN ('csv', 'xlsx')),
  status TEXT NOT NULL DEFAULT 'preview' CHECK (status IN ('preview', 'completed')),
  headers JSONB NOT NULL CHECK (jsonb_typeof(headers) = 'array'),
  preview_rows JSONB NOT NULL CHECK (jsonb_typeof(preview_rows) = 'array'),
  imported_records INTEGER NOT NULL DEFAULT 0 CHECK (imported_records >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (id, business_id)
);

CREATE INDEX IF NOT EXISTS business_imports_business_created_idx
  ON business_imports(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_imports_pending_expiry_idx
  ON business_imports(created_at)
  WHERE status = 'preview';

CREATE TABLE IF NOT EXISTS business_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  source_import_id UUID NOT NULL,
  created_by UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  source_row_number INTEGER NOT NULL CHECK (source_row_number >= 2),
  record_type TEXT NOT NULL CHECK (record_type IN ('sale', 'expense')),
  transaction_date DATE NOT NULL,
  amount NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  description TEXT,
  category TEXT,
  customer_name TEXT,
  product_name TEXT,
  quantity NUMERIC(18, 4) CHECK (quantity IS NULL OR quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT business_transactions_import_business_fk
    FOREIGN KEY (source_import_id, business_id)
    REFERENCES business_imports(id, business_id) ON DELETE CASCADE,
  CONSTRAINT business_transactions_import_row_type_key
    UNIQUE (source_import_id, source_row_number, record_type)
);

CREATE INDEX IF NOT EXISTS business_transactions_business_date_idx
  ON business_transactions(business_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS business_transactions_business_type_date_idx
  ON business_transactions(business_id, record_type, transaction_date DESC);

-- Keep new registrations on the same business model as backfilled accounts.
CREATE OR REPLACE FUNCTION provision_default_business_after_customer_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  default_business_id UUID;
BEGIN
  INSERT INTO businesses (name, created_by, is_default)
  VALUES (
    COALESCE(NULLIF(BTRIM(NEW.first_name || ' ' || NEW.last_name), ''), 'My') || '''s business',
    NEW.id,
    TRUE
  )
  ON CONFLICT (created_by) WHERE is_default = TRUE DO NOTHING
  RETURNING id INTO default_business_id;

  IF default_business_id IS NULL THEN
    SELECT id INTO default_business_id
    FROM businesses
    WHERE created_by = NEW.id AND is_default = TRUE
    LIMIT 1;
  END IF;

  INSERT INTO business_members (business_id, customer_id, role, status, joined_at)
  VALUES (default_business_id, NEW.id, 'owner', 'active', NOW())
  ON CONFLICT (business_id, customer_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customers_provision_default_business ON customers;
CREATE TRIGGER customers_provision_default_business
AFTER INSERT ON customers
FOR EACH ROW
EXECUTE FUNCTION provision_default_business_after_customer_insert();

-- Catch registrations created after the original business backfill ran.
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

INSERT INTO business_members (business_id, customer_id, role, status, joined_at)
SELECT b.id, b.created_by, 'owner', 'active', NOW()
FROM businesses b
WHERE b.is_default = TRUE
ON CONFLICT (business_id, customer_id) DO NOTHING;
