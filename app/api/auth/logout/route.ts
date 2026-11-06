import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[auth/logout] Sign-out failed:', error);
    return NextResponse.json({ error: 'Could not sign out. Please try again.' }, { status: 500 });
  }
}
