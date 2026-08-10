import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  careerConstraintIds,
  careerDirections,
  careerJobTitles,
  careerQuestions,
  careerSections,
  careerSignalIds,
} from "../data/find-your-next-step-career";
import {
  buildCareerResult,
  buildCareerNextStep,
  buildCareerSummary,
  calculateCareerDirectionEvaluations,
  calculateCareerQuestionCapacity,
  CAREER_ADDITIONAL_THRESHOLD,
  CAREER_ADDITIONAL_JOB_LIMIT,
  CAREER_HYBRID_JOB_LIMIT,
  CAREER_JOB_RESULT_LIMIT,
  CAREER_PRIMARY_THRESHOLD,
  CAREER_WEAK_JOB_RESULT_LIMIT,
  careerJourneyReducer,
  enumerateValidCareerSelections,
  formatCareerSelectionCount,
  initialCareerState,
  normalizeCareerJobTerm,
  selectCareerJobDefinitions,
  validateCareerData,
} from "../lib/find-your-next-step-career";
import type {
  CareerAnswers,
  CareerDirectionId,
  CareerNextStepMode,
  CareerQuestion,
  CareerSignalId,
} from "../types/find-your-next-step";

function specialSelection(question: CareerQuestion): readonly string[] | null {
  if (question.purpose === "constraints") return ["constraint-none"];
  if (question.purpose === "qualification") return ["qualification-open"];
  if (question.purpose === "next-step") return ["explore-role-comparison"];
  return null;
}

function createProfileAnswers(
  directionIds: readonly CareerDirectionId[],
  overrides: Readonly<Record<string, readonly string[]>> = {},
): CareerAnswers {
  const targetDirections = careerDirections.filter(({ id }) => directionIds.includes(id));
  const profileWeights = new Map<CareerSignalId, number>();
  for (const direction of targetDirections) {
    for (const profileSignal of direction.profile) {
      profileWeights.set(profileSignal.signalId, (profileWeights.get(profileSignal.signalId) ?? 0) + profileSignal.weight);
    }
  }

  return Object.fromEntries(careerQuestions.map((question) => {
    if (overrides[question.id]) return [question.id, overrides[question.id]];
    const special = specialSelection(question);
    if (special) return [question.id, special];

    const selections = enumerateValidCareerSelections(question).map((selection) => ({
      selection,
      contribution: selection.reduce((selectionTotal, optionId) => {
        const option = question.options.find(({ id }) => id === optionId);
        return selectionTotal + (option?.signals ?? []).reduce(
          (optionTotal, signal) => optionTotal + signal.weight * (profileWeights.get(signal.id) ?? 0),
          0,
        );
      }, 0),
    }));
    selections.sort((left, right) =>
      right.contribution - left.contribution
      || left.selection.join("|").localeCompare(right.selection.join("|"), "de-DE"),
    );
    return [question.id, selections[0].selection];
  }));
}

const weakGeneralistAnswers: CareerAnswers = {
  "attraction-outcomes": ["outcome-relationship", "outcome-insight", "outcome-flow"],
  "attraction-problems": ["problem-broken", "problem-direction"],
  "attraction-mini-projects": ["mini-story", "mini-build"],
  "activities-more-often": ["activity-develop", "activity-connect", "activity-research", "activity-improve"],
  "activities-new-initiative": ["contribution-story", "contribution-delivery"],
  "activities-when-stuck": ["stuck-listen"],
  "workstyle-route": ["route-deep-focus"],
  "workstyle-contact-rhythm": ["contact-contextual"],
  "workstyle-sustainable-rhythm": ["rhythm-predictable", "rhythm-depth"],
  "reality-constraints": ["constraint-none"],
  "reality-qualification": ["qualification-open"],
  "reality-transition-priorities": ["preference-stability", "preference-creativity"],
  "development-growth": ["growth-people", "growth-leadership"],
  "development-exploration-mode": ["explore-role-comparison"],
};

function visibleDirectionIds(answers: CareerAnswers): readonly CareerDirectionId[] {
  const built = buildCareerResult(answers);
  assert.equal(built.status, "complete");
  if (built.status !== "complete") return [];
  return [...built.result.primaryDirections, ...built.result.additionalDirections].map(({ id }) => id);
}

function completeCareerResult(answers: CareerAnswers) {
  const built = buildCareerResult(answers);
  if (built.status !== "complete") throw new Error(`Expected complete result, missing: ${built.missingQuestionIds.join(", ")}`);
  return built.result;
}

function collectObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (!value || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectObjectKeys(item, keys);
    return keys;
  }
  for (const [key, item] of Object.entries(value)) {
    keys.add(key);
    collectObjectKeys(item, keys);
  }
  return keys;
}

test("Career v1 defines exactly five sections and fourteen valid interactions", () => {
  assert.deepEqual(validateCareerData(), []);
  assert.equal(careerSections.length, 5);
  assert.equal(careerQuestions.length, 14);
  assert.deepEqual(
    careerSections.map((section) => careerQuestions.filter(({ sectionId }) => sectionId === section.id).length),
    [3, 3, 3, 3, 2],
  );
  assert.equal(new Set(careerQuestions.map(({ id }) => id)).size, careerQuestions.length);
  const allOptions = careerQuestions.flatMap(({ options }) => options);
  assert.equal(new Set(allOptions.map(({ id }) => id)).size, allOptions.length);
  assert.equal(new Set(careerDirections.map(({ id }) => id)).size, 9);
  assert.equal(new Set(careerSignalIds).size, careerSignalIds.length);
  assert.equal(new Set(careerConstraintIds).size, careerConstraintIds.length);

  for (const question of careerQuestions) {
    assert.ok(question.prompt.trim());
    assert.ok(question.minSelections >= 1);
    assert.ok(question.minSelections <= question.maxSelections);
    assert.ok(question.maxSelections <= question.options.length);
    if (question.format === "single") assert.deepEqual([question.minSelections, question.maxSelections], [1, 1]);
    for (const option of question.options) {
      assert.ok(option.label.trim());
      assert.equal("direction" in option, false, option.id);
      assert.equal("directionId" in option, false, option.id);
      assert.equal("directions" in option, false, option.id);
      for (const signal of option.signals ?? []) assert.equal(careerSignalIds.includes(signal.id), true, `${option.id}:${signal.id}`);
      for (const constraint of option.constraints ?? []) assert.equal(careerConstraintIds.includes(constraint), true, `${option.id}:${constraint}`);
    }
  }
});

