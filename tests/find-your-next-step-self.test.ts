import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  selfReflectionDimensions,
  selfReflectionQuestions,
  selfReflectionSections,
} from "../data/find-your-next-step-self";
import {
  buildSelfReflectionResult,
  buildSelfReflectionSummary,
  calculateQuestionDimensionCapacity,
  calculateSelfReflectionScores,
  formatSelfReflectionSelectionCount,
  initialSelfReflectionState,
  selfReflectionDimensionOrder,
  selfReflectionJourneyReducer,
  validateSelfReflectionData,
} from "../lib/find-your-next-step-self";
import type { SelfReflectionDimensionEvaluation } from "../lib/find-your-next-step-self";
import type {
  SelfReflectionAnswers,
  SelfReflectionDimensionId,
  SelfReflectionQuestion,
  SelfReflectionResultSection,
  SelfReflectionTensionResult,
  SelfReflectionVisibility,
} from "../types/find-your-next-step";

function optionSupport(option: SelfReflectionQuestion["options"][number], targets: readonly SelfReflectionDimensionId[]) {
  const signalSupport = (option.signals ?? []).filter(({ dimension }) => targets.includes(dimension)).length;
  const contextSupport = (option.contextualDimensions ?? []).filter((dimension) => targets.includes(dimension)).length;
  return signalSupport + contextSupport;
}

function createCompleteAnswers(
  targets: readonly SelfReflectionDimensionId[] = [],
  overrides: Readonly<Record<string, readonly string[]>> = {},
): SelfReflectionAnswers {
  return Object.fromEntries(selfReflectionQuestions.map((question) => {
    if (overrides[question.id]) return [question.id, overrides[question.id]];

    const ranked = question.options
      .map((option, index) => ({ option, index, support: optionSupport(option, targets) }))
      .filter(({ option }) => !option.exclusive)
      .sort((left, right) => right.support - left.support || left.index - right.index);
    const useful = ranked.filter(({ support }) => support > 0).slice(0, question.maxSelections);
    const selected = [...useful];
    for (const candidate of ranked) {
      if (selected.length >= question.minSelections) break;
      if (!selected.some(({ option }) => option.id === candidate.option.id)) selected.push(candidate);
    }

    return [question.id, selected.slice(0, question.maxSelections).map(({ option }) => option.id)];
  }));
}

function enumerateValidSelections(question: SelfReflectionQuestion): readonly (readonly string[])[] {
  const selections: string[][] = [];

  function visit(index: number, selected: string[]) {
    if (selected.length > question.maxSelections) return;
    if (index === question.options.length) {
      if (selected.length < question.minSelections || selected.length > question.maxSelections) return;
      const selectedOptions = selected.map((optionId) => question.options.find(({ id }) => id === optionId));
      if (selectedOptions.some((option) => option?.exclusive) && selected.length !== 1) return;
      selections.push([...selected]);
      return;
    }

    visit(index + 1, selected);
    visit(index + 1, [...selected, question.options[index].id]);
  }

  visit(0, []);
  return selections;
}

function collectObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (!value || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectObjectKeys(item, keys);
    return keys;
  }
  for (const [key, child] of Object.entries(value)) {
    keys.add(key);
    collectObjectKeys(child, keys);
  }
  return keys;
}

function createEvaluation(
  dimension: SelfReflectionDimensionId,
  visibility: SelfReflectionVisibility | null,
  contextual = false,
): SelfReflectionDimensionEvaluation {
  return {
    dimension,
    score: visibility === "clear" ? 6 : visibility === "multiple" ? 4 : 0,
    maximum: 10,
    evidenceQuestionCount: visibility === "clear" ? 3 : visibility === "multiple" ? 2 : 0,
    evidenceSectionCount: visibility ? 2 : 0,
    visibility,
    contextual,
  };
}

const firstTension: SelfReflectionTensionResult = {
  id: "orientation-agency",
  title: "Klare Richtung · eigener Weg",
  text: "Klare Ziele könnten dir helfen, während du den Weg dorthin gern selbst gestaltest.",
  evidence: [],
};

