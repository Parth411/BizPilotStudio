import Link from 'next/link';
import { Suspense } from 'react';
import { AccountForm } from '@/components/account-form';

export default function Page() {
  return (
    <section className="container page">
      <div className="intro">
        <small>MY ACCOUNT</small>
        <h1>Sign in to your account.</h1>
        <p>Sign in to manage purchases and access your downloads. Your email must be verified.</p>
      </div>
      <div className="summary">
        <Suspense fallback={<p>Loading sign-in form…</p>}>
          <AccountForm mode="login" />
        </Suspense>
        <p><Link href="/account/register">Create an account</Link></p>
      </div>
    </section>
  );
}
