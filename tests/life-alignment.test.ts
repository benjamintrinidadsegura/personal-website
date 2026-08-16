import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { lifeAlignment, lifeAlignmentSections, lifeAreas } from "../data/life-alignment";
import { buildLifeAlignmentClipboardSummary, buildLifeAlignmentResultText } from "../lib/life-alignment-export";
import {
  buildLifeAlignmentResult,
  formatLifeAlignmentSelectionCount,
  initialLifeAlignmentState,
  lifeAlignmentReducer,
  validCustomAreaLabel,
  validFocusIntention,
  validateLifeAlignmentSection,
} from "../lib/life-alignment";
import type { LifeAlignmentAnswers } from "../types/life-alignment";

const completeAnswers: LifeAlignmentAnswers = {
  selectedAreaIds: ["work", "close-relationships", "wellbeing", "rest-play"],
  customLabels: { "custom-1": "", "custom-2": "" },
  priorityAreaIds: ["work", "wellbeing"],
  areas: {
    work: { currentEmphasis: "a-lot", capacityEffect: "mixed", desiredDirection: "less" },
    "close-relationships": { currentEmphasis: "workable", capacityEffect: "supportive", desiredDirection: "keep" },
    wellbeing: { currentEmphasis: "little", capacityEffect: "draining", desiredDirection: "more" },
    "rest-play": { currentEmphasis: "little", capacityEffect: "unclear", desiredDirection: "uncertain" },
  },
  constraints: ["time-attention", "income-commitment"],
  focusAreaId: "work",
  tradeoffStatus: "explore-change",
  authoritySources: ["intrinsic", "social"],
  entanglementStatus: "current",
  focusIntention: "Mehr verlässliche Zeit für Erholung schützen.",
  experimentMode: "protect",
};

test("Life Alignment exposes one five-part, qualitative, local-only reflection", () => {
  assert.equal(lifeAlignment.href, "/life-alignment");
  assert.equal(lifeAlignment.status, "Beta");
  assert.equal(lifeAlignmentSections.length, 5);
  assert.equal(lifeAreas.length, 8);
  assert.match(lifeAlignment.privacy, /nicht gespeichert/i);
  assert.match(lifeAlignment.description, /ohne Lebensscore/i);
  assert.doesNotMatch(JSON.stringify({ lifeAlignment, lifeAlignmentSections, lifeAreas }), /"(?:score|ranking|diagnosis)"/i);
});

test("input boundaries accept ordinary text and reject unsafe or ambiguous free text", () => {
  assert.equal(validCustomAreaLabel("Spiritualität"), true);
  assert.equal(validCustomAreaLabel("A"), false);
  assert.equal(validCustomAreaLabel(`Plan\u202Eevil`), false);
  assert.equal(validFocusIntention(""), true);
  assert.equal(validFocusIntention("zu kurz"), false);
  assert.equal(validFocusIntention("Eine kleine, selbstgewählte Veränderung."), true);
});

