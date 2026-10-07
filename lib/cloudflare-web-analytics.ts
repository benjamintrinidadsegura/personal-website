import { stripLocalePrefix } from "@/lib/i18n/routing";

export const cloudflareAnalyticsHeader = "x-bts-public-web-analytics";
export const cloudflareBeaconUrl = "https://static.cloudflareinsights.com/beacon.min.js";
export const cloudflareBeaconData = '{"token": "cdbaf80825cc47feaf2b19079a380f04"}';

/** Classify routes only. Never read account, assessment or persisted product state. */
export function isPublicAnalyticsPath(pathname: string): boolean {
  let path: string;
  try {
    path = stripLocalePrefix(decodeURIComponent(pathname).replaceAll("\\", "/"));
  } catch {
    return false;
  }
  if (!path.startsWith("/") || path.startsWith("//") || /[\u0000-\u001f\u007f]/u.test(path)) return false;
  return ![
    "/admin", "/account", "/api", "/_next",
    "/life-alignment/invite", "/life-alignment/session", "/life-alignment/sessions",
    "/life-alignment/partner/shared-device", "/newsletter/confirm", "/newsletter/unsubscribe",
  ].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function isCloudflareAnalyticsEnabled({ siteOrigin, requestHost, nodeEnv, vercelEnv }: {
  siteOrigin: string; requestHost: string | null; nodeEnv?: string; vercelEnv?: string;
}): boolean {
  return siteOrigin === "https://btshq.online" && requestHost === "btshq.online"
    && nodeEnv === "production" && (!vercelEnv || vercelEnv === "production");
}

/** A loaded SPA beacon cannot be unloaded. Cross the privacy boundary in a new document. */
export function needsAnalyticsDocumentNavigation(pathname: string, sourceReference: string | null, origin: string): boolean {
  if (!sourceReference) return true;
  try {
    const source = new URL(sourceReference, origin);
    return source.origin !== origin || isPublicAnalyticsPath(source.pathname) !== isPublicAnalyticsPath(pathname);
  } catch {
    return true;
  }
}
