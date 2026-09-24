import assert from "node:assert/strict";
import test from "node:test";

import { getMoneyProfileUiCopy } from "../data/money-profile-locales";
import {
  moneyDimensions,
  moneyInterventions,
  moneyMeaningLabels,
  moneyProfileFamilies,
  moneyStressResponseLabels,
  moneyTensionDefinitions,
} from "../data/money-profile";
import { moneyQuestions } from "../data/money-profile-questions";
import { locales } from "../lib/i18n/config";
import { moneyDimensionIds, moneyMeaningIds, moneyProfileFamilyIds, moneyStressResponseIds } from "../types/money-profile";

test("Money Profile exposes exactly the canonical dimensions, meanings, stress responses and interpretation families", () => {
  assert.equal(moneyDimensions.length, 12);
  assert.deepEqual(moneyDimensions.map(({ id }) => id), moneyDimensionIds);
  assert.equal(new Set(moneyDimensions.map(({ id }) => id)).size, 12);
  for (const dimension of moneyDimensions) {
    assert.ok(dimension.definition.length > 30, dimension.id);
    assert.ok(dimension.potentialStrength.length > 10, dimension.id);
    assert.ok(dimension.potentialTradeOff.length > 10, dimension.id);
    assert.equal(moneyQuestions.some(({ options }) => options.some(({ effects }) => effects?.some(({ dimensionId }) => dimensionId === dimension.id))), true, dimension.id);
  }
  assert.deepEqual(Object.keys(moneyMeaningLabels), [...moneyMeaningIds]);
  assert.equal(moneyMeaningIds.some((id) => moneyDimensionIds.includes(id as never)), false);
  assert.deepEqual(Object.keys(moneyStressResponseLabels), [...moneyStressResponseIds]);
  assert.equal(moneyProfileFamilies.length, 7);
  assert.deepEqual(moneyProfileFamilies.map(({ id }) => id), moneyProfileFamilyIds);
  assert.equal(moneyProfileFamilies.find(({ id }) => id === "distance-keeper")?.label, "The Distance Keeper");
  assert.equal(moneyProfileFamilies.some(({ label }) => String(label) === "The Avoider"), false);
});

test("all 42 canonical core definitions exist and adaptive prerequisites resolve exactly", () => {
  assert.equal(moneyQuestions.length, 42);
  assert.deepEqual(moneyQuestions.map(({ id }) => id), Array.from({ length: 42 }, (_, index) => `m${index + 1}`));
  assert.equal(new Set(moneyQuestions.map(({ id }) => id)).size, 42);
  assert.deepEqual(moneyQuestions.find(({ id }) => id === "m39")?.condition?.allDimensions, ["security-orientation", "freedom-orientation"]);
  assert.deepEqual(moneyQuestions.find(({ id }) => id === "m40")?.condition?.allDimensions, ["present-enjoyment", "future-orientation"]);
  assert.deepEqual(moneyQuestions.find(({ id }) => id === "m41")?.condition?.allDimensions, ["planning-structure", "financial-avoidance"]);
  assert.equal(moneyQuestions.find(({ id }) => id === "m42")?.type, "calibration");
  for (const question of moneyQuestions) {
    assert.ok(question.options.length >= 3 || question.id === "m17" || question.id === "m24", question.id);
    assert.equal(new Set(question.options.map(({ id }) => id)).size, question.options.length, question.id);
    if (question.maxSelections) assert.ok(question.maxSelections <= question.options.length, question.id);
    for (const condition of question.condition?.allDimensions ?? []) assert.ok(moneyDimensionIds.includes(condition), `${question.id}:${condition}`);
    for (const option of question.options) for (const item of option.effects ?? []) assert.ok(moneyDimensionIds.includes(item.dimensionId), `${question.id}:${item.dimensionId}`);
  }
});

test("questions collect structured behavioural evidence without requiring private financial data or targeting a profile family", () => {
  const combined = moneyQuestions.map(({ prompt, instruction, options }) => [prompt, instruction, ...options.map(({ label }) => label)].filter(Boolean).join(" ")).join("\n");
  assert.doesNotMatch(combined, /(?:what is|enter|provide|tell us).*(?:income|account balance|net worth|debt amount|credit score|bank password|account number)/iu);
  assert.equal(moneyQuestions.some(({ type }) => type === ("text" as never)), false);
  assert.equal(moneyQuestions.some(({ options }) => options.some((option) => "profileFamily" in option)), false);
  assert.equal(moneyQuestions.find(({ id }) => id === "m6")?.instruction?.includes("hypothetical"), true);
  assert.equal(moneyQuestions.find(({ id }) => id === "m36")?.maxSelections, 2);
  assert.equal(moneyQuestions.find(({ id }) => id === "m1")?.maxSelections, 3);
});

test("tensions and intervention library are complete, unique and behavioural rather than prescriptive", () => {
  assert.equal(moneyTensionDefinitions.length, 8);
  assert.equal(new Set(moneyTensionDefinitions.map(({ id }) => id)).size, 8);
  const required = ["automatic-future-money", "fun-money-pot", "purchase-pause", "ten-minute-money-check", "fixed-cost-separation", "one-visible-goal", "minimum-viable-buffer", "permission-to-spend", "friction-for-impulse", "reduce-money-decisions", "first-small-action", "ask-for-help-earlier"];
  assert.deepEqual(moneyInterventions.map(({ id }) => id), required);
  assert.equal(new Set(moneyInterventions.map(({ id }) => id)).size, required.length);
  const content = moneyInterventions.map(({ concept, whyItMayHelp }) => `${concept} ${whyItMayHelp}`).join("\n");
  assert.doesNotMatch(content, /\b(?:ETF|stock|bond|lender|credit product|repayment order|tax strategy)\b/iu);
  assert.doesNotMatch(content, /\b\d+\s*%/u);
});

test("all seven locales provide complete functional Money Profile copy with truthful canonical-language disclosure", () => {
  assert.deepEqual(locales, ["de", "en", "es", "tr", "pl", "el", "ru"]);
  for (const locale of locales) {
    const copy = getMoneyProfileUiCopy(locale);
    assert.ok(copy.publicTitle.length > 8, locale);
    assert.ok(copy.cta.length > 5, locale);
    assert.equal(copy.noAsk.length, 3, locale);
    assert.equal(copy.patterns.length, 4, locale);
    assert.ok(copy.contentLanguageNotice.length > 25, locale);
    assert.ok(copy.safetyBoundary.length > 40, locale);
  }
});