test("job title data is unique, searchable, balanced, and free of suitability language", () => {
  assert.equal(careerJobTitles.length, 66);
  assert.equal(new Set(careerJobTitles.map(({ id }) => id)).size, careerJobTitles.length);
  const canonicalTerms = careerJobTitles.map(({ title }) => normalizeCareerJobTerm(title));
  const canonicalSet = new Set(canonicalTerms);
  assert.equal(canonicalSet.size, careerJobTitles.length);
  const directionIds = new Set(careerDirections.map(({ id }) => id));
  const aliases = new Set<string>();

  for (const job of careerJobTitles) {
    assert.ok(job.title.trim(), job.id);
    assert.ok(job.description.trim(), job.id);
    assert.ok(job.directionIds.length >= 1, job.id);
    assert.equal(new Set(job.directionIds).size, job.directionIds.length, job.id);
    for (const directionId of job.directionIds) assert.equal(directionIds.has(directionId), true, `${job.id}:${directionId}`);
    if (job.hybridDirectionIds) {
      assert.equal(new Set(job.hybridDirectionIds).size, 2, job.id);
      for (const directionId of job.hybridDirectionIds) {
        assert.equal(directionIds.has(directionId), true, `${job.id}:${directionId}`);
        assert.equal(job.directionIds.includes(directionId), true, `${job.id}:${directionId}`);
      }
    }
    assert.ok((job.aliases?.length ?? 0) <= 4, job.id);
    const localAliases = new Set<string>();
    for (const alias of job.aliases ?? []) {
      const normalized = normalizeCareerJobTerm(alias);
      assert.ok(normalized, job.id);
      assert.notEqual(normalized, normalizeCareerJobTerm(job.title), `${job.id}:${alias}`);
      assert.equal(canonicalSet.has(normalized), false, `${job.id}:${alias}`);
      assert.equal(localAliases.has(normalized), false, `${job.id}:${alias}`);
      assert.equal(aliases.has(normalized), false, `${job.id}:${alias}`);
      localAliases.add(normalized);
      aliases.add(normalized);
    }
  }

  const coverage = careerDirections.map((direction) =>
    careerJobTitles.filter(({ directionIds: jobDirectionIds }) => jobDirectionIds.includes(direction.id)).length,
  );
  assert.ok(Math.min(...coverage) >= 8);
  assert.ok(Math.max(...coverage) <= 12);
  assert.ok(Math.max(...coverage) - Math.min(...coverage) <= 4);
  const serialized = JSON.stringify(careerJobTitles);
  assert.equal(/\bArzt|Psychotherapeut|Rechtsanwalt\b/iu.test(serialized), false);
  assert.equal(/\b(score|ranking|match|prozent|geeignet|ungeeignet|perfekte jobs?|beste jobs?|top jobs?)\b|%/iu.test(serialized), false);
});

test("hybrid job data uses only the curated combinations", () => {
  const combinations = [...new Set(careerJobTitles.flatMap((job) => job.hybridDirectionIds
    ? [[...job.hybridDirectionIds].sort().join("+")]
    : [],
  ))].sort();
  assert.deepEqual(combinations, [
    "analysis-clarity+operations-improvement",
    "analysis-clarity+product-experience",
    "content-communication+develop-people",
    "develop-people+operations-improvement",
    "develop-people+relationships-influence",
    "initiative-leadership+operations-improvement",
    "initiative-leadership+relationships-influence",
    "operations-improvement+technical-practical",
    "product-experience+research-understanding",
    "product-experience+technical-practical",
    "content-communication+product-experience",
  ].sort());
});

test("all nine directions are equal-status activity spaces with balanced structural coverage", () => {
  assert.deepEqual(careerDirections.map(({ title }) => title), [
    "Menschen begleiten & entwickeln",
    "Beziehungen aufbauen & überzeugen",
    "Informationen analysieren & Entscheidungen klären",
    "Neues erforschen & verstehen",
    "Inhalte gestalten & vermitteln",
    "Produkte & Erlebnisse entwickeln",
    "Technische oder praktische Lösungen bauen",
    "Abläufe organisieren & verbessern",
    "Initiativen führen & Verantwortung tragen",
  ]);
  const coverage = careerDirections.map((direction) => careerQuestions.filter((question) =>
    question.matchingWeight > 0 && calculateCareerQuestionCapacity(question, direction) > 0,
  ).length);
  assert.ok(Math.min(...coverage) >= 8);
  assert.ok(Math.max(...coverage) - Math.min(...coverage) <= 3);
  for (const direction of careerDirections) {
    assert.ok(direction.coreActivitySignals.length >= 1);
    assert.ok(direction.fields.length >= 4);
    assert.ok(direction.environments.length >= 3);
    assert.ok(direction.rationale.trim());
    for (const profileSignal of direction.profile) assert.ok(profileSignal.weight === 1 || profileSignal.weight === 2);
  }
  assert.match(careerDirections.at(-1)?.rationale ?? "", /keine höhere Karrierestufe/iu);
});

