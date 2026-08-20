import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { lifeVision, lifeVisionAreas, lifeVisionSections } from "../data/life-alignment-life-vision";
import { buildLifeVisionClipboardSummary, buildLifeVisionResultText } from "../lib/life-alignment-life-vision-export";
import {
  buildLifeVisionResult,
  formatLifeVisionSelectionCount,
  initialLifeVisionState,
  lifeVisionReducer,
  validateLifeVisionSection,
} from "../lib/life-alignment-life-vision";
import type { LifeVisionAnswers } from "../types/life-alignment-life-vision";

const completeAnswers: LifeVisionAnswers = {
  horizon: "three-five-years",
  selectedAreaIds: ["work-contribution", "relationships", "rest-play"],
  emphasisByArea: {
    "work-contribution": "different",
    relationships: "more",
    "rest-play": "intentionally-open",
  },
  protectedAreaIds: ["relationships", "rest-play"],
  protectionIds: ["close-relationships", "financial-floor"],
  sourcesByArea: {
    "work-contribution": ["intrinsic", "social"],
    relationships: ["intrinsic"],
    "rest-play": ["uncertain"],
  },
  constraintIds: ["time", "money"],
  competingAreaIds: ["work-contribution", "relationships"],
  tradeoffStance: "protect-both",
  explorationModes: ["gather-information", "conversation", "reversible-experiment"],
};

test("Life Vision is a distinct six-section, local-only future-direction reflection", () => {
  assert.equal(lifeVision.href, "/life-alignment/life-vision");
  assert.equal(lifeVisionSections.length, 6);
  assert.equal(lifeVisionAreas.length, 8);
  assert.match(lifeVision.privacy, /weder gespeichert noch übertragen/i);
  assert.match(lifeVision.description, /kein fertiger Lebensplan/i);
});

test("each section enforces explicit bounded answers and accepts intentional openness", () => {
  for (let sectionIndex = 0; sectionIndex < 6; sectionIndex += 1) {
    assert.equal(validateLifeVisionSection(sectionIndex, completeAnswers), null);
  }
  assert.equal(completeAnswers.emphasisByArea["rest-play"], "intentionally-open");
  assert.match(validateLifeVisionSection(0, { ...completeAnswers, selectedAreaIds: ["relationships"] }) ?? "", /drei bis sechs/i);
  assert.match(validateLifeVisionSection(3, { ...completeAnswers, sourcesByArea: { ...completeAnswers.sourcesByArea, relationships: ["uncertain", "intrinsic"] } }) ?? "", /nur allein/i);
  assert.match(validateLifeVisionSection(4, { ...completeAnswers, competingAreaIds: ["relationships"] }) ?? "", /genau zwei/i);
  assert.match(validateLifeVisionSection(5, { ...completeAnswers, explorationModes: ["conversation"] }) ?? "", /zwei bis vier/i);
});

