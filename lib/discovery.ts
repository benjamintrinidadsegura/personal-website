import {
  discoveryNeutralTerms,
  discoveryRelationships,
  discoverySynonymGroups,
} from "@/data/discovery-curation";
import type {
  ActiveDiscoveryDimension,
  AdaptiveDiscoveryView,
  DiscoveryGroup,
  DiscoveryItem,
  DiscoveryMatch,
  DiscoveryMatchKind,
  DiscoveryMatchReason,
  DiscoveryMatchSource,
  DiscoveryReasonLabel,
} from "@/types/discovery";

const TITLE_EXACT_SCORE = 900;
const TITLE_PREFIX_SCORE = 800;
const TITLE_SCORE = 700;
const CATEGORY_SCORE = 600;
const TAG_OR_KEYWORD_SCORE = 500;
const RELATIONSHIP_SCORE = 400;
const SYNONYM_SCORE = 300;
const DIMENSION_SCORE = 200;
const DESCRIPTION_SCORE = 100;
const COVERAGE_BONUS_PER_CONCEPT = 10;
const MAX_COVERAGE_BONUS = 20;
const MAX_MATCH_REASONS = 2;

const activeDiscoveryDimensions: readonly ActiveDiscoveryDimension[] = [
  "intent",
  "goals",
  "problems",
  "useCases",
];

interface QueryTerm {
  value: string;
  kind: DiscoveryMatchKind;
  score?: number;
  concepts: string[];
}

interface DiscoveryQueryAnalysis {
  normalizedQuery: string;
  directTerms: QueryTerm[];
  synonymTerms: QueryTerm[];
  relationshipTerms: QueryTerm[];
}

interface SearchableField {
  source: DiscoveryMatchSource;
  value: string;
}

interface MatchSignal extends SearchableField {
  kind: DiscoveryMatchKind;
  matchedTerm: string;
  score: number;
  concepts: string[];
}

export const discoveryGroupOrder: DiscoveryGroup[] = [
  "Projects",
  "Insights",
  "Tools",
  "People",
  "Pages",
];

export const adaptiveDiscoveryGroupLimit = 4;

/** Normalizes user-authored content for locale-aware, case-insensitive matching. */
export function normalizeDiscoveryText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("de-DE").trim().replace(/\s+/gu, " ");
}

function tokenizeDiscoveryText(value: string): string[] {
  return normalizeDiscoveryText(value)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter(Boolean);
}

const normalizedNeutralTerms = new Set(discoveryNeutralTerms.map(normalizeDiscoveryText));

