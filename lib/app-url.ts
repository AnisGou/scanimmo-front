function normalizeUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getPublicBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (!configuredUrl) {
    return "http://localhost:3000";
  }

  if (configuredUrl.startsWith("http://") || configuredUrl.startsWith("https://")) {
    return normalizeUrl(configuredUrl);
  }

  return normalizeUrl(`https://${configuredUrl}`);
}
