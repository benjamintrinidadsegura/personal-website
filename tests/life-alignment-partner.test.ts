import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { partnerDimensions, partnerExpectationClarityOptions, partnerModule, partnerSections } from "../data/life-alignment-partner";
import { buildPartnerClipboardSummary, buildPartnerResultText } from "../lib/life-alignment-partner-export";
import {
  buildPartnerComparisonResult,
  firstInvalidPartnerSection,
  formatPartnerSelectionCount,
  initialPartnerJourneyState,
  partnerJourneyReducer,
  validatePartnerSection,
} from "../lib/life-alignment-partner";
import type { PartnerParticipantAnswers } from "../types/life-alignment-partner";

const completeA: PartnerParticipantAnswers = {
  selectedDimensionIds: ["connection", "communication", "autonomy", "finances"],
  sensitiveOptIns: ["finances"],
  dimensions: {
    connection: { experience: "workable", desiredDirection: "more", importance: "important", certainty: "clear", expectationClarity: "current-confirmed", differenceStance: "discuss", constraint: "none" },
    communication: { experience: "less-than-needed", desiredDirection: "more", importance: "important", certainty: "clear", expectationClarity: "assumed", differenceStance: "discuss", constraint: "capacity" },
    autonomy: { experience: "mixed", desiredDirection: "different", importance: "somewhat", certainty: "unsure", expectationClarity: "currently-unclear", differenceStance: "uncertain", constraint: "external" },
    finances: { experience: "mixed", desiredDirection: "similar", importance: "somewhat", certainty: "clear", expectationClarity: "current-confirmed", differenceStance: "acceptable", constraint: "practical" },
  },
  comparisonConsent: true,
};

const completeB: PartnerParticipantAnswers = {
  selectedDimensionIds: ["connection", "communication", "shared-time"],
  sensitiveOptIns: [],
  dimensions: {
    connection: { experience: "workable", desiredDirection: "more", importance: "important", certainty: "clear", expectationClarity: "current-confirmed", differenceStance: "acceptable", constraint: "none" },
    communication: { experience: "more-than-needed", desiredDirection: "less", importance: "important", certainty: "clear", expectationClarity: "currently-unclear", differenceStance: "acceptable", constraint: "practical" },
    "shared-time": { experience: "unclear", desiredDirection: "open", importance: "somewhat", certainty: "unsure", expectationClarity: "discussed-before-current-unclear", differenceStance: "uncertain", constraint: "unclear" },
  },
  comparisonConsent: true,
};

test("Partner V1 declares the independent-first, local same-device contract", () => {
  assert.equal(partnerModule.href, "/life-alignment/partner");
  assert.equal(partnerSections.length, 4);
  assert.equal(partnerDimensions.filter(({ sensitive }) => sensitive).length, 2);
  assert.ok(partnerDimensions.every(({ examples }) => examples.length === 3));
  assert.deepEqual(Object.keys(partnerExpectationClarityOptions), ["current-confirmed", "assumed", "discussed-before-current-unclear", "currently-unclear", "intentionally-open"]);
  assert.match(partnerModule.privacy, /Arbeitsspeicher/i);
  assert.match(partnerModule.privacy, /keine Übertragung/i);
  assert.match(partnerModule.description, /Kein Kompatibilitätstest/i);
});

test("bounded selection and sensitive opt-in are explicit and validated", () => {
  assert.equal(formatPartnerSelectionCount(0), "0 von 6 ausgewählt · 3–6 benötigt");
  assert.equal(formatPartnerSelectionCount(3), "3 von 6 ausgewählt · gültige Auswahl");
  assert.equal(validatePartnerSection(0, completeA), null);
  const missingOptIn = { ...completeA, sensitiveOptIns: [] };
  assert.match(validatePartnerSection(0, missingOptIn) ?? "", /ausdrücklicher Zustimmung/i);

  let state = partnerJourneyReducer(initialPartnerJourneyState, { type: "start" });
  state = partnerJourneyReducer(state, { type: "toggle-dimension", dimensionId: "finances" });
  assert.deepEqual(state.participants.a.selectedDimensionIds, []);
  state = partnerJourneyReducer(state, { type: "toggle-sensitive-opt-in", dimensionId: "finances" });
  state = partnerJourneyReducer(state, { type: "toggle-dimension", dimensionId: "finances" });
  assert.deepEqual(state.participants.a.selectedDimensionIds, ["finances"]);
  state = partnerJourneyReducer(state, { type: "toggle-sensitive-opt-in", dimensionId: "finances" });
  assert.deepEqual(state.participants.a.selectedDimensionIds, []);
  assert.equal(state.participants.a.dimensions.finances, undefined);
});

