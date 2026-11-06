# BizPilot Studio — Website

Next.js 15 + React 19 + TypeScript storefront for BizPilot Studio.

## Run locally
Requires Node.js 20.9+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Current storefront
- Responsive homepage, shop, product detail, cart, checkout, about, contact, FAQ, terms, privacy and refund pages.
- The first sale product is the branded Small Business Management Workbook.
- Product download is stored under `private/downloads` and is not exposed as a public static asset.
- Country selector and geo-IP country detection with market-specific display prices.
- Server-side order creation and Razorpay signature + captured-payment verification.
- Download access uses a signed, expiring token.

## Country price table
These are fixed market prices, not live FX conversions:
- India: INR 799
- United States: USD 12.99
- United Kingdom: GBP 9.99
- Canada: CAD 16.99
- Australia: AUD 18.99
- New Zealand: NZD 19.99
- Germany, France, Ireland, Netherlands: EUR 11.99
- Singapore: SGD 16.99
- UAE: AED 47
- Other countries: USD 12.99

Review these prices, taxes, local consumer rules and Razorpay currency support before launch.

## Razorpay setup
1. Keep Razorpay in Test Mode while testing.
2. Copy `.env.example` to `.env.local`.
3. Add the Test Mode `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and a random `DOWNLOAD_TOKEN_SECRET` (at least 32 characters).
4. Never commit `.env.local`, send API secrets in chat, or put the secret in a `NEXT_PUBLIC_` variable.
5. Run a test purchase for India first. Test foreign currencies only after confirming the merchant account supports them.
6. The server checks the Razorpay signature, captured payment, order amount, currency, product and market before issuing the download token.

## Important launch blockers
- The domain `bizpilotstudio.com` is still under registration review; connect DNS after it becomes active.
- Website/app verification is still required in Razorpay before going live.
- International card payments and each foreign currency may require Razorpay approval/activation. A country selector changes displayed market pricing; it does not guarantee the gateway will accept that currency.
- Production checkout should add a durable order database, Razorpay webhook reconciliation, and email delivery of receipts/download recovery links before accepting public live payments. The current success-page download is verified but is not a substitute for reliable order records and email recovery.
- Set production environment variables in the hosting provider, not in source code.
- Test payment, cancellation, failed payment, repeat callback, download expiry and mobile checkout.
- Review and approve all legal policy text and tax treatment for the markets served.
- The source has not yet passed a full `next build` in this environment because npm dependency installation timed out. Run `npm install` and `npm run build` before deployment.

## Deployment outline
1. Push this project to a private GitHub repository.
2. Import the repository into Vercel.
3. Add the production environment variables in Vercel.
4. Deploy first to the Vercel preview URL and test.
5. Once the domain is active, add `bizpilotstudio.com` in Vercel and apply the DNS records Vercel provides.
6. Submit the live website URL in Razorpay Website/App Details and wait for approval before enabling live payments.
