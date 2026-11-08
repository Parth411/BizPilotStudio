# Deploy the BizPilot Studio V15.1 product update

This source package updates the existing `small-business-management-workbook` product page and protected download delivery.

## Included changes
- Product copy and feature list updated for workbook V15.1.
- Product gallery now uses four images rendered from the actual V15.1 workbook (fictional demo records are used only in screenshots).
- Product page clearly states that the customer receives the blank workbook, PDF user guide and quick-start notes.
- Protected download API now serves the complete ZIP package after verifying a paid order.
- Protected download package is stored under `private/downloads/` and is not exposed as a public asset.

## Deploy using the existing GitHub/Vercel connection
1. Back up the current website source and keep your existing `.env.local` / Vercel environment variables unchanged.
2. Copy the updated files and folders from this package into the existing website repository, preserving its environment files.
3. Review `git diff` and confirm the private download ZIP is present at `private/downloads/BizPilot-Studio-Small-Business-Workbook-V15.1-Complete-Package.zip`.
4. Install dependencies using the repository's normal package manager and run `npm run build`.
5. Commit and push to the connected production branch (normally `main`). Vercel should deploy automatically.
6. After deployment, test the product page, add-to-cart, checkout, paid-order download, and confirm the downloaded ZIP contains the V15.1 workbook, PDF guide and README.

Do not expose `private/downloads` through `public/` or create a public static link to the ZIP. The existing `/api/download` route checks the signed-in customer and paid order before returning the package.

## Important
This update has not been deployed to production from this environment. The GitHub repository could not be fetched here and no connected Git deployment action is available in this session. The source package is prepared for deployment through the repository already connected to Vercel.