test("question capacities equal brute-force maxima for every direction", () => {
  for (const question of careerQuestions) {
    const validSelections = enumerateValidCareerSelections(question);
    assert.ok(validSelections.length > 0, question.id);
    for (const direction of careerDirections) {
      const profileWeights = new Map(direction.profile.map(({ signalId, weight }) => [signalId, weight]));
      const bruteForce = question.matchingWeight === 0 ? 0 : Math.max(...validSelections.map((selection) =>
        selection.reduce((selectionTotal, optionId) => {
          const option = question.options.find(({ id }) => id === optionId);
          return selectionTotal + (option?.signals ?? []).reduce(
            (optionTotal, signal) => optionTotal + signal.weight * (profileWeights.get(signal.id) ?? 0),
            0,
          );
        }, 0),
      ));
      assert.equal(calculateCareerQuestionCapacity(question, direction), bruteForce, `${question.id}:${direction.id}`);
    }
  }
});

test("matching thresholds are fixed after canonical, mixed, broad, and weak calibration", () => {
  assert.equal(CAREER_PRIMARY_THRESHOLD, 0.5);
  assert.equal(CAREER_ADDITIONAL_THRESHOLD, 0.3);
  assert.ok(CAREER_PRIMARY_THRESHOLD > CAREER_ADDITIONAL_THRESHOLD);

  for (const direction of careerDirections) {
    const answers = createProfileAnswers([direction.id]);
    const evaluations = calculateCareerDirectionEvaluations(answers);
    assert.equal(evaluations[0].directionId, direction.id);
    assert.ok(evaluations[0].score >= CAREER_PRIMARY_THRESHOLD, direction.id);
    const built = buildCareerResult(answers);
    assert.equal(built.status, "complete");
    if (built.status === "complete") assert.equal(built.result.primaryDirections.some(({ id }) => id === direction.id), true, direction.id);
  }

  const weakEvaluations = calculateCareerDirectionEvaluations(weakGeneralistAnswers);
  assert.ok(weakEvaluations[0].score < CAREER_PRIMARY_THRESHOLD);
  assert.ok(weakEvaluations[0].score >= CAREER_ADDITIONAL_THRESHOLD);
  const weak = buildCareerResult(weakGeneralistAnswers);
  assert.equal(weak.status, "complete");
  if (weak.status === "complete") {
    assert.equal(weak.result.primaryDirections.length, 0);
    assert.ok(weak.result.additionalDirections.length > 0);
    assert.ok(weak.result.additionalDirections.length <= 3);
  }
});

test("canonical and realistic multi-interest profiles keep their intended directions reachable", () => {
  const scenarios: readonly (readonly CareerDirectionId[])[] = [
    ["develop-people", "content-communication"],
    ["analysis-clarity", "product-experience"],
    ["relationships-influence", "initiative-leadership"],
    ["research-understanding", "technical-practical"],
  ];
  for (const targetDirections of scenarios) {
    const answers = createProfileAnswers(targetDirections);
    const visible = visibleDirectionIds(answers);
    for (const target of targetDirections) assert.equal(visible.includes(target), true, `${targetDirections.join("+")}:${target}`);
  }

  const broad = createProfileAnswers(careerDirections.map(({ id }) => id));
  const broadResult = buildCareerResult(broad);
  assert.equal(broadResult.status, "complete");
  if (broadResult.status === "complete") {
    assert.ok(broadResult.result.primaryDirections.length <= 3);
    assert.ok(broadResult.result.additionalDirections.length <= 3);
    assert.ok(broadResult.result.primaryDirections.length + broadResult.result.additionalDirections.length < careerDirections.length);
  }
});

test("matching is deterministic, bounded, positive, and never random", () => {
  const answers = createProfileAnswers(["analysis-clarity", "product-experience"]);
  const first = calculateCareerDirectionEvaluations(answers);
  const second = calculateCareerDirectionEvaluations(answers);
  assert.deepEqual(first, second);
  assert.deepEqual(buildCareerResult(answers), buildCareerResult(answers));
  for (const evaluation of first) {
    assert.ok(evaluation.score >= 0);
    assert.ok(evaluation.score <= 1);
  }
  const engine = readFileSync(new URL("../lib/find-your-next-step-career.ts", import.meta.url), "utf8");
  assert.equal(engine.includes("Math.random"), false);
  assert.equal(engine.includes("weight: -"), false);
});

test("job selection is deterministic, bounded, and never adds filler", () => {
  assert.equal(CAREER_JOB_RESULT_LIMIT, 8);
  assert.equal(CAREER_WEAK_JOB_RESULT_LIMIT, 4);
  assert.equal(CAREER_ADDITIONAL_JOB_LIMIT, 2);
  assert.equal(CAREER_HYBRID_JOB_LIMIT, 3);

  const primaryIds: CareerDirectionId[] = ["develop-people", "analysis-clarity", "technical-practical"];
  const additionalIds: CareerDirectionId[] = ["research-understanding", "operations-improvement"];
  const first = selectCareerJobDefinitions(primaryIds, additionalIds);
  const second = selectCareerJobDefinitions(primaryIds, additionalIds);
  assert.deepEqual(first.map(({ id }) => id), second.map(({ id }) => id));
  assert.ok(first.length <= CAREER_JOB_RESULT_LIMIT);
  assert.equal(new Set(first.map(({ id }) => id)).size, first.length);
  for (const job of first) {
    assert.equal(job.directionIds.some((id) => primaryIds.includes(id) || additionalIds.includes(id)), true, job.id);
  }

  const weak = selectCareerJobDefinitions([], ["analysis-clarity", "technical-practical"]);
  assert.ok(weak.length <= CAREER_WEAK_JOB_RESULT_LIMIT);
  assert.equal(weak[0].directionIds.includes("analysis-clarity"), true);
  assert.equal(weak[1].directionIds.includes("technical-practical"), true);
  assert.deepEqual(selectCareerJobDefinitions([], []), []);
});

