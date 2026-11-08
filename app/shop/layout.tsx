import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Small Business Templates, Trackers & Digital Tools",
  description:
    "Browse editable business templates and digital tools for planning, client management, quotations, projects, invoices and expenses.",
  alternates: { canonical: "/shop" },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
