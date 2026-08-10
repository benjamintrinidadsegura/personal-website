import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  selfHandbookActivityDefinitions,
  selfHandbookExperimentDefinitions,
  selfHandbookPatterns,
  selfHandbookTextDefinitions,
} from "../data/find-your-next-step-self-handbook";
import {
  selfReflectionQuestions,
} from "../data/find-your-next-step-self";
import {
  buildSelfHandbook,
  validateSelfHandbookData,
} from "../lib/find-your-next-step-self-handbook";
import type {
  SelfHandbook,
  SelfHandbookSource,
} from "../lib/find-your-next-step-self-handbook";
import {
  buildSelfReflectionResult,
  calculateSelfReflectionScores,
  selfReflectionDimensionOrder,
} from "../lib/find-your-next-step-self";
import {
  buildSelfResultText,
  buildSelfShareText,
} from "../lib/find-your-next-step-self-export";
import type {
  SelfReflectionAnswers,
  SelfReflectionDimensionId,
  SelfReflectionEvidenceRole,
  SelfReflectionQuestion,
} from "../types/find-your-next-step";

const positiveRoles: readonly SelfReflectionEvidenceRole[] = [
  "priority",
  "work",
  "decision",
  "energyGain",
  "condition",
  "synthesis",
];

function optionSupport(
  option: SelfReflectionQuestion["options"][number],
  targets: readonly SelfReflectionDimensionId[],
): number {
  const signalSupport = (option.signals ?? []).filter(({ dimension }) => targets.includes(dimension)).length;
  const contextSupport = (option.contextualDimensions ?? []).filter((dimension) => targets.includes(dimension)).length;
  return signalSupport + contextSupport;
}

function createCompleteAnswers(
  targets: readonly SelfReflectionDimensionId[],
  overrides: Readonly<Record<string, readonly string[]>> = {},
): SelfReflectionAnswers {
  return Object.fromEntries(selfReflectionQuestions.map((question) => {
    if (overrides[question.id]) return [question.id, overrides[question.id]];
    const ranked = question.options
      .map((option, index) => ({ option, index, support: optionSupport(option, targets) }))
      .filter(({ option }) => !option.exclusive)
      .sort((left, right) => right.support - left.support || left.index - right.index);
    const selected = ranked.filter(({ support }) => support > 0).slice(0, question.maxSelections);
    for (const candidate of ranked) {
      if (selected.length >= question.minSelections) break;
      if (!selected.some(({ option }) => option.id === candidate.option.id)) selected.push(candidate);
    }
    return [question.id, selected.slice(0, question.maxSelections).map(({ option }) => option.id)];
  }));
}

const orientationAgencyAnswers = createCompleteAnswers(["orientation", "agency"], {
  "self-view-context": ["context-open"],
});

const depthRecoveryAnswers = createCompleteAnswers(["depth", "recovery"], {
  "self-view-context": ["context-open"],
});

const connectionGrowthAnswers = createCompleteAnswers(["connection", "growth"], {
  "self-view-context": ["context-open"],
});

const contextHeavyAnswers = createCompleteAnswers(["orientation", "agency"], {
  "self-view-context": ["context-orientation-agency"],
});

const sparseAnswers: SelfReflectionAnswers = {
  "priorities-everyday": ["everyday-variety", "everyday-recovery"],
  "priorities-now": ["priority-agency", "priority-connection"],
  "priorities-good-day": ["good-day-connection-feedback"],
  "decisions-new-beginning": ["beginning-variety-growth"],
  "decisions-uncertainty": ["uncertainty-reliability-purpose"],
  "decisions-rhythm": ["rhythm-depth-orientation"],
  "energy-recharge": ["recharge-connection-feedback"],
  "energy-sustaining": ["sustaining-variety-growth"],
  "energy-drains": ["drain-agency-orientation"],
  "conditions-change": ["change-growth-purpose"],
  "conditions-habitat": ["habitat-connection", "habitat-recovery"],
  "conditions-combinations": ["combination-purpose-feedback"],
  "self-view-strengths": ["strength-overview"],
  "self-view-context": ["context-open"],
  "self-view-synthesis": ["synthesis-reliability-variety"],
};