const secondTension: SelfReflectionTensionResult = {
  id: "growth-recovery",
  title: "Entwicklung · Erholung",
  text: "Neue Herausforderungen könnten für dich besonders stimmig sein, wenn echte Erholung ebenfalls Platz bekommt.",
  evidence: [],
};

const sparseSelfImageSection: SelfReflectionResultSection = {
  id: "selfImage",
  title: "Was du bei dir selbst wiedererkennst",
  statements: [{
    id: "self-image-strength-depth",
    text: "Du hast ausgewählt, dass du dich häufig lange und aufmerksam mit einem Thema beschäftigst.",
    evidence: [{
      questionId: "self-view-strengths",
      optionId: "strength-depth",
      sectionId: "self-view",
      answer: "Mich lange und aufmerksam mit einem Thema beschäftigen.",
    }],
  }],
};

test("Self v1 defines exactly five sections and fifteen balanced interactions", () => {
  assert.deepEqual(validateSelfReflectionData(), []);
  assert.equal(selfReflectionSections.length, 5);
  assert.equal(selfReflectionQuestions.length, 15);
  assert.equal(new Set(selfReflectionQuestions.map(({ id }) => id)).size, 15);
  assert.equal(
    new Set(selfReflectionQuestions.flatMap(({ options }) => options.map(({ id }) => id))).size,
    selfReflectionQuestions.flatMap(({ options }) => options).length,
  );

  for (const section of selfReflectionSections) {
    assert.equal(selfReflectionQuestions.filter(({ sectionId }) => sectionId === section.id).length, 3, section.id);
  }

  const coverage = selfReflectionDimensionOrder.map((dimension) =>
    selfReflectionQuestions.filter((question) =>
      question.options.some((option) => option.signals?.some((signal) => signal.dimension === dimension)),
    ).length,
  );
  assert.ok(Math.min(...coverage) >= 8);
  assert.ok(Math.max(...coverage) - Math.min(...coverage) <= 3);

  const dimensionIds = new Set(Object.keys(selfReflectionDimensions));
  assert.deepEqual(new Set(selfReflectionDimensionOrder), dimensionIds);
  for (const question of selfReflectionQuestions) {
    for (const option of question.options) {
      for (const signal of option.signals ?? []) {
        assert.equal(dimensionIds.has(signal.dimension), true, `${question.id}:${option.id}`);
        assert.ok(signal.weight === 1 || signal.weight === 2);
        assert.ok(signal.weight > 0);
      }
    }
  }
});

test("questions cover life context beyond career without adding unsupported formats", () => {
  const content = selfReflectionQuestions
    .flatMap((question) => [question.prompt, question.context ?? "", ...question.options.map(({ label }) => label)])
    .join(" ");

  for (const expected of ["Alltag", "private", "Austausch", "Rückzug", "Erholung", "verändert"]) {
    assert.match(content, new RegExp(expected, "iu"), expected);
  }
  assert.deepEqual(new Set(selfReflectionQuestions.map(({ format }) => format)), new Set(["single", "multi", "priority"]));
  assert.equal(/slider|freitext|drag/iu.test(content), false);
  assert.ok(selfReflectionQuestions.filter(({ prompt, context = "" }) => /arbeit|aufgabe|projekt/iu.test(`${prompt} ${context}`)).length <= 7);
});

test("theoretical maxima equal the best actually valid selection for every question and dimension", () => {
  for (const question of selfReflectionQuestions) {
    const validSelections = enumerateValidSelections(question);
    assert.ok(validSelections.length > 0, question.id);

    for (const dimension of selfReflectionDimensionOrder) {
      const bruteForceMaximum = Math.max(...validSelections.map((selection) =>
        selection.reduce((questionTotal, optionId) => {
          const option = question.options.find(({ id }) => id === optionId);
          return questionTotal + (option?.signals ?? [])
            .filter((signal) => signal.dimension === dimension)
            .reduce((optionTotal, signal) => optionTotal + signal.weight, 0);
        }, 0),
      ));
      assert.equal(calculateQuestionDimensionCapacity(question, dimension), bruteForceMaximum, `${question.id}:${dimension}`);
    }
  }
});

