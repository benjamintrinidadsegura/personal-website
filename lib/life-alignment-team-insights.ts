import { teamPatternCopy } from "@/data/i18n/life-alignment-team-insights";
import { getRelationshipModule } from "@/data/life-alignment-relationship";
import type { Locale } from "@/lib/i18n/config";
import type { RelationshipAnswer, RelationshipAnswerSet } from "@/types/life-alignment-relationship";
import type { TeamAnswerEvidence, TeamPatternId, TeamSoloInsight, TeamSoloInsights } from "@/types/life-alignment-team-insights";

const rank = { low: 1, medium: 2, high: 3 } as const;
type Rule = { pattern: Exclude<TeamPatternId, "pressure-shift">; conditions: readonly (readonly [dimension: string, side: "low" | "high"])[]; tension?: boolean };
// The endpoint semantics belong to Team, not a generic personality framework.
const rules: readonly Rule[] = [
  { pattern: "feedback-repair", conditions: [["feedback", "high"], ["conflict", "low"]], tension: true },
  { pattern: "speed-quality", conditions: [["pace", "high"], ["quality", "high"]], tension: true },
  { pattern: "shared-execution", conditions: [["decisions", "low"], ["ownership", "high"]] },
  { pattern: "owned-flexible", conditions: [["autonomy", "high"], ["communication", "low"]] },
  { pattern: "explicit", conditions: [["communication", "high"], ["reliability", "high"]] },
  { pattern: "collaborative", conditions: [["collaboration", "high"], ["decisions", "low"]] },
  { pattern: "individual", conditions: [["collaboration", "low"], ["ownership", "high"]] },
  { pattern: "gradual", conditions: [["feedback", "low"], ["conflict", "low"]] },
  { pattern: "direct", conditions: [["feedback", "high"], ["conflict", "high"]] },
];

function valid(answer: unknown): answer is RelationshipAnswer {
  if (!answer || typeof answer !== "object") return false;
  const a = answer as Partial<RelationshipAnswer>;
  return Number.isInteger(a.value) && Number(a.value) >= 1 && Number(a.value) <= 5 && (a.importance === "low" || a.importance === "medium" || a.importance === "high");
}

/** Accepts partial evidence for provisional interpretation; does not relax final-submission validation. */
export function buildTeamSoloInsights(input: RelationshipAnswerSet, locale: Locale = "en"): TeamSoloInsights {
  const definition = getRelationshipModule("team");
  const questions = new Map(definition.questions.map(q => [q.id, q]));
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.entries(input).some(([id, answer]) => !questions.has(id) || (answer !== undefined && !valid(answer)))) {
    throw new Error("INVALID_TEAM_EVIDENCE");
  }
  const evidence = (id: string): TeamAnswerEvidence => {
    const answer = input[id];
    if (!valid(answer)) throw new Error("MISSING_TEAM_EVIDENCE");
    return { questionId: id, value: answer.value, importance: answer.importance };
  };
  const make = (pattern: TeamPatternId, ids: string[], tension: boolean): TeamSoloInsight => {
    const copy = teamPatternCopy[pattern];
    return { id: `${pattern}:${ids.join(":")}`, pattern, title: copy.title[locale], meaning: copy.meaning[locale], experiment: copy.experiment[locale], conversation: copy.conversation[locale], tension, evidence: ids.map(evidence) };
  };
  const shifted = new Set<string>();
  const candidates: TeamSoloInsight[] = [];
  for (const q of definition.questions.filter(q => q.kind === "scenario")) {
    const ordinary = definition.questions.find(p => p.dimensionId === q.dimensionId && p.kind !== "scenario")!;
    const a = input[ordinary.id], b = input[q.id];
    // An actual side reversal, not a midpoint difference or guessed missing scenario.
    if (a && b && ((a.value <= 2 && b.value >= 4) || (a.value >= 4 && b.value <= 2))) {
      shifted.add(ordinary.id);
      candidates.push(make("pressure-shift", [ordinary.id, q.id], true));
    }
  }
  for (const rule of rules) {
    const ids = rule.conditions.map(([dimension]) => `team-${dimension}-position`);
    if (ids.some(id => shifted.has(id))) continue;
    if (rule.conditions.every(([dimension, side]) => {
      const a = input[`team-${dimension}-position`];
      return a && (side === "low" ? a.value <= 2 : a.value >= 4);
    })) candidates.push(make(rule.pattern, ids, Boolean(rule.tension)));
  }
  const priority = (insight: TeamSoloInsight) => Math.max(...insight.evidence.map(e => rank[e.importance]));
  candidates.sort((a, b) => Number(b.pattern === "pressure-shift") - Number(a.pattern === "pressure-shift") || priority(b) - priority(a) || Number(b.tension) - Number(a.tension));
  // Several pressure changes share one interpretation. Keep that explanation once,
  // with all supporting pairs, so it cannot crowd out distinct patterns.
  const shifts = candidates.filter(c => c.pattern === "pressure-shift");
  const merged = shifts.length ? [{ ...shifts[0]!, evidence: shifts.flatMap(c => c.evidence) }, ...candidates.filter(c => c.pattern !== "pressure-shift")] : candidates;
  const insights = merged.slice(0, 3);
  const used = new Set(insights.flatMap(i => i.evidence.map(e => e.questionId)));
  const required = definition.questions.filter(q => !q.optional);
  const missing = definition.questions.filter(q => !input[q.id]);
  return {
    version: "team-solo-insights-v1",
    complete: required.every(q => input[q.id]),
    answeredRequired: required.filter(q => input[q.id]).length,
    required: required.length,
    answeredScenarios: definition.questions.filter(q => q.kind === "scenario" && input[q.id]).length,
    insights,
    missingQuestionIds: missing.map(q => q.id),
    midpointQuestionIds: definition.questions.filter(q => input[q.id]?.value === 3).map(q => q.id),
    unmatchedQuestionIds: definition.questions.filter(q => input[q.id] && input[q.id]!.value !== 3 && !used.has(q.id)).map(q => q.id),
  };
}
