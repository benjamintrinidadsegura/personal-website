import { careerSpotlights } from "@/data/career-spotlights";
import { findYourNextStep } from "@/data/find-your-next-step";
import { lifeAlignment } from "@/data/life-alignment";
import { getProject } from "@/data/projects";
import type {
  CareerSpotlightEntry,
  HqPulseCandidate,
  HqPulseItem,
  HqPulseUpdate,
} from "@/types/content";
import type { PublicWritingSummary } from "@/types/writing";

export const HQ_PULSE_LIMIT = 5;

function projectHref(slug: string) {
  const project = getProject(slug);
  if (!project) throw new Error(`HQ Pulse references an unknown project: ${slug}`);
  return `/projects/${project.slug}`;
}

function validPublicDate(value: string | undefined): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

/**
 * Editorial updates cover meaningful public releases without canonical public
 * timestamps. `sequence` is an explicit newest-first fallback, never a date.
 * Canonical content should use the same `identity` if it supersedes an entry.
 */
export const hqPulseUpdates: readonly HqPulseUpdate[] = [
  {
    id: "ecosystem-contact-social-v1",
    identity: "editorial:ecosystem-contact-social-v1",
    origin: "editorial",
    sequence: 5,
    visibility: "public",
    kind: "ecosystem",
    type: "Digital HQ",
    title: "Contact und Social Presence verbinden das HQ nach außen",
    teaser:
      "Verifizierte Profile, klare Projektwege und eine ehrliche Booking-Grenze machen sichtbar, wie Menschen Benjamin und GOATRECRUTAINER außerhalb des HQ erreichen können.",
    href: "/#contact",
    ctaLabel: "Contact & Social entdecken",
    source: "Digital HQ",
    status: "Live",
  },
  {
    id: "goatrecrutainer-ecosystem-v1",
    identity: "editorial:goatrecrutainer-ecosystem-v1",
    origin: "editorial",
    sequence: 4,
    visibility: "public",
    kind: "project",
    type: "Project update",
    title: "GOATRECRUTAINER öffnet sein professionelles Ökosystem",
    teaser:
      "Die Projektseite erklärt Marke, Recruiting-Angebot und Formate im Zusammenhang — und führt mit klarer externer Kennzeichnung zur offiziellen Website weiter.",
    href: projectHref("goatrecrutainer"),
    ctaLabel: "GOATRECRUTAINER entdecken",
    source: "GOATRECRUTAINER",
    status: "Active / Growing",
  },
  {
    id: "ratecom-ecosystem-v1",
    identity: "editorial:ratecom-ecosystem-v1",
    origin: "editorial",
    sequence: 3,
    visibility: "public",
    kind: "project",
    type: "Project update",
    title: "RateCom ist als eigener Produktweg im Digital HQ verankert",
    teaser:
      "RateCom hat eine vollständige Projektoberfläche und einen verifizierten Weg zur offiziellen Website — mit transparentem Rebuild-Status statt überzogener Produktversprechen.",
    href: projectHref("ratecom"),
    ctaLabel: "RateCom entdecken",
    source: "RateCom",
    status: "Rebuild",
  },
  {
    id: "life-alignment-modular-v1",
    identity: "editorial:life-alignment-modular-v1",
    origin: "editorial",
    sequence: 2,
    visibility: "public",
    kind: "tool",
    type: "Tool / Module",
    title: "Life Alignment V1 verbindet drei eigenständige Perspektiven",
    teaser:
      "Self, Partner / Relationship und Life Vision bilden eine modulare Reflexionsfamilie — lokal, nachvollziehbar und ohne Lebens-, Beziehungs- oder Kompatibilitätsscore.",
    href: lifeAlignment.href,
    ctaLabel: "Life Alignment öffnen",
    source: "Human Context",
    status: "V1 complete",
  },
  {
    id: "find-your-next-step-v1",
    identity: "editorial:find-your-next-step-v1",
    origin: "editorial",
    sequence: 1,
    visibility: "public",
    kind: "tool",
    type: "Tool / Journey",
    title: "Find Your Next Step V1 bündelt vier funktionale Journeys",
    teaser:
      "Self, Career, Problem und Idea führen von persönlichem Kontext zu einem nachvollziehbaren nächsten Schritt — ohne Konto, Speicherung oder fertige Antwort.",
    href: findYourNextStep.href,
    ctaLabel: "Find Your Next Step öffnen",
    source: "Human Context",
    status: "V1 complete",
  },
];

