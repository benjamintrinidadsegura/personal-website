import { locales } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";

const editorialPages = ["/", "/about", "/people", "/world", "/writing", "/echowall", "/community", "/projects"] as const;

/** Dynamic destinations must come from already validated public records, never URL input. */
export function createPublicPageViewAllowlist(records: {
  writingSlugs?: readonly string[];
  projectSlugs?: readonly string[];
  peopleSlugs?: readonly string[];
} = {}): ReadonlySet<string> {
  const paths: string[] = [...editorialPages];
  for (const [prefix, slugs] of [
    ["/writing", records.writingSlugs], ["/projects", records.projectSlugs], ["/people", records.peopleSlugs],
  ] as const) {
    for (const slug of slugs ?? []) {
      if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) paths.push(`${prefix}/${slug}`);
    }
  }
  return new Set(locales.flatMap((locale) => paths.map((path) => localizeHref(path, locale))));
}

const allowedPaths = createPublicPageViewAllowlist();

export type PublicPageView = { type: "pageview"; pathname: string };

/** Accept only a local browser reference. Never forward query, fragment, referrer or event data. */
export function getPublicPageView(reference: string, allowlist: ReadonlySet<string> = allowedPaths): PublicPageView | null {
  const pathname = reference.split(/[?#]/u, 1)[0];
  if (!allowlist.has(pathname)) return null;
  return { type: "pageview", pathname };
}
