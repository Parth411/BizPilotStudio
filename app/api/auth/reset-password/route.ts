import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, hashPassword } from '@/lib/auth';
import { hashToken } from '@/lib/email';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (Number(request.headers.get('content-length') ?? 0) > 16_384) {
      return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    }
    // Deployment must use a trusted proxy that overwrites forwarded IP headers.
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')?.trim();
    if (clientIp && clientIp.length <= 64) {
      const limit = await consumeRateLimit(`password-reset:ip:${clientIp}`, 10, 15, 15);
      if (limit.limited) return NextResponse.json({ error: 'Too many reset attempts. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } });
    }
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    const data = body as Record<string, unknown>;
    const token = typeof data.token === 'string' ? data.token : '';
    if (token.length < 32 || token.length > 128) return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
    const tokenHash = await hashToken(token);
    const allowed = await sql`SELECT 1 FROM customer_action_tokens WHERE token_hash = ${tokenHash} AND purpose = 'reset_password' AND consumed_at IS NULL AND expires_at > NOW() LIMIT 1`;
    if (!allowed.length) return NextResponse.json({ error: 'This reset link is invalid or has expired. Request another link and try again.' }, { status: 400 });
    const passwordHash = await hashPassword(typeof data.password === 'string' ? data.password : '');

    const reset = await sql`
      WITH consumed AS (
        UPDATE customer_action_tokens
        SET consumed_at = NOW()
        WHERE token_hash = ${tokenHash} AND purpose = 'reset_password'
          AND consumed_at IS NULL AND expires_at > NOW()
        RETURNING customer_id
      ), changed AS (
        UPDATE customers c SET password_hash = ${passwordHash}, updated_at = NOW()
        FROM consumed WHERE c.id = consumed.customer_id
        RETURNING c.id
      ), revoked AS (
        DELETE FROM customer_sessions s USING changed
        WHERE s.customer_id = changed.id
        RETURNING s.id
      ), invalidated AS (
        UPDATE customer_action_tokens t SET consumed_at = NOW()
        FROM changed
        WHERE t.customer_id = changed.id AND t.purpose = 'reset_password'
          AND t.consumed_at IS NULL AND t.token_hash <> ${tokenHash}
        RETURNING t.token_hash
      )
      SELECT id FROM changed
    `;
    if (!reset.length) return NextResponse.json({ error: 'This reset link is invalid or has expired. Request another link and try again.' }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[auth/reset-password] Reset failed:', error);
    if (error instanceof Error && error.message === 'Password must be 10–200 characters long.') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Could not reset your password. Request another link and try again.' }, { status: 500 });
  }
}