test("bounded status text is prominent and remains understandable without color", () => {
  assert.equal(formatLifeVisionSelectionCount(0, 3, 6), "0 von 6 ausgewählt · 3–6 benötigt");
  assert.equal(formatLifeVisionSelectionCount(3, 3, 6), "3 von 6 ausgewählt · gültige Auswahl");
  const journey = readFileSync(new URL("../components/life-alignment/life-vision/life-vision-journey.tsx", import.meta.url), "utf8");
  assert.match(journey, /aria-live="polite"/);
  assert.match(journey, /text-\[#ffb36d\]/);
  assert.match(journey, /gültiger Zustand/);
});

test("result findings are deterministic, concrete, and linked to explicit answer evidence", () => {
  const output = buildLifeVisionResult(completeAnswers);
  assert.equal(output.status, "complete");
  if (output.status !== "complete") return;
  assert.equal(output.result.areas.length, 3);
  assert.deepEqual(output.result.competingAreas.map(({ id }) => id), ["work-contribution", "relationships"]);
  assert.ok(output.result.insights.some(({ id }) => id === "protected-directions"));
  assert.ok(output.result.insights.some(({ id }) => id === "competing-directions"));
  assert.ok(output.result.insights.some(({ id }) => id === "context-influence"));
  assert.ok(output.result.insights.some(({ id }) => id === "open-directions"));
  assert.ok(output.result.insights.some(({ id }) => id === "protected-movement"));
  assert.ok(output.result.insights.every(({ evidence }) => evidence.length > 0));
  assert.ok(output.result.insights.every(({ illustrativeExample }) => /Nur als Illustration, nicht als Aussage/i.test(illustrativeExample)));
  assert.match(output.result.insights.find(({ id }) => id === "competing-directions")?.finding ?? "", /Arbeit und Beitrag.*Enge Beziehungen/);
});

test("descriptive snapshot and visual direction map preserve overlapping qualitative signals", () => {
  const output = buildLifeVisionResult(completeAnswers);
  assert.equal(output.status, "complete");
  if (output.status !== "complete") return;
  assert.match(output.result.visualSnapshot.headline, /Bewegung.*geschützt/i);
  assert.deepEqual(output.result.directionMap.lanes.map(({ id }) => id), ["protect", "move-toward", "reduce", "keep-open"]);
  const protect = output.result.directionMap.lanes.find(({ id }) => id === "protect");
  const toward = output.result.directionMap.lanes.find(({ id }) => id === "move-toward");
  assert.ok(protect?.areaIds.includes("relationships"));
  assert.ok(toward?.areaIds.includes("relationships"));
  assert.equal(output.result.directionMap.constraintLabels.length, 2);
  assert.equal(output.result.directionMap.sourceSignals.length, 3);

  const redistribution = buildLifeVisionResult({ ...completeAnswers, emphasisByArea: { ...completeAnswers.emphasisByArea, "rest-play": "less" } });
  assert.equal(redistribution.status, "complete");
  if (redistribution.status === "complete") assert.ok(redistribution.result.insights.some(({ id }) => id === "possible-redistribution"));
});

test("only user-selected path families appear, each with rationale, tradeoff, reversibility, and evidence", () => {
  const output = buildLifeVisionResult(completeAnswers);
  assert.equal(output.status, "complete");
  if (output.status !== "complete") return;
  assert.deepEqual(output.result.actionPaths.map(({ mode }) => mode), completeAnswers.explorationModes);
  for (const path of output.result.actionPaths) {
    assert.ok(path.whyItMayFit.length > 20);
    assert.ok(path.firstStep.length > 20);
    assert.ok(path.tradeoff.length > 20);
    assert.ok(path.learningQuestion.length > 20);
    assert.ok(path.reversibility.length > 20);
    assert.ok(path.tools.length > 0);
    assert.ok(path.tools.every(({ title, use }) => title.length > 5 && use.length > 15));
    assert.ok(path.evidence.length > 0);
  }

  const continuityOnly = buildLifeVisionResult({
    ...completeAnswers,
    emphasisByArea: { "work-contribution": "similar", relationships: "similar", "rest-play": "similar" },
    constraintIds: ["none"],
    competingAreaIds: [],
    tradeoffStance: "no-current-tension",
    explorationModes: ["explore-alternatives", "external-support"],
  });
  assert.equal(continuityOnly.status, "complete");
  if (continuityOnly.status === "complete") assert.ok(continuityOnly.result.actionPaths.every(({ evidence }) => evidence.length > 0));
});

test("closing orientation remains optional, chosen-path-led, and evidence-linked", () => {
  const output = buildLifeVisionResult(completeAnswers);
  assert.equal(output.status, "complete");
  if (output.status !== "complete") return;
  assert.match(output.result.closingOrientation.orientation, /könntest|gleichberechtigte Alternativen/i);
  assert.equal(output.result.closingOrientation.questions.length, 3);
  assert.ok(output.result.closingOrientation.evidence.length > 0);
  assert.doesNotMatch(output.result.closingOrientation.orientation, /musst|solltest|richtig/i);
});

test("reducer keeps the journey in memory, clears dependent selections, and requires restart confirmation", () => {
  let state = lifeVisionReducer(initialLifeVisionState, { type: "start" });
  state = lifeVisionReducer(state, { type: "set-horizon", value: "open-horizon" });
  state = lifeVisionReducer(state, { type: "toggle-area", areaId: "relationships" });
  state = lifeVisionReducer(state, { type: "toggle-protected-area", areaId: "relationships" });
  state = lifeVisionReducer(state, { type: "toggle-area", areaId: "relationships" });
  assert.deepEqual(state.answers.protectedAreaIds, []);
  state = lifeVisionReducer(state, { type: "request-restart" });
  assert.equal(state.restartPending, true);
  state = lifeVisionReducer(state, { type: "confirm-restart" });
  assert.deepEqual(state, initialLifeVisionState);
});

test("full export preserves evidence while clipboard export deliberately reduces sensitive context", () => {
  const output = buildLifeVisionResult(completeAnswers);
  assert.equal(output.status, "complete");
  if (output.status !== "complete") return;
  const full = buildLifeVisionResultText(output.result);
  const clipboard = buildLifeVisionClipboardSummary(output.result);
  assert.match(full, /Zeit und Aufmerksamkeit sind begrenzt/);
  assert.match(full, /Mein heutiges Umfeld beeinflusst/);
  assert.match(full, /DESKRIPTIVE MOMENTAUFNAHME/);
  assert.match(full, /Lernfrage:/);
  assert.match(full, /ABSCHLIESSENDE ORIENTIERUNG/);
  assert.doesNotMatch(clipboard, /Zeit und Aufmerksamkeit sind begrenzt/);
  assert.doesNotMatch(clipboard, /Mein heutiges Umfeld beeinflusst/);
  assert.match(clipboard, /Bewusst weggelassen/);
  assert.ok(full.length <= 16_000);
  assert.ok(clipboard.length <= 1_800);
});

test("visual result and journey expose semantic structure, focus targets, evidence disclosure, and restart", () => {
  const journey = readFileSync(new URL("../components/life-alignment/life-vision/life-vision-journey.tsx", import.meta.url), "utf8");
  const landscape = readFileSync(new URL("../components/life-alignment/life-vision/future-direction-landscape.tsx", import.meta.url), "utf8");
  assert.match(journey, /<fieldset/);
  assert.match(journey, /role="alert"/);
  assert.match(journey, /data-life-vision-section-heading/);
  assert.match(journey, /data-life-vision-result-heading/);
  assert.match(journey, /restartPending/);
  assert.match(journey, /Verwendete Antworten ansehen/);
  assert.match(landscape, /<ol/);
  assert.match(landscape, /Qualitative Räume der Future Direction Map/);
  assert.match(landscape, /keine Achse und keine Rangfolge/i);
  assert.match(landscape, /Mögliche Alltagsbilder/);
  assert.match(landscape, /Kleinste passende Hilfe/);
  assert.match(landscape, /Abschließende Orientierung/);
});

test("Life Vision files have no persistence, network, account, or opaque personal measurement coupling", () => {
  const files = [
    "../types/life-alignment-life-vision.ts",
    "../data/life-alignment-life-vision.ts",
    "../lib/life-alignment-life-vision.ts",
    "../lib/life-alignment-life-vision-export.ts",
    "../components/life-alignment/life-vision/life-vision-journey.tsx",
    "../components/life-alignment/life-vision/future-direction-landscape.tsx",
    "../components/life-alignment/life-vision/life-vision-result-actions.tsx",
  ];
  const source = files.map((file) => readFileSync(new URL(file, import.meta.url), "utf8")).join("\n");
  for (const prohibited of ["localStorage", "sessionStorage", "document.cookie", "@/lib/supabase", "fetch(", "sendBeacon", "useUser", "accountId"]) assert.equal(source.includes(prohibited), false, prohibited);
  assert.doesNotMatch(source, /life\s*score|alignment\s*percentage|ideal\s+life/i);
});

test("DE and EN Life Vision results preserve selected directions and evidence structure", () => {
  const de = buildLifeVisionResult(completeAnswers, "de");
  const en = buildLifeVisionResult(completeAnswers, "en");
  assert.equal(de.status, "complete");
  assert.equal(en.status, "complete");
  if (de.status !== "complete" || en.status !== "complete") return;

  assert.deepEqual(en.result.areas.map(({ id, emphasis, protected: isProtected, signals }) => ({ id, emphasis, protected: isProtected, signals })), de.result.areas.map(({ id, emphasis, protected: isProtected, signals }) => ({ id, emphasis, protected: isProtected, signals })));
  assert.deepEqual(en.result.competingAreas.map(({ id }) => id), de.result.competingAreas.map(({ id }) => id));
  assert.deepEqual(en.result.directionMap.lanes.map(({ id, areaIds }) => ({ id, areaIds })), de.result.directionMap.lanes.map(({ id, areaIds }) => ({ id, areaIds })));
  assert.deepEqual(en.result.insights.map(({ id, evidence }) => ({ id, evidenceCount: evidence.length })), de.result.insights.map(({ id, evidence }) => ({ id, evidenceCount: evidence.length })));
  assert.deepEqual(en.result.actionPaths.map(({ mode, evidence }) => ({ mode, evidenceCount: evidence.length })), de.result.actionPaths.map(({ mode, evidence }) => ({ mode, evidenceCount: evidence.length })));
  assert.equal(en.result.closingOrientation.evidence.length, de.result.closingOrientation.evidence.length);

  assert.equal(en.result.title, "Your Future Direction Landscape");
  assert.equal(en.result.horizonLabel, "The next 3–5 years");
  assert.equal(en.result.areas[0]?.title, "Work and contribution");
  assert.match(en.result.visualSnapshot.headline, /Movement with explicitly protected conditions/);
  assert.notEqual(en.result.closingOrientation.orientation, de.result.closingOrientation.orientation);

  const full = buildLifeVisionResultText(en.result, "en");
  const clipboard = buildLifeVisionClipboardSummary(en.result, "en");
  assert.match(full, /DESCRIPTIVE SNAPSHOT/);
  assert.match(full, /EVIDENCE-LINKED OBSERVATIONS/);
  assert.match(full, /CLOSING ORIENTATION/);
  assert.match(clipboard, /Intentionally omitted: source signals/);
  assert.doesNotMatch(clipboard, /Bewusst weggelassen|Zukunftsrahmen/);
});
