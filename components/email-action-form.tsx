'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Mode = 'verify' | 'resend' | 'forgot' | 'reset';

export function EmailActionForm({ mode, token = '' }: { mode: Mode; token?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const endpoint = mode === 'verify' ? '/api/auth/verify-email'
      : mode === 'resend' ? '/api/auth/resend-verification'
      : mode === 'forgot' ? '/api/auth/forgot-password'
      : '/api/auth/reset-password';
    const payload = mode === 'verify' || mode === 'reset' ? { ...values, token } : values;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Request failed.');
      if (mode === 'verify') {
        window.dispatchEvent(new Event('bps-auth-changed'));
        setSuccess('Your email is verified. Opening your account…');
        router.replace('/account');
        router.refresh();
      } else if (mode === 'reset') {
        setSuccess('Your password has been changed. Sign in with your new password.');
      } else {
        setSuccess(result.message || 'If an account exists, an email will be sent.');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const isTokenMode = mode === 'verify' || mode === 'reset';
  const missingToken = isTokenMode && !token;
  const buttonLabel = mode === 'verify' ? 'Verify email address'
    : mode === 'resend' ? 'Send verification link'
    : mode === 'forgot' ? 'Send password reset link'
    : 'Save new password';

  return <div>
    {missingToken ? <div className="email-action-message" role="alert">This link is incomplete. Request a new one below.</div> : (
      <form className="checkoutbox" onSubmit={submit}>
        {(mode === 'forgot' || mode === 'resend') && <><label htmlFor="action-email">Email address</label><input id="action-email" name="email" type="email" autoComplete="email" required maxLength={254} /></>}
        {mode === 'reset' && <><label htmlFor="new-password">New password</label><input id="new-password" name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={200} /><small>Use 10 to 200 characters.</small></>}
        {error && <p className="checkouterror" role="alert">{error}</p>}
        {success && <p className="email-action-success" role="status">{success}</p>}
        {mode === 'verify' && <p className="paymentnotice">This secure link can only be used once. It expires after 24 hours.</p>}
        <button className="btn primary" disabled={busy || (mode === 'verify' && !token)}>{busy ? 'Please wait…' : buttonLabel}</button>
      </form>
    )}
    {mode === 'reset' && success && <p><Link href="/account/login">Go to sign in</Link></p>}
    {mode === 'verify' && (missingToken || error) && <p><Link href="/account/resend-verification">Request another verification link</Link></p>}
  </div>;
}
