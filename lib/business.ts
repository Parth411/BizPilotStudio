import 'server-only';

import { getCurrentCustomer } from '@/lib/auth';
import { sql } from '@/lib/db';

export type BusinessRole = 'owner' | 'admin' | 'member';
export type BusinessMemberStatus = 'invited' | 'active' | 'suspended';

export type BusinessMembership = {
  businessId: string;
  name: string;
  businessType: string;
  country: string | null;
  currency: string | null;
  timezone: string;
  isDefault: boolean;
  role: BusinessRole;
  status: BusinessMemberStatus;
  createdAt: string;
  updatedAt: string;
};

type BusinessMembershipRow = {
  business_id: string;
  name: string;
  business_type: string;
  country: string | null;
  currency: string | null;
  timezone: string;
  is_default: boolean;
  role: BusinessRole;
  status: BusinessMemberStatus;
  created_at: Date | string;
  updated_at: Date | string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toMembership(row: BusinessMembershipRow): BusinessMembership {
  return {
    businessId: String(row.business_id),
    name: row.name,
    businessType: row.business_type,
    country: row.country?.trim() || null,
    currency: row.currency?.trim() || null,
    timezone: row.timezone,
    isDefault: row.is_default,
    role: row.role,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/** Return active businesses for the signed-in customer, with the default first. */
export async function listMyBusinesses(): Promise<BusinessMembership[]> {
  const customer = await getCurrentCustomer();
  if (!customer) return [];

  const rows = await sql`
    SELECT b.id AS business_id, b.name, b.business_type, b.country,
           b.currency, b.timezone, b.is_default, m.role, m.status,
           b.created_at, b.updated_at
    FROM business_members m
    JOIN businesses b ON b.id = m.business_id
    WHERE m.customer_id = ${customer.id}
      AND m.status = 'active'
    ORDER BY b.is_default DESC, b.created_at ASC
  `;

  return (rows as BusinessMembershipRow[]).map(toMembership);
}

/**
 * Resolve one explicitly requested business, or the customer's default one.
 * Membership is checked in the same query as the business lookup.
 */
export async function getMyBusiness(businessId?: string | null): Promise<BusinessMembership | null> {
  const customer = await getCurrentCustomer();
  if (!customer) return null;
  if (businessId && !UUID_PATTERN.test(businessId)) return null;

  const rows = businessId
    ? await sql`
        SELECT b.id AS business_id, b.name, b.business_type, b.country,
               b.currency, b.timezone, b.is_default, m.role, m.status,
               b.created_at, b.updated_at
        FROM business_members m
        JOIN businesses b ON b.id = m.business_id
        WHERE m.customer_id = ${customer.id}
          AND m.business_id = ${businessId}
          AND m.status = 'active'
        LIMIT 1
      `
    : await sql`
        SELECT b.id AS business_id, b.name, b.business_type, b.country,
               b.currency, b.timezone, b.is_default, m.role, m.status,
               b.created_at, b.updated_at
        FROM business_members m
        JOIN businesses b ON b.id = m.business_id
        WHERE m.customer_id = ${customer.id}
          AND m.status = 'active'
        ORDER BY b.is_default DESC, b.created_at ASC
        LIMIT 1
      `;

  const row = (rows as BusinessMembershipRow[])[0];
  return row ? toMembership(row) : null;
}

/** Check an active membership and, optionally, that its role is allowed. */
export async function canAccessBusiness(
  businessId: string,
  allowedRoles?: readonly BusinessRole[],
): Promise<boolean> {
  const membership = await getMyBusiness(businessId);
  if (!membership) return false;
  return !allowedRoles || allowedRoles.includes(membership.role);
}
