import type { Metadata } from "next";

import { defaultLocale, localeDetails, locales, type Locale } from "@/lib/i18n/config";
import { getLocalizedPathname } from "@/lib/i18n/routing";

export const defaultSocialImage = {
  url: "/og-btshq-v2.png",
  width: 1200,
  height: 630,
  alt: "btshq.online — Benjamin Trinidad Segura",
};

export function getLanguageAlternates(pathname: string, includedLocales: readonly Locale[] = locales) {
  const languages: Record<string, string> = {};
  for (const locale of includedLocales) languages[locale] = getLocalizedPathname(pathname, locale);
  if (includedLocales.includes(defaultLocale)) languages["x-default"] = getLocalizedPathname(pathname, defaultLocale);
  return languages;
}

export function createLocalizedMetadata({
  locale,
  pathname,
  title,
  description,
  type = "website",
  alternates = true,
  image = true,
}: {
  locale: Locale;
  pathname: string;
  title: string;
  description: string;
  type?: "website" | "profile";
  alternates?: boolean | readonly Locale[];
  image?: boolean;
}): Metadata {
  const canonical = getLocalizedPathname(pathname, locale);
  const images = image
    ? [defaultSocialImage]
    : [];
  const includedLocales = Array.isArray(alternates) ? alternates : locales;

  return {
    title,
    description,
    alternates: {
      canonical,
      ...(alternates ? { languages: getLanguageAlternates(pathname, includedLocales) } : {}),
    },
    openGraph: {
      type,
      locale: localeDetails[locale].openGraphLocale,
      alternateLocale: locales.filter((candidate) => candidate !== locale).map((candidate) => localeDetails[candidate].openGraphLocale),
      url: canonical,
      siteName: "btshq.online",
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [defaultSocialImage] : [],
    },
  };
}
