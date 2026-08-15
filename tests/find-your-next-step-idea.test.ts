import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ideaIntro, ideaQuestions, ideaSections } from "../data/find-your-next-step-idea";
import {
  buildIdeaResult,
  formatIdeaSelectionCount,
  ideaJourneyReducer,
  initialIdeaState,
  selectedIdeaOptions,
  validateIdeaAnswer,
} from "../lib/find-your-next-step-idea";
import {
  buildIdeaResultText,
  buildIdeaShareText,
  IDEA_RESULT_DISCLAIMER,
} from "../lib/find-your-next-step-idea-export";
import type { IdeaAnswers, IdeaChoiceQuestion, IdeaJourneyState } from "../types/find-your-next-step-idea";

function completeAnswers(overrides: IdeaAnswers = {}): IdeaAnswers {
  const answers: Record<string, string | readonly string[]> = {};
  for (const question of ideaQuestions) {
    if (question.format === "short-text") {
      answers[question.id] = question.resultRole === "idea"
        ? "Ein einfacher Weg, lokale Hilfe passend zu einer konkreten Frage zu finden."
        : question.resultRole === "problem"
          ? "Menschen verlieren Zeit, weil passende lokale Hilfe schwer vergleichbar ist."
          : question.resultRole === "audience"
            ? "Menschen, die erstmals kurzfristig lokale Unterstützung suchen."
            : "Sie könnten schneller eine verständliche erste Auswahl treffen.";
    } else {
      answers[question.id] = question.options.slice(0, question.minSelections).map(({ id }) => id);
    }
  }
  return { ...answers, ...overrides };
}

test("Idea V1 defines four ordered sections and exactly nine bounded interactions", () => {
  assert.deepEqual(ideaSections.map(({ id }) => id), ["core", "people-value", "reality", "experiment"]);
  assert.equal(ideaQuestions.length, 9);
  assert.equal(new Set(ideaQuestions.map(({ id }) => id)).size, 9);
  assert.deepEqual(ideaSections.map(({ id }) => ideaQuestions.filter(({ sectionId }) => sectionId === id).length), [2, 2, 3, 2]);
  assert.equal(ideaQuestions.filter(({ format }) => format === "short-text").length, 4);
  for (const question of ideaQuestions) {
    assert.equal(ideaSections.some(({ id }) => id === question.sectionId), true, question.id);
    if (question.format === "short-text") {
      assert.ok(question.minLength >= 8);
      assert.ok(question.maxLength <= 240);
      assert.ok(question.minLength < question.maxLength);
    } else {
      assert.ok(question.minSelections >= 1);
      assert.ok(question.maxSelections <= 3);
      assert.ok(question.minSelections <= question.maxSelections);
      assert.ok(question.options.length > question.maxSelections);
      assert.equal(new Set(question.options.map(({ id }) => id)).size, question.options.length);
    }
  }
});

test("intro preserves user authority, privacy, and a narrow non-validating scope", () => {
  const content = JSON.stringify(ideaIntro);
  assert.match(content, /Du entscheidest/iu);
  assert.match(content, /nicht gespeichert/iu);
  assert.match(content, /nicht mit einem Account verknüpft/iu);
  assert.match(content, /keinen Markt, Umsatz oder Erfolg vorhersagen/iu);
  assert.match(content, /keine Nachfrage, Machbarkeit oder rechtliche Zulässigkeit bestätigen/iu);
});

test("text and choice validation rejects missing, short, overlong, and conflicting answers", () => {
  const textQuestion = ideaQuestions.find(({ id }) => id === "idea-summary");
  assert.ok(textQuestion?.format === "short-text");
  assert.ok(validateIdeaAnswer(textQuestion, {})?.includes("mindestens"));
  assert.equal(validateIdeaAnswer(textQuestion, { [textQuestion.id]: "x".repeat(textQuestion.maxLength + 1) })?.includes("höchstens"), true);
  assert.equal(validateIdeaAnswer(textQuestion, { [textQuestion.id]: "Eine ausreichend konkrete erste Idee." }), null);

  const constraints = ideaQuestions.find(({ id }) => id === "real-constraints");
  assert.ok(constraints && constraints.format !== "short-text");
  assert.ok(validateIdeaAnswer(constraints, {}));
  assert.match(validateIdeaAnswer(constraints, { [constraints.id]: ["no-clear-limit", "limited-time"] }) ?? "", /nur allein/iu);
});

