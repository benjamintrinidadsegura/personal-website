import type { MetadataRoute } from "next";

import { publishedSpotlights } from "@/data/spotlights";
import { findYourNextStep, nextStepJourneys } from "@/data/find-your-next-step";
import { lifeAlignment } from "@/data/life-alignment";
import { availableLifeAlignmentModules } from "@/data/life-alignment-modules";
import { projects } from "@/data/projects";
import { siteConfig } from "@/data/site";
import { getPublishedWriting } from "@/lib/writing/queries";
import type { PublicWritingSummary } from "@/types/writing";

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

  const routes = [
    "/",
    "/echowall",
    "/writing",
    ...publishedWriting.map(({ slug }) => `/writing/${slug}`),
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

  return routes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return createSitemap(await getPublishedWriting());
}