test("primary-primary hybrids lead but stay capped and primary-additional never gets hybrid priority", () => {
  const primaryPair: CareerDirectionId[] = ["develop-people", "content-communication"];
  const selected = selectCareerJobDefinitions(primaryPair, []);
  assert.deepEqual(selected.slice(0, 3).map(({ id }) => id), [
    "employer-branding-manager",
    "learning-content-designer",
    "talent-marketing-manager",
  ]);
  const qualifiedHybrids = selected.filter((job) =>
    job.hybridDirectionIds?.every((directionId) => primaryPair.includes(directionId)),
  );
  assert.ok(qualifiedHybrids.length <= CAREER_HYBRID_JOB_LIMIT);

  const primaryAdditional = selectCareerJobDefinitions(["develop-people"], ["content-communication"]);
  assert.equal(primaryAdditional.slice(0, 3).some((job) =>
    job.hybridDirectionIds?.includes("develop-people") && job.hybridDirectionIds.includes("content-communication"),
  ), false);
  assert.ok(primaryAdditional.slice(0, 6).every((job) => job.directionIds.includes("develop-people")));
});

test("round-robin gives every primary a turn before repetition and keeps additional roles secondary", () => {
  const primaryIds: CareerDirectionId[] = ["develop-people", "analysis-clarity", "technical-practical"];
  const additionalIds: CareerDirectionId[] = ["research-understanding", "operations-improvement"];
  const selected = selectCareerJobDefinitions(primaryIds, additionalIds);
  assert.equal(selected[0].directionIds.includes(primaryIds[0]), true);
  assert.equal(selected[1].directionIds.includes(primaryIds[1]), true);
  assert.equal(selected[2].directionIds.includes(primaryIds[2]), true);
  const primarySupported = selected.filter((job) => job.directionIds.some((id) => primaryIds.includes(id)));
  const additionalOnly = selected.filter((job) =>
    job.directionIds.some((id) => additionalIds.includes(id))
    && !job.directionIds.some((id) => primaryIds.includes(id)),
  );
  assert.ok(primarySupported.length > additionalOnly.length);
  assert.ok(additionalOnly.length <= CAREER_ADDITIONAL_JOB_LIMIT);
  assert.equal(new Set(selected.map(({ id }) => id)).size, selected.length);

  const shared = selectCareerJobDefinitions(["research-understanding"], ["analysis-clarity"]);
  assert.equal(shared.filter(({ id }) => id === "customer-insights-analyst").length, 1);
});

test("constraints and qualification never change score, order, tier, or visibility", () => {
  const baseline = createProfileAnswers(["relationships-influence", "initiative-leadership"]);
  const constrained = createProfileAnswers(["relationships-influence", "initiative-leadership"], {
    "reality-constraints": ["constraint-travel", "constraint-hours", "constraint-income"],
  });
  const qualificationLimited = createProfileAnswers(["relationships-influence", "initiative-leadership"], {
    "reality-qualification": ["qualification-short"],
  });
  const differentNextStep = createProfileAnswers(["relationships-influence", "initiative-leadership"], {
    "development-exploration-mode": ["explore-observation"],
  });
  assert.deepEqual(calculateCareerDirectionEvaluations(constrained), calculateCareerDirectionEvaluations(baseline));
  assert.deepEqual(calculateCareerDirectionEvaluations(qualificationLimited), calculateCareerDirectionEvaluations(baseline));

  const resultShape = (answers: CareerAnswers) => {
    const built = buildCareerResult(answers);
    assert.equal(built.status, "complete");
    if (built.status !== "complete") return null;
    return {
      primary: built.result.primaryDirections.map(({ id }) => id),
      additional: built.result.additionalDirections.map(({ id }) => id),
      jobs: built.result.jobTitles.map(({ id }) => id),
    };
  };
  assert.deepEqual(resultShape(constrained), resultShape(baseline));
  assert.deepEqual(resultShape(qualificationLimited), resultShape(baseline));
  assert.deepEqual(resultShape(differentNextStep), resultShape(baseline));
});

test("core activity and relevance thresholds are both required and no filler direction appears", () => {
  const answers = createProfileAnswers(["develop-people"]);
  const evaluations = calculateCareerDirectionEvaluations(answers);
  const product = evaluations.find(({ directionId }) => directionId === "product-experience");
  assert.ok(product);
  assert.equal(product?.coreActivityQuestionCount, 0);
  assert.ok((product?.score ?? 0) >= CAREER_ADDITIONAL_THRESHOLD);
  assert.equal(visibleDirectionIds(answers).includes("product-experience"), false);

  const weak = buildCareerResult(weakGeneralistAnswers);
  assert.equal(weak.status, "complete");
  if (weak.status !== "complete") return;
  assert.equal(weak.result.primaryDirections.length, 0);
  assert.ok(weak.result.additionalDirections.length < 6);
  for (const direction of weak.result.additionalDirections) {
    const evaluation = calculateCareerDirectionEvaluations(weakGeneralistAnswers).find(({ directionId }) => directionId === direction.id);
    assert.ok((evaluation?.score ?? 0) >= CAREER_ADDITIONAL_THRESHOLD);
    assert.ok((evaluation?.coreActivityQuestionCount ?? 0) >= 1);
  }
});