test("selection stays bounded and exclusive choices replace other constraints", () => {
  const constraints = ideaQuestions.find(({ id }) => id === "real-constraints");
  assert.ok(constraints && constraints.format !== "short-text");
  let state: IdeaJourneyState = { ...initialIdeaState, phase: "journey", questionIndex: ideaQuestions.indexOf(constraints) };
  state = ideaJourneyReducer(state, { type: "toggle-option", questionId: constraints.id, optionId: "limited-time" });
  state = ideaJourneyReducer(state, { type: "toggle-option", questionId: constraints.id, optionId: "no-budget" });
  state = ideaJourneyReducer(state, { type: "toggle-option", questionId: constraints.id, optionId: "limited-access" });
  state = ideaJourneyReducer(state, { type: "toggle-option", questionId: constraints.id, optionId: "energy-boundary" });
  assert.deepEqual(selectedIdeaOptions(constraints, state.answers).map(({ id }) => id), ["limited-time", "no-budget", "limited-access"]);
  state = ideaJourneyReducer(state, { type: "toggle-option", questionId: constraints.id, optionId: "no-clear-limit" });
  assert.deepEqual(state.answers[constraints.id], ["no-clear-limit"]);
  assert.equal(formatIdeaSelectionCount(0, 3), "0 von 3 ausgewählt");
  assert.equal(formatIdeaSelectionCount(2, 2), "2 von 2 ausgewählt");
});

test("incomplete answers never produce a finished Idea result", () => {
  const empty = buildIdeaResult({});
  assert.equal(empty.status, "incomplete");
  if (empty.status === "incomplete") assert.deepEqual(empty.missingQuestionIds, ideaQuestions.map(({ id }) => id));

  const almost = { ...completeAnswers() } as Record<string, string | readonly string[]>;
  delete almost[ideaQuestions[3].id];
  const result = buildIdeaResult(almost);
  assert.equal(result.status, "incomplete");
  if (result.status === "incomplete") assert.deepEqual(result.missingQuestionIds, [ideaQuestions[3].id]);
});

test("result keeps idea, problem, audience, value, evidence, assumptions, constraints, uncertainty, experiment, and next step separate", () => {
  const built = buildIdeaResult(completeAnswers());
  assert.equal(built.status, "complete");
  if (built.status !== "complete") return;
  const { result } = built;
  assert.match(result.snapshot.idea, /lokale Hilfe/iu);
  assert.match(result.snapshot.problem, /Zeit/iu);
  assert.match(result.snapshot.audience, /Menschen/iu);
  assert.match(result.snapshot.value, /Auswahl/iu);
  assert.ok(result.evidenceStatus.length > 0);
  assert.equal(result.assumptions.length, 2);
  assert.equal(result.constraints.length, 1);
  assert.ok(result.known.length > 0);
  assert.ok(result.uncertain.length > 0);
  assert.ok(result.experiment.method.length > 0);
  assert.match(result.experiment.boundary, /weder Beweis noch Marktvalidierung/iu);
  assert.match(result.nextStep, /entscheide danach selbst/iu);
  assert.match(result.authorityNote, /interpretative Autorität/iu);
  assert.match(result.authorityNote, /keine Verknüpfung/iu);
});

test("evidence language changes only from the user's explicit evidence answer", () => {
  const observed = buildIdeaResult(completeAnswers({ "evidence-state": ["direct-observation"] }));
  const assumed = buildIdeaResult(completeAnswers({ "evidence-state": ["early-assumption"] }));
  assert.equal(observed.status, "complete");
  assert.equal(assumed.status, "complete");
  if (observed.status !== "complete" || assumed.status !== "complete") return;
  assert.match(observed.result.evidenceStatus, /Beobachtungen/iu);
  assert.match(observed.result.known.join(" "), /Ausgangsproblem/iu);
  assert.match(assumed.result.evidenceStatus, /Vermutung/iu);
  assert.match(assumed.result.uncertain.join(" "), /für andere Menschen trägt/iu);
});

test("result generation is deterministic, pure, and free of forecasts or hidden scoring", () => {
  const answers = completeAnswers();
  const before = JSON.stringify(answers);
  const first = buildIdeaResult(answers);
  const second = buildIdeaResult(answers);
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(answers), before);
  const serialized = JSON.stringify(first);
  assert.equal(/score|ranking|prozent|marktgröße|umsatzprognose|erfolgschance|validiert|garantiert/iu.test(serialized), false);
  assert.equal(/persönlichkeitstyp|diagnose|ADHS|Autismus|Depression|Trauma/iu.test(serialized), false);
});