test("bounded selections expose a complete textual count and validity state", () => {
  assert.equal(formatLifeAlignmentSelectionCount(0, 4, 6), "0 von 6 ausgewählt · 4–6 benötigt");
  assert.equal(formatLifeAlignmentSelectionCount(4, 4, 6), "4 von 6 ausgewählt · gültige Auswahl");
  assert.equal(formatLifeAlignmentSelectionCount(2, 1, 3, "markiert"), "2 von 3 markiert · gültige Auswahl");

  const journey = readFileSync(new URL("../components/life-alignment/life-alignment-journey.tsx", import.meta.url), "utf8");
  assert.equal(journey.match(/<SelectionCount /gu)?.length, 4);
  assert.match(journey, /border-\[#ff9a3d\]\/40/);
  assert.match(journey, /text-\[#ffb36d\]/);
  assert.match(journey, /aria-live="polite"/);
});

test("all five sections validate before a result can be created", () => {
  for (let sectionIndex = 0; sectionIndex < 5; sectionIndex += 1) {
    assert.equal(validateLifeAlignmentSection(sectionIndex, completeAnswers), null);
  }

  const incomplete = { ...completeAnswers, constraints: [] };
  const result = buildLifeAlignmentResult(incomplete);
  assert.equal(result.status, "incomplete");
  if (result.status === "incomplete") assert.equal(result.sectionIndex, 3);
});

test("result logic describes support, tension, uncertainty, constraints, and a reversible experiment without scores", () => {
  const output = buildLifeAlignmentResult(completeAnswers);
  assert.equal(output.status, "complete");
  if (output.status !== "complete") return;

  assert.equal(output.result.focus.title, "Arbeit und Beitrag");
  assert.deepEqual(output.result.supportiveAreas.map(({ id }) => id), ["close-relationships"]);
  assert.deepEqual(output.result.drainingAreas.map(({ id }) => id), ["wellbeing"]);
  assert.deepEqual(output.result.uncertainAreas.map(({ id }) => id), ["rest-play"]);
  assert.equal(output.result.constraints.length, 2);
  assert.match(output.result.experiment.boundary, /freiwillige, reversible Erkundung/i);
  assert.doesNotMatch(JSON.stringify(output.result), /"(?:score|percent|diagnosis)"/i);
});

test("Self result synthesizes cross-area relationships from explicit evidence", () => {
  const output = buildLifeAlignmentResult(completeAnswers);
  assert.equal(output.status, "complete");
  if (output.status !== "complete") return;

  assert.deepEqual(output.result.snapshot.map(({ id }) => id), ["support", "change", "open", "steady"]);
  assert.deepEqual(
    output.result.snapshot.flatMap(({ areas }) => areas.map(({ id }) => id)).sort(),
    [...completeAnswers.selectedAreaIds].sort(),
  );
  assert.deepEqual(output.result.insights.map(({ id }) => id), [
    "support-and-pressure",
    "redistribution",
    "priority-is-not-more",
    "declared-uncertainty",
    "focus-under-constraints",
  ]);
  for (const insight of output.result.insights) {
    assert.ok(insight.explanation.length > 40);
    assert.ok(insight.everydayInterpretation.length > 40);
    assert.ok(insight.evidence.length >= 1);
    assert.ok(insight.evidence.every(({ source, detail }) => source.length > 0 && detail.length > 0));
  }
  assert.match(output.result.insights[1]?.title ?? "", /mehr Gesundheit und Wohlbefinden mit weniger Arbeit und Beitrag/i);
});

test("every contextual path explains fit, example, learning, trade-off, reversibility, and evidence", () => {
  const output = buildLifeAlignmentResult(completeAnswers);
  assert.equal(output.status, "complete");
  if (output.status !== "complete") return;

  assert.deepEqual(output.result.actionPaths.map(({ id }) => id), [
    "chosen-experiment",
    "reduce-load",
    "create-capacity",
    "clarify-source",
  ]);
  for (const path of output.result.actionPaths) {
    assert.ok(path.why.length > 30);
    assert.ok(path.firstStep.length > 30);
    assert.ok(path.example.length > 30);
    assert.ok(path.learning.length > 30);
    assert.ok(path.tradeoff.length > 30);
    assert.equal(typeof path.reversible, "boolean");
    assert.ok(path.evidence.length >= 1);
  }
  assert.equal(output.result.tools.length, 3);
  assert.ok(output.result.tools.every(({ steps, prompt }) => steps.length === 3 && prompt.length > 20));
  assert.equal(output.result.closing.reminders.length, 3);
});

test("a steady snapshot still offers several non-prescriptive paths", () => {
  const steadyAreas = Object.fromEntries(
    completeAnswers.selectedAreaIds.map((areaId) => [areaId, { currentEmphasis: "workable" as const, capacityEffect: "supportive" as const, desiredDirection: "keep" as const }]),
  );
  const output = buildLifeAlignmentResult({
    ...completeAnswers,
    areas: steadyAreas,
    constraints: ["none"],
    priorityAreaIds: ["work"],
    tradeoffStatus: "accepted-now",
    authoritySources: ["intrinsic"],
    experimentMode: "pause",
  });
  assert.equal(output.status, "complete");
  if (output.status !== "complete") return;

  assert.equal(output.result.insights[0]?.id, "descriptive-focus");
  assert.equal(output.result.actionPaths.length, 3);
  assert.equal(new Set(output.result.actionPaths.map(({ id }) => id)).size, 3);
  assert.ok(output.result.actionPaths.some(({ id }) => id === "protect-what-works"));
});

test("the reducer keeps answers in memory and requires explicit restart confirmation", () => {
  const started = lifeAlignmentReducer(initialLifeAlignmentState, { type: "start" });
  const selected = lifeAlignmentReducer(started, { type: "toggle-area", areaId: "work" });
  const pending = lifeAlignmentReducer(selected, { type: "request-restart" });
  assert.equal(pending.restartPending, true);
  assert.deepEqual(pending.answers.selectedAreaIds, ["work"]);
  const restarted = lifeAlignmentReducer(pending, { type: "confirm-restart" });
  assert.deepEqual(restarted, initialLifeAlignmentState);
});

test("full export is complete while clipboard copy deliberately omits sensitive detail", () => {
  const output = buildLifeAlignmentResult(completeAnswers);
  assert.equal(output.status, "complete");
  if (output.status !== "complete") return;

  const full = buildLifeAlignmentResultText(output.result);
  const clipboard = buildLifeAlignmentClipboardSummary(output.result);
  assert.match(full, /Mehr verlässliche Zeit für Erholung schützen/);
  assert.match(full, /Zeit und Aufmerksamkeit/);
  assert.match(full, /Bereichsübergreifende Zusammenhänge/);
  assert.match(full, /Im Alltag:/);
  assert.doesNotMatch(clipboard, /Mehr verlässliche Zeit für Erholung schützen/);
  assert.doesNotMatch(clipboard, /Zeit und Aufmerksamkeit/);
  assert.doesNotMatch(clipboard, /Mein Wunsch \/ ihre Erwartung/);
  assert.match(clipboard, /Private Kurzfassung/);
  assert.ok(full.length <= 6_000);
  assert.ok(clipboard.length <= 1_200);
});

test("the implementation remains storage-, network-, and Supabase-free", () => {
  const implementation = [
    "../types/life-alignment.ts",
    "../data/life-alignment.ts",
    "../lib/life-alignment.ts",
    "../lib/life-alignment-export.ts",
    "../components/life-alignment/life-alignment-journey.tsx",
    "../components/life-alignment/self-depth/self-depth-sections.tsx",
    "../components/life-alignment/life-alignment-page.tsx",
    "../app/life-alignment/self/page.tsx",
  ].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");

  for (const prohibited of ["localStorage", "sessionStorage", "document.cookie", "@/lib/supabase", "fetch(", "navigator.sendBeacon"]) {
    assert.equal(implementation.includes(prohibited), false, prohibited);
  }
});

test("the route, result landscape, navigation, discovery, sitemap, and privacy surface are integrated", () => {
  const route = readFileSync(new URL("../app/life-alignment/self/page.tsx", import.meta.url), "utf8");
  const journey = readFileSync(new URL("../components/life-alignment/life-alignment-journey.tsx", import.meta.url), "utf8");
  const landscape = readFileSync(new URL("../components/life-alignment/alignment-landscape.tsx", import.meta.url), "utf8");
  const header = readFileSync(new URL("../components/layout/header.tsx", import.meta.url), "utf8");
  const discovery = readFileSync(new URL("../data/discovery-index.ts", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  const privacy = readFileSync(new URL("../app/privacy/page.tsx", import.meta.url), "utf8");
  assert.match(route, /alternates: \{ canonical: selfHref \}/);
  assert.match(journey, /<fieldset/);
  assert.match(journey, /role="alert"/);
  assert.match(journey, /data-life-section-heading/);
  assert.match(landscape, /<ol/);
  assert.match(landscape, /<dt/);
  assert.match(landscape, /result\.snapshot\.map/);
  assert.match(journey, /<SelfInsightSynthesis result=\{result\}/);
  assert.match(journey, /<SelfContextualPaths result=\{result\}/);
  assert.match(journey, /<SelfMicroTools result=\{result\}/);
  assert.match(journey, /<SelfClosingOrientation result=\{result\}/);
  for (const source of [header, discovery, sitemap]) assert.match(source, /life-alignment|lifeAlignment/);
  assert.match(privacy, /current page memory/);
  assert.match(privacy, /does not send answers to a server/);
});
