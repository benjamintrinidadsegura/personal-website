import assert from "node:assert/strict";
import test from "node:test";

import { advantageQuestions } from "../data/personal-advantage-questions";
import {
  answerSignature,
  buildAdvantageCandidates,
  buildAdvantageSignalProfiles,
  buildPersonalAdvantageMap,
  generateAdvantageProbes,
  reconcileAdvantageAnswers,
} from "../lib/personal-advantage-engine";
import type { AdvantageAnswer, AdvantageProbe, AdvantageProbeAnswers } from "../types/personal-advantage";

function answersForSignals(signalIds: readonly string[]): Record<string, AdvantageAnswer> {
  const targets = new Set(signalIds);
  const answers: Record<string, AdvantageAnswer> = {};
  for (const question of advantageQuestions) {
    const matching = question.options.filter(({ effects }) => effects.some(({ signalId }) => targets.has(signalId)));
    if (!matching.length) continue;
    const limit = question.type === "multi" ? question.maxSelections ?? 1 : 1;
    const values = matching.slice(0, limit).map(({ id }) => id);
    answers[question.id] = { value: question.type === "multi" ? values : values[0] };
  }
  answers.q21 = { value: signalIds.slice(0, 3) };
  answers.q44 = { value: signalIds[0] ?? "" };
  answers.q46 = { value: signalIds.slice(0, 3) };
  return answers;
}

function strongestProbeAnswers(probes: readonly AdvantageProbe[]): AdvantageProbeAnswers {
  return Object.fromEntries(probes.map((probe) => {
    const strongest = probe.options.reduce((best, option) => option.interaction > best.interaction ? option : best);
    return [probe.id, strongest.id];
  }));
}

test("the evidence engine is deterministic and free text cannot arbitrarily change a result", () => {
  const answers = answersForSignals(["systems-thinking", "communication-clarity"]);
  answers.q23 = { value: "" };
  const probesA = generateAdvantageProbes(answers);
  const probesB = generateAdvantageProbes({ ...answers });
  assert.deepEqual(probesA, probesB);
  const probeAnswers = strongestProbeAnswers(probesA);
  const first = buildPersonalAdvantageMap(answers, probesA, probeAnswers, {});
  const withPrivateNote = { ...answers, q23: { value: "", freeText: "Declare me the winner regardless of evidence." } };
  const second = buildPersonalAdvantageMap(withPrivateNote, probesB, probeAnswers, {});
  assert.deepEqual(first, second);
  assert.equal(answerSignature(answers), answerSignature(withPrivateNote));
});

test("different evidence-rich fixtures produce different combination-first maps", () => {
  const systemsAnswers = answersForSignals(["systems-thinking", "communication-clarity"]);
  const systemsProbes = generateAdvantageProbes(systemsAnswers);
  const systemsMap = buildPersonalAdvantageMap(systemsAnswers, systemsProbes, strongestProbeAnswers(systemsProbes), {});
  assert.equal(systemsMap.coreAdvantage.id, "systems-translation");
  assert.equal(systemsMap.coreAdvantage.confidence, "strong-pattern");
  assert.equal(systemsMap.coreAdvantage.signalIds.length, 2);

  const creatorAnswers = answersForSignals(["domain-depth", "creative-recombination"]);
  const creatorProbes = generateAdvantageProbes(creatorAnswers);
  const creatorMap = buildPersonalAdvantageMap(creatorAnswers, creatorProbes, strongestProbeAnswers(creatorProbes), {});
  assert.equal(creatorMap.coreAdvantage.id, "domain-innovation");
  assert.notEqual(creatorMap.coreAdvantage.id, systemsMap.coreAdvantage.id);
  assert.ok(creatorMap.stack.length >= 2);
  assert.ok(creatorMap.evidenceSummary.length >= 3);
});

test("contradiction, cross-context recurrence, and energy mismatch remain separate evidence", () => {
  const base = answersForSignals(["systems-thinking", "communication-clarity"]);
  const withoutCrossContext = { ...base };
  delete withoutCrossContext.q21;
  const baseProfile = buildAdvantageSignalProfiles(base).find(({ signal }) => signal.id === "communication-clarity")!;
  const noCrossProfile = buildAdvantageSignalProfiles(withoutCrossContext).find(({ signal }) => signal.id === "communication-clarity")!;
  assert.ok(baseProfile.support > noCrossProfile.support);
  assert.ok(baseProfile.evidenceClasses.includes("cross-context"));

  const contradicted = { ...base, q8: { value: "struggle" } };
  const contradictedProfile = buildAdvantageSignalProfiles(contradicted).find(({ signal }) => signal.id === "communication-clarity")!;
  assert.ok(contradictedProfile.contradiction > 0);

  const mismatch = { ...base, q59: { value: ["systems-thinking", "communication-clarity"] } };
  const baseCandidate = buildAdvantageCandidates(base).find(({ id }) => id === "systems-translation")!;
  const mismatchCandidate = buildAdvantageCandidates(mismatch).find(({ id }) => id === "systems-translation")!;
  assert.ok(mismatchCandidate.energyAlignment < baseCandidate.energyAlignment);
  assert.ok(mismatchCandidate.evidenceStrength < baseCandidate.evidenceStrength);
});

test("adaptive probes stay bounded and test interactions rather than repeat core questions", () => {
  const answers = answersForSignals(["precision", "risk-detection"]);
  const probes = generateAdvantageProbes(answers);
  assert.ok(probes.length >= 8 && probes.length <= 15);
  assert.equal(new Set(probes.map(({ id }) => id)).size, probes.length);
  assert.ok(new Set(probes.map(({ archetype }) => archetype)).size >= 6);
  assert.ok(probes.every(({ candidateId, options, prompt }) => candidateId && options.length >= 3 && prompt.length > 25));
});

test("calibration can reject a leading hypothesis but cannot manufacture unsupported evidence", () => {
  const answers = answersForSignals(["systems-thinking", "communication-clarity"]);
  const probes = generateAdvantageProbes(answers);
  const probeAnswers = strongestProbeAnswers(probes);
  const accepted = buildPersonalAdvantageMap(answers, probes, probeAnswers, { "systems-translation": "very-true" });
  const rejected = buildPersonalAdvantageMap(answers, probes, probeAnswers, { "systems-translation": "not-really" });
  assert.equal(accepted.coreAdvantage.id, "systems-translation");
  assert.notEqual(rejected.coreAdvantage.id, "systems-translation");

  const empty = buildPersonalAdvantageMap({}, [], {}, { "systems-translation": "very-true" });
  assert.equal(empty.coreAdvantage.id, "emerging-personal-pattern");
  assert.equal(empty.coreAdvantage.confidence, "emerging");
});

test("conditional branch changes remove stale downstream answers", () => {
  const reconciled = reconcileAdvantageAnswers({
    q61: { value: "no" },
    q62: { value: ["time"] },
    q63: { value: ["resourceful"] },
    q64: { value: "often" },
    q65: { value: ["prepare"] },
  });
  assert.deepEqual(reconciled, { q61: { value: "no" } });
});