test("all participant sections require structured answers and explicit comparison consent", () => {
  for (let sectionIndex = 0; sectionIndex < 4; sectionIndex += 1) assert.equal(validatePartnerSection(sectionIndex, completeA), null);
  assert.equal(firstInvalidPartnerSection(completeA), null);
  assert.equal(firstInvalidPartnerSection({ ...completeA, comparisonConsent: false }), 3);
  assert.equal(firstInvalidPartnerSection({ ...completeA, dimensions: { ...completeA.dimensions, connection: {} } }), 1);
});

test("participant A seals before handoff and participant B must consent before comparison", () => {
  const aReady = { ...initialPartnerJourneyState, phase: "participant-a" as const, sectionIndex: 3, participants: { a: completeA, b: initialPartnerJourneyState.participants.b } };
  const handoff = partnerJourneyReducer(aReady, { type: "seal-participant-a" });
  assert.equal(handoff.phase, "handoff");
  assert.equal(handoff.participantASealed, true);
  const bStarted = partnerJourneyReducer(handoff, { type: "begin-participant-b" });
  assert.equal(bStarted.phase, "participant-b");
  assert.deepEqual(bStarted.participants.b, initialPartnerJourneyState.participants.b);
  assert.deepEqual(bStarted.participants.a, completeA);

  const bWithoutConsent = { ...bStarted, sectionIndex: 3, participants: { ...bStarted.participants, b: { ...completeB, comparisonConsent: false } } };
  const refused = partnerJourneyReducer(bWithoutConsent, { type: "finish-participant-b" });
  assert.equal(refused.phase, "participant-b");
  assert.match(refused.validationMessage ?? "", /Bestätige/i);
  const bReady = { ...bStarted, sectionIndex: 3, participants: { ...bStarted.participants, b: completeB } };
  assert.equal(partnerJourneyReducer(bReady, { type: "finish-participant-b" }).phase, "result");
});

test("restart is explicit and clears both perspectives", () => {
  const populated = { ...initialPartnerJourneyState, phase: "handoff" as const, participantASealed: true, participants: { a: completeA, b: completeB } };
  const pending = partnerJourneyReducer(populated, { type: "request-restart" });
  assert.equal(pending.restartPending, true);
  assert.deepEqual(pending.participants.a, completeA);
  assert.deepEqual(partnerJourneyReducer(pending, { type: "confirm-restart" }), initialPartnerJourneyState);
});

test("comparison is stable, qualitative, concrete, and linked to explicit answer evidence", () => {
  const output = buildPartnerComparisonResult({ a: completeA, b: completeB }, true);
  assert.equal(output.status, "complete");
  if (output.status !== "complete") return;
  const result = output.result;
  assert.equal(result.tracks[0]?.dimensionId, "connection");
  assert.deepEqual(result.findings[0]?.dimensionIds, ["communication"]);
  assert.equal(result.metrics.topicsSelectedByA, 4);
  assert.equal(result.metrics.topicsSelectedByB, 3);
  assert.equal(result.metrics.topicsAssessedByBoth, 2);
  assert.equal(result.metrics.sharedDirections, 1);
  assert.equal(result.metrics.differingDirections, 1);
  assert.equal(result.metrics.openOrUncertainTopics, 4);
  assert.equal(result.metrics.topicsWithPresentConstraints, 1);
  assert.deepEqual(result.sharedOverview.map(({ id }) => id), ["shared-ground", "different-perspectives", "open-questions", "current-constraints", "conversation-opportunities", "not-yet-explored-together"]);
  assert.ok(result.sharedOverview.every(({ headline, explanation, dimensionIds }) => headline.length > 20 && explanation.length > 20 && dimensionIds.length > 0));
  assert.equal(result.findingsByCategory["shared-ground"].length, 1);
  assert.equal(result.findingsByCategory["worth-discussing"].length, 1);
  assert.equal(result.findingsByCategory["accepted-difference"].length, 1);
  assert.equal(result.findingsByCategory["not-assessed-by-both"].length, 1);
  assert.ok(result.findings.every(({ evidence, questions, possibleNextSteps, everydayTranslation, everydayExamples, whatCouldBeLearned, boundary }) => evidence.length > 0 && questions.length >= 2 && possibleNextSteps.length === 3 && everydayTranslation.length > 20 && everydayExamples.length >= 2 && whatCouldBeLearned.length > 20 && boundary.length > 20));
  assert.ok(result.paths.length >= 3);
  assert.ok(result.paths.every(({ why, tradeoffs, reversibility, whatCouldBeLearned, evidenceFindingIds }) => why && tradeoffs && reversibility && whatCouldBeLearned && evidenceFindingIds.length));
  assert.equal(result.experiments.length, 3);
  assert.ok(result.experiments.every(({ steps, whatCouldBeLearned, evidenceFindingIds }) => steps.length === 3 && whatCouldBeLearned && evidenceFindingIds.length));
  assert.equal(result.conversationTools.length, 2);
  assert.ok(result.conversationTools.every(({ steps, safetyBoundary, evidenceFindingIds }) => steps.length === 3 && safetyBoundary && evidenceFindingIds.length));
  assert.doesNotMatch(JSON.stringify(result), /(?:compatibility|life score|percentage|ranking|diagnosis)/i);
});

