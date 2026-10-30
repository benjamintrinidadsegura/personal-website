import type { MetadataRoute } from "next";

import { publishedSpotlights } from "@/data/spotlights";
import { findYourNextStep, nextStepJourneys } from "@/data/find-your-next-step";
import { lifeAlignment } from "@/data/life-alignment";
import { availableLifeAlignmentModules } from "@/data/life-alignment-modules";
import { projects } from "@/data/projects";
import { getPublishedWritingForSitemap } from "@/lib/writing/queries";
import type { PublicWritingSummary } from "@/types/writing";
import { getLocalizedPathname } from "@/lib/i18n/routing";
import { defaultLocale, locales } from "@/lib/i18n/config";
import { getCanonicalProductionUrl, publicStaticRoutes } from "@/lib/search-discovery";

// Never serve a previous publication snapshot or cache a failed collection read.
export const dynamic = "force-dynamic";

export function createSitemap(publishedWriting: PublicWritingSummary[]): MetadataRoute.Sitemap {
  const siteUrl = getCanonicalProductionUrl();
  if (!siteUrl) return [];

  const localizedRoutes = [...new Set([
    ...publicStaticRoutes,
    lifeAlignment.href,
    ...availableLifeAlignmentModules.map(({ href }) => href),
    findYourNextStep.href,
    ...nextStepJourneys.map(({ href }) => href),
    ...projects.map(({ slug }) => `/projects/${slug}`),
    ...publishedSpotlights.map(({ slug }) => `/people/${slug}`),
  ])];

  const localizedEntries = localizedRoutes.flatMap((route) => {
    const languages: Record<string, string> = Object.fromEntries(locales.map((locale) => [
      locale,
      new URL(getLocalizedPathname(route, locale), siteUrl).toString(),
    ]));
    languages["x-default"] = languages[defaultLocale];
    return locales.map((locale) => ({ url: languages[locale], alternates: { languages } }));
  });

  const writingEntries = publishedWriting.flatMap((article) => {
    const pathname = `/writing/${article.slug}`;
    const languages: Record<string, string> = Object.fromEntries(article.availableLanguages.map((locale) => [
      locale,
      new URL(getLocalizedPathname(pathname, locale), siteUrl).toString(),
    ]));
    languages["x-default"] = languages[article.sourceLanguage];
    return article.availableLanguages.map((locale) => ({ url: languages[locale], alternates: { languages } }));
  });

  return [...localizedEntries, ...writingEntries];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { classifyWritingReadFailure, logWritingDiagnostic, newWritingCorrelationId } = await import("@/lib/writing/read-diagnostics");
  const correlationId = newWritingCorrelationId();
  const started = performance.now();
  try {
    // Preview never advertises production URLs and needs no Writing credentials.
    if (!getCanonicalProductionUrl()) return [];
    const result = await getPublishedWritingForSitemap(correlationId);
    // On this dynamic route an exception is a non-cacheable HTTP failure, not ISR fallback.
    if (result.status === "unavailable") throw new Error("Sitemap Writing collection unavailable.");
    const entries = createSitemap(result.data);
    logWritingDiagnostic({ operation: "sitemap_generation", state: "success",
      correlationId, durationMs: performance.now() - started, acceptedCount: result.data.length,
      emittedUrlCount: entries.length });
    return entries;
  } catch (error) {
    logWritingDiagnostic({ operation: "sitemap_generation", state: "unavailable", correlationId,
      durationMs: performance.now() - started, emittedUrlCount: 0, failure: classifyWritingReadFailure(error) });
    // Upstream errors may contain private details; Next.js must only see a fixed message.
    throw new Error("Sitemap temporarily unavailable.");
  }
}
