import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveMoneyProfile,
  getVisibleMoneyQuestions,
  moneyDimensionResult,
  moneyEngineHasFiniteOutput,
} from "../lib/money-profile-engine";
import type { MoneyAnswerSet, MoneyCalibration } from "../types/money-profile";

function answers(values: Record<string, string | readonly string[]>): MoneyAnswerSet {
  return Object.fromEntries(Object.entries(values).map(([id, value]) => [id, { value }]));
}

const healthyEnjoyer = answers({ m1: ["experiences", "comfort"], m2: "experiences", m3: "experiences", m5: "now", m6: "split", m7: "wait", m8: "neither", m9: "experience", m10: "easy", m20: "now", m24: "today", m30: "never", m33: "expected", m36: ["none"] });
const healthyProtector = answers({ m1: ["security", "peace"], m2: "buffer", m3: "stable", m5: "safer", m6: "protect", m7: "wait", m8: "neither", m14: "separate", m20: "very", m21: "satisfying", m24: "future", m25: "buffer", m26: "solve", m29: "necessary", m36: ["none"], m37: "step" });

test("same structured input produces the same complete finite result", () => {
  const first = deriveMoneyProfile(healthyProtector);
  const second = deriveMoneyProfile(healthyProtector);
  assert.deepEqual(first, second);
  assert.equal(moneyEngineHasFiniteOutput(first), true);
  assert.ok(first.nextSteps.length >= 3 && first.nextSteps.length <= 5);
});

test("Money Meaning changes interpretation metadata without rewriting the same behavioural evidence", () => {
  const safety = deriveMoneyProfile(answers({ m1: ["security", "peace"], m2: "buffer", m3: "stable", m6: "wait", m7: "wait", m14: "mental", m20: "large" }));
  const freedom = deriveMoneyProfile(answers({ m1: ["freedom", "choices"], m2: "choice", m3: "say-no", m6: "wait", m7: "wait", m14: "mental", m20: "large" }));
  assert.notDeepEqual(safety.meanings.map(({ id }) => id), freedom.meanings.map(({ id }) => id));
  assert.equal(moneyDimensionResult(safety, "spending-impulsivity").net, moneyDimensionResult(freedom, "spending-impulsivity").net);
});

test("baseline and stress remain separate and stress evidence cannot redefine the primary family alone", () => {
  const base = { m1: ["security", "peace"] as const, m2: "buffer", m3: "stable", m5: "safer", m6: "protect", m14: "separate", m20: "very", m21: "satisfying", m24: "future", m25: "buffer", m36: ["none"] as const };
  const control = deriveMoneyProfile(answers({ ...base, m26: "check", m27: "much" }));
  const avoid = deriveMoneyProfile(answers({ ...base, m26: "avoid", m28: "repeatedly" }));
  assert.equal(control.primaryProfile?.id, "protector");
  assert.equal(avoid.primaryProfile?.id, "protector");
  assert.equal(control.stress.primary, "control");
  assert.equal(avoid.stress.primary, "avoid");
  assert.notEqual(control.stress.description, avoid.stress.description);
});

test("supporting and contradicting evidence remain separate", () => {
  const supported = deriveMoneyProfile(answers({ m13: "postpone", m19: "delay", m28: "repeatedly", m33: "late" }));
  const contradicted = deriveMoneyProfile(answers({ m13: "neutral", m19: "immediately", m28: "never", m33: "expected" }));
  const a = moneyDimensionResult(supported, "financial-avoidance");
  const b = moneyDimensionResult(contradicted, "financial-avoidance");
  assert.ok(a.support > 0 && a.contradiction === 0);
  assert.ok(b.contradiction > 0);
  assert.ok(a.net > b.net);
});

test("conditional probes appear only when their dimension evidence qualifies", () => {
  assert.equal(getVisibleMoneyQuestions({}).some(({ id }) => id === "m39"), false);
  const securityFreedom = answers({ m1: ["security", "freedom", "choices"], m2: "buffer", m3: "say-no", m5: "options", m6: "wait", m16: "pot", m17: "restricted", m21: "options", m25: "options" });
  assert.equal(getVisibleMoneyQuestions(securityFreedom).some(({ id }) => id === "m39"), true);
  assert.equal(getVisibleMoneyQuestions(securityFreedom).some(({ id }) => id === "m40"), false);
});

test("Planning plus Avoidance creates the accepted tension and bounded contact recommendation", () => {
  const result = deriveMoneyProfile(answers({ m13: "postpone", m14: "track", m15: "drops", m18: "difficult", m19: "delay", m26: "avoid", m28: "repeatedly", m34: "stop", m36: ["admin"] }));
  assert.ok(result.tensions.some(({ id }) => id === "planning-avoidance"));
  assert.ok(result.interventions.some(({ id }) => id === "ten-minute-money-check"));
  assert.match(result.tensions.find(({ id }) => id === "planning-avoidance")!.insight, /lose access|may not lack/iu);
});

