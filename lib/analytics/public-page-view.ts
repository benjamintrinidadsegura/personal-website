import { locales } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";

const editorialPages = ["/", "/about", "/people", "/world", "/writing"] as const;
const allowedPaths = new Set(locales.flatMap((locale) => editorialPages.map((path) => localizeHref(path, locale))));

export type PublicPageView = { type: "pageview"; pathname: string };

/** Accept only a local browser reference. Never forward query, fragment, referrer or event data. */
export function getPublicPageView(reference: string): PublicPageView | null {
  const pathname = reference.split(/[?#]/u, 1)[0];
  if (!allowedPaths.has(pathname)) return null;
  return { type: "pageview", pathname };
}

export type CountryPageView = { countryCode: string; pageViews: number };
export type CountryReach =
  | { status: "inactive" }
  | { status: "available"; periodStart: string; periodEnd: string; countries: readonly CountryPageView[] };
