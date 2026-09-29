import { parseSiteUrl } from "@/lib/site-url-validation";

export { parseSiteUrl } from "@/lib/site-url-validation";

export type SiteUrlEnvironment = {
  SITE_URL?: string;
  NODE_ENV?: string;
  VERCEL_ENV?: string;
};

export function getSiteUrl(environment: SiteUrlEnvironment = process.env): URL | null {
  const siteUrl = parseSiteUrl(environment.SITE_URL);
  if (environment.VERCEL_ENV === "production" && siteUrl?.protocol !== "https:") return null;
  return siteUrl;
}

export function requireSiteUrl(environment: SiteUrlEnvironment = process.env): URL {
  const siteUrl = getSiteUrl(environment);
  if (!siteUrl) throw new Error("SITE_URL must be one canonical HTTPS origin (HTTP is allowed only for local development)");
  return siteUrl;
}

export function absoluteSiteUrl(pathname: string, siteUrl: URL = requireSiteUrl()): string {
  return new URL(pathname, siteUrl).toString();
}

export function isCanonicalIndexingEnvironment(environment: SiteUrlEnvironment = process.env): boolean {
  const siteUrl = getSiteUrl(environment);
  return Boolean(
    environment.NODE_ENV === "production"
    && (!environment.VERCEL_ENV || environment.VERCEL_ENV === "production")
    && siteUrl?.protocol === "https:"
  );
}