const multipleOnlyAnswers: SelfReflectionAnswers = {
  "priorities-everyday": ["everyday-purpose", "everyday-orientation"],
  "priorities-now": ["priority-agency", "priority-orientation"],
  "priorities-good-day": ["good-day-growth-purpose"],
  "decisions-new-beginning": ["beginning-orientation"],
  "decisions-uncertainty": ["uncertainty-connection-feedback"],
  "decisions-rhythm": ["rhythm-depth-orientation"],
  "energy-recharge": ["recharge-recovery-depth"],
  "energy-sustaining": ["sustaining-agency-orientation"],
  "energy-drains": ["drain-agency-orientation"],
  "conditions-change": ["change-connection-feedback"],
  "conditions-habitat": ["habitat-orientation", "habitat-variety"],
  "conditions-combinations": ["combination-reliability-variety"],
  "self-view-strengths": ["strength-meaning"],
  "self-view-context": ["context-open"],
  "self-view-synthesis": ["synthesis-depth-connection"],
};

const broadMixedAnswers: SelfReflectionAnswers = {
  "priorities-everyday": ["everyday-depth", "everyday-connection", "everyday-reliability", "everyday-orientation"],
  "priorities-now": ["priority-recovery", "priority-feedback"],
  "priorities-good-day": ["good-day-agency-orientation", "good-day-depth-variety"],
  "decisions-new-beginning": ["beginning-depth", "beginning-agency"],
  "decisions-uncertainty": ["uncertainty-connection-feedback", "uncertainty-reliability-purpose"],
  "decisions-rhythm": ["rhythm-depth-orientation", "rhythm-recovery"],
  "energy-recharge": ["recharge-variety", "recharge-connection-feedback"],
  "energy-sustaining": ["sustaining-depth-recovery", "sustaining-reliability-purpose"],
  "energy-drains": ["drain-agency-orientation", "drain-reliability-purpose"],
  "conditions-change": ["change-agency-variety", "change-connection-feedback"],
  "conditions-habitat": ["habitat-recovery", "habitat-orientation", "habitat-variety"],
  "conditions-combinations": ["combination-depth-connection", "combination-reliability-variety"],
  "self-view-strengths": ["strength-explore", "strength-connect", "strength-overview"],
  "self-view-context": ["context-open"],
  "self-view-synthesis": ["synthesis-purpose-feedback", "synthesis-orientation-agency"],
};

function requireHandbook(answers: SelfReflectionAnswers): SelfHandbook {
  const handbook = buildSelfHandbook(answers);
  assert.ok(handbook);
  return handbook;
}

function sourcesOf(handbook: SelfHandbook): readonly SelfHandbookSource[] {
  return [
    ...handbook.decisionQuestions,
    ...handbook.environmentChecklist,
    ...handbook.energySupports,
    ...handbook.energyWatchouts,
    ...handbook.workStrategies,
    ...handbook.learningIdeas,
    ...handbook.activitySuggestions,
    ...handbook.experiments,
  ].map(({ source }) => source);
}

function evidenceQuestionIds(
  answers: SelfReflectionAnswers,
  dimensions: readonly SelfReflectionDimensionId[],
  roles?: readonly SelfReflectionEvidenceRole[],
): Set<string> {
  const questionIds = new Set<string>();
  for (const question of selfReflectionQuestions) {
    if (roles && !roles.includes(question.evidenceRole)) continue;
    for (const optionId of answers[question.id] ?? []) {
      const option = question.options.find(({ id }) => id === optionId);
      if ((option?.signals ?? []).some(({ dimension }) => dimensions.includes(dimension))) questionIds.add(question.id);
    }
  }
  return questionIds;
}

