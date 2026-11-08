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
  fulfillment: "download" | "online_access";
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
    price: 399,
    oldPrice: 1299,
    format: "Microsoft Excel (.xlsx)",
    fulfillment: "download",
    badge: "Diwali offer",
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
  {
    slug: "business-starter-system",
    name: "Business Starter System",
    category: "Business Planning",
    categorySlug: "business-planning",
    description:
      "An AI-assisted online business planning system to validate an idea, estimate startup capital, test pricing and break-even, and turn profit goals into practical sales targets.",
    price: 499,
    format: "Online access · Saved progress · Data export",
    badge: "Online business tool",
    visual: "planner",
    fulfillment: "online_access",
    features: [
      "Validate your idea and launch readiness across 10 guided steps",
      "Estimate startup costs, operating expenses and required capital",
      "Test unit pricing, profit margin, break-even and capital recovery",
      "Plan sales, order, website traffic and advertising targets",
      "Save your plan securely and return to update it later",
      "Compare actual results with your original targets",
      "Export your plan and results as a portable JSON backup",
      "Generate a Gemini AI review of your assumptions, risks and next steps",
      "See transparent, assumption-based calculations alongside AI suggestions",
    ],
  },
];

export const categories = [
  {
    name: "Business Tools",
    slug: "business-tools",
    description: "Track, plan and manage everyday business work.",
  },
  {
    name: "Business Planning",
    slug: "business-planning",
    description: "Validate ideas, plan startup costs and test business numbers.",
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
