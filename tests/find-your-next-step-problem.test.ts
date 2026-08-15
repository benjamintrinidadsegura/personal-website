import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { problemIntro, problemQuestions, problemSections } from "../data/find-your-next-step-problem";
import {
  buildProblemResult,
  formatProblemSelectionCount,
  getMissingProblemQuestionIds,
  initialProblemState,
  problemJourneyReducer,
  validateProblemData,
} from "../lib/find-your-next-step-problem";
import {
  buildProblemResultText,
  buildProblemShareText,
  PROBLEM_RESULT_DISCLAIMER,
} from "../lib/find-your-next-step-problem-export";
import type { ProblemAnswers } from "../types/find-your-next-step-problem";

const completeAnswers: ProblemAnswers = {
  "situation-area": ["area-work"],
  "situation-change": ["Ich kenne die zwei nächsten realistischen Optionen."],
  "urgency-pressure": ["pressure-soon"],
  "urgency-safety": ["safety-no"],
  "experience-tried": ["tried-reflect", "tried-talk"],
  "experience-effect": ["effect-partly"],
  "experience-influence": ["influence-shared"],
  "next-support": ["support-trusted", "support-information"],
  "next-mode": ["mode-facts"],
};

function completed(result = buildProblemResult(completeAnswers)) {
  assert.equal(result.status, "complete");
  if (result.status !== "complete") throw new Error("Expected complete result");
  return result.result;
}

test("Problem V1 defines four balanced sections and nine bounded interactions", () => {
  assert.deepEqual(validateProblemData(), []);
  assert.equal(problemSections.length, 4);
  assert.equal(problemQuestions.length, 9);
  assert.deepEqual(problemSections.map(({ id }) => problemQuestions.filter(({ sectionId }) => sectionId === id).length), [2, 2, 3, 2]);
  assert.deepEqual(new Set(problemQuestions.map(({ format }) => format)), new Set(["single", "multi", "text"]));
  const textQuestions = problemQuestions.filter(({ format }) => format === "text");
  assert.equal(textQuestions.length, 1);
  assert.ok(textQuestions.every(({ maxLength }) => Boolean(maxLength && maxLength <= 500)));
  assert.equal(new Set(problemQuestions.map(({ id }) => id)).size, 9);
  assert.equal(new Set(problemQuestions.flatMap(({ options }) => options.map(({ id }) => id))).size, problemQuestions.flatMap(({ options }) => options).length);
});

test("incomplete and malformed inputs never create a result", () => {
  assert.equal(buildProblemResult({}).status, "incomplete");
  assert.deepEqual(getMissingProblemQuestionIds(completeAnswers), []);
  assert.ok(getMissingProblemQuestionIds({ ...completeAnswers, "situation-change": ["zu kurz"] }).includes("situation-change"));
  assert.ok(getMissingProblemQuestionIds({ ...completeAnswers, "experience-tried": ["tried-none", "tried-talk"] }).includes("experience-tried"));
  assert.ok(getMissingProblemQuestionIds({ ...completeAnswers, "urgency-safety": ["unknown"] }).includes("urgency-safety"));
});

test("results are deterministic, qualitative, bounded, and evidence-backed", () => {
  const first = completed();
  const second = completed();
  assert.deepEqual(first, second);
  assert.ok(first.summary.length >= 1 && first.summary.length <= 3);
  assert.equal(first.situation.length, 3);
  assert.equal(first.resources.length, 3);
  assert.ok(first.questionsToCarry.length >= 2 && first.questionsToCarry.length <= 3);
  assert.ok(first.userNote && first.userNote.length <= 280);
  for (const statement of [...first.situation, ...first.resources]) {
    assert.ok(statement.evidence.length >= 1 && statement.evidence.length <= 3, statement.id);
    for (const evidence of statement.evidence) assert.ok(completeAnswers[evidence.questionId]?.includes(evidence.optionId) || evidence.optionId === "self-authored-note");
  }
  const serialized = JSON.stringify(first);
  assert.equal(/\bscore\b|ranking|prozent|%|du bist schuld|garantiert|erfolgschance/iu.test(serialized), false);
});

test("urgent and professional boundaries override ordinary self-help framing", () => {
  const urgent = completed(buildProblemResult({ ...completeAnswers, "urgency-safety": ["safety-immediate"], "next-mode": ["mode-small-step"] }));
  assert.equal(urgent.boundary.level, "urgent");
  assert.match(urgent.boundary.text, /Notruf|Anlaufstelle/iu);
  assert.match(urgent.nextStep.title, /Hilfe/iu);
  assert.equal(urgent.nextStep.evidence[0]?.optionId, "safety-immediate");
  assert.equal(urgent.nextStep.text.includes("ausprobieren"), false);

  for (const area of ["area-health", "area-finance", "area-legal"] as const) {
    const professional = completed(buildProblemResult({ ...completeAnswers, "situation-area": [area] }));
    assert.equal(professional.boundary.level, "professional");
    assert.match(professional.boundary.text, /qualifizierten Stelle/iu);
  }
});

