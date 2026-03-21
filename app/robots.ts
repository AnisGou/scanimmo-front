import type { MetadataRoute } from "next";
import { getPublicBaseUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/success"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
