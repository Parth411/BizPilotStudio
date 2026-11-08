# Razorpay Standard Checkout setup

This project already implements Razorpay Standard Checkout using Razorpay's Orders and Payments REST APIs from Next.js server routes. It intentionally does not add the `razorpay` npm SDK: server-side `fetch` is already used, so adding a second integration would duplicate dependencies and logic.

## Local environment

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to the Neon connection string.
3. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to a freshly generated **Test Mode** key pair.
4. Set `RAZORPAY_WEBHOOK_SECRET` to a separate random webhook secret configured in the Razorpay Test Mode dashboard.
5. Never commit `.env.local`, expose the key secret in browser variables, or paste secrets into chat.

## Existing endpoints

- `POST /api/checkout/create-order`: requires a signed-in customer, calculates the server-side product price, creates the Razorpay order, and saves a pending order in Neon.
- `POST /api/checkout/verify`: validates the HMAC-SHA256 signature using a timing-safe comparison, then fetches the payment and order from Razorpay and checks captured status, amount, currency, product and customer before marking the order paid.
- `POST /api/webhooks/razorpay`: validates `X-Razorpay-Signature` against the raw request body and processes captured, failed and refund events idempotently.
- `GET /api/download?order=<database-order-id>`: requires the signed-in customer to own a paid order before streaming `private/downloads/BizPilot_Product_Package.zip`.

## Razorpay webhook configuration

Configure a webhook URL for each environment:

- Local development: use a secure HTTPS tunnel to `https://<your-tunnel-host>/api/webhooks/razorpay`.
- Production: `https://bizpilotstudio.com/api/webhooks/razorpay`.

Use the exact webhook secret in that environment's `RAZORPAY_WEBHOOK_SECRET`. Subscribe to `payment.captured`, `payment.failed`, and `refund.processed`.

## Test

1. Run `npm install` and `npm run dev`.
2. Sign in, add the workbook to cart, and open checkout.
3. Complete a Razorpay Test Mode payment.
4. Confirm the Neon `customer_orders` row changes from `pending` to `paid` and a `customer_payments` row is created.
5. Open My Account and download the ZIP. Confirm it contains the Demo Edition, Blank Edition, PDF guide and README.
6. Test a declined payment and a dismissed checkout; neither should grant download access.

## Production cutover

Only after Razorpay activates the merchant account and required payment methods, replace the Vercel Production values of `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` with the **Live** credentials/separate Live webhook secret. Redeploy. Do not use test keys in production or live keys locally during test runs. Test the full order-to-download journey before announcing the store.
