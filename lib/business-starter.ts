import 'server-only';
import { sql } from '@/lib/db';

export async function hasBusinessStarterAccess(customerId: string): Promise<boolean> {
  const rows = await sql`SELECT EXISTS (
    SELECT 1 FROM customer_orders o
    LEFT JOIN customer_order_items i ON i.order_id = o.id
    WHERE o.customer_id = ${customerId} AND o.status = 'paid'
      AND (i.product_slug = 'business-starter-system'
        OR (i.order_id IS NULL AND o.product_slug = 'business-starter-system'))
  ) AS allowed`;
  return Boolean(rows[0]?.allowed);
}

export function validPlanPayload(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  try { return Buffer.byteLength(JSON.stringify(value), 'utf8') <= 100_000; } catch { return false; }
}