test("scoring is deterministic, bounded, positive, and uses fixed qualitative thresholds", () => {
  const answers = createCompleteAnswers(["agency", "orientation"]);
  const first = calculateSelfReflectionScores(answers);
  const second = calculateSelfReflectionScores(answers);
  assert.deepEqual(first, second);

  for (const evaluation of first) {
    assert.ok(evaluation.score >= 0, evaluation.dimension);
    assert.ok(evaluation.maximum >= 0, evaluation.dimension);
    assert.ok(evaluation.score <= evaluation.maximum, evaluation.dimension);
  }

  const agency = first.find(({ dimension }) => dimension === "agency");
  assert.equal(agency?.visibility, "clear");
  assert.equal(agency?.contextual, true);
});

test("summary templates cover clear, multiple, mixed, single, and low-evidence cases", () => {
  assert.deepEqual(
    buildSelfReflectionSummary([
      createEvaluation("agency", "clear"),
      createEvaluation("orientation", "clear"),
    ], [], null),
    ["In deiner Momentaufnahme zeigen sich Entscheidungsspielraum und Orientierung besonders klar."],
  );

  assert.deepEqual(
    buildSelfReflectionSummary([
      createEvaluation("orientation", "multiple"),
      createEvaluation("agency", "clear"),
    ], [], null),
    ["Entscheidungsspielraum zeigt sich in deiner Momentaufnahme besonders klar; Orientierung taucht ebenfalls an mehreren Stellen auf."],
  );

  assert.deepEqual(
    buildSelfReflectionSummary([
      createEvaluation("agency", "multiple"),
      createEvaluation("orientation", "multiple"),
    ], [], null),
    ["In deiner Momentaufnahme tauchen Entscheidungsspielraum und Orientierung an mehreren Stellen auf."],
  );

  assert.deepEqual(
    buildSelfReflectionSummary([createEvaluation("purpose", "clear")], [], null),
    ["In deiner Momentaufnahme zeigt sich Sinn und Beitrag besonders klar."],
  );

  assert.deepEqual(
    buildSelfReflectionSummary([createEvaluation("growth", null, true)], [], null),
    ["Deine Antworten ergeben im Moment kein stark verdichtetes Muster – einige Themen scheinen stärker vom jeweiligen Kontext abzuhängen."],
  );

  assert.deepEqual(
    buildSelfReflectionSummary([createEvaluation("growth", null)], [], null),
    ["Deine Antworten ergeben im Moment ein offenes Bild, ohne dass ein einzelnes Thema deutlich in den Vordergrund tritt."],
  );
});

test("summary uses only the first existing tension and never exceeds three sentences", () => {
  const summary = buildSelfReflectionSummary([
    createEvaluation("agency", "clear"),
    createEvaluation("orientation", "clear"),
  ], [firstTension, secondTension], sparseSelfImageSection);

  assert.deepEqual(summary, [
    "In deiner Momentaufnahme zeigen sich Entscheidungsspielraum und Orientierung besonders klar.",
    "Spannend ist außerdem die Kombination „Klare Richtung · eigener Weg“.",
    firstTension.text,
  ]);
  assert.ok(summary.length <= 3);
  assert.equal(summary.some((sentence) => sentence.includes(secondTension.title)), false);
  assert.equal(summary.some((sentence) => sentence.includes("Als eigene Beobachtung")), false);
});

test("summary uses an existing self-image observation only as a sparse fallback", () => {
  const summary = buildSelfReflectionSummary(
    [createEvaluation("depth", "multiple")],
    [],
    sparseSelfImageSection,
  );

  assert.deepEqual(summary, [
    "In deiner Momentaufnahme taucht Vertiefung an mehreren Stellen auf.",
    "Als eigene Beobachtung hast du außerdem ausgewählt: „Mich lange und aufmerksam mit einem Thema beschäftigen.“",
  ]);
});

