import type { DiscoveryGroup, DiscoveryItem, DiscoveryMatch } from "@/types/discovery";

const TITLE_PREFIX_SCORE = 500;
const TITLE_SCORE = 400;
const CATEGORY_SCORE = 300;
const TAG_OR_KEYWORD_SCORE = 200;
const DESCRIPTION_SCORE = 100;

export const discoveryGroupOrder: DiscoveryGroup[] = [
  "Projects",
  "Insights",
  "Tools",
  "People",
  "Pages",
];

/** Normalizes user-authored content for locale-aware, case-insensitive matching. */
export function normalizeDiscoveryText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("de-DE").trim();
}

function getMatchScore(item: DiscoveryItem, normalizedQuery: string): number {
  const title = normalizeDiscoveryText(item.title);
  if (title.startsWith(normalizedQuery)) return TITLE_PREFIX_SCORE;
  if (title.includes(normalizedQuery)) return TITLE_SCORE;
  if (normalizeDiscoveryText(item.category).includes(normalizedQuery)) return CATEGORY_SCORE;

  const tagsAndKeywords = [...item.tags, ...item.keywords];
  if (tagsAndKeywords.some((value) => normalizeDiscoveryText(value).includes(normalizedQuery))) {
    return TAG_OR_KEYWORD_SCORE;
  }

  if (normalizeDiscoveryText(item.description).includes(normalizedQuery)) return DESCRIPTION_SCORE;
  return 0;
}

/**
 * Finds relevant items from the first character. Equal scores keep index order,
 * giving editors deterministic control without a second ranking system.
 */
export function discoverItems(items: DiscoveryItem[], query: string): DiscoveryMatch[] {
  const normalizedQuery = normalizeDiscoveryText(query);
  if (!normalizedQuery) return [];

  return items
    .map((item, index) => ({ item, index, score: getMatchScore(item, normalizedQuery) }))
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ item, score }) => ({ item, score }));
}

export function groupDiscoveryItems(matches: DiscoveryMatch[]): Map<DiscoveryGroup, DiscoveryMatch[]> {
  const groups = new Map<DiscoveryGroup, DiscoveryMatch[]>();

  for (const group of discoveryGroupOrder) {
    const groupMatches = matches.filter(({ item }) => item.group === group);
    if (groupMatches.length > 0) groups.set(group, groupMatches);
  }

  return groups;
}
