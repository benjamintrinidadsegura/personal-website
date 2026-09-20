import { projects } from "@/data/projects";
import { publishedSpotlights } from "@/data/spotlights";
import { createWorldMapConnections } from "@/data/world-map";
import type { Project, SpotlightPulseSource } from "@/types/content";
import type { DiscoveryItem } from "@/types/discovery";
import type {
  HqPulseCurrentState,
  HqPulseItem,
  HqPulseSource,
  HqPulseSourceClassification,
  HqPulseTileSize,
  HqPulseViewModel,
  HumanPulseContent,
} from "@/types/hq-pulse";
import type { WorldMapConnection } from "@/types/world-map";
import type { PublicWritingSummary } from "@/types/writing";

export const HQ_PULSE_LIMIT = 8;

export const hqPulseSourceClassification: Readonly<Record<HqPulseSource, HqPulseSourceClassification>> = {
  writing: "EVENT_CAPABLE",
  projects: "CURRENT_STATE_ONLY",
  people: "EVENT_CAPABLE",
  "world-map": "CURRENT_STATE_ONLY",
  discovery: "CURRENT_STATE_ONLY",
};

const emptyHumanPulse: HumanPulseContent = {
  rightNow: [],
  onMyMind: null,
  next: null,
  openLoops: [],
};

function validPublicDate(value: string | undefined): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function publicationTime(item: HqPulseItem): number {
  return Date.parse(item.occurredAt);
}

export function createWritingPulseCandidates(
  articles: readonly PublicWritingSummary[],
): HqPulseItem[] {
  return articles.flatMap((article) => {
    if (!validPublicDate(article.publishedAt)) return [];
    return [{
      id: `writing-${article.id}`,
      source: "writing" as const,
      type: "publication" as const,
      occurredAt: article.publishedAt,
      title: article.title,
      summary: article.excerpt,
      href: `/writing/${article.slug}`,
      provenance: {
        source: "writing" as const,
        entityId: article.id,
        key: `writing:${article.id}:published`,
      },
    }];
  });
}

export function createPeoplePulseCandidates(
  people: readonly SpotlightPulseSource[],
): HqPulseItem[] {
  return people.flatMap((person) => {
    if (person.status !== "published" || !person.title || !validPublicDate(person.publishedAt)) return [];
    return [{
      id: `people-${person.slug}`,
      source: "people" as const,
      type: "conversation" as const,
      occurredAt: person.publishedAt,
      title: person.title,
      summary: person.teaser,
      href: `/people/${person.slug}`,
      spotlightFormat: person.format,
      provenance: {
        source: "people" as const,
        entityId: person.slug,
        key: `people:${person.slug}:published`,
      },
    }];
  });
}

export const createInterviewPulseCandidates = createPeoplePulseCandidates;

/**
 * Presentation size is a pure derivation from canonical source semantics.
 * It never uses chronology, popularity, engagement, or render position.
 */
export function getHqPulseTileSize(item: HqPulseItem): HqPulseTileSize {
  if (item.source === "writing" && item.type === "publication") return "featured";
  if (item.source === "people" && item.spotlightFormat === "Career Spotlight") return "featured";
  if (item.source === "people" && item.spotlightFormat === "Spotlight Conversation") return "standard";
  return "compact";
}

export function createProjectPulseCurrentStates(
  sourceProjects: readonly Project[],
): HqPulseCurrentState[] {
  return sourceProjects
    .filter(({ featured }) => featured)
    .map((project) => ({
      id: `project-state-${project.slug}`,
      source: "projects" as const,
      entityId: project.slug,
      title: project.name,
      summary: project.currentState,
      href: `/projects/${project.slug}`,
      status: project.status,
    }));
}

