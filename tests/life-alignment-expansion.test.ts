import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { careerModule } from "../data/life-alignment-personal";
import { getRelationshipModule, relationshipModuleIds } from "../data/life-alignment-relationship";
import { buildPersonalAlignmentResult } from "../lib/life-alignment-personal";
import { buildRelationshipSharedResult } from "../lib/life-alignment-relationship";
import { appendLifeVisionRound, appendPersonalRound, compareLifeVisionRounds, comparePersonalRounds, compareRelationshipRounds, personalLongitudinalInsights, relationshipLongitudinalInsights, stableLifeVisionAreas } from "../lib/life-alignment-longitudinal";
import { locales } from "../lib/i18n/config";
import { selectQuote } from "../lib/quotes";
import type { AlignmentRoundHistoryItem, RelationshipAnswerSet, RelationshipSharedResult } from "../types/life-alignment-relationship";
import type { LifeVisionResult } from "../types/life-alignment-life-vision";
import type { PersonalAlignmentAnswerSet, PersonalRoundSnapshot } from "../types/life-alignment-personal";

function completedRelationshipAnswers(moduleId: "family" | "team", value: 1 | 2 | 3 | 4 | 5): RelationshipAnswerSet {
  return Object.fromEntries(getRelationshipModule(moduleId).questions.map(({ id }) => [id, { value, importance: "high" as const }]));
}

test("Family and Team are complete localized configurations in the shared relationship engine", () => {
  assert.ok(relationshipModuleIds.includes("family")); assert.ok(relationshipModuleIds.includes("team"));
  for (const moduleId of ["family", "team"] as const) {
    const definition = getRelationshipModule(moduleId);
    assert.equal(definition.sections.length, 4);
    assert.equal(definition.dimensions.length, 10);
    assert.equal(definition.questions.length, 14);
    assert.ok(definition.questions.every(({ prompt, leftLabel, rightLabel }) => locales.every((locale) => prompt[locale].length > 20 && leftLabel[locale].length > 3 && rightLabel[locale].length > 3)));
    const shared = buildRelationshipSharedResult(moduleId, completedRelationshipAnswers(moduleId, 2), completedRelationshipAnswers(moduleId, 4), "en");
    assert.equal(shared.moduleId, moduleId); assert.ok(shared.insights.length > 0);
    assert.doesNotMatch(JSON.stringify(shared), /compatibilityScore|ranking|winner|rawAnswers/iu);
  }
});

test("Career is a concise seven-locale personal module with deterministic result groups", () => {
  assert.equal(careerModule.dimensions.length, 8);
  assert.ok(careerModule.dimensions.every(({ title, prompt }) => locales.every((locale) => title[locale].length > 2 && prompt[locale].length > 20)));
  const answers = Object.fromEntries(careerModule.dimensions.map(({ id }, index) => [id, { current: index < 2 ? 2 : 4, importance: 5 }])) as PersonalAlignmentAnswerSet;
  const result = buildPersonalAlignmentResult(careerModule, answers, "en");
  assert.ok(result); assert.equal(result.tensions.length, 2); assert.equal(result.strongSignals.length, 6);
  assert.doesNotMatch(JSON.stringify(result), /salaryPrediction|jobRank|guarantee|score/iu);
});

function relationshipRound(roundNumber: number, result: RelationshipSharedResult): AlignmentRoundHistoryItem {
  return { roundNumber, completedAt: `2026-0${roundNumber}-01T00:00:00.000Z`, sharedResult: result, agreementStatus: roundNumber === 1 ? "finalized" : "none" };
}

test("relationship comparison requires adjacent completed rounds and three-round stability requires three", () => {
  const base = buildRelationshipSharedResult("family", completedRelationshipAnswers("family", 2), completedRelationshipAnswers("family", 4), "en");
  const first = relationshipRound(1, base);
  assert.deepEqual(relationshipLongitudinalInsights([first]), []);
  const secondResult = structuredClone(base); secondResult.insights = secondResult.insights.map((insight, index) => index === 0 ? { ...insight, category: "strong-alignment" } : insight);
  const second = relationshipRound(2, secondResult);
  assert.ok(compareRelationshipRounds(first, second).some(({ kind }) => kind === "reduced-tension" || kind === "more-aligned"));
  assert.ok(relationshipLongitudinalInsights([first, second]).every(({ minimumRounds }) => minimumRounds === 2));
  const third = relationshipRound(3, structuredClone(secondResult));
  assert.ok(relationshipLongitudinalInsights([first, second, third]).some(({ minimumRounds }) => minimumRounds === 3));
});