test("healthy Enjoyer and Protector fixtures are not moralized or given unsupported fixes", () => {
  const enjoyer = deriveMoneyProfile(healthyEnjoyer);
  const protector = deriveMoneyProfile(healthyProtector);
  assert.equal(enjoyer.primaryProfile?.id, "enjoyer");
  assert.equal(protector.primaryProfile?.id, "protector");
  assert.equal(enjoyer.blindSpots.length, 0);
  assert.equal(enjoyer.interventions.some(({ id }) => id === "purchase-pause" || id === "friction-for-impulse"), false);
  assert.equal(protector.interventions.some(({ id }) => id === "permission-to-spend"), false);
  assert.doesNotMatch(JSON.stringify([enjoyer, protector]), /bad with money|irresponsible|immature|greedy|lazy/iu);
});

test("recommendations discriminate control overload, impulse regret, freeze and real constraint", () => {
  const optimizer = deriveMoneyProfile(answers({ m11: "track", m13: "frequent", m14: "track", m15: "clear", m17: "not-knowing", m18: "safety", m26: "check", m27: "much", m31: "focus", m36: ["checking"] }));
  const impulse = deriveMoneyProfile(answers({ m7: "buy", m8: "spending", m10: "questionable", m11: "add-up", m30: "repeatedly", m33: "small", m35: "less", m36: ["spending"] }));
  const freeze = deriveMoneyProfile(answers({ m26: "freeze", m31: "overwhelmed", m36: ["start"], m37: "overwhelming", m38: "postpone" }));
  const constrained = deriveMoneyProfile(answers({ m26: "freeze", m31: "sequence", m36: ["start"], m37: "limited", m38: "simple" }));
  assert.ok(optimizer.interventions.some(({ id }) => id === "reduce-money-decisions"));
  assert.ok(impulse.interventions.some(({ id }) => id === "purchase-pause"));
  assert.ok(freeze.interventions.some(({ id }) => id === "first-small-action"));
  assert.ok(constrained.interventions.some(({ id }) => id === "ask-for-help-earlier"));
  assert.equal(constrained.interventions.some(({ id }) => id === "minimum-viable-buffer" || id === "permission-to-spend"), false);
});

test("mixed, context-dependent and no-type fallbacks work without forcing a label", () => {
  const mixed = deriveMoneyProfile(answers({ m1: ["security", "freedom", "choices"], m2: "buffer", m3: "say-no", m5: "options", m6: "wait", m7: "check-purpose", m14: "separate", m17: "restricted", m20: "very", m21: "options", m24: "future", m25: "options", m36: ["none"], m37: "step" }));
  const contextual = deriveMoneyProfile(answers({ m6: "depends", m9: "context", m12: "context", m20: "stress", m26: "depends", m33: "varies" }));
  const empty = deriveMoneyProfile({});
  assert.equal(mixed.confidenceMode, "mixed-profile");
  assert.ok(mixed.primaryProfile && mixed.secondaryProfile);
  assert.equal(contextual.confidenceMode, "context-dependent");
  assert.equal(contextual.primaryProfile, null);
  assert.equal(empty.confidenceMode, "money-map");
  assert.equal(empty.primaryProfile, null);
  assert.equal(moneyEngineHasFiniteOutput(empty), true);
});

test("calibration can refine close evidence but cannot manufacture a weak profile", () => {
  const empty = deriveMoneyProfile({}, { "hypothesis-protector": "very-true" } as MoneyCalibration);
  assert.equal(empty.primaryProfile, null);
  const source = healthyProtector;
  const hypothesis = deriveMoneyProfile(source).calibrationHypotheses[0];
  const rejected = deriveMoneyProfile(source, hypothesis ? { [hypothesis.id]: "not-really" } : {});
  assert.equal(moneyEngineHasFiniteOutput(rejected), true);
});

test("result language never exposes numeric dimension percentages or prohibited financial prescriptions", () => {
  const result = deriveMoneyProfile(answers({ m7: "buy", m8: "spending", m10: "questionable", m30: "sometimes", m35: "less", m36: ["spending"] }));
  const publicText = JSON.stringify({ baseline: result.baseline, stress: result.stress.description, strengths: result.strengths, blindSpots: result.blindSpots, interventions: result.interventions, nextSteps: result.nextSteps, experiment: result.experiment });
  assert.doesNotMatch(publicText, /\b\d+\s*%/u);
  assert.doesNotMatch(publicText, /\b(?:ETF|stock|bond|lender|asset allocation|repayment order|tax strategy)\b/iu);
  assert.ok(result.nextSteps.length >= 3 && result.nextSteps.length <= 5);
  assert.ok(result.interventions.some(({ effort }) => effort === "low"));
});
