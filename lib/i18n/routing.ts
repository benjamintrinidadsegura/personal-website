import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n/config";

const germanAliasPrefix = "/de";

function localePrefix(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

function prefixedLocale(pathname: string): Locale | null {
  const segment = pathname.split("/", 3)[1];
  return segment && isLocale(segment) ? segment : null;
}

function splitLocalReference(reference: string) {
  const match = reference.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/u);
  return {
    pathname: match?.[1] || "/",
    search: match?.[2] ?? "",
    hash: match?.[3] ?? "",
  };
}

export function isSafeLocalPathname(pathname: string): boolean {
  return pathname.startsWith("/")
    && !pathname.startsWith("//")
    && !pathname.includes("\\")
    && !/[\u0000-\u001f\u007f]/u.test(pathname);
}

export function localeFromPathname(pathname: string): Locale {
  return prefixedLocale(pathname) ?? defaultLocale;
}

export function stripLocalePrefix(pathname: string): string {
  const locale = prefixedLocale(pathname);
  if (!locale) return pathname;
  const prefix = `/${locale}`;
  if (pathname === prefix) return "/";
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  return pathname;
}

export function getLocalizedPathname(reference: string, locale: Locale): string {
  const { pathname, search, hash } = splitLocalReference(reference);
  if (!isSafeLocalPathname(pathname)) throw new Error("Only safe local paths can be localized");

  const unprefixed = stripLocalePrefix(pathname);
  const prefix = localePrefix(locale);
  const localized = prefix ? (unprefixed === "/" ? prefix : `${prefix}${unprefixed}`) : unprefixed;
  return `${localized}${search}${hash}`;
}

export function localizeHref(href: string, locale: Locale): string {
  if (href.startsWith("#") || /^(?:https?:|mailto:|tel:)/iu.test(href)) return href;
  return getLocalizedPathname(href, locale);
}

export function getLanguageSwitchTarget(currentReference: string, targetLocale: Locale): string {
  return getLocalizedPathname(currentReference, targetLocale);
}

export function getRequestLocaleRouting(pathname: string): {
  locale: Locale;
  internalPathname: string;
  canonicalRedirect: string | null;
} {
  if (!isSafeLocalPathname(pathname)) {
    return { locale: defaultLocale, internalPathname: pathname, canonicalRedirect: null };
  }

  if (pathname === germanAliasPrefix || pathname.startsWith(`${germanAliasPrefix}/`)) {
    return { locale: defaultLocale, internalPathname: stripLocalePrefix(pathname), canonicalRedirect: stripLocalePrefix(pathname) };
  }

  const locale = localeFromPathname(pathname);
  return { locale, internalPathname: stripLocalePrefix(pathname), canonicalRedirect: null };
}

export function getLocalePrefixes(): readonly string[] {
  return locales.filter((locale) => locale !== defaultLocale).map((locale) => `/${locale}`);
}

export function isLocaleAwarePublicPath(pathname: string): boolean {
  return ![
    "/admin",
    "/api",
    "/_next",
    "/robots.txt",
    "/sitemap.xml",
    "/favicon.ico",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
