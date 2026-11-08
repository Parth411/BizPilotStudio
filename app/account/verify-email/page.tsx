import Link from 'next/link';
import { EmailActionForm } from '@/components/email-action-form';

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams;
  return <section className="container page"><div className="intro"><small>EMAIL VERIFICATION</small><h1>Verify your email address.</h1><p>Confirm your email to activate your account and access your purchases.</p></div><div className="summary email-action-card"><EmailActionForm mode="verify" token={token} /><p><Link href="/account/resend-verification">Need a new verification link?</Link></p></div></section>;
}
