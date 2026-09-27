import type { Metadata } from "next";

import { siteConfig } from "@/data/site";
import { defaultLocale, localeDetails, locales, type Locale } from "@/lib/i18n/config";
import { getLocalizedPathname } from "@/lib/i18n/routing";

export const publicStaticRoutes = [
  "/",
  "/echowall",
  "/writing",
  "/newsletter",
  "/privacy",
  "/impressum",
  "/about",
  "/about/how-my-brain-works",
  "/about/nerd-corner",
  "/people",
  "/world",
  "/tools/personal-advantage",
  "/tools/money-profile",
] as const;

export const privateRoutePrefixes = [
  "/admin",
  "/account",
  "/api",
  "/newsletter/confirm",
  "/newsletter/unsubscribe",
  "/life-alignment/invite",
  "/life-alignment/session",
  "/life-alignment/sessions",
  "/life-alignment/partner/shared-device",
] as const;

export const searchRetrievalCrawlers = [
  "Googlebot",
  "Bingbot",
  "OAI-SearchBot",
  "ChatGPT-User",
] as const;

export const modelTrainingCrawlers = ["GPTBot"] as const;

export function getCanonicalProductionUrl(): URL | null {
  if (process.env.NODE_ENV !== "production" || !process.env.SITE_URL) return null;

  try {
    const url = new URL(process.env.SITE_URL);
    if (
      url.protocol !== "https:"
      || url.hostname !== siteConfig.domain
      || url.port !== ""
      || url.username !== ""
      || url.password !== ""
      || url.pathname !== "/"
      || url.search !== ""
      || url.hash !== ""
    ) return null;
    return new URL(url.origin);
  } catch {
    return null;
  }
}

export function getLocalizedPrivateRoutePrefixes(): string[] {
  return [
    ...privateRoutePrefixes,
    ...locales.filter((locale) => locale !== defaultLocale).flatMap((locale) => (
      privateRoutePrefixes
        .filter((route) => !route.startsWith("/admin") && !route.startsWith("/api"))
        .map((route) => `/${locale}${route}`)
    )),
  ];
}

function verificationToken(value: string | undefined): string | null {
  const token = value?.trim();
  return token && /^[A-Za-z0-9._-]{6,256}$/u.test(token) ? token : null;
}

export function getSiteVerificationMetadata(): Metadata["verification"] | undefined {
  const google = verificationToken(process.env.GOOGLE_SITE_VERIFICATION);
  const bing = verificationToken(process.env.BING_SITE_VERIFICATION);
  if (!google && !bing) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  };
}

export function createToolStructuredData({
  applicationCategory,
  description,
  locale,
  name,
  pathname,
}: {
  applicationCategory: string;
  description: string;
  locale: Locale;
  name: string;
  pathname: string;
}) {
  const canonical = new URL(getLocalizedPathname(pathname, locale), `https://${siteConfig.domain}`).toString();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name,
        description,
        inLanguage: localeDetails[locale].htmlLang,
        isPartOf: { "@id": `https://${siteConfig.domain}/#website` },
        mainEntity: { "@id": `${canonical}#tool` },
      },
      {
        "@type": "WebApplication",
        "@id": `${canonical}#tool`,
        url: canonical,
        name,
        description,
        inLanguage: localeDetails[locale].htmlLang,
        applicationCategory,
        operatingSystem: "Web browser",
        browserRequirements: "JavaScript is required for the interactive reflection; explanatory content is available in the initial document.",
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Digital HQ", item: `https://${siteConfig.domain}/` },
          { "@type": "ListItem", position: 2, name, item: canonical },
        ],
      },
    ],
  };
}
