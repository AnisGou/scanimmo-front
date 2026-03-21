import type { MetadataRoute } from "next";
import { getPublicBaseUrl } from "@/lib/app-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicBaseUrl();
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
