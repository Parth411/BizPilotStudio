import { NextRequest, NextResponse } from 'next/server';
import {
  clearRateLimit,
  consumeRateLimit,
  createSession,
  normalizeEmail,
  verifyPassword,
} from '@/lib/auth';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const candidate =
    forwarded?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim();

  if (!candidate || candidate.length > 64) return null;
  return candidate;
}

function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: 'Too many sign-in attempts. Please try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    },
  );
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(
      request.headers.get('content-length') ?? 0,
    );

    if (contentLength > 16_384) {
      return NextResponse.json(
        { error: 'Request is too large.' },
        { status: 413 },
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request.' },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;
    const email = normalizeEmail(data.email);
    const password =
      typeof data.password === 'string' ? data.password : '';

    if (!password || password.length > 200) {
      return NextResponse.json(
        { error: 'Email or password is incorrect.' },
        { status: 401 },
      );
    }

    const emailLimit = await consumeRateLimit(
      `login:email:${email}`,
      8,
      15,
      15,
    );

    if (emailLimit.limited) {
      return tooManyRequests(emailLimit.retryAfterSeconds);
    }

    const clientIp = getClientIp(request);

    if (clientIp) {
      const ipLimit = await consumeRateLimit(
        `login:ip:${clientIp}`,
        30,
        15,
        15,
      );

      if (ipLimit.limited) {
        return tooManyRequests(ipLimit.retryAfterSeconds);
      }
    }

    const rows = await sql`
      SELECT id, email, password_hash, first_name, last_name
      FROM customers
      WHERE email = ${email}
      LIMIT 1
    `;

    const customer = rows[0];

    if (
      !customer ||
      !(await verifyPassword(
        password,
        String(customer.password_hash ?? ''),
      ))
    ) {
      return NextResponse.json(
        { error: 'Email or password is incorrect.' },
        { status: 401 },
      );
    }

    await createSession(String(customer.id));
    await clearRateLimit(`login:email:${email}`);

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
      },
    });
  } catch (error) {
    console.error('[auth/login] Sign-in failed:', error);

    if (
      error instanceof Error &&
      error.message === 'Enter a valid email address.'
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Could not sign in. Please try again.' },
      { status: 500 },
    );
  }
}