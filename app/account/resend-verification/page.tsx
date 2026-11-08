import Link from 'next/link';
import { EmailActionForm } from '@/components/email-action-form';

export default function ResendVerificationPage() {
  return <section className="container page"><div className="intro"><small>EMAIL VERIFICATION</small><h1>Get a new verification link.</h1><p>Enter the email address you used to create your account.</p></div><div className="summary email-action-card"><EmailActionForm mode="resend" /><p><Link href="/account/login">Return to sign in</Link></p></div></section>;
}
