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

/** Display/reason normalization retains the established spelling contract. */
export function normalizeDiscoveryText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("de-DE").trim().replace(/\s+/gu, " ");
}

/** Normalizes user-authored content for locale-aware, case-insensitive matching. */
export function normalizeSearchText(value: string): string {
  return value.slice(0, 2000).normalize("NFKC").toLocaleLowerCase("de-DE")
    .replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss")
    .normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/gu, " ");
}

function tokenizeDiscoveryText(value: string): string[] {
  return normalizeSearchText(value)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter(Boolean);
}

const normalizedNeutralTerms = new Set(discoveryNeutralTerms.map(normalizeSearchText));

function uniqueTerms(terms: QueryTerm[]): QueryTerm[] {
  const seen = new Set<string>();

  return terms.filter((term) => {
    const key = `${term.kind}:${normalizeSearchText(term.value)}`;
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
  const normalizedQuery = normalizeSearchText(query);
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
      const normalizedAlias = normalizeSearchText(alias.value);
      // A single unfinished word can suggest a documented alias. It stays below
      // genuine descriptive evidence; aliases never recursively expand.
      if (tokens.length === 1 && tokens[0].length >= 3 && normalizedAlias.startsWith(tokens[0])) return true;
      if (alias.match === "whole-query") return meaningfulPhrase === normalizedAlias;
      if (alias.match === "phrase") return includesTokenPhrase(tokens, normalizedAlias);
      return tokens.includes(normalizedAlias);
    });

    if (!matchingAlias) return [];
    const progressive = tokens.length === 1 && normalizeSearchText(matchingAlias.value) !== tokens[0] && normalizeSearchText(matchingAlias.value).startsWith(tokens[0]);
    const aliasConcepts = progressive ? tokens : tokenizeDiscoveryText(matchingAlias.value);
    return [{ value: group.canonical, kind: "synonym" as const, score: progressive ? 85 : SYNONYM_SCORE, concepts: aliasConcepts }];
  }));

  return {
    normalizedQuery,
    directTerms,
    synonymTerms,
    relationshipTerms,
  };
}

/** Strong whole-word/phrase evidence stays above progressive prefixes and substrings. */
function termStrength(value: string, term: string): "exact" | "prefix" | "partial" | null {
  const words=tokenizeDiscoveryText(value), terms=tokenizeDiscoveryText(term);
  if (!terms.length) return null;
  if (includesTokenPhrase(words, term)) return "exact";
  if (words.some((_, start) => terms.every((word, index) => {
    const candidate=words[start+index];
    return candidate && (index===terms.length-1 ? candidate.startsWith(word) : candidate===word);
  }))) return "prefix";
  // Bounded partials are useful within long compound words, never arbitrary K/IT/HR fragments.
  if (terms.length===1 && terms[0].length>=4 && words.some(word=>word.includes(terms[0]))) return "partial";
  return null;
}
function matchesSearchTerm(value: string, term: string): boolean {
  return termStrength(value, term)==="exact";
}
function titleMatchScore(title: string, term: string): number {
  const normalizedTitle=normalizeSearchText(title), normalizedTerm=normalizeSearchText(term);
  if (!normalizedTerm) return 0;
  if (normalizedTitle===normalizedTerm) return TITLE_EXACT_SCORE;
  const strength=termStrength(title,term);
  if (strength==="exact") return normalizedTitle.startsWith(normalizedTerm)?TITLE_PREFIX_SCORE:TITLE_SCORE;
  return strength==="prefix"?70:strength==="partial"?30:0;
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
  const strength=termStrength(field.value, term);
  if (!strength) return 0;
  if (strength!=="exact") {
    if (field.source==="description" && normalizeSearchText(term).length<3) return 0;
    if (activeDiscoveryDimensions.includes(field.source as ActiveDiscoveryDimension) && normalizeSearchText(term).length<3) return 0;
    return strength==="prefix"?60:20;
  }
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
        score: term.score <= 90 && (field.source !== "title" || normalizeSearchText(field.value) !== normalizeSearchText(term.value))
          ? Math.min(65, term.score) : term.score,
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
    const reasonKey = normalizeSearchText(reason.displayValue);
    if (reasonKeys.has(reasonKey)) continue;
    reasonKeys.add(reasonKey);
    reasons.push(reason);
    if (reasons.length === MAX_MATCH_REASONS) break;
  }

  const requestedConcepts = new Set(analysis.directTerms.flatMap(term=>term.concepts));
  const presentation = analysis.relationshipTerms.length===0 && [...requestedConcepts].some(concept=>!matchedConcepts.has(concept)) ? "related" : strongestScore <= 90 ? "suggestion" : "match";
  return { item, score: strongestScore <= 90 ? Math.min(90, strongestScore + coverageBonus) : strongestScore + coverageBonus, reasons, presentation };
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