function uniqueTerms(terms: QueryTerm[]): QueryTerm[] {
  const seen = new Set<string>();

  return terms.filter((term) => {
    const key = `${term.kind}:${normalizeDiscoveryText(term.value)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function includesTokenPhrase(tokens: string[], phrase: string): boolean {
  const phraseTokens = tokenizeDiscoveryText(phrase);
  if (phraseTokens.length === 0 || phraseTokens.length > tokens.length) return false;

  return tokens.some((_, startIndex) => (
    phraseTokens.every((token, phraseIndex) => tokens[startIndex + phraseIndex] === token)
  ));
}

function analyzeDiscoveryQuery(query: string): DiscoveryQueryAnalysis {
  const normalizedQuery = normalizeDiscoveryText(query);
  const tokens = tokenizeDiscoveryText(normalizedQuery);
  const meaningfulTokens = tokens.filter((token) => !normalizedNeutralTerms.has(token));
  const meaningfulPhrase = meaningfulTokens.join(" ");
  const conceptsForPhrase = meaningfulTokens.length > 0 ? meaningfulTokens : tokens;
  const relationshipTerms = uniqueTerms(discoveryRelationships.flatMap((relationship) => {
    const relationshipPhrase = tokenizeDiscoveryText(relationship.query)
      .filter((token) => !normalizedNeutralTerms.has(token))
      .join(" ");
    if (!meaningfulPhrase || meaningfulPhrase !== relationshipPhrase) return [];

    return relationship.terms.map((term) => ({
      value: term,
      kind: "relationship" as const,
      score: RELATIONSHIP_SCORE,
      concepts: tokenizeDiscoveryText(term),
    }));
  }));
  const directTerms = uniqueTerms([
    ...(normalizedQuery && meaningfulTokens.length > 0
      ? [{ value: normalizedQuery, kind: "direct" as const, concepts: conceptsForPhrase }]
      : []),
    ...(meaningfulPhrase && meaningfulPhrase !== normalizedQuery
      ? [{ value: meaningfulPhrase, kind: "direct" as const, concepts: conceptsForPhrase }]
      : []),
    ...(relationshipTerms.length === 0
      ? meaningfulTokens.map((token) => ({ value: token, kind: "direct" as const, concepts: [token] }))
      : []),
  ]);

  const synonymTerms = relationshipTerms.length > 0 ? [] : uniqueTerms(discoverySynonymGroups.flatMap((group) => {
    const matchingAlias = group.aliases.find((alias) => {
      const normalizedAlias = normalizeDiscoveryText(alias.value);
      if (alias.match === "whole-query") return meaningfulPhrase === normalizedAlias;
      if (alias.match === "phrase") return includesTokenPhrase(tokens, normalizedAlias);
      return tokens.includes(normalizedAlias);
    });

    if (!matchingAlias) return [];
    const aliasConcepts = tokenizeDiscoveryText(matchingAlias.value);
    return [{ value: group.canonical, kind: "synonym" as const, score: SYNONYM_SCORE, concepts: aliasConcepts }];
  }));

  return {
    normalizedQuery,
    directTerms,
    synonymTerms,
    relationshipTerms,
  };
}

function matchesSearchTerm(value: string, term: string): boolean {
  const normalizedValue = normalizeDiscoveryText(value);
  const normalizedTerm = normalizeDiscoveryText(term);
  if (!normalizedTerm) return false;

  if (tokenizeDiscoveryText(normalizedTerm).length > 1 || normalizedTerm.length > 2) {
    return normalizedValue.includes(normalizedTerm);
  }

  return tokenizeDiscoveryText(normalizedValue).includes(normalizedTerm);
}

function titleMatchScore(title: string, term: string): number {
  const normalizedTitle = normalizeDiscoveryText(title);
  const normalizedTerm = normalizeDiscoveryText(term);
  if (!normalizedTerm) return 0;
  if (normalizedTitle === normalizedTerm) return TITLE_EXACT_SCORE;
  if (normalizedTitle.startsWith(normalizedTerm)) return TITLE_PREFIX_SCORE;
  if (normalizedTerm.length > 2 && normalizedTitle.includes(normalizedTerm)) return TITLE_SCORE;
  return 0;
}

function getSearchableFields(item: DiscoveryItem): SearchableField[] {
  const fields: SearchableField[] = [
    { source: "title", value: item.title },
    { source: "category", value: item.category },
    ...item.tags.map((value) => ({ source: "tag" as const, value })),
    ...item.keywords.map((value) => ({ source: "keyword" as const, value })),
  ];

  for (const dimension of activeDiscoveryDimensions) {
    for (const value of item.dimensions?.[dimension] ?? []) {
      fields.push({ source: dimension, value });
    }
  }

  fields.push({ source: "description", value: item.description });
  return fields;
}

function directFieldScore(field: SearchableField, term: string): number {
  if (field.source === "title") return titleMatchScore(field.value, term);
  if (!matchesSearchTerm(field.value, term)) return 0;
  if (field.source === "category") return CATEGORY_SCORE;
  if (field.source === "tag" || field.source === "keyword") return TAG_OR_KEYWORD_SCORE;
  if (field.source === "description") return DESCRIPTION_SCORE;
  return DIMENSION_SCORE;
}

function collectSignals(item: DiscoveryItem, analysis: DiscoveryQueryAnalysis): MatchSignal[] {
  const fields = getSearchableFields(item);
  const signals: MatchSignal[] = [];

  for (const term of analysis.directTerms) {
    for (const field of fields) {
      const score = directFieldScore(field, term.value);
      if (score > 0) signals.push({ ...field, kind: term.kind, matchedTerm: term.value, score, concepts: term.concepts });
    }
  }

  for (const term of [...analysis.relationshipTerms, ...analysis.synonymTerms]) {
    if (term.score === undefined) continue;
    for (const field of fields) {
      if (!matchesSearchTerm(field.value, term.value)) continue;
      signals.push({
        ...field,
        kind: term.kind,
        matchedTerm: term.value,
        score: term.score,
        concepts: term.concepts,
      });
    }
  }

  return signals;
}

function getReasonLabel(signal: MatchSignal): DiscoveryReasonLabel | null {
  if (signal.kind === "relationship" || signal.kind === "synonym") return "Gefunden über";
  if (signal.source === "category" || signal.source === "tag" || signal.source === "keyword") return "Passt zu";
  if (activeDiscoveryDimensions.includes(signal.source as ActiveDiscoveryDimension)) return "Relevant für";
  return null;
}

function capitalizeDisplayTerm(value: string): string {
  if (!value) return value;
  return value[0].toLocaleUpperCase("de-DE") + value.slice(1);
}

function createReason(signal: MatchSignal): DiscoveryMatchReason | null {
  const label = getReasonLabel(signal);
  if (!label) return null;
  if (signal.kind === "direct" && signal.value.length > 56) return null;

  const useSourceValue = signal.kind === "direct";
  return {
    source: signal.source,
    value: signal.value,
    matchedTerm: signal.matchedTerm,
    kind: signal.kind,
    label,
    displayValue: useSourceValue ? signal.value : capitalizeDisplayTerm(signal.matchedTerm),
  };
}

function getMatch(item: DiscoveryItem, analysis: DiscoveryQueryAnalysis): DiscoveryMatch | null {
  const signals = collectSignals(item, analysis);
  if (signals.length === 0) return null;

  const sortedSignals = [...signals].sort((left, right) => right.score - left.score);
  const strongestScore = sortedSignals[0].score;
  const matchedConcepts = new Set(sortedSignals.flatMap(({ concepts }) => concepts));
  const coverageBonus = Math.min(
    MAX_COVERAGE_BONUS,
    Math.max(0, matchedConcepts.size - 1) * COVERAGE_BONUS_PER_CONCEPT,
  );
  const reasons: DiscoveryMatchReason[] = [];
  const reasonKeys = new Set<string>();

  for (const signal of sortedSignals) {
    const reason = createReason(signal);
    if (!reason) continue;
    const reasonKey = normalizeDiscoveryText(reason.displayValue);
    if (reasonKeys.has(reasonKey)) continue;
    reasonKeys.add(reasonKey);
    reasons.push(reason);
    if (reasons.length === MAX_MATCH_REASONS) break;
  }

  return { item, score: strongestScore + coverageBonus, reasons };
}

/**
 * Finds relevant items from the first character. Equal scores keep index order,
 * giving editors deterministic control without a second ranking system.
 */
export function discoverItems(items: DiscoveryItem[], query: string): DiscoveryMatch[] {
  const analysis = analyzeDiscoveryQuery(query);
  if (!analysis.normalizedQuery || analysis.directTerms.length === 0) return [];

  return items
    .map((item, index) => ({ match: getMatch(item, analysis), index }))
    .filter((entry): entry is { match: DiscoveryMatch; index: number } => entry.match !== null)
    .sort((left, right) => right.match.score - left.match.score || left.index - right.index)
    .map(({ match }) => match);
}

export function groupDiscoveryItems(matches: DiscoveryMatch[]): Map<DiscoveryGroup, DiscoveryMatch[]> {
  const groups = new Map<DiscoveryGroup, DiscoveryMatch[]>();

  for (const group of discoveryGroupOrder) {
    const groupMatches = matches.filter(({ item }) => item.group === group);
    if (groupMatches.length > 0) groups.set(group, groupMatches);
  }

  return groups;
}

/**
 * Projects the existing ranked results into the calmer homepage presentation.
 * Ranking and grouping stay owned by Discovery Engine v1; this function only
 * removes the first result and limits the visible cards per group.
 */
export function createAdaptiveDiscoveryView(matches: DiscoveryMatch[], selectedMatchId: string | null = null): AdaptiveDiscoveryView {
  const selectedIndex = selectedMatchId ? matches.findIndex(({ item }) => item.id === selectedMatchId) : -1;
  const topMatchIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const topMatch = matches[topMatchIndex];
  const remainingMatches = matches.filter((_, index) => index !== topMatchIndex);
  const groups = groupDiscoveryItems(remainingMatches);

  return {
    topMatch: topMatch ?? null,
    groups: [...groups].map(([group, groupMatches]) => ({
      group,
      matches: groupMatches.slice(0, adaptiveDiscoveryGroupLimit),
      remainingCount: Math.max(0, groupMatches.length - adaptiveDiscoveryGroupLimit),
    })),
  };
}
