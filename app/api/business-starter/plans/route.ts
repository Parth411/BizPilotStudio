import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { sql } from '@/lib/db';
import { hasBusinessStarterAccess, validPlanPayload } from '@/lib/business-starter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authorized() {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: NextResponse.json({ error: 'Sign in to access your saved plans.' }, { status: 401 }) };
  if (!(await hasBusinessStarterAccess(String(customer.id)))) return { error: NextResponse.json({ error: 'Purchase the Business Starter System to use the planner.' }, { status: 403 }) };
  return { customer };
}

export async function GET() {
  try {
    const auth = await authorized(); if ('error' in auth) return auth.error;
    const rows = await sql`SELECT id, name, current_step, plan_data, created_at, updated_at FROM customer_business_plans WHERE customer_id=${auth.customer.id} ORDER BY updated_at DESC`;
    return NextResponse.json({ plans: rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { console.error('List business plans failed', error); return NextResponse.json({ error: 'Could not load your plans.' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorized(); if ('error' in auth) return auth.error;
    const body = await request.json();
    const name = String(body.name || 'My business plan').trim().slice(0, 100) || 'My business plan';
    const currentStep = Number(body.currentStep || 1);
    const data = body.data ?? {};
    if (!Number.isInteger(currentStep) || currentStep < 1 || currentStep > 10 || !validPlanPayload(data)) return NextResponse.json({ error: 'The plan data is invalid or too large.' }, { status: 400 });
    const rows = await sql`INSERT INTO customer_business_plans (customer_id, name, current_step, plan_data) VALUES (${auth.customer.id}, ${name}, ${currentStep}, ${JSON.stringify(data)}::jsonb) RETURNING id, name, current_step, plan_data, created_at, updated_at`;
    return NextResponse.json({ plan: rows[0] }, { status: 201 });
  } catch (error) { console.error('Create business plan failed', error); return NextResponse.json({ error: 'Could not create your plan.' }, { status: 500 }); }
}