test("incomplete or invalid answers never produce a finished Career Map", () => {
  assert.equal(buildCareerResult({}).status, "incomplete");
  const complete = createProfileAnswers(["analysis-clarity"]);
  const incomplete = Object.fromEntries(Object.entries(complete).filter(([questionId]) => questionId !== careerQuestions[0].id));
  assert.equal(buildCareerResult(incomplete).status, "incomplete");
  assert.equal(buildCareerResult({ ...complete, [careerQuestions[0].id]: ["unknown-option"] }).status, "incomplete");
  assert.equal(buildCareerResult({ ...complete, [careerQuestions[0].id]: [complete[careerQuestions[0].id][0]] }).status, "incomplete");
});

test("result directions are bounded, qualitative, evidence-backed, and score-free", () => {
  const answers = createProfileAnswers(["analysis-clarity", "product-experience"]);
  const built = buildCareerResult(answers);
  assert.equal(built.status, "complete");
  if (built.status !== "complete") return;
  assert.ok(built.result.primaryDirections.length <= 3);
  assert.ok(built.result.additionalDirections.length <= 3);
  const serialized = JSON.stringify(built.result);
  assert.equal(serialized.includes("%"), false);
  assert.equal(/\bscore\b|\branking\b|platz 1|perfekte passung|geeignet|ungeeignet|persönlichkeitstyp|archetyp/iu.test(serialized), false);
  assert.equal(/ADHS|Autismus|Depression|Trauma|Burnout|Neurodivergenz|Persönlichkeitsstörung/iu.test(serialized), false);
  const prohibitedKeys = new Set(["score", "rank", "ranking", "ratio", "maximum", "points", "percentage"]);
  for (const key of collectObjectKeys(built.result)) assert.equal(prohibitedKeys.has(key), false, key);

  const visible = [...built.result.primaryDirections, ...built.result.additionalDirections];
  for (const direction of visible) {
    assert.ok(direction.evidence.length >= 1, direction.id);
    assert.ok(direction.evidence.length <= 4, direction.id);
    assert.ok(direction.fields.length >= 4, direction.id);
    assert.ok(direction.environments.length >= 3, direction.id);
    assert.ok(direction.why.trim(), direction.id);
    assert.equal(new Set(direction.evidence.map(({ questionId }) => questionId)).size, direction.evidence.length, direction.id);
    for (const evidence of direction.evidence) {
      assert.equal(answers[evidence.questionId]?.includes(evidence.optionId), true, `${direction.id}:${evidence.optionId}`);
      const question = careerQuestions.find(({ id }) => id === evidence.questionId);
      assert.ok(question?.options.some(({ id, label }) => id === evidence.optionId && label === evidence.answer));
    }
  }
});

test("result job titles connect only to visible directions and contain no hidden ordering signals", () => {
  const result = completeCareerResult(createProfileAnswers(["analysis-clarity", "product-experience"]));
  const visibleDirections = [...result.primaryDirections, ...result.additionalDirections];
  const visibleIds = new Set(visibleDirections.map(({ id }) => id));
  const visibleTitles = new Set(visibleDirections.map(({ title }) => title));
  assert.ok(result.jobTitles.length > 0);
  assert.ok(result.jobTitles.length <= CAREER_JOB_RESULT_LIMIT);

  const usedTerms = new Set<string>();
  for (const job of result.jobTitles) {
    assert.ok(job.title.trim(), job.id);
    assert.ok(job.description.trim(), job.id);
    assert.ok(job.why.trim(), job.id);
    assert.ok(job.directions.length >= 1, job.id);
    for (const direction of job.directions) {
      assert.equal(visibleIds.has(direction.id), true, `${job.id}:${direction.id}`);
      assert.equal(visibleTitles.has(direction.title), true, `${job.id}:${direction.title}`);
    }
    for (const direction of careerDirections) {
      if (!visibleIds.has(direction.id)) assert.equal(job.why.includes(direction.title), false, `${job.id}:${direction.id}`);
    }
    for (const term of [job.title, ...job.aliases]) {
      const normalized = normalizeCareerJobTerm(term);
      assert.equal(usedTerms.has(normalized), false, `${job.id}:${term}`);
      usedTerms.add(normalized);
    }
  }

  const serialized = JSON.stringify(result.jobTitles);
  assert.equal(/\bscore\b|\branking\b|\bmatch(?:wert)?\b|platz\s*\d|top job|%/iu.test(serialized), false);
  const prohibitedKeys = new Set(["score", "rank", "ranking", "ratio", "maximum", "points", "percentage"]);
  for (const key of collectObjectKeys(result.jobTitles)) assert.equal(prohibitedKeys.has(key), false, key);
});

test("shared jobs appear once and explain only their visible non-hybrid directions", () => {
  const result = completeCareerResult(createProfileAnswers(["analysis-clarity", "research-understanding"]));
  const sharedJobs = result.jobTitles.filter(({ id }) => id === "customer-insights-analyst");
  assert.equal(sharedJobs.length, 1);
  assert.equal(new Set(result.jobTitles.map(({ id }) => id)).size, result.jobTitles.length);
  const shared = sharedJobs[0];
  assert.equal(shared.directions.length, 2);
  assert.match(shared.why, /berührt die sichtbaren Spuren/iu);
  for (const direction of shared.directions) assert.ok(shared.why.includes(direction.title));
});

