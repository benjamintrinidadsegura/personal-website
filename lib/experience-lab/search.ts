export const labKinds = ["project", "writing", "tool", "person", "world", "community", "idea"] as const;
export type LabKind = (typeof labKinds)[number];
export type LabItem = {
  id: string;
  kind: LabKind;
  title: string;
  summary: string;
  topics: readonly string[];
  keywords: readonly string[];
  language: "de" | "en";
  image?: { src: string; alt: string };
} & ({ source: "public"; href: string } | { source: "demo"; href?: never });

export type LabMatch = { item: LabItem; score: number; matchedTopics: readonly string[] };
type IndexedItem = {
  item: LabItem;
  fields: readonly { value: string; words: readonly string[]; weight: number }[];
};

// Small equivalence groups apply to terms, never to complete queries or predetermined result lists.
const synonyms: readonly (readonly string[])[] = [
  ["career", "karriere", "beruf", "laufbahn", "beruflich"],
  ["recruiting", "recruitment", "hiring", "personalgewinnung"],
  ["ai", "ki", "artificial intelligence", "kunstliche intelligenz"],
  ["people", "menschen", "person", "personen"],
  ["relationship", "relationships", "beziehung", "beziehungen", "partnerschaft"],
  ["writing", "schreiben", "texte", "essay", "essays", "artikel"],
  ["gaming", "games", "game", "spiele", "spielen"],
  ["community", "gemeinschaft", "communities"],
  ["map", "karte", "world", "welt"],
  ["reflection", "reflexion", "selbstreflexion"],
  ["tools", "tool", "werkzeug", "werkzeuge"],
];

export function normalizeLabQuery(value: string): string {
  return value.slice(0, 160).toLocaleLowerCase("de-DE").replaceAll("ß", "ss")
    .normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function oneEditAway(left: string, right: string): boolean {
  if (left.length < 5 || right.length < 5 || Math.abs(left.length - right.length) > 1) return false;
  if (left.length === right.length) {
    const differences = [...left].flatMap((char, index) => char === right[index] ? [] : [index]);
    if (differences.length === 1) return true;
    return differences.length === 2 && differences[1] === differences[0] + 1
      && left[differences[0]] === right[differences[1]] && left[differences[1]] === right[differences[0]];
  }
  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  let index = 0;
  while (index < shorter.length && shorter[index] === longer[index]) index++;
  return shorter.slice(index) === longer.slice(index + 1);
}

function termStrength(words: readonly string[], token: string): number {
  if (words.includes(token)) return 1;
  if (token.length >= 3 && words.some(word => word.startsWith(token))) return .7;
  if (words.some(word => oneEditAway(word, token))) return .45;
  return 0;
}

function queryConcepts(query: string): readonly string[][] {
  const words = query.split(" ");
  const concepts: string[][] = [];
  for (let index = 0; index < words.length; index++) {
    const pair = words.slice(index, index + 2).join(" ");
    const group = synonyms.find(entries => entries.includes(pair));
    if (group) {
      concepts.push([...group]);
      index++;
    } else {
      concepts.push([...(synonyms.find(entries => entries.includes(words[index])) ?? [words[index]])]);
    }
  }
  return concepts;
}

/** Pure, replaceable index. No network, storage, clock or access to the live search engine. */
export function createLabSearch(items: readonly LabItem[]) {
  const seen = new Set<string>();
  const index: IndexedItem[] = items.map(item => {
    if (!item.id || seen.has(item.id)) throw new Error("Lab item IDs must be unique");
    seen.add(item.id);
    const fields = [
      { text: item.title, weight: 12 },
      { text: item.topics.join(" "), weight: 8 },
      { text: item.keywords.join(" "), weight: 5 },
      { text: item.summary, weight: 3 },
      { text: item.kind, weight: 4 },
    ].map(({ text, weight }) => {
      const value = normalizeLabQuery(text);
      return { value, words: value.split(" "), weight };
    });
    return { item, fields };
  });
  return (input: string, kind: LabKind | "all" = "all"): LabMatch[] => {
    const query = normalizeLabQuery(input);
    const concepts = query ? queryConcepts(query) : [];
    return index.flatMap(({ item, fields }): LabMatch[] => {
      if (kind !== "all" && item.kind !== kind) return [];
      const scores = concepts.map(variants => Math.max(...fields.map(field => (
        field.weight * Math.max(...variants.map(term => term.includes(" ")
          ? field.value.includes(term) ? .9 : 0
          : termStrength(field.words, term)))
      ))));
      // Every concept must contribute evidence. A broad category never fills missing terms.
      if (scores.some(score => score === 0)) return [];
      const exactTitle = query && fields[0].value === query ? 25 : 0;
      const phrase = query && fields[0].value.includes(query) ? 12 : 0;
      const matchedTopics = item.topics.filter(topic => concepts.some(variants => (
        variants.some(term => normalizeLabQuery(topic).includes(term))
      )));
      return [{ item, score: scores.reduce((sum, score) => sum + score, 0) + exactTitle + phrase, matchedTopics }];
    }).sort((first, second) => second.score - first.score);
  };
}

export function relatedLabItems(item: LabItem, items: readonly LabItem[], limit = 2): LabItem[] {
  const topics = new Set(item.topics.map(normalizeLabQuery));
  return items.filter(other => other.id !== item.id)
    .map(other => ({ item: other, overlap: other.topics.filter(topic => topics.has(normalizeLabQuery(topic))).length }))
    .filter(({ overlap }) => overlap > 0)
    .sort((first, second) => second.overlap - first.overlap)
    .slice(0, Math.max(0, limit)).map(({ item: other }) => other);
}