test("comparison cannot be generated before both releases and A's seal", () => {
  const noSeal = buildPartnerComparisonResult({ a: completeA, b: completeB }, false);
  assert.equal(noSeal.status, "incomplete");
  if (noSeal.status === "incomplete") assert.equal(noSeal.participant, "a");
  const noBConsent = buildPartnerComparisonResult({ a: completeA, b: { ...completeB, comparisonConsent: false } }, true);
  assert.equal(noBConsent.status, "incomplete");
  if (noBConsent.status === "incomplete") assert.equal(noBConsent.participant, "b");
});

test("reduced clipboard export omits sensitive themes and all person-level evidence", () => {
  const output = buildPartnerComparisonResult({ a: completeA, b: completeB }, true);
  assert.equal(output.status, "complete");
  if (output.status !== "complete") return;
  const full = buildPartnerResultText(output.result);
  const clipboard = buildPartnerClipboardSummary(output.result);
  assert.match(full, /Geld und finanzielle Absprachen/);
  assert.match(full, /Gemeinsamer Beziehungskontext/i);
  assert.match(full, /Eine Perspektive:/);
  assert.doesNotMatch(full, /Person [AB]:/);
  assert.doesNotMatch(full, /Von A gewählt|Von B gewählt|Beschreibende Anzahlen/);
  assert.doesNotMatch(clipboard, /Geld und finanzielle Absprachen/);
  assert.doesNotMatch(clipboard, /Person [AB]:/);
  assert.doesNotMatch(clipboard, /Von A gewählt|Von B gewählt|Beschreibende Anzahlen/);
  assert.match(clipboard, /Sensible Themen.*ausgelassen/i);
  assert.ok(full.length <= 16_000);
  assert.ok(clipboard.length <= 1_600);
});