test("reducer supports validation, navigation, section editing, result recovery, and confirmed restart", () => {
  let state = ideaJourneyReducer(initialIdeaState, { type: "start" });
  assert.equal(state.phase, "journey");
  state = ideaJourneyReducer(state, { type: "continue" });
  assert.ok(state.validationMessage);
  state = { ...state, answers: completeAnswers(), validationMessage: null, questionIndex: ideaQuestions.length - 1 };
  state = ideaJourneyReducer(state, { type: "continue" });
  assert.equal(state.phase, "result");
  state = ideaJourneyReducer(state, { type: "edit-section", sectionId: "people-value" });
  assert.equal(state.phase, "journey");
  assert.equal(state.questionIndex, 2);
  state = ideaJourneyReducer(state, { type: "back" });
  assert.equal(state.phase, "result");
  state = ideaJourneyReducer(state, { type: "request-restart" });
  assert.equal(state.restartPending, true);
  state = ideaJourneyReducer(state, { type: "cancel-restart" });
  assert.equal(state.restartPending, false);
  state = ideaJourneyReducer(state, { type: "request-restart" });
  state = ideaJourneyReducer(state, { type: "confirm-restart" });
  assert.deepEqual(state, initialIdeaState);
});

test("exports are bounded, deterministic, plain text, and keep the non-validation disclaimer", () => {
  const built = buildIdeaResult(completeAnswers());
  assert.equal(built.status, "complete");
  if (built.status !== "complete") return;
  const copy = buildIdeaResultText(built.result);
  const share = buildIdeaShareText(built.result);
  assert.equal(copy, buildIdeaResultText(built.result));
  assert.ok(copy.length <= 5_000);
  assert.ok(share.length <= 1_000);
  assert.ok(copy.endsWith(IDEA_RESULT_DISCLAIMER));
  assert.match(copy, /Bewusst offen/iu);
  assert.match(copy, /Erster Lernversuch/iu);
  assert.match(share, /keine Marktvalidierung/iu);
  assert.equal(/<\/?[a-z][^>]*>/iu.test(`${copy}\n${share}`), false);
});

test("Idea UI is an accessible local client island with progress, export, edit, and restart recovery", () => {
  const client = readFileSync(new URL("../components/find-your-next-step/idea-journey.tsx", import.meta.url), "utf8");
  const shell = readFileSync(new URL("../components/find-your-next-step/find-your-next-step-idea.tsx", import.meta.url), "utf8");
  const engine = readFileSync(new URL("../lib/find-your-next-step-idea.ts", import.meta.url), "utf8");
  const implementation = `${client}\n${shell}\n${engine}`;
  assert.equal(client.startsWith('"use client"'), true);
  assert.equal(shell.startsWith('"use client"'), false);
  assert.match(client, /<fieldset/gu);
  assert.match(client, /<legend/gu);
  assert.match(client, /<textarea/gu);
  assert.match(client, /maxLength=\{question\.maxLength\}/u);
  assert.match(client, /type=\{inputType\}/u);
  assert.match(client, /role="alert"/u);
  assert.match(client, /tabIndex=\{-1\}/u);
  assert.match(client, /<JourneyDock/u);
  assert.match(client, /totalQuestionCount=\{ideaQuestions\.length\}/u);
  assert.match(client, /accessibleLabel="Steuerung und Fortschritt der Ideenklärung"/u);
  assert.match(client, /pb-\[calc\(12rem\+env\(safe-area-inset-bottom\)\)\]/u);
  assert.match(client, /<FynsResultActions/u);
  assert.match(client, /data-fyns-print-document="idea"/u);
  assert.match(client, /aria-labelledby="idea-edit-title"/u);
  assert.match(client, /request-restart/u);
  assert.match(shell, /data-fyns-result-page="idea"/u);
  assert.match(shell, /data-fyns-result-page-content/u);
  for (const prohibited of [
    "localStorage", "sessionStorage", "document.cookie", "fetch(", "@/lib/supabase",
    "URLSearchParams", "location.href", "history.pushState", "history.replaceState",
    "beforeunload", "use server", "Math.random", "console.log",
  ]) {
    assert.equal(implementation.includes(prohibited), false, prohibited);
  }
});

test("choice result copy remains curated and does not smuggle business-plan or certainty claims", () => {
  const choices = ideaQuestions
    .filter((question): question is IdeaChoiceQuestion => question.format !== "short-text")
    .flatMap(({ options }) => options.flatMap(({ label, resultText }) => [label, resultText]))
    .join(" ");
  assert.equal(/\b(?:TAM|SAM|SOM|ROI|Umsatz|Gewinn|Marktanteil|garantiert|bewiesen|validiert)\b/iu.test(choices), false);
});