function hasRoleEvidenceForEveryDimension(
  answers: SelfReflectionAnswers,
  dimensions: readonly SelfReflectionDimensionId[],
  roles: readonly SelfReflectionEvidenceRole[],
): boolean {
  return dimensions.every((dimension) => evidenceQuestionIds(answers, [dimension], roles).size > 0);
}

test("Handbook data is curated, valid, unique, and never maps an answer option directly to an activity", () => {
  assert.deepEqual(validateSelfHandbookData(), []);
  assert.equal(selfHandbookPatterns.filter(({ dimensions }) => dimensions.length === 2).length, 7);
  assert.deepEqual(
    selfHandbookPatterns.filter(({ dimensions }) => dimensions.length === 2).map(({ id }) => id),
    [
      "pair-orientation-agency",
      "pair-reliability-variety",
      "pair-depth-recovery",
      "pair-depth-connection",
      "pair-growth-recovery",
      "pair-connection-growth",
      "pair-purpose-feedback",
    ],
  );
  assert.equal(selfHandbookTextDefinitions.filter(({ kind }) => kind === "decision").length, 12);
  assert.equal(selfHandbookActivityDefinitions.length, 8);

  const knownDimensions = new Set(selfReflectionDimensionOrder);
  const knownRoles = new Set<SelfReflectionEvidenceRole>([
    "priority", "work", "decision", "energyGain", "energyDrain", "condition", "selfImage", "context", "synthesis",
  ]);
  for (const pattern of selfHandbookPatterns) {
    for (const dimension of pattern.dimensions) assert.equal(knownDimensions.has(dimension), true, pattern.id);
  }
  for (const definition of [
    ...selfHandbookTextDefinitions,
    ...selfHandbookActivityDefinitions,
    ...selfHandbookExperimentDefinitions,
  ]) {
    for (const role of definition.roles) assert.equal(knownRoles.has(role), true, `${definition.id}:${role}`);
  }

  const optionIds = selfReflectionQuestions.flatMap(({ options }) => options.map(({ id }) => id));
  const activities = JSON.stringify(selfHandbookActivityDefinitions);
  for (const optionId of optionIds) assert.equal(activities.includes(optionId), false, optionId);
  for (const direction of selfHandbookActivityDefinitions) {
    assert.ok(direction.examples.length >= 2 && direction.examples.length <= 4, direction.id);
    assert.ok(direction.examples.every(({ activity, why }) => activity.trim() && why.trim()), direction.id);
    assert.equal(selfHandbookPatterns.find(({ id }) => id === direction.patternId)?.dimensions.length, 2, direction.id);
  }
});

test("Handbook consumes the existing Self evaluation without duplicating visibility thresholds", () => {
  const engine = readFileSync(new URL("../lib/find-your-next-step-self-handbook.ts", import.meta.url), "utf8");
  assert.match(engine, /calculateSelfReflectionScores\(answers\)/u);
  assert.match(engine, /getMissingSelfReflectionQuestionIds\(answers\)/u);
  assert.equal(engine.includes("0.6"), false);
  assert.equal(engine.includes("0.35"), false);
  assert.equal(engine.includes("Math.random"), false);

  for (const answers of [
    orientationAgencyAnswers,
    depthRecoveryAnswers,
    connectionGrowthAnswers,
    broadMixedAnswers,
    contextHeavyAnswers,
  ]) {
    const evaluations = new Map(calculateSelfReflectionScores(answers).map((evaluation) => [evaluation.dimension, evaluation]));
    const handbook = requireHandbook(answers);
    for (const source of sourcesOf(handbook)) {
      for (const dimension of source.dimensions) {
        const evaluation = evaluations.get(dimension);
        assert.ok(evaluation?.visibility, `${source.patternId}:${dimension}`);
      }
      if (source.dimensions.length > 1) {
        assert.ok(evidenceQuestionIds(answers, source.dimensions).size >= 3, source.patternId);
      }
    }
  }
});

