import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { CurrencyProvider } from "@/components/currency-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.bizpilotstudio.com"),
  title: {
    default: "BizPilot Studio | Business Templates & Digital Tools",
    template: "%s | BizPilot Studio",
  },
  description:
    "Practical business templates and digital tools for small businesses. Organise clients, quotes, projects, invoices, payments and expenses with the BizPilot Studio workbook.",
  applicationName: "BizPilot Studio",
  openGraph: {
    type: "website",
    siteName: "BizPilot Studio",
    url: "/",
    title: "BizPilot Studio | Business Templates & Digital Tools",
    description:
      "Practical business templates and digital tools to help small businesses work smarter.",
    images: [{ url: "/bizpilot-logo-lockup.png", width: 1393, height: 352, alt: "BizPilot Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BizPilot Studio | Business Templates & Digital Tools",
    description: "Practical business templates and digital tools for small businesses.",
    images: ["/bizpilot-logo-lockup.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CurrencyProvider>
          <CartProvider>
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
