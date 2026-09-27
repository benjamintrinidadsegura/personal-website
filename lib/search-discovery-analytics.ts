import type { DiscoverySurfaceId } from "@/data/search-discovery";
import type { Locale } from "@/lib/i18n/config";

export const discoveryReferralCategories = ["direct", "internal", "organic-search", "ai-assistant", "external"] as const;
export type DiscoveryReferralCategory = (typeof discoveryReferralCategories)[number];

const searchHosts = /(^|\.)(?:google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.brave\.com|ecosia\.org|search\.yahoo\.com)$/iu;
const aiHosts = /(^|\.)(?:chatgpt\.com|perplexity\.ai|copilot\.microsoft\.com|gemini\.google\.com)$/iu;
const discoveryRouteBySurface: Record<DiscoverySurfaceId, string> = {
  "personal-advantage": "/tools/personal-advantage",
  "money-profile": "/tools/money-profile",
};

export function classifyDiscoveryReferrer(referrer: string, origin: string): DiscoveryReferralCategory {
  if (!referrer) return "direct";
  try {
    const source = new URL(referrer);
    const current = new URL(origin);
    if (source.origin === current.origin) return "internal";
    if (searchHosts.test(source.hostname)) return "organic-search";
    if (aiHosts.test(source.hostname)) return "ai-assistant";
    return "external";
  } catch {
    return "direct";
  }
}

export function emitDiscoveryLandingEvent(surface: DiscoverySurfaceId, locale: Locale): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("bts:product-event", {
    detail: {
      name: "discovery_landing_viewed",
      route: discoveryRouteBySurface[surface],
      locale,
      referralCategory: classifyDiscoveryReferrer(document.referrer, window.location.origin),
    },
  }));
}