test("Handbook is pure, deterministic, input-safe, and leaves SelfReflectionResult byte-for-byte unchanged", () => {
  const answerSnapshot = structuredClone(orientationAgencyAnswers);
  const resultBefore = buildSelfReflectionResult(orientationAgencyAnswers);
  const first = buildSelfHandbook(orientationAgencyAnswers);
  const second = buildSelfHandbook(orientationAgencyAnswers);
  const resultAfter = buildSelfReflectionResult(orientationAgencyAnswers);

  assert.deepEqual(first, second);
  assert.deepEqual(orientationAgencyAnswers, answerSnapshot);
  assert.deepEqual(resultAfter, resultBefore);
  assert.equal(JSON.stringify(resultAfter), JSON.stringify(resultBefore));
  assert.equal(buildSelfHandbook({}), null);
});

test("Orientation and autonomy produce a usable pair compass without redundant single prompts", () => {
  const result = buildSelfReflectionResult(orientationAgencyAnswers);
  const handbook = requireHandbook(orientationAgencyAnswers);
  assert.equal(result.status, "complete");
  if (result.status !== "complete") return;

  assert.equal(result.result.tensions[0]?.id, "orientation-agency");
  assert.deepEqual(handbook.decisionQuestions.map(({ id }) => id), [
    "decision-orientation-agency",
    "decision-orientation-agency-boundaries",
  ]);
  assert.equal(handbook.decisionQuestions.some(({ id }) => id === "decision-orientation" || id === "decision-agency"), false);
  assert.equal(handbook.workStrategies[0]?.id, "work-orientation-agency");
  assert.match(handbook.workStrategies[0]?.text ?? "", /Ziel und zwei Grenzen/u);
  assert.equal(handbook.activitySuggestions[0]?.id, "activity-build-organize");
  assert.equal(handbook.experiments[0]?.id, "experiment-direction-freedom");
  assert.match(handbook.experiments[0]?.observe ?? "", /Klarheit und Spielraum/u);
});

test("Connection and development unlock evidence-backed learning, activities, and a concrete experiment", () => {
  const handbook = requireHandbook(connectionGrowthAnswers);
  assert.ok(handbook.learningIdeas.length >= 1);
  assert.ok(handbook.learningIdeas.every(({ source }) => source.dimensions.includes("growth")));
  assert.equal(handbook.activitySuggestions[0]?.id, "activity-learn-together");
  assert.deepEqual(
    handbook.activitySuggestions[0]?.examples.map(({ activity }) => activity),
    ["Ein Sprachtandem", "Ein Lernkreis", "Ein Maker- oder Coding-Workshop"],
  );
  assert.equal(handbook.experiments[0]?.id, "experiment-learn-together");
  assert.ok(handbook.experiments[0]?.action.trim());
  assert.ok(handbook.experiments[0]?.observe.trim());
});

test("multiple and contextual signals remain visibly cautious qualifiers", () => {
  const multipleHandbook = requireHandbook(multipleOnlyAnswers);
  assert.deepEqual(multipleHandbook.decisionQuestions, []);
  assert.ok(sourcesOf(multipleHandbook).length > 0);
  for (const item of [
    ...multipleHandbook.environmentChecklist,
    ...multipleHandbook.energySupports,
    ...multipleHandbook.energyWatchouts,
    ...multipleHandbook.workStrategies,
  ]) {
    assert.equal(item.source.visibility, "multiple");
    assert.match(item.text, /^Das könnte einen Versuch wert sein:/u);
  }
  assert.match(multipleHandbook.experiments[0]?.framing ?? "", /^Das könnte einen Versuch wert sein\.$/u);

  const contextualHandbook = requireHandbook(contextHeavyAnswers);
  assert.ok(sourcesOf(contextualHandbook).every(({ contextual }) => contextual));
  for (const item of [
    ...contextualHandbook.decisionQuestions,
    ...contextualHandbook.environmentChecklist,
    ...contextualHandbook.energySupports,
    ...contextualHandbook.energyWatchouts,
    ...contextualHandbook.workStrategies,
  ]) {
    assert.match(item.text, /^(?:Wenn dieser Kontext gerade relevant ist|Je nach Aufgabe könnte)/u);
  }
  assert.match(contextualHandbook.experiments[0]?.framing ?? "", /^Wenn dieser Kontext gerade relevant ist/u);
});

