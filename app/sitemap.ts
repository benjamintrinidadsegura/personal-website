import type { MetadataRoute } from "next";

import { publishedSpotlights } from "@/data/spotlights";
import { findYourNextStep, nextStepJourneys } from "@/data/find-your-next-step";
import { lifeAlignment } from "@/data/life-alignment";
import { availableLifeAlignmentModules } from "@/data/life-alignment-modules";
import { projects } from "@/data/projects";
import { siteConfig } from "@/data/site";
import { getPublishedWriting } from "@/lib/writing/queries";
import type { PublicWritingSummary } from "@/types/writing";
import { getLocalizedPathname } from "@/lib/i18n/routing";
import { getWritingTranslationSlug } from "@/data/writing-localization";
import { defaultLocale, locales } from "@/lib/i18n/config";

function getCanonicalProductionUrl(): URL | null {
  if (process.env.NODE_ENV !== "production" || !process.env.SITE_URL) return null;

  try {
    const url = new URL(process.env.SITE_URL);
    if (
      url.protocol !== "https:" ||
      url.hostname !== siteConfig.domain ||
      url.port !== "" ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== ""
    ) {
      return null;
    }

    return new URL(url.origin);
  } catch {
    return null;
  }
}

export function createSitemap(publishedWriting: PublicWritingSummary[]): MetadataRoute.Sitemap {
  const siteUrl = getCanonicalProductionUrl();
  if (!siteUrl) return [];

  const localizedRoutes = [
    "/",
    "/echowall",
    "/writing",
    "/newsletter",
    "/privacy",
    "/about",
    "/people",
    lifeAlignment.href,
    ...availableLifeAlignmentModules.map(({ href }) => href),
    findYourNextStep.href,
    ...nextStepJourneys.map(({ href }) => href),
    ...projects.map(({ slug }) => `/projects/${slug}`),
    ...publishedSpotlights.map(({ slug }) => `/people/${slug}`),
  ];

  const localizedEntries = localizedRoutes.flatMap((route) => {
    const languages: Record<string, string> = Object.fromEntries(locales.map((locale) => [
      locale,
      new URL(getLocalizedPathname(route, locale), siteUrl).toString(),
    ]));
    languages["x-default"] = languages[defaultLocale];
    return locales.map((locale) => ({ url: languages[locale], alternates: { languages } }));
  });

  const writingEntries = publishedWriting.map((article) => {
    const pathname = `/writing/${article.slug}`;
    const canonicalPath = getLocalizedPathname(pathname, article.language);
    const canonicalUrl = new URL(canonicalPath, siteUrl).toString();
    const languages: Record<string, string> = { [article.language]: canonicalUrl, "x-default": canonicalUrl };
    for (const targetLocale of locales) {
      const translationSlug = getWritingTranslationSlug(article.slug, targetLocale);
      if (translationSlug) languages[targetLocale] = new URL(getLocalizedPathname(`/writing/${translationSlug}`, targetLocale), siteUrl).toString();
    }
    return { url: canonicalUrl, alternates: { languages } };
  });

  return [...localizedEntries, ...writingEntries];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return createSitemap(await getPublishedWriting());
}
