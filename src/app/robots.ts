import type { MetadataRoute } from "next";

const SITE_URL = "https://klok.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep authenticated app routes and the API out of the index.
      disallow: [
        "/dashboard",
        "/today",
        "/analytics",
        "/templates",
        "/settings",
        "/recurring-blocks",
        "/onboarding",
        "/reset-password",
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
