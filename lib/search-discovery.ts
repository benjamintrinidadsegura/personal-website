import type { Metadata } from "next";

import { defaultLocale, localeDetails, locales, type Locale } from "@/lib/i18n/config";
import { getLocalizedPathname } from "@/lib/i18n/routing";
import { absoluteSiteUrl, getSiteUrl, isCanonicalIndexingEnvironment, requireSiteUrl } from "@/lib/site-url";

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
  return isCanonicalIndexingEnvironment() ? getSiteUrl() : null;
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
  siteUrl = requireSiteUrl(),
}: {
  applicationCategory: string;
  description: string;
  locale: Locale;
  name: string;
  pathname: string;
  siteUrl?: URL;
}) {
  const canonical = absoluteSiteUrl(getLocalizedPathname(pathname, locale), siteUrl);
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
        isPartOf: { "@id": absoluteSiteUrl("/#website", siteUrl) },
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
          { "@type": "ListItem", position: 1, name: "Digital HQ", item: absoluteSiteUrl("/", siteUrl) },
          { "@type": "ListItem", position: 2, name, item: canonical },
        ],
      },
    ],
  };
}
