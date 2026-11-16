import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TeamSoloResultView } from "../components/life-alignment/relationship/team-solo-result";
import { teamInsightLabels, teamPatternCopy } from "../data/i18n/life-alignment-team-insights";
import { getRelationshipModule } from "../data/life-alignment-relationship";
import { locales } from "../lib/i18n/config";
import { buildRelationshipSoloResult } from "../lib/life-alignment-relationship";
import { buildTeamSoloInsights } from "../lib/life-alignment-team-insights";
import { teamProfiles } from "./fixtures/team-solo-profiles";

const profile = (id: string) => teamProfiles.find(p => p.id === id)!;
const definition = getRelationshipModule("team");

test("opposite actual Team evidence produces different connections, not identical answer paraphrases", () => {
  const expected: Record<string, string[]> = {
    "owned-flexible": ["owned-flexible"], "explicit-under-pressure": ["explicit"], collaborative: ["collaborative"],
    "individual-focus": ["individual"], "gradual-repair": ["gradual"], "direct-repair": ["direct"],
    "context-shift": ["pressure-shift"], incomplete: [], midpoint: [],
    "competing-priorities": ["feedback-repair", "speed-quality", "shared-execution"],
  };
  for (const p of teamProfiles) assert.deepEqual(buildTeamSoloInsights(p.answers).insights.map(i => i.pattern), expected[p.id], p.id);
  const a = buildTeamSoloInsights(profile("gradual-repair").answers);
  const b = buildTeamSoloInsights(profile("direct-repair").answers);
  assert.notEqual(a.insights[0]!.meaning, b.insights[0]!.meaning);
  assert.notEqual(a.insights[0]!.experiment, b.insights[0]!.experiment);
  assert.notEqual(a.insights[0]!.conversation, b.insights[0]!.conversation);
});

test("every combined interpretation has at least two exact supported directional answers", () => {
  for (const p of teamProfiles) for (const locale of locales) {
    const result = buildTeamSoloInsights(p.answers, locale);
    assert.ok(result.insights.length <= 3);
    assert.equal(new Set(result.insights.map(i => i.pattern)).size, result.insights.length);
    for (const insight of result.insights) {
      assert.ok(insight.evidence.length >= 2);
      for (const e of insight.evidence) {
        assert.ok(definition.questions.some(q => q.id === e.questionId));
        assert.equal(e.value, p.answers[e.questionId]!.value);
        assert.equal(e.importance, p.answers[e.questionId]!.importance);
        assert.notEqual(e.value, 3);
      }
    }
  }
});

test("removing either supporting answer removes its claim and never invents a counterpart", () => {
  const original = profile("owned-flexible").answers;
  for (const questionId of ["team-autonomy-position", "team-communication-position"]) {
    const copy = { ...original }; delete copy[questionId];
    assert.equal(buildTeamSoloInsights(copy).insights.some(i => i.pattern === "owned-flexible"), false);
  }
  assert.doesNotMatch(JSON.stringify(buildTeamSoloInsights(original)), /your team agrees|you both|your colleague answered|compatibility|diagnos|suitab/i);
});

test("incomplete and no-answer inputs remain limited while final completion still fails closed", () => {
  const partial = buildTeamSoloInsights(profile("incomplete").answers);
  assert.equal(partial.complete, false);
  assert.equal(partial.answeredRequired, 1);
  assert.equal(partial.required, 10);
  assert.equal(partial.insights.length, 0);
  assert.equal(partial.missingQuestionIds.length, 13);
  assert.throws(() => buildRelationshipSoloResult("team", profile("incomplete").answers), /ASSESSMENT_INCOMPLETE/);
  const empty = buildTeamSoloInsights({});
  assert.equal(empty.answeredRequired, 0);
  assert.deepEqual(empty.insights, []);
});

test("midpoints do not establish balance, uncertainty, friction or a working style", () => {
  const result = buildTeamSoloInsights(profile("midpoint").answers);
  assert.deepEqual(result.insights, []);
  assert.equal(result.midpointQuestionIds.length, 14);
  assert.equal(result.complete, true);
  assert.equal(result.unmatchedQuestionIds.length, 0);
});

test("pressure reversals are contextual and take precedence over an unstable ordinary preference", () => {
  const answers = { ...profile("context-shift").answers, "team-reliability-position": { value: 5 as const, importance: "high" as const } };
  const result = buildTeamSoloInsights(answers);
  assert.equal(result.insights[0]!.pattern, "pressure-shift");
  assert.deepEqual(result.insights[0]!.evidence.map(e => e.questionId), ["team-communication-position", "team-communication-scenario"]);
  assert.ok(!result.insights.some(i => i.pattern === "explicit"));
  assert.match(result.insights[0]!.meaning, /context, not an error/);
  const noReversal = buildTeamSoloInsights({ ...answers, "team-communication-scenario": { value: 3, importance: "high" } });
  assert.ok(!noReversal.insights.some(i => i.pattern === "pressure-shift"));
});

test("multiple context shifts combine their evidence without repeating the same advice", () => {
  const answers = { ...profile("context-shift").answers, "team-decisions-position": { value: 1 as const, importance: "high" as const }, "team-coordination-scenario": { value: 5 as const, importance: "high" as const } };
  const result = buildTeamSoloInsights(answers);
  assert.equal(result.insights.filter(i => i.pattern === "pressure-shift").length, 1);
  assert.equal(result.insights[0]!.evidence.length, 4);
  assert.equal(result.insights[0]!.evidence.filter(e => e.questionId.includes("scenario")).length, 2);
});

