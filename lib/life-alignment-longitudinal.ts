import type { AlignmentRoundHistoryItem, RelationshipResultCategory } from "@/types/life-alignment-relationship";
import type { LifeVisionAreaId, LifeVisionEmphasis, LifeVisionResult } from "@/types/life-alignment-life-vision";
import type { PersonalRoundSnapshot } from "@/types/life-alignment-personal";

export type AlignmentChangeKind = "more-aligned" | "less-aligned" | "stable" | "new-tension" | "reduced-tension" | "changed-priority";

export interface AlignmentChange {
  dimensionId: string;
  kind: AlignmentChangeKind;
}

export interface LongitudinalInsight {
  id: string;
  dimensionId: string;
  kind: "stable-three-rounds" | "difference-persists" | "moved-closer" | "became-more-important";
  minimumRounds: 2 | 3;
}

const relationshipRank: Record<RelationshipResultCategory, number | null> = {
  "strong-alignment": 2,
  "complementary-strengths": 1,
  "different-workable": 0,
  "needs-conversation": -1,
  "potential-friction": -2,
  "insufficient-evidence": null,
};

function relationshipSignals(round: AlignmentRoundHistoryItem): Map<string, RelationshipResultCategory> {
  return new Map(round.sharedResult.insights.map((insight) => [insight.dimensionId, insight.category]));
}

export function compareRelationshipRounds(previous: AlignmentRoundHistoryItem, current: AlignmentRoundHistoryItem): AlignmentChange[] {
  const before = relationshipSignals(previous);
  const after = relationshipSignals(current);
  const ids = [...new Set([...before.keys(), ...after.keys()])].sort();
  const changes: AlignmentChange[] = [];
  for (const dimensionId of ids) {
    const previousCategory = before.get(dimensionId);
    const currentCategory = after.get(dimensionId);
    if (!previousCategory || !currentCategory) continue;
    if (previousCategory === currentCategory) { changes.push({ dimensionId, kind: "stable" }); continue; }
    if (currentCategory === "potential-friction" || currentCategory === "needs-conversation") { changes.push({ dimensionId, kind: "new-tension" }); continue; }
    if (previousCategory === "potential-friction" || previousCategory === "needs-conversation") { changes.push({ dimensionId, kind: "reduced-tension" }); continue; }
    const previousRank = relationshipRank[previousCategory];
    const currentRank = relationshipRank[currentCategory];
    if (previousRank === null || currentRank === null) continue;
    if (currentRank > previousRank) changes.push({ dimensionId, kind: "more-aligned" });
    else if (currentRank < previousRank) changes.push({ dimensionId, kind: "less-aligned" });
    else changes.push({ dimensionId, kind: "changed-priority" });
  }
  return changes;
}

export function relationshipLongitudinalInsights(rounds: readonly AlignmentRoundHistoryItem[]): LongitudinalInsight[] {
  if (rounds.length < 2) return [];
  const ordered = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const changes = compareRelationshipRounds(ordered.at(-2)!, ordered.at(-1)!);
  const insights: LongitudinalInsight[] = [];
  for (const change of changes) {
    if (change.kind === "more-aligned" || change.kind === "reduced-tension") { insights.push({ id: `closer-${change.dimensionId}`, dimensionId: change.dimensionId, kind: "moved-closer", minimumRounds: 2 }); continue; }
    if (change.kind === "stable") {
      const latest = relationshipSignals(ordered.at(-1)!).get(change.dimensionId);
      if (latest === "needs-conversation" || latest === "potential-friction") insights.push({ id: `persists-${change.dimensionId}`, dimensionId: change.dimensionId, kind: "difference-persists", minimumRounds: 2 });
    }
  }
  if (ordered.length >= 3) {
    const latestThree = ordered.slice(-3).map(relationshipSignals);
    for (const [dimensionId, category] of latestThree[0]!) {
      if (latestThree.every((signals) => signals.get(dimensionId) === category)) insights.push({ id: `stable-${dimensionId}`, dimensionId, kind: "stable-three-rounds", minimumRounds: 3 });
    }
  }
  return insights;
}

