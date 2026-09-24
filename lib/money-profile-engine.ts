import {
  moneyDimensionById,
  moneyDimensions,
  moneyInterventions,
  moneyMeaningLabels,
  moneyProfileFamilies,
  moneyStressResponseLabels,
  moneyTensionDefinitions,
} from "@/data/money-profile";
import { moneyQuestions } from "@/data/money-profile-questions";
import type {
  MatchedMoneyIntervention,
  MoneyAnswer,
  MoneyAnswerSet,
  MoneyCalibration,
  MoneyCalibrationHypothesis,
  MoneyDimensionId,
  MoneyDimensionResult,
  MoneyEvidence,
  MoneyEvidenceClass,
  MoneyMeaningId,
  MoneyProfileCandidate,
  MoneyProfileFamilyId,
  MoneyProfileResult,
  MoneyQuestion,
  MoneyQuestionOption,
  MoneyStressProfile,
  MoneyStressResponseId,
  MoneyTension,
} from "@/types/money-profile";

const evidenceWeights: Readonly<Record<MoneyEvidenceClass, number>> = {
  "self-perception": 0.7,
  "scenario-evidence": 1,
  "behavioral-evidence": 1.25,
  "repeated-friction": 1.5,
  "stress-evidence": 0.9,
};

const stressEmpty = (): Record<MoneyStressResponseId, number> => ({
  avoid: 0,
  control: 0,
  restrict: 0,
  "soothe-spend": 0,
  freeze: 0,
  act: 0,
});

function values(answer: MoneyAnswer | undefined): readonly string[] {
  if (!answer || answer.skipped) return [];
  return typeof answer.value === "string" ? [answer.value] : answer.value;
}

function selectedOptions(answers: MoneyAnswerSet): readonly { question: MoneyQuestion; option: MoneyQuestionOption }[] {
  return moneyQuestions.flatMap((question) => {
    const selected = new Set(values(answers[question.id]));
    return question.options.filter(({ id }) => selected.has(id)).map((option) => ({ question, option }));
  });
}

export function collectMoneyEvidence(answers: MoneyAnswerSet): readonly MoneyEvidence[] {
  return selectedOptions(answers).flatMap(({ question, option }) => (option.effects ?? []).map((item) => ({
    questionId: question.id,
    optionId: option.id,
    dimensionId: item.dimensionId,
    evidenceClass: question.evidenceClass,
    direction: item.direction ?? "support",
    strength: (item.strength ?? 1) * evidenceWeights[question.evidenceClass],
  })));
}

export function deriveMoneyDimensions(answers: MoneyAnswerSet): readonly MoneyDimensionResult[] {
  const evidence = collectMoneyEvidence(answers);
  return moneyDimensions.map((dimension) => {
    const relevant = evidence.filter(({ dimensionId }) => dimensionId === dimension.id);
    const support = relevant.filter(({ direction }) => direction === "support").reduce((sum, item) => sum + item.strength, 0);
    const contradiction = relevant.filter(({ direction }) => direction === "contradict").reduce((sum, item) => sum + item.strength, 0);
    const questionIds = [...new Set(relevant.map(({ questionId }) => questionId))];
    return {
      dimension,
      support,
      contradiction,
      net: support - contradiction,
      supported: support >= 2.4 && support - contradiction >= 0.8 && questionIds.length >= 2,
      evidence: relevant,
      questionIds,
      evidenceClasses: [...new Set(relevant.map(({ evidenceClass }) => evidenceClass))],
    };
  });
}

function supportedDimensionSet(answers: MoneyAnswerSet): ReadonlySet<MoneyDimensionId> {
  return new Set(deriveMoneyDimensions(answers).filter(({ supported }) => supported).map(({ dimension }) => dimension.id));
}

export function getVisibleMoneyQuestions(answers: MoneyAnswerSet): readonly MoneyQuestion[] {
  const supported = supportedDimensionSet(answers);
  return moneyQuestions.filter((question) => question.type !== "calibration" && (!question.condition || question.condition.allDimensions.every((id) => supported.has(id))));
}

export function reconcileMoneyAnswers(answers: MoneyAnswerSet): Record<string, MoneyAnswer> {
  const visible = new Set<string>(getVisibleMoneyQuestions(answers).map(({ id }) => id));
  return Object.fromEntries(Object.entries(answers).filter(([id]) => visible.has(id)));
}

