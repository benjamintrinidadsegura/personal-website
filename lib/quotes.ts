import { quoteUniverse } from "@/data/quotes";
import type { QuoteRecord, QuoteSelectionContext, SelectedQuote } from "@/types/quote";

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function overlaps<T>(left: readonly T[] | undefined, right: readonly T[] | undefined): boolean {
  return Boolean(left?.length && right?.length && left.some((value) => right.includes(value)));
}

function activeOn(record: QuoteRecord, dateKey: string): boolean {
  if (record.status !== "active") return false;
  if (record.activeFrom && dateKey < record.activeFrom) return false;
  if (record.activeUntil && dateKey > record.activeUntil) return false;
  return true;
}

function specificity(record: QuoteRecord, context: QuoteSelectionContext): number {
  if (context.surface === "daily") return record.dailyEligible ? 3 : -1;

  if (context.surface === "life-alignment") {
    if (!record.products.includes("life-alignment")) return overlaps(record.themes, context.themes) ? 1 : 0;
    const mapping = record.lifeAlignment;
    const specific = Boolean(
      (context.lifeAlignment?.moduleId && context.lifeAlignment.moduleId !== "self" && mapping?.moduleIds?.includes(context.lifeAlignment.moduleId))
      || (context.lifeAlignment?.snapshotGroup && mapping?.snapshotGroups?.includes(context.lifeAlignment.snapshotGroup))
      || (context.lifeAlignment?.signal && mapping?.signals?.includes(context.lifeAlignment.signal))
      || overlaps(mapping?.partnerCategories, context.lifeAlignment?.partnerCategories)
      || overlaps(mapping?.relationshipCategories, context.lifeAlignment?.relationshipCategories)
    );
    return specific ? 3 : 2;
  }

  if (!record.products.includes("fyns")) return overlaps(record.themes, context.themes) ? 1 : 0;
  const mapping = record.fyns;
  const identityMatches = overlaps(mapping?.characterIds, context.fyns?.characterIds)
    || overlaps(mapping?.dimensions, context.fyns?.dimensions);
  return identityMatches ? 3 : 2;
}

function fallbackLabel(level: number): SelectedQuote["fallbackLevel"] {
  if (level >= 3) return "specific";
  if (level === 2) return "product";
  if (level === 1) return "theme";
  return "general";
}

export function selectQuote(context: QuoteSelectionContext, records: readonly QuoteRecord[] = quoteUniverse): SelectedQuote {
  const dateKey = context.dateKey ?? new Date().toISOString().slice(0, 10);
  const active = records.filter((record) => activeOn(record, dateKey));
  const scored = active
    .map((record) => ({ record, level: specificity(record, context) }))
    .filter(({ level }) => level >= 0);
  if (scored.length === 0) throw new Error("Quote Universe has no active fallback quote");

  const excludedIds = new Set(context.excludeIds ?? []);
  const excludedFamilies = new Set(context.excludeFamilies ?? []);
  const levels = [...new Set(scored.map(({ level }) => level))].sort((left, right) => right - left);
  let chosenLevel = levels[0]!;
  let candidates: typeof scored = [];

  for (const level of levels) {
    const familySafe = scored.filter(({ record, level: candidateLevel }) => candidateLevel === level && !excludedIds.has(record.id) && !excludedFamilies.has(record.semanticFamily));
    if (familySafe.length > 0) { chosenLevel = level; candidates = familySafe; break; }
  }
  if (candidates.length === 0) {
    for (const level of levels) {
      const idSafe = scored.filter(({ record, level: candidateLevel }) => candidateLevel === level && !excludedIds.has(record.id));
      if (idSafe.length > 0) { chosenLevel = level; candidates = idSafe; break; }
    }
  }
  if (candidates.length === 0) candidates = scored.filter(({ level }) => level === chosenLevel);
  const seed = [
    context.locale,
    context.surface,
    dateKey,
    context.seed ?? "default",
    context.lifeAlignment?.moduleId ?? "",
    context.lifeAlignment?.snapshotGroup ?? "",
    context.lifeAlignment?.signal ?? "",
    ...(context.lifeAlignment?.partnerCategories ?? []),
    ...(context.lifeAlignment?.relationshipCategories ?? []),
    context.fyns?.journey ?? "",
    ...(context.fyns?.characterIds ?? []),
    ...(context.fyns?.dimensions ?? []),
  ].join("|");
  const ranked = [...candidates].sort((left, right) => {
    const leftRank = stableHash(`${seed}|${left.record.id}`) / (left.record.weight ?? 1);
    const rightRank = stableHash(`${seed}|${right.record.id}`) / (right.record.weight ?? 1);
    return leftRank - rightRank || left.record.id.localeCompare(right.record.id);
  });
  const selected = ranked[0]!.record;
  const variant = selected.variants[context.locale];

  return {
    id: selected.id,
    text: variant.text,
    attribution: selected.origin === "bts-original" ? "bts.online" : variant.attribution ?? "",
    source: variant.source,
    origin: selected.origin,
    themes: selected.themes,
    semanticFamily: selected.semanticFamily,
    shareEligible: selected.shareEligible,
    fallbackLevel: fallbackLabel(chosenLevel),
    eligibleCount: candidates.length,
  };
}

export function dailyQuoteKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
