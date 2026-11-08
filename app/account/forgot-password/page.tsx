import Link from 'next/link';
import { EmailActionForm } from '@/components/email-action-form';

export default function ForgotPasswordPage() {
  return <section className="container page"><div className="intro"><small>ACCOUNT RECOVERY</small><h1>Reset your password.</h1><p>Enter the email address on your account. We’ll send a secure reset link if the account is eligible.</p></div><div className="summary email-action-card"><EmailActionForm mode="forgot" /><p><Link href="/account/login">Return to sign in</Link></p></div></section>;
}