function optionSignals(answers: MoneyAnswerSet) {
  const selected = selectedOptions(answers);
  const meanings = new Map<MoneyMeaningId, number>();
  const frictions = new Set<string>();
  const tags = new Set<string>();
  const stress = stressEmpty();
  const stressQuestions = new Set<string>();
  for (const { question, option } of selected) {
    const weight = evidenceWeights[question.evidenceClass];
    for (const meaning of option.meanings ?? []) meanings.set(meaning, (meanings.get(meaning) ?? 0) + weight);
    for (const friction of option.frictions ?? []) frictions.add(friction);
    for (const tag of option.tags ?? []) tags.add(tag);
    for (const response of option.stressResponses ?? []) {
      stress[response] += question.evidenceClass === "stress-evidence" ? 2 : 1;
      stressQuestions.add(question.id);
    }
  }
  if (frictions.has("no-repeated-friction")) {
    for (const friction of [...frictions]) if (friction !== "no-repeated-friction") frictions.delete(friction);
  }
  return { selected, meanings, frictions, tags, stress, stressQuestions };
}

function deriveStressProfile(answers: MoneyAnswerSet): MoneyStressProfile {
  const { stress, stressQuestions } = optionSignals(answers);
  const ranked = (Object.entries(stress) as [MoneyStressResponseId, number][]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const primary = ranked[0][1] > 0 ? ranked[0][0] : null;
  const secondary = ranked[1][1] > 0 && ranked[1][1] >= ranked[0][1] * 0.55 ? ranked[1][0] : null;
  const baselineShift = [primary, secondary].filter((value): value is MoneyStressResponseId => Boolean(value)).map((id) => `${moneyStressResponseLabels[id]} ↑`);
  return { primary, secondary, support: stress, evidenceQuestionIds: [...stressQuestions], baselineShift };
}

function baselineDimensionValue(result: MoneyDimensionResult): number {
  return result.evidence
    .filter(({ evidenceClass }) => evidenceClass !== "stress-evidence")
    .reduce((sum, item) => sum + (item.direction === "support" ? item.strength : -item.strength), 0);
}

function profileCandidates(answers: MoneyAnswerSet, calibration: MoneyCalibration = {}): readonly MoneyProfileCandidate[] {
  const dimensions = deriveMoneyDimensions(answers);
  const byId = new Map(dimensions.map((item) => [item.dimension.id, item]));
  const { meanings } = optionSignals(answers);
  const base = moneyProfileFamilies.map((family): MoneyProfileCandidate => {
    const relevantEvidence = family.dimensionIds.flatMap((id) => byId.get(id)?.evidence.filter(({ evidenceClass }) => evidenceClass !== "stress-evidence") ?? []);
    const questionIds = [...new Set(relevantEvidence.map(({ questionId }) => questionId))];
    const evidenceClasses = [...new Set(relevantEvidence.map(({ evidenceClass }) => evidenceClass))];
    const strongClass = evidenceClasses.some((item) => item === "behavioral-evidence" || item === "scenario-evidence" || item === "repeated-friction");
    let score = family.dimensionIds.reduce((sum, id) => sum + Math.max(0, baselineDimensionValue(byId.get(id)!)), 0);
    score += family.meaningIds.reduce((sum, id) => sum + (meanings.get(id) ?? 0), 0) * 0.65;
    if (family.id === "balancer") {
      const present = Math.max(0, baselineDimensionValue(byId.get("present-enjoyment")!));
      const future = Math.max(0, baselineDimensionValue(byId.get("future-orientation")!));
      const security = Math.max(0, baselineDimensionValue(byId.get("security-orientation")!));
      const freedom = Math.max(0, baselineDimensionValue(byId.get("freedom-orientation")!));
      const balancedPairs = Number(present >= 2 && future >= 2) + Number(security >= 2 && freedom >= 2);
      score = balancedPairs * 4 + Math.min(present, future) + Math.min(security, freedom);
    }
    const eligible = questionIds.length >= 2 && strongClass && score >= (family.id === "balancer" ? 8 : 5);
    return { family, score, eligible, evidenceQuestionIds: questionIds, evidenceClasses };
  });
  const hypotheses = generateCalibrationHypothesesFromCandidates(answers, base);
  return base.map((candidate) => {
    const modifiers = hypotheses.filter(({ familyIds }) => familyIds.includes(candidate.family.id)).map(({ id }) => calibration[id]);
    const adjustment = modifiers.reduce((sum, value) => sum + (value === "very-true" ? 1 : value === "not-really" ? -1.5 : 0), 0);
    return { ...candidate, score: candidate.score + adjustment };
  }).sort((a, b) => b.score - a.score || a.family.id.localeCompare(b.family.id));
}

function deriveTensions(answers: MoneyAnswerSet, dimensions = deriveMoneyDimensions(answers)): readonly MoneyTension[] {
  const byId = new Map(dimensions.map((item) => [item.dimension.id, item]));
  const { frictions } = optionSignals(answers);
  return moneyTensionDefinitions.flatMap((definition) => {
    const dimensionResults = definition.dimensionIds.map((id) => byId.get(id)!);
    const eligible = definition.id === "future-low-efficacy"
      ? baselineDimensionValue(dimensionResults[0]) >= 2 && dimensionResults[1].contradiction >= 1
      : dimensionResults.every((item) => item.support >= 2 && item.net >= 0.5);
    if (!eligible) return [];
    if (definition.id === "enjoyment-impulsivity" && !["purchase-regret", "spending-more-than-intended", "stress-spending"].some((id) => frictions.has(id))) return [];
    return [{ ...definition, evidenceQuestionIds: [...new Set(dimensionResults.flatMap(({ questionIds }) => questionIds))] }];
  });
}

function generateCalibrationHypothesesFromCandidates(answers: MoneyAnswerSet, candidates: readonly MoneyProfileCandidate[]): readonly MoneyCalibrationHypothesis[] {
  const tensions = deriveTensions(answers);
  const hypotheses: MoneyCalibrationHypothesis[] = tensions.slice(0, 2).map((tension) => ({
    id: `hypothesis-${tension.id}`,
    text: tension.insight,
    familyIds: candidates.filter(({ family }) => family.dimensionIds.some((id) => tension.dimensionIds.includes(id))).slice(0, 2).map(({ family }) => family.id),
    evidenceQuestionIds: tension.evidenceQuestionIds,
  }));
  const top = candidates.find(({ eligible }) => eligible);
  if (top && hypotheses.length < 3) hypotheses.push({
    id: `hypothesis-${top.family.id}`,
    text: `${top.family.strength} ${top.family.helpfulDirection}`,
    familyIds: [top.family.id],
    evidenceQuestionIds: top.evidenceQuestionIds,
  });
  if (!hypotheses.length) {
    const dimensions = deriveMoneyDimensions(answers).filter(({ supported }) => supported).sort((a, b) => b.net - a.net).slice(0, 2);
    for (const item of dimensions) hypotheses.push({
      id: `hypothesis-${item.dimension.id}`,
      text: `${item.dimension.label} appears relevant to how you make money decisions.`,
      familyIds: [],
      evidenceQuestionIds: item.questionIds,
    });
  }
  return hypotheses.slice(0, 3);
}

export function generateMoneyCalibrationHypotheses(answers: MoneyAnswerSet): readonly MoneyCalibrationHypothesis[] {
  return generateCalibrationHypothesesFromCandidates(answers, profileCandidates(answers));
}

function matchInterventions(
  answers: MoneyAnswerSet,
  dimensions: readonly MoneyDimensionResult[],
  candidates: readonly MoneyProfileCandidate[],
  stress: MoneyStressProfile,
): readonly MatchedMoneyIntervention[] {
  const { frictions, tags } = optionSignals(answers);
  const byId = new Map(dimensions.map((item) => [item.dimension.id, item]));
  const familyIds = new Set(candidates.filter(({ eligible }) => eligible).slice(0, 2).map(({ family }) => family.id));
  const has = (id: string) => frictions.has(id) || tags.has(id);
  const dim = (id: MoneyDimensionId) => (byId.get(id)?.net ?? 0) >= 1;
  const constrained = has("severe-constraint") || has("limited-flexibility");
  const scores: Record<string, { score: number; reason: string }> = {};
  const add = (id: string, score: number, reason: string) => { if (!scores[id] || scores[id].score < score) scores[id] = { score, reason }; };

  if (dim("future-orientation") && (has("consistency-gap") || has("automation-fit")) && !constrained) add("automatic-future-money", 8, "Future intentions are present, and a chosen automatic rule may reduce repeated decisions.");
  if ((has("spending-guilt") || has("over-restriction")) && !constrained) add("fun-money-pot", 8, "Your answers suggest that explicit permission may make intentional enjoyment easier.");
  if (dim("spending-impulsivity") && has("purchase-regret") && has("desire-fades")) add("purchase-pause", 10, "Wanting sometimes fades after a pause and regret has repeated, so a delay can reveal the durable choice.");
  if (dim("financial-avoidance") || has("avoidance") || has("control-overload")) add("ten-minute-money-check", 9, has("control-overload") ? "A bounded check can reduce repeated monitoring without losing overview." : "Short, predictable contact may feel more manageable than a large system.");
  if (has("unclear-overview") || (dim("freedom-orientation") && stress.primary)) add("fixed-cost-separation", 6, "Separating obligations from flexible money may protect clarity and freedom at the same time.");
  if (dim("future-orientation") && (has("abstract-future") || has("goal-loses-relevance") || has("needs-visible-progress"))) add("one-visible-goal", 8, "A visible priority may help a meaningful future goal compete with nearer decisions.");
  if (dim("security-orientation") && has("unexpected-costs") && !constrained) add("minimum-viable-buffer", 7, "A self-defined buffer target may turn vague uncertainty into a boundary you choose.");
  if ((has("spending-guilt") || has("over-restriction")) && !constrained && !(dim("spending-impulsivity") && has("purchase-regret"))) add("permission-to-spend", 7, "Pre-deciding where spending is allowed may reduce recurring guilt without assuming affordability.");
  if (dim("spending-impulsivity") && has("purchase-regret")) add("friction-for-impulse", 8, "One deliberate step can protect the distance between wanting and deciding.");
  if (has("control-overload") || familyIds.has("optimizer") || has("decision-fatigue")) add("reduce-money-decisions", 7, "Your attention may be better protected by simplifying low-value recurring decisions.");
  if (has("freeze") || has("overwhelm") || (stress.primary === "avoid" && has("unclear-next-step"))) add("first-small-action", 10, "One bounded action can create movement without demanding a complete financial overhaul.");
  if (has("overwhelm") || has("severe-constraint") || has("unclear-next-step") || (byId.get("financial-self-efficacy")?.contradiction ?? 0) >= 2) add("ask-for-help-earlier", 9, has("severe-constraint") ? "Your answers describe genuinely limited options; appropriate support may be more useful than another self-help system." : "Earlier support may reduce the load of finding the next useful step alone.");

  if (scores["automatic-future-money"] === undefined && has("automation-fit") && !constrained) add("automatic-future-money", 4, "Your answer indicates that a flexible automatic rule could fit your preferred decision style.");
  if (scores["fun-money-pot"] === undefined && dim("present-enjoyment") && !constrained) add("fun-money-pot", 3, "A clearly intended enjoyment category can protect something your answers say matters.");
  if (scores["one-visible-goal"] === undefined && dim("future-orientation")) add("one-visible-goal", 3, "One visible goal can support an already meaningful future orientation.");
  if (scores["fixed-cost-separation"] === undefined && dim("planning-structure")) add("fixed-cost-separation", 2, "A light separation may reinforce the structure you already use without adding a complex system.");

  const ranked = moneyInterventions.flatMap((intervention) => {
    const match = scores[intervention.id];
    return match ? [{ ...intervention, priority: match.score, fitReason: match.reason }] : [];
  }).sort((a, b) => b.priority - a.priority || (a.effort === "low" ? -1 : 1));
  const chosen = ranked.slice(0, 5);
  if (chosen.length >= 3 && chosen.some(({ effort }) => effort === "low")) return chosen;
  const low = ranked.find((item) => item.effort === "low" && !chosen.some(({ id }) => id === item.id));
  if (low) chosen.push(low);
  return chosen.slice(0, 5);
}

function strengthStatements(dimensions: readonly MoneyDimensionResult[]): readonly string[] {
  const copy: Partial<Record<MoneyDimensionId, string>> = {
    "security-orientation": "You notice what protects stability and future resilience.",
    "freedom-orientation": "You keep options and autonomy visible in money decisions.",
    "present-enjoyment": "You let money serve life in the present.",
    "future-orientation": "You connect current choices with future needs and possibilities.",
    "planning-structure": "You can create useful overview and repeatable structure.",
    "control-need": "You notice uncertainty early and seek clarity.",
    "risk-comfort": "You can make decisions without requiring complete certainty.",
    "financial-self-efficacy": "You tend to see a meaningful next step when change is needed.",
  };
  return dimensions.filter(({ supported, dimension }) => supported && copy[dimension.id]).sort((a, b) => b.net - a.net).slice(0, 4).map(({ dimension }) => copy[dimension.id]!);
}

function blindSpotStatements(frictions: ReadonlySet<string>): readonly string[] {
  const items: [string, string][] = [
    ["control-overload", "Watch for checking that consumes attention without creating more security."],
    ["avoidance", "Distance can reduce stress now while allowing uncertainty to grow later."],
    ["purchase-regret", "Notice when a fast decision produces less durable enjoyment than expected."],
    ["over-restriction", "Future protection can become costly when reasonable present use repeatedly feels unsafe."],
    ["consistency-gap", "An intention can matter deeply and still need a structure that survives ordinary life."],
    ["goal-loses-relevance", "A distant goal may lose influence when it stays abstract."],
    ["overwhelm", "Several decisions at once may reduce access to the skills you normally have."],
    ["unexpected-costs", "Unexpected necessary costs may disrupt the structure more than ordinary spending does."],
  ];
  return items.filter(([id]) => frictions.has(id)).slice(0, 3).map(([, text]) => text);
}

function triggerStatements(answers: MoneyAnswerSet): readonly string[] {
  const { frictions, stress } = optionSignals(answers);
  const triggers: string[] = [];
  if (frictions.has("unexpected-costs")) triggers.push("An unexpected necessary cost");
  if (frictions.has("overwhelm") || stress.freeze > 0) triggers.push("Several financial decisions arriving at once");
  if (frictions.has("purchase-regret") || frictions.has("stress-spending")) triggers.push("An unplanned want during a stressful moment");
  if (frictions.has("avoidance")) triggers.push("Financial admin or information that may feel uncomfortable");
  if (frictions.has("abstract-future")) triggers.push("A large, distant goal without visible progress");
  if (frictions.has("control-overload")) triggers.push("A loss of overview or rising uncertainty");
  return [...new Set(triggers)].slice(0, 4);
}

export function deriveMoneyProfile(answers: MoneyAnswerSet, calibration: MoneyCalibration = {}): MoneyProfileResult {
  const cleanAnswers = reconcileMoneyAnswers(answers);
  const dimensions = deriveMoneyDimensions(cleanAnswers);
  const signals = optionSignals(cleanAnswers);
  const stress = deriveStressProfile(cleanAnswers);
  const candidates = profileCandidates(cleanAnswers, calibration);
  const eligible = candidates.filter((candidate) => candidate.eligible);
  const primaryCandidate = eligible[0] ?? null;
  const secondaryCandidate = eligible[1] && eligible[0] && eligible[0].score - eligible[1].score <= 3.25 ? eligible[1] : null;
  const contextCount = signals.selected.filter(({ option }) => option.tags?.includes("context-dependent")).length;
  const confidenceMode = !primaryCandidate
    ? (contextCount >= 2 ? "context-dependent" : "money-map")
    : secondaryCandidate
      ? "mixed-profile"
      : contextCount >= 3
        ? "context-dependent"
        : "clear-pattern";
  const meanings = [...signals.meanings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 4).map(([id, score]) => ({ id, label: moneyMeaningLabels[id], score }));
  const tensions = deriveTensions(cleanAnswers, dimensions);
  const interventions = matchInterventions(cleanAnswers, dimensions, candidates, stress);
  const strengths = strengthStatements(dimensions);
  const blindSpots = blindSpotStatements(signals.frictions);
  const triggers = triggerStatements(cleanAnswers);
  const primary = primaryCandidate?.family ?? null;
  const secondary = secondaryCandidate?.family ?? null;
  const topDimensions = dimensions.filter(({ supported }) => supported).sort((a, b) => b.net - a.net).slice(0, 3).map(({ dimension }) => dimension.label);
  const baselineHeadline = primary
    ? secondary ? `${primary.label} × ${secondary.label}` : primary.label
    : confidenceMode === "context-dependent" ? "A context-dependent Money Map" : "A mixed Money Map";
  const baselineDescription = primary
    ? `${primary.strength} ${secondary ? `${secondary.strength} ` : ""}${primary.helpfulDirection}`
    : `Your answers are better explained by a combination of ${topDimensions.join(", ") || "several situational patterns"} than by one profile family.`;
  const stressDescription = stress.primary
    ? `When pressure rises, ${moneyStressResponseLabels[stress.primary].toLowerCase()} becomes more available${stress.secondary ? `, with ${moneyStressResponseLabels[stress.secondary].toLowerCase()} as a secondary response` : ""}. This describes a shift under stress, not a permanent identity.`
    : "No single stress response clearly dominated. Your response may depend more on the situation than on one repeated pattern.";
  const experiment = interventions[0]?.id === "purchase-pause"
    ? "For one week, notice each unplanned purchase without trying to stop it. The next day, notice whether you still feel good about it."
    : interventions[0]?.id === "ten-minute-money-check"
      ? "Try one planned, bounded money check. Notice whether stopping after the chosen window creates more clarity than checking whenever stress asks you to."
      : interventions[0]?.id === "fun-money-pot" || interventions[0]?.id === "permission-to-spend"
        ? "Use a user-chosen, genuinely available category intentionally for enjoyment and notice whether guilt appears."
        : "Choose one small structure from this map for a week. Notice what becomes easier, what creates resistance and what stays unchanged.";
  const nextSteps = interventions.slice(0, 5).map(({ concept }) => concept);
  if (nextSteps.length < 3 && meanings[0]) nextSteps.push(`For one week, notice which money decisions make ${meanings[0].label.toLowerCase()} most visible.`);
  if (nextSteps.length < 3 && topDimensions[0]) nextSteps.push(`Notice one situation where ${topDimensions[0]} helps and one where it creates a trade-off.`);
  if (nextSteps.length < 3) nextSteps.push("Notice one money decision this week and record what mattered most in the moment.");
  const firstStep = nextSteps[0] ?? "Notice one money decision this week and record what mattered most in the moment.";
  const watchFor = blindSpots.length ? blindSpots : ["No repeated problem was strongly supported. Keep testing the map instead of inventing something to fix."];
  const atMyBest = strengths[0] ?? "You adapt your money decisions to the context rather than following one rigid pattern.";

  return {
    version: 1,
    confidenceMode,
    primaryProfile: primary,
    secondaryProfile: secondary,
    dimensions,
    meanings,
    baseline: { headline: baselineHeadline, description: baselineDescription },
    stress: { ...stress, description: stressDescription },
    tensions,
    strengths,
    blindSpots,
    triggers,
    interventions,
    nextSteps,
    experiment,
    playbook: {
      atMyBest,
      underStress: stressDescription,
      watchFor,
      whatHelps: interventions.slice(0, 4).map(({ label, fitReason }) => `${label}: ${fitReason}`),
      myNextMove: firstStep,
    },
    frictionIds: [...signals.frictions],
    calibrationHypotheses: generateMoneyCalibrationHypotheses(cleanAnswers),
  };
}

export function moneyEngineHasFiniteOutput(result: MoneyProfileResult): boolean {
  return result.dimensions.every(({ support, contradiction, net }) => [support, contradiction, net].every(Number.isFinite))
    && result.nextSteps.every(Boolean)
    && Boolean(result.baseline.headline && result.baseline.description && result.stress.description);
}

export function moneyDimensionResult(result: MoneyProfileResult, id: MoneyDimensionId): MoneyDimensionResult {
  const found = result.dimensions.find(({ dimension }) => dimension.id === id);
  if (!found) throw new Error(`Unknown Money Dimension: ${id}`);
  return found;
}

export function moneyProfileCandidateFor(answers: MoneyAnswerSet, id: MoneyProfileFamilyId): MoneyProfileCandidate {
  const found = profileCandidates(answers).find(({ family }) => family.id === id);
  if (!found) throw new Error(`Unknown Money Profile family: ${id}`);
  return found;
}

export function moneyDimensionDefinition(id: MoneyDimensionId) {
  const found = moneyDimensionById.get(id);
  if (!found) throw new Error(`Unknown Money Dimension: ${id}`);
  return found;
}
