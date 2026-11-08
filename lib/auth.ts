import 'server-only';

import { cookies } from 'next/headers';
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { sql } from '@/lib/db';

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = 'bps_session';
const SESSION_DAYS = 30;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: unknown): string {
  const email = String(value ?? '').trim().toLowerCase();
  if (email.length > 254 || !emailPattern.test(email)) {
    throw new Error('Enter a valid email address.');
  }
  return email;
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 10 || password.length > 200) {
    throw new Error('Password must be 10–200 characters long.');
  }

  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Validate the complete encoding before decoding or running the expensive KDF.
  const match = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/i.exec(stored);
  if (!match || typeof password !== 'string' || password.length > 200) return false;

  const salt = Buffer.from(match[1], 'hex');
  const expected = Buffer.from(match[2], 'hex');
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type RateLimitResult = {
  limited: boolean;
  retryAfterSeconds: number;
};

/**
 * Atomic, database-backed rate limiting. It works across serverless instances
 * because the counter is updated by one PostgreSQL statement.
 */
export async function consumeRateLimit(
  key: string,
  maxAttempts: number,
  windowMinutes: number,
  blockMinutes: number,
): Promise<RateLimitResult> {
  const keyHash = digest(key);
  const rows = await sql`
    INSERT INTO auth_rate_limits (key_hash, attempts, window_started_at, blocked_until, updated_at)
    VALUES (${keyHash}, 1, NOW(), NULL, NOW())
    ON CONFLICT (key_hash) DO UPDATE SET
      attempts = CASE
        WHEN auth_rate_limits.window_started_at <= NOW() - (${windowMinutes} * INTERVAL '1 minute') THEN 1
        ELSE auth_rate_limits.attempts + 1
      END,
      window_started_at = CASE
        WHEN auth_rate_limits.window_started_at <= NOW() - (${windowMinutes} * INTERVAL '1 minute') THEN NOW()
        ELSE auth_rate_limits.window_started_at
      END,
      blocked_until = CASE
        WHEN auth_rate_limits.blocked_until > NOW() THEN auth_rate_limits.blocked_until
        WHEN auth_rate_limits.window_started_at <= NOW() - (${windowMinutes} * INTERVAL '1 minute') THEN NULL
        WHEN auth_rate_limits.attempts + 1 >= ${maxAttempts}
          THEN NOW() + (${blockMinutes} * INTERVAL '1 minute')
        ELSE NULL
      END,
      updated_at = NOW()
    RETURNING blocked_until
  `;

  const blockedUntil = rows[0]?.blocked_until
    ? new Date(String(rows[0].blocked_until))
    : null;

  if (!blockedUntil || Number.isNaN(blockedUntil.getTime()) || blockedUntil.getTime() <= Date.now()) {
    return { limited: false, retryAfterSeconds: 0 };
  }

  return {
    limited: true,
    retryAfterSeconds: Math.max(1, Math.ceil((blockedUntil.getTime() - Date.now()) / 1000)),
  };
}

export async function clearRateLimit(key: string): Promise<void> {
  await sql`DELETE FROM auth_rate_limits WHERE key_hash = ${digest(key)}`;
}

export async function createSession(customerId: string): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);

  await sql`
    INSERT INTO customer_sessions (customer_id, token_hash, expires_at)
    VALUES (${customerId}, ${digest(token)}, ${expiresAt.toISOString()})
  `;

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function getCurrentCustomer() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await sql`
    SELECT c.id, c.email, c.first_name, c.last_name, c.phone
    FROM customer_sessions s
    JOIN customers c ON c.id = s.customer_id
    WHERE s.token_hash = ${digest(token)}
      AND s.expires_at > NOW()
      AND c.email_verified_at IS NOT NULL
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;

  if (token) {
    await sql`DELETE FROM customer_sessions WHERE token_hash = ${digest(token)}`;
  }

  jar.delete(COOKIE_NAME);
}
