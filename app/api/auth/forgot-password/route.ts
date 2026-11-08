import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, normalizeEmail } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
const genericMessage = 'If an account exists for that email, password reset instructions will be sent.';

export async function POST(request: NextRequest) {
  try {
    if (Number(request.headers.get('content-length') ?? 0) > 16_384) return NextResponse.json({ message: genericMessage });
    const body: unknown = await request.json();
    const value = body && typeof body === 'object' && 'email' in body
      ? String((body as { email?: unknown }).email ?? '')
      : '';
    let email: string;
    try { email = normalizeEmail(value); } catch { return NextResponse.json({ message: genericMessage }); }

    const limit = await consumeRateLimit(`password-reset:${email}`, 3, 60, 60);
    if (limit.limited) return NextResponse.json({ message: genericMessage }, { headers: { 'Retry-After': String(limit.retryAfterSeconds) } });

    const rows = await sql`
      SELECT id, email, first_name FROM customers
      WHERE email = ${email} AND email_verified_at IS NOT NULL LIMIT 1
    `;
    if (rows[0]) await sendPasswordResetEmail({ id: String(rows[0].id), email: String(rows[0].email), first_name: String(rows[0].first_name) });
    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error('[auth/forgot-password] Request failed:', error);
    return NextResponse.json({ message: genericMessage });
  }
}