export function createWorldMapPulseCurrentStates(
  connections: readonly WorldMapConnection[],
): HqPulseCurrentState[] {
  const publicConnections = connections.filter((connection) => (
    connection.relationships.length > 0
    && connection.relationships.every(({ published }) => published)
    && connection.entity.sourceHref.startsWith("/")
  ));
  if (publicConnections.length === 0) return [];

  return [{
    id: "world-map-state-public-context",
    source: "world-map",
    entityId: "public-context",
    title: "World Map",
    summary: "Veröffentlichte Gespräche und Beziehungen sind mit ihrem öffentlichen Ortskontext verbunden.",
    href: "/world",
    template: "world-map-public-context",
  }];
}

export function createDiscoveryPulseCurrentStates(
  items: readonly DiscoveryItem[],
): HqPulseCurrentState[] {
  const eligible = items.filter((item) => (
    !item.id.startsWith("pulse-")
    && item.id !== "page-pulse"
    && (item.status === "Live" || item.status === "Beta")
    && typeof item.href === "string"
    && item.href.startsWith("/")
  ));
  if (eligible.length === 0) return [];

  return [{
    id: "discovery-state-available",
    source: "discovery",
    entityId: "public-index",
    title: "Discovery",
    summary: "Öffentliche Wege durch Projekte, Menschen, Writing und Tools sind über Discovery erreichbar.",
    href: "/#home",
    template: "discovery-available",
  }];
}

/**
 * Chronology is strict: only items with canonical public timestamps enter the
 * timeline. Stable provenance keys deduplicate and break timestamp ties.
 */
export function resolveHqPulseItems(
  candidates: readonly HqPulseItem[],
  limit = HQ_PULSE_LIMIT,
): HqPulseItem[] {
  if (limit <= 0) return [];
  const byProvenance = new Map<string, HqPulseItem>();
  for (const candidate of candidates) {
    if (!validPublicDate(candidate.occurredAt)) continue;
    const current = byProvenance.get(candidate.provenance.key);
    if (!current || candidate.id.localeCompare(current.id, "en") < 0) {
      byProvenance.set(candidate.provenance.key, candidate);
    }
  }

  return [...byProvenance.values()]
    .sort((left, right) => (
      publicationTime(right) - publicationTime(left)
      || left.provenance.key.localeCompare(right.provenance.key, "en")
      || left.id.localeCompare(right.id, "en")
    ))
    .slice(0, limit);
}

export type HqPulseCompositionInput = {
  publishedWriting?: readonly PublicWritingSummary[];
  people?: readonly SpotlightPulseSource[];
  sourceProjects?: readonly Project[];
  worldMapConnections?: readonly WorldMapConnection[];
  discoveryItems?: readonly DiscoveryItem[];
  human?: HumanPulseContent;
  limit?: number;
};

export function createHqPulseViewModel({
  publishedWriting = [],
  people = publishedSpotlights,
  sourceProjects = projects,
  worldMapConnections = createWorldMapConnections(publishedSpotlights),
  discoveryItems = [],
  human = emptyHumanPulse,
  limit = HQ_PULSE_LIMIT,
}: HqPulseCompositionInput = {}): HqPulseViewModel {
  const allEvents = [
    ...createWritingPulseCandidates(publishedWriting),
    ...createPeoplePulseCandidates(people),
  ];

  return {
    human,
    timeline: resolveHqPulseItems(allEvents, limit),
    timelineEligibleCount: new Set(allEvents.filter(({ occurredAt }) => validPublicDate(occurredAt)).map(({ provenance }) => provenance.key)).size,
    timelineLimit: limit,
    currentStates: [
      ...createProjectPulseCurrentStates(sourceProjects),
      ...createWorldMapPulseCurrentStates(worldMapConnections),
      ...createDiscoveryPulseCurrentStates(discoveryItems),
    ],
    sourceClassifications: hqPulseSourceClassification,
  };
}

/** Compatibility surface for Discovery: automatic events only, never Human Pulse. */
export function createHqPulseItems(input: HqPulseCompositionInput = {}): HqPulseItem[] {
  return [...createHqPulseViewModel(input).timeline];
}

export const hqPulseItems = createHqPulseItems();
