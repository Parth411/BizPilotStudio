import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

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
    const expired = await sql`
      DELETE FROM business_imports
      WHERE status = 'preview'
        AND created_at <= NOW() - INTERVAL '24 hours'
      RETURNING id
    `;
    return NextResponse.json({ removedPreviews: expired.length });
  } catch (error) {
    console.error('[cron/imports/cleanup] Could not remove expired previews', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Could not clean expired import previews.' }, { status: 500 });
  }
}
