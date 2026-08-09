import type { MetadataRoute } from "next";

import { careerSpotlights } from "@/data/career-spotlights";
import { findYourNextStep, nextStepJourneys } from "@/data/find-your-next-step";
import { projects } from "@/data/projects";
import { siteConfig } from "@/data/site";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getCanonicalProductionUrl();
  if (!siteUrl) return [];

  const routes = [
    "/",
    "/echowall",
    findYourNextStep.href,
    ...nextStepJourneys.map(({ href }) => href),
    ...projects.map(({ slug }) => `/projects/${slug}`),
    "/goatrecrutainer/career-spotlight",
    ...careerSpotlights
      .filter(({ status }) => status === "published")
      .map(({ slug }) => `/goatrecrutainer/career-spotlight/${slug}`),
  ];

  return routes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
  }));
}
