# BizPilot Studio transactional email

The app sends transactional email through the Resend REST API from server-side code. It does not send credentials, passwords, or payment details in email.

## Configure the sender

1. Create a Resend account and add a sending domain that you control. Resend requires a verified domain before it will send to your customers. Follow the DNS records shown in its dashboard and wait for verification: [Resend verified domains](https://resend.com/docs/dashboard/domains/introduction).
2. Create an API key with permission to send email.
3. Add these values to local `.env.local` and to the hosting provider's server environment. Do not use `NEXT_PUBLIC_` variables for secrets.

```dotenv
RESEND_API_KEY=re_...
EMAIL_FROM="BizPilot Studio <account@mail.bizpilotstudio.com>"
SUPPORT_EMAIL=support@bizpilotstudio.com
APP_BASE_URL=http://localhost:3000
CRON_SECRET=<long-random-secret>
```

Use the exact sender domain or subdomain you verified with Resend. For production, set `APP_BASE_URL` to the canonical HTTPS address customers use. The Resend API request supports an idempotency key, which this integration uses to prevent duplicate messages on webhook retries: [Resend send email API](https://resend.com/docs/api-reference/emails/send-email).

## Apply the database migration

Run `database/migrations/20261107_customer_email_auth.sql` once against the Neon branch used by the app, before deploying the code. It adds email-verification timestamps, expiring one-time action tokens, and a transactional email outbox. Existing customers are marked verified during this migration so their current accounts keep working. New accounts must verify their address before sign-in.

Do not run the migration against a different Neon branch than the app uses.

## Email flows

- Registration sends a 24-hour verification link. The app creates the account but does not create a sign-in session until the link is confirmed.
- Sign-in rejects unverified accounts and provides a resend path.
- Forgot-password requests always return a generic response to avoid revealing whether an email is registered. Reset links expire after one hour, work once, and revoke active sessions after a successful reset.
- Captured payments trigger an order confirmation through both the checkout verification path and Razorpay webhook path. The unique outbox key prevents the two paths from sending duplicate confirmations.
- Processed refunds send a refund confirmation.
- The first delivery attempt happens immediately when the app creates an email. Failed deliveries remain in the Neon outbox and are retried by the protected `/api/cron/emails` route. `vercel.json` schedules retries once daily at 03:00 UTC to fit Vercel Hobby's cron limit. Configure `CRON_SECRET` in the hosting environment; Vercel Cron sends it as a bearer token. On Hobby, retries can take up to roughly a day; verification and password-reset links may expire before a retry, so customers can request a fresh link.

## Local and production verification

After the migration and email environment variables are set:

1. Register with an address you can receive mail at, then verify using the email link.
2. Sign out, sign in again, and confirm a wrong or expired verification link cannot create a session.
3. Request a password reset for a real account and an unknown address; both pages should display the same confirmation.
4. Complete a Razorpay Test Mode purchase and verify that one order confirmation is delivered, including when both the checkout response and webhook run.
5. Trigger a test refund and confirm one refund email. Check Resend's email logs and the `email_outbox` row status.
6. Confirm unverified accounts cannot reach the account dashboard, checkout, or protected downloads.

Email delivery is not active until the sender domain, `RESEND_API_KEY`, `EMAIL_FROM`, and `APP_BASE_URL` are correctly configured and the migration has been applied.