test("job qualification and constraint notes are scoped and never influence selection", () => {
  const baseline = completeCareerResult(createProfileAnswers(["relationships-influence", "initiative-leadership"]));
  const scoped = completeCareerResult(createProfileAnswers(["relationships-influence", "initiative-leadership"], {
    "reality-constraints": ["constraint-travel"],
    "reality-qualification": ["qualification-short"],
  }));
  assert.deepEqual(scoped.jobTitles.map(({ id }) => id), baseline.jobTitles.map(({ id }) => id));
  assert.equal(baseline.jobTitles.every(({ constraintNotes }) => constraintNotes.length === 0), true);
  const businessDevelopment = scoped.jobTitles.find(({ id }) => id === "business-development-manager");
  assert.ok(businessDevelopment);
  assert.match(businessDevelopment?.qualificationNote ?? "", /kurzen Qualifizierungsrahmen/iu);
  assert.ok((businessDevelopment?.constraintNotes.length ?? 0) >= 1);
  for (const note of businessDevelopment?.constraintNotes ?? []) {
    assert.match(note, /Je nach|Einige Varianten|konkreten Stellen/iu);
    assert.equal(/passt nicht|ungeeignet|dir fehlt/iu.test(note), false);
  }
});

test("constraint notes are explicit, scoped to role variants, and never remove directions", () => {
  const withoutConstraint = createProfileAnswers(["relationships-influence"]);
  const withConstraint = createProfileAnswers(["relationships-influence"], {
    "reality-constraints": ["constraint-travel", "constraint-remote", "constraint-physical"],
  });
  const first = buildCareerResult(withoutConstraint);
  const second = buildCareerResult(withConstraint);
  assert.equal(first.status, "complete");
  assert.equal(second.status, "complete");
  if (first.status !== "complete" || second.status !== "complete") return;
  assert.deepEqual(
    [...second.result.primaryDirections, ...second.result.additionalDirections].map(({ id }) => id),
    [...first.result.primaryDirections, ...first.result.additionalDirections].map(({ id }) => id),
  );
  const relationship = [...second.result.primaryDirections, ...second.result.additionalDirections].find(({ id }) => id === "relationships-influence");
  assert.ok(relationship?.constraintNotes.some((note) => /Einige Sales-, Partnership- oder Beratungsrollen/iu.test(note)));
  assert.equal((relationship?.constraintNotes ?? []).some((note) => /passt nicht|ungeeignet|ganze Richtung/iu.test(note)), false);
  assert.ok(second.result.conditions.some(({ kind }) => kind === "constraint"));
});

test("qualification scope only reorders fields and adds transparent notes", () => {
  const short = createProfileAnswers(["technical-practical"], { "reality-qualification": ["qualification-short"] });
  const formal = createProfileAnswers(["technical-practical"], { "reality-qualification": ["qualification-formal"] });
  const first = buildCareerResult(short);
  const second = buildCareerResult(formal);
  assert.equal(first.status, "complete");
  assert.equal(second.status, "complete");
  if (first.status !== "complete" || second.status !== "complete") return;
  assert.deepEqual(first.result.primaryDirections.map(({ id }) => id), second.result.primaryDirections.map(({ id }) => id));
  const firstDirection = [...first.result.primaryDirections, ...first.result.additionalDirections].find(({ id }) => id === "technical-practical");
  const secondDirection = [...second.result.primaryDirections, ...second.result.additionalDirections].find(({ id }) => id === "technical-practical");
  assert.ok(firstDirection?.qualificationNote?.includes("kurzen Qualifizierungsrahmen"));
  assert.ok(secondDirection?.qualificationNote?.includes("längere Qualifizierungswege"));
  assert.notDeepEqual(firstDirection?.fields, secondDirection?.fields);
  assert.equal(/\bArzt|Psychotherapeut|Rechtsanwalt\b/iu.test(careerDirections.flatMap(({ fields }) => fields.map(({ label }) => label)).join(" ")), false);
});

test("summary is evidence-based, bounded, non-typological, and defensive without strong signals", () => {
  const built = buildCareerResult(createProfileAnswers(["develop-people", "content-communication"], {
    "reality-constraints": ["constraint-income"],
  }));
  assert.equal(built.status, "complete");
  if (built.status !== "complete") return;
  assert.ok(built.result.summary.length >= 1);
  assert.ok(built.result.summary.length <= 3);
  assert.match(built.result.summary[0], /Deine Auswahl zieht dich/iu);
  assert.equal(/du bist|geboren|typ|talentiert|geeignet/iu.test(built.result.summary.join(" ")), false);
  assert.ok(built.result.summary.some((sentence) => /Einkommenskontinuität/iu.test(sentence)));

  const defensive = buildCareerSummary({});
  assert.deepEqual(defensive, ["Deine Auswahl öffnet mehrere berufliche Spuren, ohne dass ein einzelnes Tätigkeitsmuster klar dominiert."]);
});

test("tensions require explicit support, stay bounded, and avoid problem language", () => {
  const baseline = createProfileAnswers(["initiative-leadership"], {
    "workstyle-route": ["route-own-way"],
    "reality-transition-priorities": ["preference-ownership", "preference-stability"],
    "reality-constraints": ["constraint-income"],
  });
  const built = buildCareerResult(baseline);
  assert.equal(built.status, "complete");
  if (built.status !== "complete") return;
  assert.ok(built.result.tensions.length >= 1);
  assert.ok(built.result.tensions.length <= 2);
  for (const tension of built.result.tensions) {
    assert.match(tension.text, /gleichzeitig|beides/iu);
    assert.equal(/Problem|Widerspruch|Konflikt/iu.test(tension.text), false);
    assert.ok(tension.evidence.length >= 2);
    assert.ok(tension.evidence.length <= 3);
    for (const evidence of tension.evidence) assert.equal(baseline[evidence.questionId]?.includes(evidence.optionId), true);
  }

  const noSignals = createProfileAnswers(["analysis-clarity"], {
    "workstyle-route": ["route-checkpoints"],
    "workstyle-contact-rhythm": ["contact-mostly-focus"],
    "reality-transition-priorities": ["preference-stability", "preference-learning"],
  });
  const noSignalsResult = buildCareerResult(noSignals);
  assert.equal(noSignalsResult.status, "complete");
  if (noSignalsResult.status === "complete") {
    assert.equal(noSignalsResult.result.tensions.some(({ id }) => id === "people-focus"), false);
  }
});

