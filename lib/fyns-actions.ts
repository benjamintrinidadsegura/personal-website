import { fynsActionRegistry } from "@/data/fyns-actions";
import type { FynsActionContext, FynsActionRecord, SelectedFynsAction } from "@/types/fyns-action";

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

function pairKey(values: readonly string[]): string {
  return [...values].sort().join("+");
}

function specificity(record: FynsActionRecord, context: FynsActionContext): number {
  if (record.tensionOnly && !context.tensionIds?.length) return -1;
  if (record.resultSignals?.length && !overlaps(record.resultSignals, context.resultSignals)) return -1;
  if (record.journeys?.length && !record.journeys.includes(context.journey)) return -1;

  const characters = context.characterIds ?? [];
  const currentPair = characters.length >= 2 ? pairKey(characters.slice(0, 2)) : "";
  if (currentPair && record.characterPairs?.includes(currentPair)) return 6;
  if (record.characterIds && record.characterIds.length > 1 && !record.characterIds.every((id) => characters.includes(id))) return -1;
  if (record.characterIds?.length && record.characterIds.every((id) => characters.includes(id))) {
    return record.characterIds.length > 1 ? 6 : 5;
  }
  if (overlaps(record.dimensions, context.dimensions)) return 4;
  if (record.resultSignals?.length) return 3;
  if (record.journeys?.includes(context.journey)) return 2;
  if (record.safeGeneral) return 1;
  return -1;
}

function fallbackLevel(level: number): SelectedFynsAction["fallbackLevel"] {
  if (level >= 6) return "constellation";
  if (level === 5) return "character";
  if (level === 4) return "dimension";
  if (level === 3) return "result";
  if (level === 2) return "journey";
  return "general";
}

export function selectFynsAction(
  context: FynsActionContext,
  records: readonly FynsActionRecord[] = fynsActionRegistry,
): SelectedFynsAction | null {
  if (context.unsupported) return null;
  const scored = records
    .map((record) => ({ record, level: specificity(record, context) }))
    .filter(({ level }) => level > 0);
  if (scored.length === 0) return null;

  const excludedIds = new Set(context.excludeIds ?? []);
  const excludedFamilies = new Set(context.excludeFamilies ?? []);
  const levels = [...new Set(scored.map(({ level }) => level))].sort((left, right) => right - left);
  let chosenLevel = levels[0]!;
  let candidates: typeof scored = [];

  for (const level of levels) {
    const safe = scored.filter(({ record, level: candidateLevel }) => candidateLevel === level
      && !excludedIds.has(record.id)
      && !excludedFamilies.has(record.semanticFamily));
    if (safe.length) { chosenLevel = level; candidates = safe; break; }
  }
  if (!candidates.length) {
    for (const level of levels) {
      const safe = scored.filter(({ record, level: candidateLevel }) => candidateLevel === level && !excludedIds.has(record.id));
      if (safe.length) { chosenLevel = level; candidates = safe; break; }
    }
  }
  if (!candidates.length) return null;

  const seed = [
    context.locale, context.journey, context.seed ?? "default",
    ...(context.characterIds ?? []), ...(context.dimensions ?? []),
    ...(context.tensionIds ?? []), ...(context.resultSignals ?? []),
  ].join("|");
  const ranked = [...candidates].sort((left, right) => {
    const leftRank = stableHash(`${seed}|${left.record.id}`) / Math.max(1, left.record.priority);
    const rightRank = stableHash(`${seed}|${right.record.id}`) / Math.max(1, right.record.priority);
    return leftRank - rightRank || left.record.id.localeCompare(right.record.id);
  });
  const selected = ranked[0]!.record;
  return {
    id: selected.id,
    ...selected.variants[context.locale],
    kind: selected.kind,
    horizon: selected.horizon,
    semanticFamily: selected.semanticFamily,
    fallbackLevel: fallbackLevel(chosenLevel),
    eligibleCount: candidates.length,
  };
}

export function selectFynsActionSet(
  context: FynsActionContext,
  count = 3,
  records: readonly FynsActionRecord[] = fynsActionRegistry,
): readonly SelectedFynsAction[] {
  const selected: SelectedFynsAction[] = [];
  for (let index = 0; index < count; index += 1) {
    const next = selectFynsAction({
      ...context,
      seed: `${context.seed ?? "default"}:${index}`,
      excludeIds: [...(context.excludeIds ?? []), ...selected.map(({ id }) => id)],
      excludeFamilies: [...(context.excludeFamilies ?? []), ...selected.map(({ semanticFamily }) => semanticFamily)],
    }, records);
    if (!next) break;
    selected.push(next);
  }
  return selected;
}