test("selection count stays neutral and covers multi, priority, and single limits", () => {
  const multi = selfReflectionQuestions.find(({ format, maxSelections }) => format === "multi" && maxSelections === 4);
  const priority = selfReflectionQuestions.find(({ format }) => format === "priority");
  const single = selfReflectionQuestions.find(({ format }) => format === "single");
  assert.ok(multi);
  assert.ok(priority);
  assert.ok(single);

  assert.deepEqual(
    [0, 1, 2, 3, 4].map((count) => formatSelfReflectionSelectionCount(count, multi.maxSelections)),
    [
      "0 von 4 ausgewählt",
      "1 von 4 ausgewählt",
      "2 von 4 ausgewählt",
      "3 von 4 ausgewählt",
      "4 von 4 ausgewählt",
    ],
  );
  assert.equal(formatSelfReflectionSelectionCount(0, priority.maxSelections), `0 von ${priority.maxSelections} ausgewählt`);
  assert.equal(formatSelfReflectionSelectionCount(priority.maxSelections, priority.maxSelections), `${priority.maxSelections} von ${priority.maxSelections} ausgewählt`);
  assert.equal(formatSelfReflectionSelectionCount(0, single.maxSelections), "0 von 1 ausgewählt");
  assert.equal(formatSelfReflectionSelectionCount(1, single.maxSelections), "1 von 1 ausgewählt");

  for (const label of [
    formatSelfReflectionSelectionCount(0, multi.maxSelections),
    formatSelfReflectionSelectionCount(multi.maxSelections, multi.maxSelections),
  ]) {
    assert.equal(/warn|fehler|fertig|vollständig|erfolg|geschafft/iu.test(label), false);
  }
});

test("context dependence is a qualifier and never replaces dimension visibility", () => {
  const answers = createCompleteAnswers(["agency", "orientation"], {
    "self-view-context": ["context-orientation-agency"],
  });
  const evaluations = calculateSelfReflectionScores(answers);
  const agency = evaluations.find(({ dimension }) => dimension === "agency");
  assert.equal(agency?.visibility, "clear");
  assert.equal(agency?.contextual, true);

  const built = buildSelfReflectionResult(answers);
  assert.equal(built.status, "complete");
  if (built.status !== "complete") return;
  const agencyStatements = built.result.sections
    .flatMap(({ statements }) => statements)
    .filter(({ dimensionLabel }) => dimensionLabel === "Entscheidungsspielraum");
  assert.ok(agencyStatements.length > 0);
  assert.equal(agencyStatements.every(({ visibility }) => visibility === "clear"), true);
  assert.equal(agencyStatements.every(({ contextual }) => contextual === true), true);
});

test("an incomplete or invalid journey never produces a finished result", () => {
  assert.deepEqual(buildSelfReflectionResult({}).status, "incomplete");
  const complete = createCompleteAnswers(["purpose"]);
  const incomplete = Object.fromEntries(
    Object.entries(complete).filter(([questionId]) => questionId !== selfReflectionQuestions[0].id),
  );
  assert.equal(buildSelfReflectionResult(incomplete).status, "incomplete");
  assert.equal(buildSelfReflectionResult({ ...complete, [selfReflectionQuestions[0].id]: ["unknown-option"] }).status, "incomplete");
});