test("missing optional scenarios do not block completion or count as matching ordinary answers", () => {
  const answers = { ...profile("owned-flexible").answers };
  for (const q of definition.questions.filter(q => q.optional)) delete answers[q.id];
  const result = buildRelationshipSoloResult("team", answers);
  assert.equal(result.teamInsights!.complete, true);
  assert.equal(result.teamInsights!.answeredScenarios, 0);
  assert.ok(result.teamInsights!.insights.every(i => i.evidence.every(e => !e.questionId.includes("scenario"))));
  assert.equal(result.interpretationVersion, "team-solo-insights-v1");
});

test("invalid and unknown evidence is rejected, including prototype-key and non-Team inputs", () => {
  for (const answers of [{ unknown: { value: 5, importance: "high" } }, { "team-feedback-position": { value: 6, importance: "high" } }, { "team-feedback-position": { value: 4, importance: "urgent" } }, { "founder-feedback-position": { value: 4, importance: "high" } }, JSON.parse('{"__proto__":{"value":1,"importance":"high"}}')]) {
    assert.throws(() => buildTeamSoloInsights(answers as never), /INVALID_TEAM_EVIDENCE/);
  }
});

test("all seven locales preserve the same evidence and cautious domain-specific distinctions without fallback", () => {
  for (const localized of [...Object.values(teamInsightLabels), ...Object.values(teamPatternCopy).flatMap(Object.values)]) {
    assert.deepEqual(Object.keys(localized).sort(), [...locales].sort());
    for (const locale of locales) assert.ok(localized[locale].trim().length > 10, locale);
    assert.equal(new Set(Object.values(localized)).size, 7);
  }
  for (const p of teamProfiles) {
    const en = buildTeamSoloInsights(p.answers);
    for (const locale of locales) {
      const result = buildTeamSoloInsights(p.answers, locale);
      assert.deepEqual(result.insights.map(({ pattern, evidence, tension }) => ({ pattern, evidence, tension })), en.insights.map(({ pattern, evidence, tension }) => ({ pattern, evidence, tension })));
    }
  }
});

test("Team results render supported insight, action and evidence disclosure in every locale", () => {
  for (const locale of locales) {
    const result = buildTeamSoloInsights(profile("competing-priorities").answers, locale);
    const html = renderToStaticMarkup(createElement(TeamSoloResultView, { result, locale }));
    assert.ok(html.includes(teamInsightLabels.action[locale]));
    assert.ok(html.includes(teamInsightLabels.open[locale]));
    assert.ok(html.includes(result.insights[0]!.experiment));
    const visible = html.split('aria-hidden="true"')[0]!;
    assert.match(visible, /<summary class=/);
    assert.doesNotMatch(visible, /<details open/);
    assert.ok(visible.indexOf(teamInsightLabels.evidence[locale]) > visible.indexOf(teamInsightLabels.talk[locale]));
    assert.match(html, /data-fyns-print-document="life-alignment-relationship-solo"/);
    assert.match(html, /<details open/);
  }
});

test("limited results do not force friction, experiment, evidence or conversation sections", () => {
  for (const id of ["incomplete", "midpoint"]) {
    const html = renderToStaticMarkup(createElement(TeamSoloResultView, { result: buildTeamSoloInsights(profile(id).answers), locale: "en" }));
    assert.ok(html.includes(teamInsightLabels.limited.en));
    assert.ok(!html.includes(teamInsightLabels.action.en));
    assert.ok(!html.includes(teamInsightLabels.friction.en));
    assert.ok(!html.includes(teamInsightLabels.evidence.en));
  }
});

test("the deterministic interpreter and renderer have no transport, persistence, logging or external AI", () => {
  for (const path of ["../lib/life-alignment-team-insights.ts", "../components/life-alignment/relationship/team-solo-result.tsx"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /fetch\(|sendBeacon|localStorage|sessionStorage|console\.|logger\.|supabase|https:\/\/|"use server"/);
  }
});

test("directional boundaries include 2 and 4 but never turn a midpoint into supporting evidence", () => {
  const base = profile("owned-flexible").answers;
  const boundary = { ...base, "team-autonomy-position": { value: 4 as const, importance: "low" as const }, "team-communication-position": { value: 2 as const, importance: "low" as const } };
  assert.equal(buildTeamSoloInsights(boundary).insights[0]!.pattern, "owned-flexible");
  const middle = { ...boundary, "team-autonomy-position": { value: 3 as const, importance: "high" as const } };
  assert.ok(!buildTeamSoloInsights(middle).insights.some(i => i.pattern === "owned-flexible"));
});

test("bounded interpretation prioritizes supported pressure context and preserves immutable input", () => {
  const answers = { ...profile("competing-priorities").answers, "team-communication-position": { value: 5 as const, importance: "low" as const }, "team-communication-scenario": { value: 1 as const, importance: "low" as const } };
  for (const answer of Object.values(answers)) if (answer) Object.freeze(answer);
  Object.freeze(answers);
  const before = JSON.stringify(answers);
  const result = buildTeamSoloInsights(answers);
  assert.equal(result.insights.length, 3);
  assert.equal(result.insights[0]!.pattern, "pressure-shift");
  assert.ok(result.unmatchedQuestionIds.includes("team-ownership-position"));
  assert.equal(JSON.stringify(answers), before);
  assert.deepEqual(buildTeamSoloInsights(answers), result);
});
