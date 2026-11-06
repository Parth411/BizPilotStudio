# BizPilot Studio — Neon + customer accounts integration

## What this patch adds
- Neon PostgreSQL access through `@neondatabase/serverless`.
- Customer registration/sign-in with scrypt password hashes and opaque, HttpOnly, SameSite=Lax sessions.
- Database-backed pending orders and captured payment records.
- Razorpay verification tied to the signed-in customer and persisted order amount/currency/product.
- Downloads require an authenticated customer and a `paid` order belonging to that customer.
- My Account order history and downloads.

## Apply safely
1. Back up your current `F:\BizPilotWebsite` folder or commit it to Git.
2. Extract the ZIP to a temporary folder. Copy the application files into `F:\BizPilotWebsite`, preserving paths. Do not overwrite `.env.local`, `.neon`, `neon.ts`, or `package-lock.json`.
3. Merge the `@neondatabase/serverless` dependency from the patch `package.json` into your existing `package.json` (keep your existing `@neon/config` and `@neon/env` entries), then run `npm install @neondatabase/serverless`.
4. In Neon Console → SQL Editor, select the `production` branch and run the complete `db/0001_initial.sql` file once.
5. Ensure your local `.env.local` contains the freshly rotated `DATABASE_URL`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET`. Do not paste these values into chat or commit them.
6. Start with Razorpay Test Mode credentials.
7. Run `npm run build`, then `npm run dev`.
8. Test registration, logout/login, checkout order creation, a Razorpay test payment, account order history, and download. A real test payment must show as `captured` in Razorpay before a download appears.

## Important
- This integration expects one product slug currently: `small-business-management-workbook`.
- Prices are computed server-side from `lib/pricing.ts`; browser-sent price values are ignored.
- The account system is intentionally custom and does not use Neon Auth.
- `@neondatabase/serverless` tagged-template queries are parameterized. Do not interpolate untrusted strings into SQL.
- This is a first integration pass, not a claim of production readiness. Before launch add email verification/password reset, rate limiting/abuse protection, Razorpay webhooks with signature validation, refund handling, CSRF/origin checks, privacy/retention review, and full end-to-end tests.
- Existing old download links will no longer work after the download route is replaced; purchases made before this database integration need manual support or a migration plan.
