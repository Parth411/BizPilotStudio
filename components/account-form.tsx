'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function AccountForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [emailSent, setEmailSent] = useState(true);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNeedsVerification(false);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        setNeedsVerification(Boolean(result.emailNotVerified));
        throw new Error(result.error || 'Request failed.');
      }
      if (mode === 'register') {
        setRegistrationEmail(String(data.email ?? ''));
        setEmailSent(result.emailSent !== false);
        return;
      }

      window.dispatchEvent(new Event('bps-auth-changed'));
      const next = params.get('next') || '/account';
      router.replace(next.startsWith('/') && !next.startsWith('//') ? next : '/account');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  if (registrationEmail) {
    return <div className="email-action-success account-form-success" role="status">
      <strong>Check your inbox to verify your email.</strong>
      <p>We sent a verification link to <b>{registrationEmail}</b>. Use it within 24 hours to activate your BizPilot Studio account.</p>
      {!emailSent && <p className="checkouterror">Email delivery is waiting for configuration or a retry. You can request another link below.</p>}
      <Link className="btn outline" href="/account/resend-verification">Resend verification email</Link>
    </div>;
  }

  return <form className="checkoutbox" onSubmit={submit}>
    {mode === 'register' && <>
      <label htmlFor="register-first-name">First name</label><input id="register-first-name" name="firstName" required maxLength={80} autoComplete="given-name" />
      <label htmlFor="register-last-name">Last name</label><input id="register-last-name" name="lastName" required maxLength={80} autoComplete="family-name" />
      <label htmlFor="register-phone">Phone (optional)</label><input id="register-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" />
    </>}
    <label htmlFor={`${mode}-email`}>Email address</label><input id={`${mode}-email`} name="email" type="email" required autoComplete="email" maxLength={254} />
    <label htmlFor={`${mode}-password`}>Password</label><input id={`${mode}-password`} name="password" type="password" required minLength={mode === 'register' ? 10 : 1} maxLength={200} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
    {error && <p className="checkouterror" role="alert">{error}</p>}
    {needsVerification && <p className="email-action-hint">Your account needs email verification. <Link href="/account/resend-verification">Resend the verification link</Link>.</p>}
    {mode === 'login' && <p className="account-form-link"><Link href="/account/forgot-password">Forgot your password?</Link></p>}
    <button className="btn primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}</button>
  </form>;
}
