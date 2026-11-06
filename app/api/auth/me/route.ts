import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const customer = await getCurrentCustomer();
    return NextResponse.json(
      { customer },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (error) {
    console.error('[auth/me] Session lookup failed:', error);
    return NextResponse.json(
      { error: 'Could not load your account session.' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
