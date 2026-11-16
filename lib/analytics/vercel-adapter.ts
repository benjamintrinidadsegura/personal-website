import type { BeforeSendEvent } from "@vercel/analytics";

import { getPublicPageView } from "@/lib/analytics/public-page-view";
import { isPublicAnalyticsEnabled, type AnalyticsEnvironment } from "@/lib/analytics/configuration";

/** URL filtering is necessary, but is NOT a complete collector-payload privacy boundary. */
export function createPublicBeforeSend(origin: string, allowlist: ReadonlySet<string>) {
  return (event: BeforeSendEvent): BeforeSendEvent | null => {
    if (event.type !== "pageview") return null;
    try {
      const url = new URL(event.url);
      if (url.origin !== origin || url.username || url.password) return null;
      // Reject encoded, noncanonical and dot-segment references before URL normalization.
      const rawPath = event.url.slice(url.origin.length).split(/[?#]/u, 1)[0];
      if (rawPath !== url.pathname) return null;
      const view = getPublicPageView(rawPath, allowlist);
      return view ? { type: "pageview", url: origin + view.pathname } : null;
    } catch {
      return null;
    }
  };
}

/** Prepared official-SDK integration. Caller must enforce the server activation gate.
 * Not mounted while payload readiness is blocked. Only page-view preparation is supported.
 */
export async function preparePublicAnalytics(origin: string, allowlist: ReadonlySet<string>, environment: AnalyticsEnvironment) {
  if (!isPublicAnalyticsEnabled(environment)) return false;
  const { inject } = await import("@vercel/analytics");
  inject({ mode: "production", debug: false, beforeSend: createPublicBeforeSend(origin, allowlist) });
  return true;
}
