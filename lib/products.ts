export type Product = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  price: number;
  oldPrice?: number;
  format: string;
  badge?: string;
  visual: "sheet" | "doc" | "planner" | "creative" | "bundle" | "slides";
  features: string[];
};

// Only products with a real, prepared downloadable file are published for sale.
export const products: Product[] = [
  {
    slug: "small-business-management-workbook",
    name: "Small Business Management Workbook",
    category: "Business Tools",
    categorySlug: "business-tools",
    description:
      "A branded Excel command center to organise leads, clients, services, quotations, projects, invoices, payments and expenses in one place.",
    price: 799,
    format: "Microsoft Excel (.xlsx)",
    badge: "First release",
    visual: "sheet",
    features: [
      "Business dashboard with key operating metrics",
      "Lead and client management trackers",
      "Service catalogue and quotation workflow",
      "Project, invoice and payment tracking",
      "Expense log and monthly cash-flow report",
      "Print-ready quotation and invoice layouts",
      "Editable dropdowns and business settings",
    ],
  },
];

export const categories = [
  {
    name: "Business Tools",
    slug: "business-tools",
    description: "Track, plan and manage everyday business work.",
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