export function comparePersonalRounds(previous: PersonalRoundSnapshot, current: PersonalRoundSnapshot): AlignmentChange[] {
  const before = new Map(previous.result.dimensions.map((dimension) => [dimension.dimensionId, dimension]));
  const changes: AlignmentChange[] = [];
  for (const dimension of current.result.dimensions) {
    const prior = before.get(dimension.dimensionId);
    if (!prior) continue;
    if (dimension.importance !== prior.importance && Math.abs(dimension.importance - prior.importance) >= 1) { changes.push({ dimensionId: dimension.dimensionId, kind: "changed-priority" }); continue; }
    const delta = dimension.current - prior.current;
    if (delta >= 1) changes.push({ dimensionId: dimension.dimensionId, kind: "more-aligned" });
    else if (delta <= -1) changes.push({ dimensionId: dimension.dimensionId, kind: "less-aligned" });
    else changes.push({ dimensionId: dimension.dimensionId, kind: "stable" });
  }
  return changes;
}

export function personalLongitudinalInsights(rounds: readonly PersonalRoundSnapshot[]): LongitudinalInsight[] {
  if (rounds.length < 2) return [];
  const ordered = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const changes = comparePersonalRounds(ordered.at(-2)!, ordered.at(-1)!);
  const insights: LongitudinalInsight[] = [];
  for (const change of changes) {
    if (change.kind === "more-aligned") insights.push({ id: `closer-${change.dimensionId}`, dimensionId: change.dimensionId, kind: "moved-closer", minimumRounds: 2 });
    else if (change.kind === "changed-priority") insights.push({ id: `priority-${change.dimensionId}`, dimensionId: change.dimensionId, kind: "became-more-important", minimumRounds: 2 });
  }
  if (ordered.length >= 3) {
    const latestThree = ordered.slice(-3);
    for (const dimension of latestThree[0]!.result.dimensions) {
      if (latestThree.every((round) => round.result.dimensions.find(({ dimensionId }) => dimensionId === dimension.dimensionId)?.current === dimension.current)) insights.push({ id: `stable-${dimension.dimensionId}`, dimensionId: dimension.dimensionId, kind: "stable-three-rounds", minimumRounds: 3 });
    }
  }
  return insights;
}

export function appendPersonalRound(history: readonly PersonalRoundSnapshot[], moduleId: PersonalRoundSnapshot["moduleId"], result: PersonalRoundSnapshot["result"], completedAt = new Date().toISOString()): PersonalRoundSnapshot[] {
  const moduleHistory = history.filter((round) => round.moduleId === moduleId);
  const roundNumber = Math.max(0, ...moduleHistory.map((round) => round.roundNumber)) + 1;
  return [...history, { id: `${moduleId}-${roundNumber}-${completedAt}`, moduleId, roundNumber, completedAt, result }];
}

export interface LifeVisionRoundSnapshot {
  roundNumber: number;
  completedAt: string;
  signature: string;
  areas: readonly { id: LifeVisionAreaId; title: string; emphasis: LifeVisionEmphasis; protected: boolean }[];
}

function lifeVisionSignature(result: Pick<LifeVisionResult, "areas">): string {
  return JSON.stringify(result.areas.map(({ id, emphasis, protected: isProtected }) => ({ id, emphasis, protected: isProtected })).sort((a, b) => a.id.localeCompare(b.id)));
}

export function appendLifeVisionRound(history: readonly LifeVisionRoundSnapshot[], result: Pick<LifeVisionResult, "areas">, completedAt = new Date().toISOString()): LifeVisionRoundSnapshot[] {
  const current = history.slice(-20);
  const last = current.at(-1);
  const signature = lifeVisionSignature(result);
  if (last?.signature === signature && Date.parse(completedAt) - Date.parse(last.completedAt) < 5 * 60_000) return current;
  return [...current, {
    roundNumber: (last?.roundNumber ?? 0) + 1,
    completedAt,
    signature,
    areas: result.areas.map(({ id, title, emphasis, protected: isProtected }) => ({ id, title, emphasis, protected: isProtected })),
  }].slice(-20);
}

export function compareLifeVisionRounds(previous: LifeVisionRoundSnapshot, current: LifeVisionRoundSnapshot): LifeVisionAreaId[] {
  return current.areas.filter((area) => {
    const before = previous.areas.find(({ id }) => id === area.id);
    return !before || before.emphasis !== area.emphasis || before.protected !== area.protected;
  }).map(({ id }) => id);
}

export function stableLifeVisionAreas(rounds: readonly LifeVisionRoundSnapshot[]): LifeVisionAreaId[] {
  if (rounds.length < 3) return [];
  const latestThree = rounds.slice(-3);
  return latestThree.at(-1)!.areas.filter((area) => latestThree.every((round) => {
    const item = round.areas.find(({ id }) => id === area.id);
    return item?.emphasis === area.emphasis && item.protected === area.protected;
  })).map(({ id }) => id);
}
