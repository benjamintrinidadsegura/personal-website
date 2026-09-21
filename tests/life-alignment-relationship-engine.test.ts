import assert from "node:assert/strict";
import test from "node:test";

import {
  assertRelationshipModuleCompleteness,
  getRelationshipModule,
  relationshipModuleIds,
} from "../data/life-alignment-relationship";
import {
  buildRelationshipSharedResult,
  buildRelationshipSoloResult,
  isRelationshipAssessmentComplete,
  normalizeRelationshipAnswers,
} from "../lib/life-alignment-relationship";
import type {
  RelationshipAnswerSet,
  RelationshipImportance,
  RelationshipModuleId,
} from "../types/life-alignment-relationship";

function answers(
  moduleId: RelationshipModuleId,
  value: 1 | 2 | 3 | 4 | 5,
  importance: RelationshipImportance = "medium",
): Record<string, { value: 1 | 2 | 3 | 4 | 5; importance: RelationshipImportance }> {
  return Object.fromEntries(getRelationshipModule(moduleId).questions.map(({ id }) => [id, { value, importance }]));
}

test("relationship registry is complete in all seven locales with stable module-specific content", () => {
  assert.doesNotThrow(assertRelationshipModuleCompleteness);
  assert.deepEqual(relationshipModuleIds, ["partner", "friendship", "founder"]);

  const partner = getRelationshipModule("partner");
  const friendship = getRelationshipModule("friendship");
  const founder = getRelationshipModule("founder");
  assert.equal(partner.sections.length, 6);
  assert.equal(partner.dimensions.length, 12);
  assert.equal(partner.questions.length, 18);
  assert.equal(friendship.sections.length, 5);
  assert.equal(friendship.dimensions.length, 11);
  assert.equal(friendship.questions.length, 16);
  assert.equal(founder.sections.length, 7);
  assert.equal(founder.dimensions.length, 21);
  assert.equal(founder.questions.length, 30);
  assert.notDeepEqual(partner.questions.map(({ id }) => id), friendship.questions.map(({ id }) => id));
  assert.equal(founder.sections.some(({ id }) => id === "crisis"), true);
  assert.equal(founder.questions.filter(({ sectionId, kind }) => sectionId === "crisis" && kind === "scenario").length, 3);
});

test("normalization fails closed on unknown IDs and invalid answer shapes", () => {
  const definition = getRelationshipModule("friendship");
  const valid = answers("friendship", 3);
  assert.ok(normalizeRelationshipAnswers(definition, valid));
  assert.equal(normalizeRelationshipAnswers(definition, { ...valid, unexpected: { value: 3, importance: "high" } }), null);
  const invalid = { ...valid, [definition.questions[0]!.id]: { value: 9, importance: "high" } };
  assert.equal(normalizeRelationshipAnswers(definition, invalid), null);
});

test("shared engine yields strong alignment without any global compatibility score", () => {
  const result = buildRelationshipSharedResult("partner", answers("partner", 3), answers("partner", 3), "en");
  assert.ok(result.categories["strong-alignment"].length > 0);
  assert.equal("score" in result, false);
  assert.doesNotMatch(JSON.stringify(result), /\b(?:compatible|compatibility percentage|good match|bad match)\b/i);
});

test("low-priority differences remain workable while important large differences become friction", () => {
  const low = buildRelationshipSharedResult("friendship", answers("friendship", 1, "low"), answers("friendship", 5, "low"), "en");
  assert.ok(low.categories["different-workable"].length > 0);
  assert.equal(low.categories["potential-friction"].length, 0);

  const high = buildRelationshipSharedResult("friendship", answers("friendship", 1, "high"), answers("friendship", 5, "high"), "en");
  assert.ok(high.categories["potential-friction"].length > 0);
  assert.match(high.categories["potential-friction"][0]!.explanation, /may create|puede generar|kann|yaratabilir|może|μπορεί|может/u);
});

test("complementary dimensions stay qualitative and evidence-linked", () => {
  const left = answers("founder", 2, "medium");
  const right = answers("founder", 2, "medium");
  for (const question of getRelationshipModule("founder").questions) {
    if (question.complementary) {
      left[question.id] = { value: 1, importance: "medium" };
      right[question.id] = { value: 4, importance: "medium" };
    }
  }
  const result = buildRelationshipSharedResult("founder", left, right, "en");
  assert.ok(result.categories["complementary-strengths"].length > 0);
  assert.ok(result.categories["complementary-strengths"].every(({ evidence }) => evidence.length > 0));
});

test("solo reflection never fabricates a counterpart", () => {
  const result = buildRelationshipSoloResult("partner", answers("partner", 4, "high"), "en");
  assert.equal(result.kind, "solo");
  assert.ok(result.reflections.length > 0);
  assert.doesNotMatch(JSON.stringify(result), /the other participant answered|you both|your compatibility/i);
});

test("partial answers are accepted only for progress, never as completed assessment", () => {
  const definition = getRelationshipModule("founder");
  const partial = { [definition.questions[0]!.id]: { value: 3, importance: "high" } };
  const normalized = normalizeRelationshipAnswers(definition, partial, true);
  assert.ok(normalized);
  assert.equal(isRelationshipAssessmentComplete(definition, normalized as RelationshipAnswerSet), false);
  assert.throws(() => buildRelationshipSoloResult("founder", normalized as RelationshipAnswerSet), /ASSESSMENT_INCOMPLETE/);
});

test("the same answer evidence produces the same underlying categories in every locale", () => {
  const left = answers("partner", 1, "high");
  const right = answers("partner", 4, "high");
  const en = buildRelationshipSharedResult("partner", left, right, "en");
  const de = buildRelationshipSharedResult("partner", left, right, "de");
  assert.deepEqual(en.insights.map(({ id, category, evidence }) => ({ id, category, evidence })), de.insights.map(({ id, category, evidence }) => ({ id, category, evidence })));
  assert.notEqual(en.insights[0]?.title, de.insights[0]?.title);
});