test("energy result sections use only explicit gain and drain evidence", () => {
  const noAgencyDrain = createCompleteAnswers(["agency", "orientation"], {
    "energy-drains": ["drain-depth-recovery"],
  });
  const withAgencyDrain = createCompleteAnswers(["agency", "orientation"], {
    "energy-drains": ["drain-agency-orientation"],
  });

  const first = buildSelfReflectionResult(noAgencyDrain);
  const second = buildSelfReflectionResult(withAgencyDrain);
  assert.equal(first.status, "complete");
  assert.equal(second.status, "complete");
  if (first.status !== "complete" || second.status !== "complete") return;

  const firstDrain = first.result.sections.find(({ id }) => id === "energyDrain");
  const secondDrain = second.result.sections.find(({ id }) => id === "energyDrain");
  assert.equal(firstDrain?.statements.some(({ dimensionLabel }) => dimensionLabel === "Entscheidungsspielraum") ?? false, false);
  assert.equal(secondDrain?.statements.some(({ dimensionLabel }) => dimensionLabel === "Entscheidungsspielraum") ?? false, true);

  for (const statement of secondDrain?.statements ?? []) {
    for (const evidence of statement.evidence) {
      assert.equal(selfReflectionQuestions.find(({ id }) => id === evidence.questionId)?.evidenceRole, "energyDrain");
    }
  }
  const gain = second.result.sections.find(({ id }) => id === "energyGain");
  for (const statement of gain?.statements ?? []) {
    for (const evidence of statement.evidence) {
      assert.equal(selfReflectionQuestions.find(({ id }) => id === evidence.questionId)?.evidenceRole, "energyGain");
    }
  }
});

test("results contain only supported qualitative statements and bounded explainability", () => {
  const answers = createCompleteAnswers(["agency", "orientation"]);
  const built = buildSelfReflectionResult(answers);
  const repeated = buildSelfReflectionResult(answers);
  assert.equal(built.status, "complete");
  assert.deepEqual(built, repeated);
  if (built.status !== "complete") return;

  const serialized = JSON.stringify(built.result);
  assert.equal(serialized.includes("%"), false);
  assert.equal(/du bist|persönlichkeitstyp|visionär|archetyp|\bscore\b|\branking\b/iu.test(serialized), false);
  assert.equal(/ADHS|Autismus|Depression|Trauma|Angststörung|Burnout|Neurodivergenz|Persönlichkeitsstörung/iu.test(serialized), false);
  assert.ok(built.result.summary.length >= 1);
  assert.ok(built.result.summary.length <= 3);
  if (built.result.tensions[0]) {
    assert.equal(
      built.result.summary[1],
      `Spannend ist außerdem die Kombination „${built.result.tensions[0].title}“.`,
    );
    assert.equal(built.result.summary[2], built.result.tensions[0].text);
  }

  const prohibitedKeys = new Set(["score", "maximum", "ratio", "rank", "points", "percentage"]);
  for (const key of collectObjectKeys(built.result)) assert.equal(prohibitedKeys.has(key), false, key);

  for (const statement of built.result.sections.flatMap(({ statements }) => statements)) {
    assert.ok(statement.evidence.length >= 1, statement.id);
    assert.ok(statement.evidence.length <= 3, statement.id);
    assert.equal(new Set(statement.evidence.map(({ answer }) => answer)).size, statement.evidence.length, statement.id);
    for (const evidence of statement.evidence) {
      const question = selfReflectionQuestions.find(({ id }) => id === evidence.questionId);
      assert.ok(question, evidence.questionId);
      assert.ok(question.options.some(({ id, label }) => id === evidence.optionId && label === evidence.answer));
    }
  }
  assert.ok(built.result.tensions.length <= 2);
  for (const tension of built.result.tensions) {
    assert.ok(tension.evidence.length >= 2);
    assert.ok(tension.evidence.length <= 3);
  }
});