test("next step follows only the selected exploration mode and supports comparison", () => {
  const modes: Readonly<Record<CareerNextStepMode, string>> = {
    conversation: "explore-conversation",
    "role-comparison": "explore-role-comparison",
    "mini-project": "explore-mini-project",
    "skill-test": "explore-skill",
    "work-observation": "explore-observation",
  };
  for (const [mode, optionId] of Object.entries(modes) as [CareerNextStepMode, string][]) {
    const answers = createProfileAnswers(["analysis-clarity", "product-experience"], {
      "development-exploration-mode": [optionId],
    });
    const built = buildCareerResult(answers);
    assert.equal(built.status, "complete");
    if (built.status !== "complete") continue;
    assert.equal(built.result.nextStep.mode, mode);
    assert.ok(built.result.nextStep.title.trim());
    assert.ok(built.result.nextStep.text.trim());
    assert.equal(/automatisch|bewerben|bewerbung absenden/iu.test(`${built.result.nextStep.title} ${built.result.nextStep.text}`), false);
    const mentionsConcreteTitle = built.result.jobTitles.some(({ title }) => built.result.nextStep.text.includes(`„${title}“`));
    if (mode === "role-comparison" || mode === "conversation" || mode === "work-observation") {
      assert.equal(mentionsConcreteTitle, true, mode);
    } else {
      assert.equal(mentionsConcreteTitle, false, mode);
      assert.match(built.result.nextStep.text, /Mini-Experiment|praktische Aufgabe|Skill/iu);
    }
  }
  const comparison = buildCareerResult(createProfileAnswers(["analysis-clarity", "product-experience"]));
  assert.equal(comparison.status, "complete");
  if (comparison.status === "complete") assert.match(comparison.result.nextStep.text, /sechs Stellenanzeigen/iu);

  const fallbackAnswers = createProfileAnswers(["analysis-clarity"], {
    "development-exploration-mode": ["explore-role-comparison"],
  });
  assert.deepEqual(buildCareerNextStep(fallbackAnswers, [], []), {
    mode: "role-comparison",
    title: "Vergleiche Aufgaben statt Titel",
    text: "Vergleiche sechs unterschiedliche Stellenanzeigen und markiere ausschließlich wiederkehrende Tätigkeiten, Bedingungen und Zugangsvoraussetzungen.",
  });
});

test("selection counter stays neutral across all supported formats", () => {
  assert.equal(formatCareerSelectionCount(0, 3), "0 von 3 ausgewählt");
  assert.equal(formatCareerSelectionCount(2, 3), "2 von 3 ausgewählt");
  assert.equal(formatCareerSelectionCount(1, 1), "1 von 1 ausgewählt");
});

test("Career dock derives global progress while keeping section and local positions separate", () => {
  const client = readFileSync(new URL("../components/find-your-next-step/career-exploration-journey.tsx", import.meta.url), "utf8");
  const dock = readFileSync(new URL("../components/find-your-next-step/journey-dock.tsx", import.meta.url), "utf8");

  assert.equal(careerQuestions.length, 14);
  assert.equal(careerSections.length, 5);
  assert.match(client, /globalQuestionNumber=\{state\.questionIndex \+ 1\}/u);
  assert.match(client, /totalQuestionCount=\{careerQuestions\.length\}/u);
  assert.match(client, /localQuestionNumber=\{currentQuestionNumber\}/u);
  assert.match(client, /localQuestionCount=\{sectionQuestions\.length\}/u);
  assert.equal(/totalQuestionCount=\{14\}/u.test(client), false);
  assert.match(client, /accent="#ff9a3d"/u);
  assert.match(dock, /Frage \{globalQuestionNumber\} von \{totalQuestionCount\}/u);
  assert.match(dock, /hier \{localQuestionNumber\}\/\{localQuestionCount\}/u);
  assert.match(dock, /hier \{localQuestionNumber\} von \{localQuestionCount\}/u);
  assert.equal((dock.match(/aria-current=/gu) ?? []).length, 1);
  assert.match(dock, /aria-current=\{current \? "step" : undefined\}/u);
  assert.equal(dock.includes("<progress"), false);
  assert.equal(dock.includes("%"), false);
  assert.equal(dock.includes("aria-live"), false);
  assert.equal(dock.includes('role="status"'), false);

  for (const checkpoint of [
    { questionIndex: 0, globalQuestionNumber: 1, sectionIndex: 0, localQuestionNumber: 1 },
    { questionIndex: 2, globalQuestionNumber: 3, sectionIndex: 0, localQuestionNumber: 3 },
    { questionIndex: 3, globalQuestionNumber: 4, sectionIndex: 1, localQuestionNumber: 1 },
    { questionIndex: 5, globalQuestionNumber: 6, sectionIndex: 1, localQuestionNumber: 3 },
    { questionIndex: 6, globalQuestionNumber: 7, sectionIndex: 2, localQuestionNumber: 1 },
    { questionIndex: 8, globalQuestionNumber: 9, sectionIndex: 2, localQuestionNumber: 3 },
    { questionIndex: 9, globalQuestionNumber: 10, sectionIndex: 3, localQuestionNumber: 1 },
    { questionIndex: 11, globalQuestionNumber: 12, sectionIndex: 3, localQuestionNumber: 3 },
    { questionIndex: 12, globalQuestionNumber: 13, sectionIndex: 4, localQuestionNumber: 1 },
    { questionIndex: 13, globalQuestionNumber: 14, sectionIndex: 4, localQuestionNumber: 2 },
  ]) {
    const question = careerQuestions[checkpoint.questionIndex];
    const sectionIndex = careerSections.findIndex(({ id }) => id === question.sectionId);
    const localQuestionNumber = careerQuestions
      .filter(({ sectionId }) => sectionId === question.sectionId)
      .findIndex(({ id }) => id === question.id) + 1;
    assert.equal(checkpoint.questionIndex + 1, checkpoint.globalQuestionNumber);
    assert.equal(sectionIndex, checkpoint.sectionIndex);
    assert.equal(localQuestionNumber, checkpoint.localQuestionNumber);
  }

  const completeAnswers = createProfileAnswers(["analysis-clarity", "product-experience"]);
  const boundaryBackState = careerJourneyReducer(
    { ...initialCareerState, phase: "journey", questionIndex: 6, answers: completeAnswers },
    { type: "back" },
  );
  assert.equal(boundaryBackState.questionIndex + 1, 6);

  let editState = careerJourneyReducer(
    { ...initialCareerState, phase: "result", answers: completeAnswers },
    { type: "edit-section", sectionId: "workstyle" },
  );
  assert.equal(editState.questionIndex + 1, 7);
  editState = careerJourneyReducer(editState, { type: "continue" });
  assert.equal(editState.questionIndex + 1, 8);
  editState = careerJourneyReducer(editState, { type: "continue" });
  assert.equal(editState.questionIndex + 1, 9);
});

