import Link from 'next/link';
import { EmailActionForm } from '@/components/email-action-form';

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams;
  return <section className="container page"><div className="intro"><small>ACCOUNT RECOVERY</small><h1>Choose a new password.</h1><p>Use a new password between 10 and 200 characters.</p></div><div className="summary email-action-card"><EmailActionForm mode="reset" token={token} /><p><Link href="/account/login">Return to sign in</Link></p></div></section>;
}