test("domain evidence gates environment, energy, work, learning, activities, and experiments", () => {
  for (const answers of [orientationAgencyAnswers, depthRecoveryAnswers, connectionGrowthAnswers, broadMixedAnswers]) {
    const handbook = requireHandbook(answers);
    for (const item of handbook.environmentChecklist) {
      assert.equal(hasRoleEvidenceForEveryDimension(answers, item.source.dimensions, ["condition", "synthesis"]), true, item.id);
    }
    for (const item of handbook.energySupports) {
      assert.equal(hasRoleEvidenceForEveryDimension(answers, item.source.dimensions, ["energyGain"]), true, item.id);
    }
    for (const item of handbook.energyWatchouts) {
      assert.equal(hasRoleEvidenceForEveryDimension(answers, item.source.dimensions, ["energyDrain"]), true, item.id);
    }
    for (const item of handbook.workStrategies) {
      assert.equal(hasRoleEvidenceForEveryDimension(answers, item.source.dimensions, ["work", "decision", "condition", "synthesis"]), true, item.id);
    }
    for (const item of handbook.learningIdeas) {
      assert.equal(item.source.dimensions.includes("growth"), true, item.id);
      assert.equal(hasRoleEvidenceForEveryDimension(answers, item.source.dimensions, positiveRoles), true, item.id);
    }
    for (const item of handbook.activitySuggestions) {
      assert.equal(hasRoleEvidenceForEveryDimension(answers, item.source.dimensions, positiveRoles), true, item.id);
    }
  }
});

test("caps, stable tie-breakers, semantic dedupe, and global activity dedupe hold for a broad mixed profile", () => {
  const first = requireHandbook(broadMixedAnswers);
  const second = requireHandbook(broadMixedAnswers);
  assert.deepEqual(first, second);
  assert.deepEqual(first.decisionQuestions.map(({ id }) => id), [
    "decision-depth-connection",
    "decision-depth-connection-timing",
    "decision-orientation-agency",
    "decision-orientation-agency-boundaries",
    "decision-feedback",
  ]);
  assert.ok(first.decisionQuestions.length >= 2 && first.decisionQuestions.length <= 5);
  assert.ok(first.environmentChecklist.length <= 6);
  assert.ok(first.energySupports.length <= 2);
  assert.ok(first.energyWatchouts.length <= 2);
  assert.ok(first.workStrategies.length <= 4);
  assert.ok(first.learningIdeas.length <= 2);
  assert.ok(first.activitySuggestions.length <= 4);
  assert.ok(first.experiments.length <= 3);

  const allIds = [
    ...first.decisionQuestions,
    ...first.environmentChecklist,
    ...first.energySupports,
    ...first.energyWatchouts,
    ...first.workStrategies,
    ...first.learningIdeas,
    ...first.activitySuggestions,
    ...first.experiments,
  ].map(({ id }) => id);
  assert.equal(new Set(allIds).size, allIds.length);

  const examples = first.activitySuggestions.flatMap(({ examples }) => examples);
  assert.equal(new Set(examples.map(({ id }) => id)).size, examples.length);
  assert.equal(new Set(examples.map(({ activity }) => activity.toLocaleLowerCase("de-DE"))).size, examples.length);
  for (const activity of first.activitySuggestions) {
    assert.ok(activity.examples.length >= 2 && activity.examples.length <= 4);
    assert.ok(activity.examples.every(({ why }) => why.trim()));
    assert.ok(activity.source.label.trim());
  }
  assert.deepEqual(new Set(first.experiments.map(({ area }) => area)), new Set(["work", "energy", "activity"]));
});

