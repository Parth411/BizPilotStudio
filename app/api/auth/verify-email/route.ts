import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { hashToken } from '@/lib/email';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (Number(request.headers.get('content-length') ?? 0) > 16_384) {
      return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    }
    const body: unknown = await request.json();
    const token = body && typeof body === 'object' && 'token' in body
      ? String((body as { token?: unknown }).token ?? '')
      : '';
    if (token.length < 32 || token.length > 128) {
      return NextResponse.json({ error: 'This verification link is invalid or has expired.' }, { status: 400 });
    }

    const tokenHash = await hashToken(token);
    const verified = await sql`
      WITH consumed AS (
        UPDATE customer_action_tokens
        SET consumed_at = NOW()
        WHERE token_hash = ${tokenHash} AND purpose = 'verify_email'
          AND consumed_at IS NULL AND expires_at > NOW()
        RETURNING customer_id
      )
      UPDATE customers c
      SET email_verified_at = COALESCE(c.email_verified_at, NOW())
      FROM consumed
      WHERE c.id = consumed.customer_id
      RETURNING c.id
    `;
    const customerId = verified[0]?.id;
    if (!customerId) {
      return NextResponse.json({ error: 'This verification link is invalid or has expired. Request a new link and try again.' }, { status: 400 });
    }

    await sql`UPDATE customer_action_tokens SET consumed_at = NOW() WHERE customer_id = ${customerId} AND purpose = 'verify_email' AND consumed_at IS NULL`;
    await createSession(String(customerId));
    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error('[auth/verify-email] Verification failed:', error);
    return NextResponse.json({ error: 'Could not verify your email. Please try again.' }, { status: 500 });
  }
}