test("result polish exposes distinct textual and visual contracts without live announcements", () => {
  const client = readFileSync(new URL("../components/find-your-next-step/self-reflection-journey.tsx", import.meta.url), "utf8");
  const clearContract = client.match(/clear: \{\s+badge: "([^"]+)",\s+card: "([^"]+)",\s+\}/u);
  const multipleContract = client.match(/multiple: \{\s+badge: "([^"]+)",\s+card: "([^"]+)",\s+\}/u);
  assert.ok(clearContract);
  assert.ok(multipleContract);
  assert.notDeepEqual(clearContract.slice(1), multipleContract.slice(1));
  assert.match(clearContract.join(" "), /#35d0e5/u);
  assert.match(multipleContract.join(" "), /#9aaabd/u);

  assert.equal(client.includes("Besonders klar sichtbar"), true);
  assert.equal(client.includes("Mehrfach sichtbar"), true);
  assert.equal(client.includes("Kontextabhängiger Hinweis"), true);
  assert.equal(client.includes("#b8a5ff"), true);
  assert.equal(client.includes("formatSelfReflectionSelectionCount"), true);
  assert.equal(client.includes("border-[#ff9a3d]/35"), true);
  assert.equal(client.includes('aria-live'), false);
  assert.equal(client.includes('role="status"'), false);
});

test("the journey dock is the single active-phase navigation and progress surface", () => {
  const client = readFileSync(new URL("../components/find-your-next-step/self-reflection-journey.tsx", import.meta.url), "utf8");
  const dockStart = client.indexOf("function JourneyDock");
  const dockEnd = client.indexOf("function EvidenceDetails");
  const dock = client.slice(dockStart, dockEnd);
  const dockInvocation = client.indexOf("<JourneyDock");
  const resultBranch = client.indexOf('if (state.phase === "result")');

  assert.ok(dockStart >= 0);
  assert.ok(dockEnd > dockStart);
  assert.ok(dockInvocation > resultBranch, "intro and result return before the dock is mounted");
  assert.equal(client.includes("function Progress"), false);
  assert.equal(client.includes("<Progress"), false);
  assert.equal((client.match(/<JourneyDock/gu) ?? []).length, 1);
  assert.equal((dock.match(/<button/gu) ?? []).length, 2);
  assert.equal((client.match(/type: "back"/gu) ?? []).length, 1);
  assert.match(dock, /type="button"/u);
  assert.match(dock, /type="submit"/u);
  assert.match(dock, /fixed inset-x-0 bottom-0 z-30/u);
  assert.match(dock, /max-w-4xl/u);
  assert.match(dock, /lg:grid-cols-\[auto_minmax\(18rem,1fr\)_auto\]/u);
  assert.equal(dock.includes("sticky"), false);
  assert.equal(dock.includes("Nicht gespeichert"), false);
  assert.equal(dock.includes("animate-"), false);
  assert.equal(client.includes('"Ergebnis ansehen"'), true);
  assert.equal(client.includes('"Zurück zum Ergebnis"'), true);
  assert.equal(client.includes('"Ergebnis aktualisieren"'), true);
});

test("the journey dock exposes five non-color-only segment states and local question context", () => {
  const client = readFileSync(new URL("../components/find-your-next-step/self-reflection-journey.tsx", import.meta.url), "utf8");
  const dock = client.slice(client.indexOf("function JourneyDock"), client.indexOf("function EvidenceDetails"));

  assert.equal(selfReflectionSections.length, 5);
  assert.equal(selfReflectionSections.every((section) =>
    selfReflectionQuestions.filter(({ sectionId }) => sectionId === section.id).length === 3
  ), true);
  assert.match(dock, /<ol aria-label="Abschnitte der Reflexion"/u);
  assert.equal((dock.match(/aria-current=/gu) ?? []).length, 1);
  assert.match(dock, /aria-current=\{current \? "step" : undefined\}/u);
  assert.match(dock, /"h-1\.5 bg-\[#35d0e5\]"/u);
  assert.match(dock, /"h-1 bg-\[#9aaabd\]\/70"/u);
  assert.match(dock, /border-dashed border-white\/25/u);
  assert.match(dock, /"aktuell"/u);
  assert.match(dock, /"abgeschlossen"/u);
  assert.match(dock, /"noch nicht erreicht"/u);
  assert.match(dock, /Frage \{questionInSection \+ 1\} von \{sectionQuestions\.length\}/u);
  assert.equal(dock.includes("<progress"), false);
  assert.equal(dock.includes("%"), false);
});

test("the journey dock reserves content and safe-area space at every responsive layout", () => {
  const client = readFileSync(new URL("../components/find-your-next-step/self-reflection-journey.tsx", import.meta.url), "utf8");

  assert.match(client, /pb-\[calc\(0\.75rem\+env\(safe-area-inset-bottom\)\)\]/u);
  assert.match(client, /pb-\[calc\(12rem\+env\(safe-area-inset-bottom\)\)\]/u);
  assert.match(client, /lg:pb-\[calc\(8\.5rem\+env\(safe-area-inset-bottom\)\)\]/u);
  assert.match(client, /scroll-mb-\[calc\(12rem\+env\(safe-area-inset-bottom\)\)\]/u);
  assert.match(client, /lg:scroll-mb-\[calc\(8\.5rem\+env\(safe-area-inset-bottom\)\)\]/u);
  assert.ok((client.match(/safe-area-inset-bottom/gu) ?? []).length >= 5);
  assert.match(client, /\{currentSection\?\.title\} · Reflexionsentscheidung/u);
});

test("local progress crosses section boundaries while reducer navigation preserves answers", () => {
  for (const checkpoint of [
    { questionIndex: 0, sectionIndex: 0, questionInSection: 0 },
    { questionIndex: 2, sectionIndex: 0, questionInSection: 2 },
    { questionIndex: 3, sectionIndex: 1, questionInSection: 0 },
    { questionIndex: 14, sectionIndex: 4, questionInSection: 2 },
  ]) {
    const question = selfReflectionQuestions[checkpoint.questionIndex];
    const sectionIndex = selfReflectionSections.findIndex(({ id }) => id === question.sectionId);
    const questionInSection = selfReflectionQuestions
      .filter(({ sectionId }) => sectionId === question.sectionId)
      .findIndex(({ id }) => id === question.id);
    assert.equal(sectionIndex, checkpoint.sectionIndex);
    assert.equal(questionInSection, checkpoint.questionInSection);
  }

  const completeAnswers = createCompleteAnswers(["agency", "orientation"]);
  let state = selfReflectionJourneyReducer(initialSelfReflectionState, { type: "start" });

  for (let expectedIndex = 0; expectedIndex < 4; expectedIndex += 1) {
    assert.equal(state.phase, "journey");
    assert.equal(state.questionIndex, expectedIndex);
    const question = selfReflectionQuestions[state.questionIndex];
    const sectionIndex = selfReflectionSections.findIndex(({ id }) => id === question.sectionId);
    const questionInSection = selfReflectionQuestions
      .filter(({ sectionId }) => sectionId === question.sectionId)
      .findIndex(({ id }) => id === question.id);

    assert.equal(sectionIndex, expectedIndex < 3 ? 0 : 1);
    assert.equal(questionInSection, expectedIndex < 3 ? expectedIndex : 0);

    for (const optionId of completeAnswers[question.id]) {
      state = selfReflectionJourneyReducer(state, { type: "toggle-option", questionId: question.id, optionId });
    }
    state = selfReflectionJourneyReducer(state, { type: "continue" });
  }

  assert.equal(state.questionIndex, 4);
  state = selfReflectionJourneyReducer(state, { type: "back" });
  assert.equal(state.questionIndex, 3);
  assert.deepEqual(state.answers[selfReflectionQuestions[2].id], completeAnswers[selfReflectionQuestions[2].id]);
});

test("missing signals never create an opposite interpretation", () => {
  const answers = createCompleteAnswers(["agency", "orientation"]);
  const evaluations = calculateSelfReflectionScores(answers);
  const built = buildSelfReflectionResult(answers);
  assert.equal(built.status, "complete");
  if (built.status !== "complete") return;

  const invisibleLabels = new Set(evaluations
    .filter(({ visibility }) => visibility === null)
    .map(({ dimension }) => selfReflectionDimensions[dimension].label));
  for (const statement of built.result.sections.flatMap(({ statements }) => statements)) {
    if (statement.dimensionLabel) assert.equal(invisibleLabels.has(statement.dimensionLabel), false);
  }
});

test("the journey reducer supports navigation, editing, regeneration, and restart", () => {
  let state = selfReflectionJourneyReducer(initialSelfReflectionState, { type: "start" });
  assert.equal(state.phase, "journey");

  state = selfReflectionJourneyReducer(state, { type: "continue" });
  assert.ok(state.validationMessage);
  assert.equal(state.questionIndex, 0);

  const firstQuestion = selfReflectionQuestions[0];
  for (const optionId of createCompleteAnswers()[firstQuestion.id]) {
    state = selfReflectionJourneyReducer(state, { type: "toggle-option", questionId: firstQuestion.id, optionId });
  }
  const answeredFirst = state.answers[firstQuestion.id];
  state = selfReflectionJourneyReducer(state, { type: "continue" });
  assert.equal(state.questionIndex, 1);
  state = selfReflectionJourneyReducer(state, { type: "back" });
  assert.equal(state.questionIndex, 0);
  assert.deepEqual(state.answers[firstQuestion.id], answeredFirst);

  const completeAnswers = createCompleteAnswers(["agency", "orientation"]);
  state = {
    ...state,
    phase: "journey",
    questionIndex: selfReflectionQuestions.length - 1,
    answers: completeAnswers,
    validationMessage: null,
  };
  state = selfReflectionJourneyReducer(state, { type: "continue" });
  assert.equal(state.phase, "result");

  state = selfReflectionJourneyReducer(state, { type: "edit-section", sectionId: "priorities" });
  assert.equal(state.phase, "journey");
  assert.equal(state.questionIndex, 0);
  const changedOption = firstQuestion.options.find(({ id }) => !state.answers[firstQuestion.id]?.includes(id));
  assert.ok(changedOption);
  state = selfReflectionJourneyReducer(state, { type: "toggle-option", questionId: firstQuestion.id, optionId: changedOption.id });
  assert.notDeepEqual(state.answers[firstQuestion.id], completeAnswers[firstQuestion.id]);
  state = selfReflectionJourneyReducer(state, { type: "continue" });
  state = selfReflectionJourneyReducer(state, { type: "continue" });
  state = selfReflectionJourneyReducer(state, { type: "continue" });
  assert.equal(state.phase, "result");
  assert.equal(buildSelfReflectionResult(state.answers).status, "complete");

  state = selfReflectionJourneyReducer(state, { type: "request-restart" });
  assert.equal(state.restartPending, true);
  state = selfReflectionJourneyReducer(state, { type: "cancel-restart" });
  assert.equal(state.restartPending, false);
  state = selfReflectionJourneyReducer(state, { type: "request-restart" });
  state = selfReflectionJourneyReducer(state, { type: "confirm-restart" });
  assert.deepEqual(state, initialSelfReflectionState);
});

test("Self remains a focused client island with native semantics and no persistence channel", () => {
  const client = readFileSync(new URL("../components/find-your-next-step/self-reflection-journey.tsx", import.meta.url), "utf8");
  const shell = readFileSync(new URL("../components/find-your-next-step/find-your-next-step-self.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/find-your-next-step/[slug]/page.tsx", import.meta.url), "utf8");
  const engine = readFileSync(new URL("../lib/find-your-next-step-self.ts", import.meta.url), "utf8");
  const implementation = [client, shell, route, engine].join("\n");

  assert.equal(client.startsWith('"use client"'), true);
  assert.equal(shell.startsWith('"use client"'), false);
  assert.equal(route.startsWith('"use client"'), false);
  assert.equal(client.includes("<fieldset"), true);
  assert.equal(client.includes("<legend"), true);
  assert.equal(client.includes('type="radio"'), false);
  assert.equal(client.includes('question.format === "single" ? "radio" : "checkbox"'), true);
  assert.equal(client.includes("onKeyDown"), false);
  assert.equal(client.includes("<details"), true);
  assert.equal(client.includes("<summary"), true);

  for (const prohibited of [
    "localStorage",
    "sessionStorage",
    "document.cookie",
    "URLSearchParams",
    "history.pushState",
    "history.replaceState",
    "beforeunload",
    "@/lib/supabase",
    "fetch(",
    "console.log",
    "Math.random",
  ]) {
    assert.equal(implementation.includes(prohibited), false, prohibited);
  }
});
