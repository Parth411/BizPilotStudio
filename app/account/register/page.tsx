import Link from 'next/link';
import { Suspense } from 'react';
import { AccountForm } from '@/components/account-form';

export default function Page() {
  return (
    <section className="container page">
      <div className="intro">
        <small>MY ACCOUNT</small>
        <h1>Create your BizPilot account.</h1>
        <p>Create your account, then verify your email to access purchases and downloads.</p>
      </div>
      <div className="summary">
        <Suspense fallback={<p>Loading registration form…</p>}>
          <AccountForm mode="register" />
        </Suspense>
        <p><Link href="/account/login">Already have an account? Sign in</Link></p>
      </div>
    </section>
  );
}