test("longitudinal comparisons cover every reachable change and insight label", () => {
  const base = buildRelationshipSharedResult("family", completedRelationshipAnswers("family", 2), completedRelationshipAnswers("family", 4), "en");
  const withCategories = (roundNumber: number, categories: RelationshipSharedResult["insights"][number]["category"][]) => {
    const result = structuredClone(base);
    result.insights = result.insights.map((insight, index) => ({ ...insight, category: categories[index] ?? insight.category }));
    return relationshipRound(roundNumber, result);
  };
  const before = withCategories(1, ["strong-alignment", "strong-alignment", "needs-conversation", "different-workable", "strong-alignment"]);
  const after = withCategories(2, ["strong-alignment", "needs-conversation", "strong-alignment", "complementary-strengths", "complementary-strengths"]);
  assert.deepEqual(
    new Set(compareRelationshipRounds(before, after).map(({ kind }) => kind)),
    new Set(["stable", "new-tension", "reduced-tension", "more-aligned", "less-aligned"]),
  );
  const persistent = [1, 2, 3].map((roundNumber) => withCategories(roundNumber, base.insights.map(() => "needs-conversation")));
  assert.deepEqual(relationshipLongitudinalInsights([persistent[0]!]), []);
  assert.ok(relationshipLongitudinalInsights(persistent.slice(0, 2)).some(({ kind }) => kind === "difference-persists"));
  assert.ok(relationshipLongitudinalInsights(persistent).some(({ kind }) => kind === "stable-three-rounds"));
  assert.ok(relationshipLongitudinalInsights([before, after]).some(({ kind }) => kind === "moved-closer"));

  const personalAnswers = (second: boolean): PersonalAlignmentAnswerSet => Object.fromEntries(careerModule.dimensions.map(({ id }, index) => [id, {
    current: index === 0 ? (second ? 3 : 2) : index === 1 ? (second ? 3 : 4) : 3,
    importance: index === 3 ? (second ? 4 : 2) : 3,
  }])) as PersonalAlignmentAnswerSet;
  const personalBefore = { id: "career-1", moduleId: "career" as const, roundNumber: 1, completedAt: "2026-01-01T00:00:00.000Z", result: buildPersonalAlignmentResult(careerModule, personalAnswers(false), "en")! };
  const personalAfter = { id: "career-2", moduleId: "career" as const, roundNumber: 2, completedAt: "2026-02-01T00:00:00.000Z", result: buildPersonalAlignmentResult(careerModule, personalAnswers(true), "en")! };
  assert.deepEqual(
    new Set(comparePersonalRounds(personalBefore, personalAfter).map(({ kind }) => kind)),
    new Set(["more-aligned", "less-aligned", "stable", "changed-priority"]),
  );
  const personalInsights = personalLongitudinalInsights([personalBefore, personalAfter]);
  assert.ok(personalInsights.some(({ kind }) => kind === "moved-closer"));
  assert.ok(personalInsights.some(({ kind }) => kind === "became-more-important"));
  const personalThird = { ...personalAfter, id: "career-3", roundNumber: 3, completedAt: "2026-03-01T00:00:00.000Z" };
  assert.ok(personalLongitudinalInsights([personalBefore, personalAfter, personalThird]).some(({ kind }) => kind === "stable-three-rounds"));
});

test("personal rounds append without overwriting history and compare only canonical derived signals", () => {
  const answerSet = (current: 2 | 4, importance: 4 | 5): PersonalAlignmentAnswerSet => Object.fromEntries(careerModule.dimensions.map(({ id }) => [id, { current, importance }])) as PersonalAlignmentAnswerSet;
  const firstResult = buildPersonalAlignmentResult(careerModule, answerSet(2, 4), "en")!;
  const secondResult = buildPersonalAlignmentResult(careerModule, answerSet(4, 4), "en")!;
  const thirdResult = buildPersonalAlignmentResult(careerModule, answerSet(4, 4), "en")!;
  let history: PersonalRoundSnapshot[] = appendPersonalRound([], "career", firstResult, "2026-01-01T00:00:00.000Z");
  history = appendPersonalRound(history, "career", secondResult, "2026-02-01T00:00:00.000Z");
  history = appendPersonalRound(history, "career", thirdResult, "2026-03-01T00:00:00.000Z");
  assert.deepEqual(history.map(({ roundNumber }) => roundNumber), [1, 2, 3]);
  assert.ok(comparePersonalRounds(history[0]!, history[1]!).every(({ kind }) => kind === "more-aligned"));
  assert.ok(personalLongitudinalInsights(history).some(({ kind, minimumRounds }) => kind === "stable-three-rounds" && minimumRounds === 3) === false);
  assert.equal(history[0]!.result.dimensions[0]!.current, 2);
});

