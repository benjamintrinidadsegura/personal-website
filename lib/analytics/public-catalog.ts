import { projects } from "@/data/projects";
import { publishedSpotlights } from "@/data/spotlights";
import { createPublicPageViewAllowlist } from "@/lib/analytics/public-page-view";
import { isPublicWritingReady } from "@/lib/public-content-hygiene";
import type { PublicWritingSummary } from "@/types/writing";

/** Reuse the successful published-only reader result; never guess slugs or persist withdrawals. */
export function createPublicAnalyticsCatalog(writing: readonly PublicWritingSummary[]) {
  return createPublicPageViewAllowlist({
    writingSlugs: writing.filter(isPublicWritingReady).map(({ slug }) => slug),
    projectSlugs: projects.map(({ slug }) => slug),
    peopleSlugs: publishedSpotlights.map(({ slug }) => slug),
  });
}