test("Career reducer supports intro, validation, navigation, edit, regeneration, and restart", () => {
  let state = careerJourneyReducer(initialCareerState, { type: "start" });
  assert.equal(state.phase, "journey");
  state = careerJourneyReducer(state, { type: "continue" });
  assert.ok(state.validationMessage);
  assert.equal(state.questionIndex, 0);

  const completeAnswers = createProfileAnswers(["analysis-clarity", "product-experience"]);
  const firstQuestion = careerQuestions[0];
  for (const optionId of completeAnswers[firstQuestion.id]) {
    state = careerJourneyReducer(state, { type: "toggle-option", questionId: firstQuestion.id, optionId });
  }
  state = careerJourneyReducer(state, { type: "continue" });
  assert.equal(state.questionIndex, 1);
  state = careerJourneyReducer(state, { type: "back" });
  assert.equal(state.questionIndex, 0);

  state = { ...state, phase: "journey", questionIndex: careerQuestions.length - 1, answers: completeAnswers, validationMessage: null };
  state = careerJourneyReducer(state, { type: "continue" });
  assert.equal(state.phase, "result");
  state = careerJourneyReducer(state, { type: "edit-section", sectionId: "attraction" });
  assert.equal(state.phase, "journey");
  assert.equal(state.questionIndex, 0);
  state = careerJourneyReducer(state, { type: "back" });
  assert.equal(state.phase, "result");

  state = careerJourneyReducer(state, { type: "request-restart" });
  assert.equal(state.restartPending, true);
  state = careerJourneyReducer(state, { type: "cancel-restart" });
  assert.equal(state.restartPending, false);
  state = careerJourneyReducer(state, { type: "request-restart" });
  state = careerJourneyReducer(state, { type: "confirm-restart" });
  assert.deepEqual(state, initialCareerState);
});

test("Career remains a focused accessible client island with no persistence channel", () => {
  const client = readFileSync(new URL("../components/find-your-next-step/career-exploration-journey.tsx", import.meta.url), "utf8");
  const shell = readFileSync(new URL("../components/find-your-next-step/find-your-next-step-career.tsx", import.meta.url), "utf8");
  const dock = readFileSync(new URL("../components/find-your-next-step/journey-dock.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/find-your-next-step/[slug]/page.tsx", import.meta.url), "utf8");
  const engine = readFileSync(new URL("../lib/find-your-next-step-career.ts", import.meta.url), "utf8");
  const implementation = [client, shell, dock, route, engine].join("\n");

  assert.equal(client.startsWith('"use client"'), true);
  assert.equal(shell.startsWith('"use client"'), false);
  assert.equal(route.startsWith('"use client"'), false);
  assert.equal(client.includes("<fieldset"), true);
  assert.equal(client.includes("<legend"), true);
  assert.equal(client.includes('question.format === "single" ? "radio" : "checkbox"'), true);
  assert.equal(client.includes("<details"), true);
  assert.equal(client.includes("<summary"), true);
  assert.equal(client.includes("Jobtitel zum Erkunden"), true);
  assert.equal(client.includes("Alternative Suchbegriffe"), true);
  assert.match(client, /result\.jobTitles\.map/iu);
  assert.match(client, /md:grid-cols-2/iu);
  assert.equal(client.includes("aria-live"), false);
  assert.equal(client.includes("onKeyDown"), false);
  assert.equal(client.includes("Career Map · Ebenen"), true);
  assert.equal(client.includes("Radar"), false);
  assert.equal(client.includes("Bubble"), false);
  assert.match(client, /pb-\[calc\(12rem\+env\(safe-area-inset-bottom\)\)\]/u);
  assert.match(client, /accent="#ff9a3d"/u);

  for (const prohibited of [
    "localStorage", "sessionStorage", "document.cookie", "URLSearchParams", "location.hash",
    "history.pushState", "history.replaceState", "beforeunload", "@/lib/supabase", "fetch(",
    "console.log", "Math.random", "use server",
  ]) {
    assert.equal(implementation.includes(prohibited), false, prohibited);
  }
});
