import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  selfProfileDefinitions,
  validateSelfProfileData,
} from "../data/find-your-next-step-self-profile";
import {
  selfReflectionDimensions,
  selfReflectionQuestions,
} from "../data/find-your-next-step-self";
import {
  buildSelfHandbook,
} from "../lib/find-your-next-step-self-handbook";
import {
  buildSelfProfileIdentity,
} from "../lib/find-your-next-step-self-profile";
import {
  buildSelfReflectionResult,
  calculateSelfReflectionScores,
} from "../lib/find-your-next-step-self";
import {
  buildSelfResultText,
  buildSelfShareText,
} from "../lib/find-your-next-step-self-export";
import type {
  SelfReflectionAnswers,
  SelfReflectionDimensionId,
  SelfReflectionQuestion,
} from "../types/find-your-next-step";

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
const reliabilityVarietyAnswers = createCompleteAnswers(["reliability", "variety"], {
  "self-view-context": ["context-open"],
});
const purposeFeedbackAnswers = createCompleteAnswers(["purpose", "feedback"], {
  "self-view-context": ["context-open"],
});
const contextHeavyAnswers = createCompleteAnswers(["orientation", "agency"], {
  "self-view-context": ["context-orientation-agency"],
});
const unsupportedAnswers = createCompleteAnswers(["variety", "growth"], {
  "self-view-context": ["context-open"],
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

function wordCount(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (!value || typeof value !== "object") return keys;
  for (const [key, nested] of Object.entries(value)) {
    keys.add(key);
    collectKeys(nested, keys);
  }
  return keys;
}

test("Self Profile data contains exactly the approved eight unique pair definitions", () => {
  assert.deepEqual(validateSelfProfileData(), []);
  assert.deepEqual(
    selfProfileDefinitions.map(({ id, name, tagline, dimensions }) => ({ id, name, tagline, dimensions })),
    [
      { id: "profile-own-course", name: "Eigener Kurs", tagline: "Richtung erkennen, den Weg mitgestalten.", dimensions: ["orientation", "agency"] },
      { id: "profile-moving-anchor", name: "Beweglicher Anker", tagline: "Eine feste Basis, die Bewegung erlaubt.", dimensions: ["reliability", "variety"] },
      { id: "profile-quiet-depth", name: "Ruhige Tiefe", tagline: "Vertiefung, die Raum zum Auftanken lässt.", dimensions: ["depth", "recovery"] },
      { id: "profile-depth-in-dialogue", name: "Tiefe im Austausch", tagline: "Erst durchdringen, dann bewusst verbinden.", dimensions: ["depth", "connection"] },
      { id: "profile-growth-with-space", name: "Wachstum mit Atemraum", tagline: "Neues wagen, ohne Erholung zu verdrängen.", dimensions: ["growth", "recovery"] },
      { id: "profile-shared-momentum", name: "Gemeinsamer Aufbruch", tagline: "Entwicklung gewinnt im Austausch an Bewegung.", dimensions: ["connection", "growth"] },
      { id: "profile-impact-echo", name: "Wirkung mit Echo", tagline: "Beitrag wird greifbar, wenn Resonanz zurückkommt.", dimensions: ["purpose", "feedback"] },
      { id: "profile-grounded-impact", name: "Wirkung mit Bodenhaftung", tagline: "Bedeutung, die auf einer tragfähigen Basis steht.", dimensions: ["purpose", "reliability"] },
    ],
  );

  const knownDimensions = new Set(Object.keys(selfReflectionDimensions));
  const pairs = new Set<string>();
  const names = new Set<string>();
  for (const definition of selfProfileDefinitions) {
    assert.equal(definition.dimensions.length, 2);
    assert.equal(new Set(definition.dimensions).size, 2);
    assert.ok(definition.dimensions.every((dimension) => knownDimensions.has(dimension)));
    const pair = [...definition.dimensions].sort().join("+");
    assert.equal(pairs.has(pair), false);
    pairs.add(pair);
    assert.equal(names.has(definition.name), false);
    names.add(definition.name);
    assert.ok(wordCount(definition.description) >= 100 && wordCount(definition.description) <= 180);
    assert.ok(wordCount(definition.contextualDescription) >= 100 && wordCount(definition.contextualDescription) <= 180);
    assert.equal(definition.signatureSignals.length, 3);
    assert.ok(definition.signatureSignals.every((signal) => signal.trim()));
  }
});

test("Profile definitions contain no score contract, direct Handbook source, or prohibited identity claims", () => {
  const data = readFileSync(new URL("../data/find-your-next-step-self-profile.ts", import.meta.url), "utf8");
  const keys = collectKeys(selfProfileDefinitions);
  for (const prohibitedKey of ["score", "percentage", "probability", "confidence", "personalityCode"]) {
    assert.equal(keys.has(prohibitedKey), false, prohibitedKey);
  }
  for (const prohibitedImport of [
    "find-your-next-step-self-handbook",
    "Activity",
    "Experiment",
    "WorkStrategy",
  ]) {
    assert.equal(data.includes(prohibitedImport), false, prohibitedImport);
  }
  const copy = JSON.stringify(selfProfileDefinitions);
  for (const prohibitedCopy of [
    "Du bist", "Menschen wie du", "Dein Persönlichkeitstyp", "Du gehörst zu", "Du brauchst",
    "Leader", "Navigator", "Strategist", "Connector", "Innovator", "Talent für", "geeignet für",
    "ADHS", "Autismus", "Neurodivergenz", "Nervensystem",
  ]) {
    assert.equal(copy.includes(prohibitedCopy), false, prohibitedCopy);
  }
});

test("Profile selection is deterministic, pure, and consumes the existing Self visibility without recreating thresholds", () => {
  const engine = readFileSync(new URL("../lib/find-your-next-step-self-profile.ts", import.meta.url), "utf8");
  const answerSnapshot = structuredClone(orientationAgencyAnswers);
  const first = buildSelfProfileIdentity(orientationAgencyAnswers);
  const second = buildSelfProfileIdentity(orientationAgencyAnswers);
  assert.deepEqual(first, second);
  assert.deepEqual(orientationAgencyAnswers, answerSnapshot);
  assert.match(engine, /calculateSelfReflectionScores\(answers\)/u);
  assert.match(engine, /getMissingSelfReflectionQuestionIds\(answers\)/u);
  assert.equal(engine.includes("0.6"), false);
  assert.equal(engine.includes("0.35"), false);
  assert.equal(engine.includes("Math.random"), false);
  assert.equal(engine.includes("find-your-next-step-self-handbook"), false);
});

test("the five required pair scenarios select the approved profile identities", () => {
  const scenarios = [
    { answers: orientationAgencyAnswers, id: "profile-own-course", strength: "strong", basis: "tension" },
    { answers: depthRecoveryAnswers, id: "profile-quiet-depth", strength: "strong", basis: "explicit-pair" },
    { answers: connectionGrowthAnswers, id: "profile-shared-momentum", strength: "possible", basis: "co-visible" },
    { answers: reliabilityVarietyAnswers, id: "profile-moving-anchor", strength: "strong", basis: "tension" },
    { answers: purposeFeedbackAnswers, id: "profile-impact-echo", strength: "strong", basis: "explicit-pair" },
  ] as const;

  for (const scenario of scenarios) {
    const identity = buildSelfProfileIdentity(scenario.answers);
    assert.equal(identity.status, "profile");
    if (identity.status !== "profile") continue;
    assert.equal(identity.definition.id, scenario.id);
    assert.equal(identity.strength, scenario.strength);
    assert.equal(identity.basis, scenario.basis);
    if (identity.basis === "co-visible") {
      assert.equal(identity.evidence.supportingQuestionCount, 0);
      assert.equal(identity.evidence.supportingSectionCount, 0);
    } else {
      assert.ok(identity.evidence.supportingQuestionCount >= 3);
      assert.ok(identity.evidence.supportingSectionCount >= 2);
    }
    assert.ok(identity.secondarySignals.length <= 2);
  }
});

test("Gemeinsamer Aufbruch remains independently clear, co-visible, transparent, and never strong", () => {
  const identity = buildSelfProfileIdentity(connectionGrowthAnswers);
  assert.equal(identity.status, "profile");
  if (identity.status !== "profile") return;
  assert.equal(identity.definition.id, "profile-shared-momentum");
  assert.equal(identity.basis, "co-visible");
  assert.equal(identity.strength, "possible");
  assert.equal(identity.evidence.supportingQuestionCount, 0);
  assert.equal(identity.evidence.supportingSectionCount, 0);
  assert.equal(identity.evidence.directPairQuestionCount, 0);
  assert.deepEqual(identity.evidence.dimensions.map(({ visibility }) => visibility), ["clear", "clear"]);
  assert.ok(identity.evidence.dimensions.every(({ questionCount, sectionCount }) => questionCount >= 3 && sectionCount >= 2));
  assert.match(identity.why, /jeweils klar und eigenständig/u);
  assert.match(identity.why, /nicht direkt als gemeinsames Muster gewählt/u);

  const notClear = buildSelfProfileIdentity(createCompleteAnswers(["connection"], {
    "self-view-context": ["context-open"],
  }));
  assert.equal(notClear.status === "profile" && notClear.definition.id === "profile-shared-momentum", false);

  for (const targets of [
    ["connection", "growth", "depth"],
    ["connection", "growth", "recovery"],
    ["connection", "growth", "orientation", "agency"],
  ] as const) {
    const competing = buildSelfProfileIdentity(createCompleteAnswers(targets, {
      "self-view-context": ["context-open"],
    }));
    assert.equal(competing.status === "profile" && competing.definition.id === "profile-shared-momentum", false);
  }
});

test("broad, sparse, unsupported, incomplete, and contextual states remain honest", () => {
  const broad = buildSelfProfileIdentity(broadMixedAnswers);
  assert.equal(broad.status, "mixed");
  if (broad.status === "mixed") {
    assert.ok(broad.candidateIds.length >= 1 && broad.candidateIds.length <= 2);
    assert.match(broad.message, /vielseitiger als eindeutig/u);
  }

  assert.equal(calculateSelfReflectionScores(sparseAnswers).some(({ visibility }) => visibility), false);
  const sparse = buildSelfProfileIdentity(sparseAnswers);
  assert.deepEqual(sparse.status === "none" ? sparse.reason : null, "sparse");
  if (sparse.status === "none") assert.match(sparse.message, /valides Ergebnis/u);

  const unsupported = buildSelfProfileIdentity(unsupportedAnswers);
  assert.deepEqual(unsupported.status === "none" ? unsupported.reason : null, "unsupported");
  if (unsupported.status === "none") assert.match(unsupported.message, /keine der kuratierten Profil-Linsen/u);

  const incomplete = buildSelfProfileIdentity({});
  assert.deepEqual(incomplete.status === "none" ? incomplete.reason : null, "incomplete");

  const contextual = buildSelfProfileIdentity(contextHeavyAnswers);
  assert.equal(contextual.status, "profile");
  if (contextual.status === "profile") {
    assert.equal(contextual.contextual, true);
    assert.equal(contextual.strength, "possible");
    assert.match(contextual.definition.contextualDescription, /^Je nach Situation/u);
  }
});

test("secondary signals are visible, individual, contextualized when needed, and capped at two", () => {
  for (const answers of [
    orientationAgencyAnswers,
    depthRecoveryAnswers,
    connectionGrowthAnswers,
    reliabilityVarietyAnswers,
    purposeFeedbackAnswers,
    contextHeavyAnswers,
    createCompleteAnswers(["connection", "growth", "orientation", "agency"], { "self-view-context": ["context-open"] }),
  ]) {
    const identity = buildSelfProfileIdentity(answers);
    if (identity.status !== "profile") continue;
    assert.ok(identity.secondarySignals.length <= 2);
    const evaluations = new Map(calculateSelfReflectionScores(answers).map((evaluation) => [evaluation.dimension, evaluation]));
    for (const secondary of identity.secondarySignals) {
      assert.ok(evaluations.get(secondary.dimension)?.visibility);
      assert.equal(identity.definition.dimensions.includes(secondary.dimension), false);
      assert.equal("id" in secondary, false);
      if (secondary.contextual) assert.match(secondary.text, /^Situationsabhängig/u);
    }
  }
});

test("Profile evaluation leaves Self result, Handbook, exports, questions, and answer fixtures unchanged", () => {
  const answersBefore = structuredClone(orientationAgencyAnswers);
  const resultBefore = buildSelfReflectionResult(orientationAgencyAnswers);
  const handbookBefore = buildSelfHandbook(orientationAgencyAnswers);
  assert.equal(resultBefore.status, "complete");
  if (resultBefore.status !== "complete") return;
  const copyBefore = buildSelfResultText(resultBefore.result);
  const shareBefore = buildSelfShareText(resultBefore.result);

  buildSelfProfileIdentity(orientationAgencyAnswers, resultBefore.result);

  const resultAfter = buildSelfReflectionResult(orientationAgencyAnswers);
  const handbookAfter = buildSelfHandbook(orientationAgencyAnswers);
  assert.deepEqual(orientationAgencyAnswers, answersBefore);
  assert.deepEqual(resultAfter, resultBefore);
  assert.equal(JSON.stringify(resultAfter), JSON.stringify(resultBefore));
  assert.deepEqual(handbookAfter, handbookBefore);
  assert.equal(buildSelfResultText(resultBefore.result), copyBefore);
  assert.equal(buildSelfShareText(resultBefore.result), shareBefore);
  assert.equal(copyBefore.includes("Eigener Kurs"), false);
  assert.equal(shareBefore.includes("Eigener Kurs"), false);
  assert.equal(selfReflectionQuestions.length, 15);
});

test("Profile UI is screen-only, follows the required result position, and exposes semantic states", () => {
  const journey = readFileSync(new URL("../components/find-your-next-step/self-reflection-journey.tsx", import.meta.url), "utf8");
  const view = readFileSync(new URL("../components/find-your-next-step/self-profile-identity.tsx", import.meta.url), "utf8");
  const printStart = journey.indexOf("function SelfPrintDocument");
  const printEnd = journey.indexOf("function ResultView", printStart);
  const printDocument = journey.slice(printStart, printEnd);
  const screenResultStart = journey.indexOf("function ResultView");
  const summaryIndex = journey.indexOf("result.summary.map", screenResultStart);
  const profileIndex = journey.indexOf("<SelfProfileIdentityView");
  const sectionsIndex = journey.indexOf("result.sections.map");
  const tensionsIndex = journey.indexOf("result.tensions.length", sectionsIndex);
  const handbookIndex = journey.indexOf("<SelfHandbookView");
  const actionsIndex = journey.indexOf("<FynsResultActions");

  assert.ok(summaryIndex < profileIndex);
  assert.ok(profileIndex < sectionsIndex);
  assert.ok(sectionsIndex < tensionsIndex);
  assert.ok(tensionsIndex < handbookIndex);
  assert.ok(handbookIndex < actionsIndex);
  assert.equal(printDocument.includes("SelfProfile"), false);
  assert.equal(printDocument.includes("Profil-Linse"), false);

  assert.match(view, /<section/u);
  assert.match(view, /aria-labelledby=/u);
  assert.match(view, /<h3/u);
  assert.match(view, /<h4/u);
  assert.match(view, /<ul/u);
  assert.match(view, /Situationsabhängige Linse/u);
  assert.match(view, /Vielseitiger als eindeutig/u);
  assert.match(view, /Profil-Linse bewusst offen/u);
  assert.match(view, /Warum diese Linse\?/u);
  assert.match(view, /Drei Signale dieser Linse/u);
  assert.match(view, /weder Persönlichkeitstyp noch Diagnose/u);
  assert.equal(view.includes("identity.strength"), false);
  assert.equal(view.includes("aria-live"), false);
  assert.equal(view.includes("animate-"), false);
  assert.equal(view.includes("overflow-x"), false);
  assert.equal(view.includes("carousel"), false);
});

test("Profile implementation remains local, deterministic, privacy-safe, and independent from Career", () => {
  const files = [
    "../data/find-your-next-step-self-profile.ts",
    "../lib/find-your-next-step-self-profile.ts",
    "../components/find-your-next-step/self-profile-identity.tsx",
    "../components/find-your-next-step/self-reflection-journey.tsx",
  ].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");

  for (const prohibited of [
    "localStorage", "sessionStorage", "document.cookie", "fetch(", "URLSearchParams",
    "history.pushState", "history.replaceState", "@/lib/supabase", "analytics",
    "Math.random", "find-your-next-step-career", "CareerProfile",
  ]) {
    assert.equal(files.includes(prohibited), false, prohibited);
  }
});
