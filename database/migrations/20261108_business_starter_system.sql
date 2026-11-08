-- Business Starter System entitlements and customer-owned saved plans.
-- Run manually in the target Neon branch before deploying this feature.
ALTER TABLE customer_orders
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0);

CREATE TABLE IF NOT EXISTS customer_order_items (
  order_id UUID NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  unit_amount INTEGER NOT NULL CHECK (unit_amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (order_id, product_slug)
);

CREATE INDEX IF NOT EXISTS customer_order_items_product_order_idx
  ON customer_order_items(product_slug, order_id);

CREATE TABLE IF NOT EXISTS customer_business_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My business plan',
  current_step SMALLINT NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 10),
  plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_business_plans_customer_updated_idx
  ON customer_business_plans(customer_id, updated_at DESC);

