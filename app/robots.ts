import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private pages expose their no-index directive when crawled. Blocking them
      // here would prevent search engines from seeing that directive.
      disallow: ["/api/"],
    },
    sitemap: "https://www.bizpilotstudio.com/sitemap.xml",
    host: "https://www.bizpilotstudio.com",
  };
}