test("the UI does not disclose A during B's journey and uses accessible evidence structures", () => {
  const journey = readFileSync(new URL("../components/life-alignment/partner/partner-journey.tsx", import.meta.url), "utf8");
  const landscape = readFileSync(new URL("../components/life-alignment/partner/comparison-landscape.tsx", import.meta.url), "utf8");
  assert.match(journey, /function Handoff\(\{ dispatch, restart \}/);
  assert.doesNotMatch(journey, /function Handoff\([^)]*answers/);
  assert.match(journey, /const answers = state\.participants\[participant\]/);
  assert.match(journey, /state\.phase === "result"/);
  assert.match(journey, /role="alert"/);
  assert.match(journey, /aria-live="polite"/);
  assert.match(journey, /Du antwortest nur für dich/);
  assert.match(journey, /dimension\.examples\.join/);
  assert.match(landscape, /<ol/);
  assert.match(landscape, /<details/);
  assert.match(landscape, /<dl/);
  assert.match(landscape, /Gemeinsamer Beziehungskontext/);
  assert.match(landscape, /Qualitative Übersicht eures gemeinsamen Beziehungskontexts/);
  assert.match(landscape, /Nicht überinterpretieren/);
  assert.match(landscape, /Drei kleine Möglichkeiten/);
  assert.match(landscape, /Was ihr lernen könntet/);
  assert.match(landscape, /Worauf basiert das\?/);
  assert.doesNotMatch(landscape, /Von A gewählt|Von B gewählt|A · erste Perspektive|B · zweite Perspektive|role="img"/);
  assert.doesNotMatch(journey, /Perspektiven A \+ B|Beschreibende Anzahlen/);
  assert.doesNotMatch(journey, /<textarea/);
});

test("Partner-specific implementation has no persistence, network, analytics, or account coupling", () => {
  const paths = [
    "../types/life-alignment-partner.ts",
    "../data/life-alignment-partner.ts",
    "../lib/life-alignment-partner.ts",
    "../lib/life-alignment-partner-export.ts",
    "../components/life-alignment/partner/partner-journey.tsx",
    "../components/life-alignment/partner/comparison-landscape.tsx",
    "../components/life-alignment/partner/partner-result-actions.tsx",
    "../components/life-alignment/partner/partner-page.tsx",
  ];
  const source = paths.map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
  for (const prohibited of ["localStorage", "sessionStorage", "indexedDB", "document.cookie", "@/lib/supabase", "fetch(", "navigator.sendBeacon", "analytics", "accountId", "userId"]) assert.equal(source.includes(prohibited), false, prohibited);
});

test("DE and EN Partner results preserve released semantics while localizing shared interpretation", () => {
  const participants = { a: completeA, b: completeB };
  const de = buildPartnerComparisonResult(participants, true, "de");
  const en = buildPartnerComparisonResult(participants, true, "en");
  assert.equal(de.status, "complete");
  assert.equal(en.status, "complete");
  if (de.status !== "complete" || en.status !== "complete") return;

  assert.deepEqual(en.result.metrics, de.result.metrics);
  assert.deepEqual(en.result.tracks.map(({ dimensionId, sensitive, participantA, participantB }) => ({ dimensionId, sensitive, participantA: participantA && { experience: participantA.experience, desiredDirection: participantA.desiredDirection, importance: participantA.importance, certainty: participantA.certainty, expectationClarity: participantA.expectationClarity, differenceStance: participantA.differenceStance, constraint: participantA.constraint }, participantB: participantB && { experience: participantB.experience, desiredDirection: participantB.desiredDirection, importance: participantB.importance, certainty: participantB.certainty, expectationClarity: participantB.expectationClarity, differenceStance: participantB.differenceStance, constraint: participantB.constraint } })), de.result.tracks.map(({ dimensionId, sensitive, participantA, participantB }) => ({ dimensionId, sensitive, participantA: participantA && { experience: participantA.experience, desiredDirection: participantA.desiredDirection, importance: participantA.importance, certainty: participantA.certainty, expectationClarity: participantA.expectationClarity, differenceStance: participantA.differenceStance, constraint: participantA.constraint }, participantB: participantB && { experience: participantB.experience, desiredDirection: participantB.desiredDirection, importance: participantB.importance, certainty: participantB.certainty, expectationClarity: participantB.expectationClarity, differenceStance: participantB.differenceStance, constraint: participantB.constraint } })));
  assert.deepEqual(en.result.sharedOverview.map(({ id, dimensionIds }) => ({ id, dimensionIds })), de.result.sharedOverview.map(({ id, dimensionIds }) => ({ id, dimensionIds })));
  assert.deepEqual(en.result.findings.map(({ id, category, dimensionIds, evidence }) => ({ id, category, dimensionIds, evidence: evidence.map(({ participant, dimensionId, field }) => ({ participant, dimensionId, field })) })), de.result.findings.map(({ id, category, dimensionIds, evidence }) => ({ id, category, dimensionIds, evidence: evidence.map(({ participant, dimensionId, field }) => ({ participant, dimensionId, field })) })));
  assert.deepEqual(en.result.paths.map(({ id, evidenceFindingIds }) => ({ id, evidenceFindingIds })), de.result.paths.map(({ id, evidenceFindingIds }) => ({ id, evidenceFindingIds })));
  assert.deepEqual(en.result.experiments.map(({ id, evidenceFindingIds }) => ({ id, evidenceFindingIds })), de.result.experiments.map(({ id, evidenceFindingIds }) => ({ id, evidenceFindingIds })));
  assert.deepEqual(en.result.conversationTools.map(({ id, evidenceFindingIds }) => ({ id, evidenceFindingIds })), de.result.conversationTools.map(({ id, evidenceFindingIds }) => ({ id, evidenceFindingIds })));

  assert.equal(en.result.title, "What becomes visible between you");
  assert.equal(en.result.tracks[0]?.dimensionTitle, "Closeness and connection");
  assert.match(en.result.description, /without a compatibility score/i);
  assert.notEqual(en.result.sharedOverview[0]?.headline, de.result.sharedOverview[0]?.headline);

  const full = buildPartnerResultText(en.result, "en");
  const clipboard = buildPartnerClipboardSummary(en.result, "en");
  assert.match(full, /SHARED RELATIONSHIP CONTEXT/);
  assert.match(full, /THREE REVERSIBLE EXPLORATIONS/);
  assert.match(full, /One perspective:/);
  assert.match(clipboard, /Sensitive topics and personal evidence were intentionally omitted/);
  assert.doesNotMatch(clipboard, /Kompatibilitätsmessung|Sensible Themen/);
});