export function createWritingPulseCandidates(
  articles: readonly PublicWritingSummary[],
): HqPulseCandidate[] {
  return articles
    .filter((article) => validPublicDate(article.publishedAt))
    .map((article) => ({
      id: `writing-${article.id}`,
      identity: `writing:${article.id}`,
      origin: "canonical",
      visibility: "public",
      kind: "content",
      type: "Article",
      title: article.title,
      teaser: article.excerpt,
      href: `/writing/${article.slug}`,
      ctaLabel: article.contentType === "essay" ? "Essay lesen" : "Note lesen",
      date: article.publishedAt,
      source: "Writing",
      status: "Published",
    }));
}

export function createInterviewPulseCandidates(
  interviews: readonly CareerSpotlightEntry[],
): HqPulseCandidate[] {
  return interviews.flatMap((interview) => {
    if (interview.status !== "published" || !interview.title) return [];
    return [{
      id: `career-spotlight-${interview.slug}`,
      identity: `career-spotlight:${interview.slug}`,
      origin: "canonical" as const,
      visibility: "public" as const,
      kind: "content" as const,
      type: "Interview",
      title: interview.title,
      teaser: interview.teaser,
      href: `/goatrecrutainer/career-spotlight/${interview.slug}`,
      ctaLabel: "Career Spotlight lesen",
      ...(validPublicDate(interview.publishedAt) ? { date: interview.publishedAt } : {}),
      source: "GOATRECRUTAINER",
      status: "Published",
    }];
  });
}

function publicationTime(candidate: HqPulseCandidate): number | null {
  return validPublicDate(candidate.date) ? Date.parse(candidate.date) : null;
}

/**
 * Ordering rule: canonical items with real public timestamps come first,
 * newest timestamp first. Undated editorial releases follow by descending
 * sequence. Undated canonical items remain eligible behind explicit editorial
 * order and use stable identity ordering. Ties always resolve by identity.
 */
function compareCandidates(left: HqPulseCandidate, right: HqPulseCandidate): number {
  const leftTime = publicationTime(left);
  const rightTime = publicationTime(right);
  if (leftTime !== null || rightTime !== null) {
    if (leftTime === null) return 1;
    if (rightTime === null) return -1;
    if (leftTime !== rightTime) return rightTime - leftTime;
  }

  const sequenceDifference = (right.sequence ?? Number.MIN_SAFE_INTEGER) - (left.sequence ?? Number.MIN_SAFE_INTEGER);
  if (sequenceDifference !== 0) return sequenceDifference;
  return left.identity.localeCompare(right.identity, "en");
}

function mergeDuplicate(
  current: HqPulseCandidate,
  incoming: HqPulseCandidate,
): HqPulseCandidate {
  if (current.origin !== incoming.origin) {
    const canonical = current.origin === "canonical" ? current : incoming;
    const editorial = current.origin === "editorial" ? current : incoming;
    return { ...canonical, sequence: canonical.sequence ?? editorial.sequence };
  }
  return compareCandidates(current, incoming) <= 0 ? current : incoming;
}

export function resolveHqPulseItems(
  candidates: readonly HqPulseCandidate[],
  limit = HQ_PULSE_LIMIT,
): HqPulseItem[] {
  if (limit <= 0) return [];

  const byIdentity = new Map<string, HqPulseCandidate>();
  for (const candidate of candidates) {
    if (candidate.visibility !== "public") continue;
    const current = byIdentity.get(candidate.identity);
    byIdentity.set(candidate.identity, current ? mergeDuplicate(current, candidate) : candidate);
  }

  return [...byIdentity.values()]
    .sort(compareCandidates)
    .slice(0, limit)
    .map(({ identity, origin, sequence, visibility, ...item }) => {
      void identity;
      void origin;
      void sequence;
      void visibility;
      return item;
    });
}

type HqPulseAggregationInput = {
  publishedWriting?: readonly PublicWritingSummary[];
  interviews?: readonly CareerSpotlightEntry[];
  editorialUpdates?: readonly HqPulseUpdate[];
  limit?: number;
};

export function createHqPulseItems({
  publishedWriting = [],
  interviews = careerSpotlights,
  editorialUpdates = hqPulseUpdates,
  limit = HQ_PULSE_LIMIT,
}: HqPulseAggregationInput = {}): HqPulseItem[] {
  return resolveHqPulseItems([
    ...createWritingPulseCandidates(publishedWriting),
    ...createInterviewPulseCandidates(interviews),
    ...editorialUpdates,
  ], limit);
}

export const hqPulseItems = createHqPulseItems();
