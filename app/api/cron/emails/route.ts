import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { retryEmailOutbox } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization') ?? '';
  const received = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!secret || received.length !== secret.length || !timingSafeEqual(Buffer.from(received), Buffer.from(secret))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    return NextResponse.json(await retryEmailOutbox(20));
  } catch (error) {
    console.error('[cron/emails] Outbox processing failed:', error);
    return NextResponse.json({ error: 'Could not process queued email.' }, { status: 500 });
  }
}
