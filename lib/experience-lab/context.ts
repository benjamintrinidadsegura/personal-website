import { normalizeLabQuery, type LabItem, type LabMatch } from "./search";

/** Explain only evidence supplied by the authoritative index; never infer endorsements. */
export function labContext(match: LabMatch, query: string) {
  return {searched:Boolean(normalizeLabQuery(query)),topics:[...new Set(match.matchedTopics)].filter(topic=>match.item.topics.includes(topic))};
}
export function sharedLabTopics(first: LabItem,second: LabItem): string[] {
  const terms=new Set(first.topics.map(normalizeLabQuery));
  return [...new Set(second.topics.filter(topic=>terms.has(normalizeLabQuery(topic))))];
}
