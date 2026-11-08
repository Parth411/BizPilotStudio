import { NextRequest, NextResponse } from 'next/server';
import {
  consumeRateLimit,
  hashPassword,
  normalizeEmail,
} from '@/lib/auth';
import { sql } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';

export const runtime = 'nodejs';

function getClientIp(request: NextRequest): string | null {
  // Requires a trusted reverse proxy that overwrites forwarded headers.
  const forwarded = request.headers.get('x-forwarded-for');
  const candidate = forwarded?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim();
  if (!candidate || candidate.length > 64) return null;
  return candidate;
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 16_384) {
      return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const email = normalizeEmail(data.email);
    const firstName = String(data.firstName ?? '').trim();
    const lastName = String(data.lastName ?? '').trim();
    const phone = String(data.phone ?? '').trim().slice(0, 40) || null;

    if (!firstName || !lastName || firstName.length > 80 || lastName.length > 80) {
      return NextResponse.json({ error: 'Enter your first and last name.' }, { status: 400 });
    }

    const clientIp = getClientIp(request);
    if (clientIp) {
      const ipLimit = await consumeRateLimit(`register:ip:${clientIp}`, 5, 60, 60);
      if (ipLimit.limited) {
        return NextResponse.json(
          { error: 'Too many account creation attempts. Please try again later.' },
          { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } },
        );
      }
    }

    const emailLimit = await consumeRateLimit(`register:email:${email}`, 3, 60, 60);
    if (emailLimit.limited) {
      return NextResponse.json(
        { error: 'Too many account creation attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfterSeconds) } },
      );
    }

    const passwordHash = await hashPassword(String(data.password ?? ''));
    const rows = await sql`
      INSERT INTO customers (email, password_hash, first_name, last_name, phone, email_verified_at)
      VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName}, ${phone}, NULL)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, first_name, last_name
    `;

    if (!rows.length) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 },
      );
    }

    let emailSent = false;
    try {
      emailSent = await sendVerificationEmail({
        id: String(rows[0].id),
        email: String(rows[0].email),
        first_name: String(rows[0].first_name),
      });
    } catch (error) {
      console.error('[auth/register] Verification email could not be queued:', error);
    }
    return NextResponse.json({ verificationRequired: true, emailSent }, { status: 201 });
  } catch (error) {
    console.error('[auth/register] Registration failed:', error);
    if (error instanceof Error && (
      error.message === 'Enter a valid email address.'
      || error.message === 'Password must be 10–200 characters long.'
    )) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Could not create your account. Please try again.' }, { status: 500 });
  }
}