test("sparse results stay small and never receive filler content", () => {
  assert.equal(calculateSelfReflectionScores(sparseAnswers).some(({ visibility }) => visibility), false);
  const handbook = requireHandbook(sparseAnswers);
  assert.equal(Object.values(handbook).every((items) => items.length === 0), true);

  const onePattern = requireHandbook(multipleOnlyAnswers);
  assert.deepEqual(onePattern.decisionQuestions, []);
  assert.deepEqual(onePattern.activitySuggestions, []);
  assert.ok(onePattern.environmentChecklist.length <= 1);
  assert.ok(onePattern.workStrategies.length <= 1);
});

test("copy, share, print, Result Actions, and Career boundaries remain outside the Handbook", () => {
  const resultBefore = buildSelfReflectionResult(orientationAgencyAnswers);
  assert.equal(resultBefore.status, "complete");
  if (resultBefore.status !== "complete") return;
  const copyBefore = buildSelfResultText(resultBefore.result);
  const shareBefore = buildSelfShareText(resultBefore.result);
  buildSelfHandbook(orientationAgencyAnswers);
  const resultAfter = buildSelfReflectionResult(orientationAgencyAnswers);
  assert.deepEqual(resultAfter, resultBefore);
  assert.equal(buildSelfResultText(resultBefore.result), copyBefore);
  assert.equal(buildSelfShareText(resultBefore.result), shareBefore);
  assert.equal(copyBefore.includes("Dein persönliches Handbuch"), false);
  assert.equal(shareBefore.includes("Dein persönliches Handbuch"), false);

  const client = readFileSync(new URL("../components/find-your-next-step/self-reflection-journey.tsx", import.meta.url), "utf8");
  const printStart = client.indexOf("function SelfPrintDocument");
  const printEnd = client.indexOf("function ResultView", printStart);
  const printDocument = client.slice(printStart, printEnd);
  const handbookIndex = client.indexOf("<SelfHandbookView");
  const actionsIndex = client.indexOf("<FynsResultActions");
  const editIndex = client.indexOf('aria-labelledby="edit-answers-title"');
  assert.equal(printDocument.includes("SelfHandbook"), false);
  assert.ok(handbookIndex > client.indexOf("result.tensions"));
  assert.ok(handbookIndex < actionsIndex);
  assert.ok(actionsIndex < editIndex);

  const formatter = readFileSync(new URL("../lib/find-your-next-step-self-export.ts", import.meta.url), "utf8");
  const actions = readFileSync(new URL("../components/find-your-next-step/result-actions.tsx", import.meta.url), "utf8");
  assert.equal(formatter.includes("SelfHandbook"), false);
  assert.equal(actions.includes("SelfHandbook"), false);
  assert.equal(selfReflectionQuestions.length, 15);
});

test("Handbook UI exposes four compact semantic chapters without persistence or live regions", () => {
  const view = readFileSync(new URL("../components/find-your-next-step/self-handbook.tsx", import.meta.url), "utf8");
  assert.match(view, /aria-labelledby="self-handbook-title"/u);
  assert.match(view, /<h3 id="self-handbook-title"/u);
  assert.match(view, /<h4 id=\{id\}/u);
  for (const chapter of ["Entscheiden", "Arbeiten", "Energie & Umfeld", "Lernen & Ausprobieren"]) {
    assert.equal(view.includes(`title="${chapter}"`), true, chapter);
  }
  assert.ok((view.match(/<ol/gu) ?? []).length >= 2);
  assert.ok((view.match(/<ul/gu) ?? []).length >= 3);
  assert.equal(view.includes("<details"), true);
  assert.equal(view.includes("<summary"), true);
  assert.equal(view.includes("focus-visible"), true);
  assert.equal(view.includes("aria-live"), false);
  assert.equal(view.includes("sticky"), false);
  assert.equal(view.includes("overflow-x"), false);

  for (const prohibited of [
    "localStorage",
    "sessionStorage",
    "document.cookie",
    "fetch(",
    "URLSearchParams",
    "@/lib/supabase",
    "analytics",
    "Math.random",
  ]) {
    assert.equal(view.includes(prohibited), false, prohibited);
  }
});
