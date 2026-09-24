import assert from "node:assert/strict";
import test from "node:test";

import { advantageQuestions } from "../data/personal-advantage-questions";
import { advantageSignalById, advantageSignals } from "../data/personal-advantage-signals";
import { curatedAdvantageSynergies } from "../data/personal-advantage-synergies";
import { advantageEvidenceClasses, advantageSignalDomains } from "../types/personal-advantage";

test("the assessment has 58 real signals across all nine domains", () => {
  assert.equal(advantageSignals.length, 58);
  assert.equal(new Set(advantageSignals.map(({ id }) => id)).size, 58);
  assert.deepEqual([...new Set(advantageSignals.map(({ domain }) => domain))].sort(), [...advantageSignalDomains].sort());
  for (const domain of advantageSignalDomains) {
    assert.ok(advantageSignals.filter((signal) => signal.domain === domain).length >= 2, `domain ${domain} is too thin`);
  }
  for (const signal of advantageSignals) {
    assert.ok(signal.definition.length > 45);
    assert.ok(signal.contexts.length >= 2);
    assert.ok(signal.overusePatterns.length >= 1);
    assert.ok(signal.possibleMultipliers.length >= 1);
  }
});

test("the canonical core journey contains q1 through q65 with bounded, valid interactions", () => {
  assert.equal(advantageQuestions.length, 65);
  assert.deepEqual(advantageQuestions.map(({ id }) => id), Array.from({ length: 65 }, (_, index) => `q${index + 1}`));
  assert.ok(advantageQuestions.filter(({ condition }) => condition).length >= 6);
  assert.ok(advantageQuestions.filter(({ type }) => type === "adaptive-signals").length >= 4);
  assert.ok(advantageQuestions.some(({ type, freeTextLimit, optional }) => type === "text" && optional && freeTextLimit === 280));
  assert.deepEqual([...new Set(advantageQuestions.map(({ evidenceClass }) => evidenceClass))].sort(), [...advantageEvidenceClasses].sort());

  for (const question of advantageQuestions) {
    if (question.type === "text" || question.type === "adaptive-signals") assert.equal(question.options.length, 0);
    else assert.ok(question.options.length >= 2, `${question.id} needs real options`);
    if (question.type === "multi" || question.type === "adaptive-signals") assert.ok((question.maxSelections ?? 0) > 0);
    for (const option of question.options) {
      for (const effect of option.effects) assert.ok(advantageSignalById.has(effect.signalId), `unknown signal ${effect.signalId} in ${question.id}`);
    }
  }
});

test("every signal is reachable through authored evidence and not placeholder generation", () => {
  const covered = new Set(advantageQuestions.flatMap(({ options }) => options.flatMap(({ effects }) => effects.map(({ signalId }) => signalId))));
  assert.deepEqual(advantageSignals.filter(({ id }) => !covered.has(id)).map(({ id }) => id), []);
  assert.ok(advantageQuestions.some(({ evidenceClass, options }) => evidenceClass === "outcome" && options.some(({ effects }) => effects.length)));
  assert.ok(advantageQuestions.some(({ evidenceClass, options }) => evidenceClass === "external" && options.some(({ effects }) => effects.length)));
  assert.ok(advantageQuestions.some(({ evidenceClass }) => evidenceClass === "cross-context"));
});

test("the combination library is curated, typed, and covers every intended synergy mechanism", () => {
  assert.ok(curatedAdvantageSynergies.length >= 60);
  assert.equal(new Set(curatedAdvantageSynergies.map(({ id }) => id)).size, curatedAdvantageSynergies.length);
  assert.deepEqual(
    [...new Set(curatedAdvantageSynergies.map(({ type }) => type))].sort(),
    ["amplification", "bridge", "constraint-transformation", "distinctive-perspective", "distribution", "reinforcement", "translation"],
  );
  for (const synergy of curatedAdvantageSynergies) {
    assert.ok(synergy.signalIds.length >= 2 && synergy.signalIds.length <= 3);
    assert.ok(synergy.signalIds.every((id) => advantageSignalById.has(id)));
    assert.ok(synergy.synthesis.length > 90);
    assert.ok(synergy.recognition.length >= 3);
    assert.ok(synergy.contexts.length >= 2);
    assert.ok(synergy.killers.length >= 2);
    assert.ok(synergy.counterweight.length > 25);
  }
});