test("Life Vision keeps bounded derived browser snapshots with adjacent and three-round context", () => {
  const result = (emphasis: "more" | "different", isProtected: boolean) => ({ areas: [{ id: "work-contribution", title: "Work and contribution", emphasis, protected: isProtected }] }) as unknown as Pick<LifeVisionResult, "areas">;
  let history = appendLifeVisionRound([], result("more", true), "2026-01-01T00:00:00.000Z");
  assert.equal(history.length, 1);
  assert.deepEqual(stableLifeVisionAreas(history), []);
  history = appendLifeVisionRound(history, result("different", true), "2026-01-01T00:10:00.000Z");
  assert.equal(history.length, 2);
  assert.deepEqual(compareLifeVisionRounds(history[0]!, history[1]!), ["work-contribution"]);
  assert.equal(history[0]!.areas[0]!.emphasis, "more");
  const duplicate = appendLifeVisionRound(history, result("different", true), "2026-01-01T00:11:00.000Z");
  assert.equal(duplicate.length, 2);
  const stable = [0, 10, 20].reduce((rounds, minutes) => appendLifeVisionRound(rounds, result("more", true), `2026-01-01T00:${String(minutes).padStart(2, "0")}:00.000Z`), [] as ReturnType<typeof appendLifeVisionRound>);
  assert.deepEqual(stableLifeVisionAreas(stable), ["work-contribution"]);
  const bounded = Array.from({ length: 22 }, (_, index) => index).reduce((rounds, index) => appendLifeVisionRound(rounds, result(index % 2 ? "different" : "more", true), `2026-01-01T${String(Math.floor(index / 6)).padStart(2, "0")}:${String((index % 6) * 10).padStart(2, "0")}:00.000Z`), [] as ReturnType<typeof appendLifeVisionRound>);
  assert.equal(bounded.length, 20);
  assert.deepEqual(bounded.map(({ roundNumber }) => roundNumber), Array.from({ length: 20 }, (_, index) => index + 3));
});

test("B6 migration is forward-only, service-only, bounded, authority checked, and preserves round agreements", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20260922000000_life_alignment_expansion_rounds.sql", import.meta.url), "utf8").toLowerCase();
  assert.match(sql, /module_id in \('partner', 'friendship', 'founder', 'family', 'team'\)/u);
  assert.match(sql, /create function public\.start_alignment_round/u);
  assert.match(sql, /create function public\.get_alignment_round_history/u);
  assert.match(sql, /limit least\(greatest\(coalesce\(p_limit, 20\), 1\), 20\)/u);
  assert.match(sql, /participant\.capability_hash = p_capability_hash/u);
  assert.doesNotMatch(sql, /alignment_answers[\s\S]*get_alignment_round_history[\s\S]*answer_value/u);
  const startRound = sql.slice(sql.indexOf("create function public.start_alignment_round"), sql.indexOf("create function public.get_alignment_round_history"));
  assert.doesNotMatch(startRound, /delete from public\.alignment_agreement|update public\.alignment_agreement/u);
  assert.match(sql, /round\.round_number = \(select max\(current_round\.round_number\)/u);
  assert.doesNotMatch(sql, /drop table|truncate|alter table auth\.|delete from auth\./u);
  for (const name of ["start_alignment_round", "get_alignment_round_history"]) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${name}`));
    assert.match(sql, new RegExp(`grant execute on function public\\.${name}`));
  }
  assert.ok((sql.match(/security definer/gu) ?? []).length >= 4);
  assert.ok((sql.match(/set search_path = pg_catalog, pg_temp/gu) ?? []).length >= 4);
});

test("new modules receive semantically mapped Quote Universe context", () => {
  for (const moduleId of ["family", "team", "career", "life-vision"] as const) {
    const selected = selectQuote({ locale: "en", surface: "life-alignment", themes: ["clarity"], lifeAlignment: { moduleId } });
    assert.notEqual(selected.fallbackLevel, "general");
  }
});

test("timeline sources exclude analytics, public sharing and counterpart raw answers", () => {
  const sources = [
    readFileSync("components/life-alignment/personal/personal-alignment-journey.tsx", "utf8"),
    readFileSync("components/life-alignment/personal/life-vision-timeline.tsx", "utf8"),
    readFileSync("components/life-alignment/relationship/relationship-session-experience.tsx", "utf8"),
  ].join("\n");
  for (const prohibited of ["sendBeacon", "counterpartAnswers", "rawAnswers", "window.location.href"]) assert.equal(sources.includes(prohibited), false, prohibited);
  assert.match(sources, /slice\(-20\)|p_limit/u);
});
