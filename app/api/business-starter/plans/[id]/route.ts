import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { sql } from '@/lib/db';
import { hasBusinessStarterAccess, validPlanPayload } from '@/lib/business-starter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

async function authorize() {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: NextResponse.json({ error: 'Sign in to access your saved plans.' }, { status: 401 }) };
  if (!(await hasBusinessStarterAccess(String(customer.id)))) return { error: NextResponse.json({ error: 'Purchase the Business Starter System to use the planner.' }, { status: 403 }) };
  return { customer };
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    const auth = await authorize(); if ('error' in auth) return auth.error;
    const { id } = await context.params;
    const rows = await sql`SELECT id, name, current_step, plan_data, created_at, updated_at FROM customer_business_plans WHERE id=${id} AND customer_id=${auth.customer.id} LIMIT 1`;
    if (!rows[0]) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
    return NextResponse.json({ plan: rows[0] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { console.error('Load business plan failed', error); return NextResponse.json({ error: 'Could not load this plan.' }, { status: 500 }); }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const auth = await authorize(); if ('error' in auth) return auth.error;
    const { id } = await context.params;
    const body = await request.json();
    const name = String(body.name || 'My business plan').trim().slice(0, 100) || 'My business plan';
    const currentStep = Number(body.currentStep || 1);
    const data = body.data ?? {};
    if (!Number.isInteger(currentStep) || currentStep < 1 || currentStep > 10 || !validPlanPayload(data)) return NextResponse.json({ error: 'The plan data is invalid or too large.' }, { status: 400 });
    const rows = await sql`UPDATE customer_business_plans SET name=${name}, current_step=${currentStep}, plan_data=${JSON.stringify(data)}::jsonb, updated_at=NOW() WHERE id=${id} AND customer_id=${auth.customer.id} RETURNING id, name, current_step, plan_data, created_at, updated_at`;
    if (!rows[0]) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
    return NextResponse.json({ plan: rows[0] });
  } catch (error) { console.error('Save business plan failed', error); return NextResponse.json({ error: 'Could not save your changes.' }, { status: 500 }); }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const auth = await authorize(); if ('error' in auth) return auth.error;
    const { id } = await context.params;
    const rows = await sql`DELETE FROM customer_business_plans WHERE id=${id} AND customer_id=${auth.customer.id} RETURNING id`;
    if (!rows[0]) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) { console.error('Delete business plan failed', error); return NextResponse.json({ error: 'Could not delete this plan.' }, { status: 500 }); }
}
