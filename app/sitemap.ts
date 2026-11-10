import type { MetadataRoute } from "next";
import { products } from "@/lib/products";

const baseUrl = "https://www.bizpilotstudio.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "",
    "/shop",
    "/about",
    "/contact",
    "/faq",
    "/privacy",
    "/terms",
    "/refund",
    "/features/import-business-data",
    "/features/business-analytics",
    "/features/business-workspace",
    "/tools/business-starter",
    "/tools/product-finder",
    "/tools/client-growth-copilot",
    "/reviews",
  ];

  return [
    ...pages.map((path) => ({
      url: `${baseUrl}${path}`,
      changeFrequency: path === "" || path === "/shop" ? "weekly" as const : "monthly" as const,
      priority: path === "" ? 1 : path === "/shop" ? 0.9 : path === "/tools/client-growth-copilot" ? 0.88 : path.startsWith("/tools/") ? 0.85 : path.startsWith("/features/") ? 0.8 : 0.5,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
