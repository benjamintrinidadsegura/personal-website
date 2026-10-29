import { contextualJourneys, type ContentReference, type ContextualReference } from "@/data/contextual-journeys";
import { getLocalizedNextStepJourney, nextStepJourneys } from "@/data/find-your-next-step";
import { getLocalizedPublishedSpotlights } from "@/data/i18n/people";
import { getLocalizedProject } from "@/data/i18n/projects";
import { getWorldMapDictionary } from "@/data/i18n/world-map";
import { publishedSpotlights } from "@/data/spotlights";
import { createWorldMapConnections } from "@/data/world-map";
import type { Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import { isPublicWritingReady } from "@/lib/public-content-hygiene";
import type { PublicWritingSummary } from "@/types/writing";

export type ContextualDestination = { href: string; title: string; language: Locale; kind: ContentReference["kind"]; reason: ContextualReference["reason"] };
const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function referenceKey(reference: ContentReference): string {
  switch (reference.kind) {
    case "writing": case "project": return `${reference.kind}:${reference.slug}`;
    case "person": case "experience": return `${reference.kind}:${reference.id}`;
    case "world": return `world:${reference.personId}`;
  }
}

export function getContextualReferences(source: ContentReference): readonly ContextualReference[] {
  return contextualJourneys.find(({ from }) => referenceKey(from) === referenceKey(source))?.next ?? [];
}

/** Writing records must come from the existing published-only reader; never from forthcoming entries or a cache fallback. */
export function resolveContextualDestinations(source: ContentReference, references: readonly ContextualReference[], locale: Locale, articles: readonly PublicWritingSummary[] = []): ContextualDestination[] {
  const people = getLocalizedPublishedSpotlights(locale);
  function resolve(reference: ContentReference): Omit<ContextualDestination, "reason"> | null {
    switch (reference.kind) {
      case "writing": {
        const article = articles.find(({ slug }) => slug === reference.slug);
        if (!article || !safeSlug.test(article.slug) || !isPublicWritingReady(article)) return null;
        // A fallback always links to the actual content language, matching article canonical metadata.
        return { href: localizeHref(`/writing/${article.slug}`, article.language), title: article.title, language: article.language, kind: reference.kind };
      }
      case "project": {
        const project = getLocalizedProject(reference.slug, locale);
        return project && safeSlug.test(project.slug) ? { href: localizeHref(`/projects/${project.slug}`, locale), title: project.name, language: locale, kind: reference.kind } : null;
      }
      case "person": {
        const person = people.find(({ id }) => id === reference.id);
        return person && safeSlug.test(person.slug) ? { href: localizeHref(`/people/${person.slug}`, locale), title: person.fullName, language: locale, kind: reference.kind } : null;
      }
      case "experience": {
        const journey = nextStepJourneys.find(({ id }) => id === reference.id);
        // Only existing, implemented public journeys; no private session/invite URLs.
        if (!journey || !["self", "career"].includes(journey.slug) || journey.href !== `/find-your-next-step/${journey.slug}`) return null;
        const localized = getLocalizedNextStepJourney(journey.slug, locale);
        return localized ? { href: localizeHref(journey.href, locale), title: localized.title, language: locale, kind: reference.kind } : null;
      }
      case "world": {
        const person = publishedSpotlights.find(({ id }) => id === reference.personId);
        try {
          if (!person || createWorldMapConnections([person]).length === 0) return null;
        } catch {
          // Invalid map context is omitted rather than breaking the reading page.
          return null;
        }
        return { href: localizeHref("/world", locale), title: getWorldMapDictionary(locale).breadcrumb, language: locale, kind: reference.kind };
      }
      default: return null;
    }
  }
  if (!resolve(source)) return [];
  const seen = new Set<string>();
  const result: ContextualDestination[] = [];
  for (const { to, reason } of references) {
    if (referenceKey(to) === referenceKey(source)) continue;
    const destination = resolve(to);
    if (!destination || seen.has(destination.href)) continue;
    seen.add(destination.href);
    result.push({ ...destination, reason });
    if (result.length === 3) break;
  }
  return result;
}
