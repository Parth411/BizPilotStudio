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
  ];

  return [
    ...pages.map((path) => ({
      url: `${baseUrl}${path}`,
      changeFrequency: path === "" || path === "/shop" ? "weekly" as const : "monthly" as const,
      priority: path === "" ? 1 : path === "/shop" ? 0.9 : path.startsWith("/features/") ? 0.75 : 0.5,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