test("constraints and interpretive authority remain explicit without inferred psychology", () => {
  const data = readFileSync(new URL("../data/find-your-next-step-problem.ts", import.meta.url), "utf8");
  const engine = readFileSync(new URL("../lib/find-your-next-step-problem.ts", import.meta.url), "utf8");
  const client = readFileSync(new URL("../components/find-your-next-step/problem-journey.tsx", import.meta.url), "utf8");
  assert.match(problemIntro.privacy, /nicht mit deinem BTS Account verknüpft/iu);
  assert.match(client, /deine Einordnung bleibt maßgeblich/iu);
  assert.match(client, /Gewohnheit, Erwartungen anderer oder einer älteren Erfahrung/iu);
  assert.match(data, /Dingen, die von anderen, Regeln oder Umständen abhängen/iu);
  assert.equal(/intrinsicScore|inheritedScore|personalityType|diagnostic/iu.test(`${data}\n${engine}\n${client}`), false);
});

test("export and share are deterministic, bounded, and retain safety disclaimers", () => {
  const result = completed();
  const text = buildProblemResultText(result);
  const share = buildProblemShareText(result);
  assert.equal(text, buildProblemResultText(result));
  assert.equal(share, buildProblemShareText(result));
  assert.ok(text.length <= 5_000);
  assert.ok(share.length <= 1_200);
  assert.ok(text.endsWith(PROBLEM_RESULT_DISCLAIMER));
  assert.ok(share.endsWith(PROBLEM_RESULT_DISCLAIMER));
  assert.match(text, /Ich kenne die zwei nächsten realistischen Optionen/iu);
  assert.equal(/<\/?[a-z][^>]*>/iu.test(text), false);
});

test("selection counts and reducer support text, options, editing, and confirmed restart", () => {
  assert.equal(formatProblemSelectionCount(0, 3), "0 von 3 ausgewählt");
  assert.equal(formatProblemSelectionCount(3, 3), "3 von 3 ausgewählt");
  let state = problemJourneyReducer(initialProblemState, { type: "start" });
  assert.equal(state.phase, "journey");
  state = problemJourneyReducer(state, { type: "toggle-option", questionId: "situation-area", optionId: "area-work" });
  state = problemJourneyReducer(state, { type: "continue" });
  state = problemJourneyReducer(state, { type: "set-text", questionId: "situation-change", value: "Eine ausreichend klare Veränderung." });
  assert.deepEqual(state.answers["situation-change"], ["Eine ausreichend klare Veränderung."]);
  const resultState = { ...initialProblemState, phase: "result" as const, answers: completeAnswers };
  const editing = problemJourneyReducer(resultState, { type: "edit-section", sectionId: "experience" });
  assert.equal(problemQuestions[editing.questionIndex]?.sectionId, "experience");
  assert.deepEqual(problemJourneyReducer(editing, { type: "confirm-restart" }), initialProblemState);
});

test("Problem UI stays accessible, local-only, and uses shared journey/result controls", () => {
  const client = readFileSync(new URL("../components/find-your-next-step/problem-journey.tsx", import.meta.url), "utf8");
  const shell = readFileSync(new URL("../components/find-your-next-step/find-your-next-step-problem.tsx", import.meta.url), "utf8");
  const engine = readFileSync(new URL("../lib/find-your-next-step-problem.ts", import.meta.url), "utf8");
  const implementation = `${client}\n${shell}\n${engine}`;
  assert.equal(client.startsWith('"use client"'), true);
  assert.match(client, /<fieldset/u);
  assert.match(client, /<legend/u);
  assert.match(client, /<textarea/u);
  assert.match(client, /role="alert"/u);
  assert.match(client, /<details/u);
  assert.match(client, /<JourneyDock/u);
  assert.match(client, /<FynsResultActions/u);
  assert.match(client, /pb-\[calc\(12rem\+env\(safe-area-inset-bottom\)\)\]/u);
  assert.match(shell, /data-fyns-result-page="problem"/u);
  for (const prohibited of [
    "localStorage", "sessionStorage", "document.cookie", "URLSearchParams", "location.hash",
    "history.pushState", "history.replaceState", "beforeunload", "@/lib/supabase", "fetch(",
    "console.log", "Math.random", "use server", "analytics",
  ]) assert.equal(implementation.includes(prohibited), false, prohibited);
});
