-- Preserve purchased item quantity and default existing orders to one unit.
ALTER TABLE customer_orders
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0);
