import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LocaleProvider } from "../components/i18n/locale-context";
import { PersonalAdvantageShareCard } from "../components/personal-advantage/personal-advantage-share-card";
import { PersonalAdvantageShareDialog } from "../components/personal-advantage/personal-advantage-share-dialog";
import { CanonicalSiteUrlProvider } from "../components/site/canonical-site-url-context";
import { advantageGermanQuestions, advantageGermanSignals, advantageGermanStatements, getAdvantageChapterDisplay, getAdvantageSignalDisplay, localizeAdvantageCandidate, localizeAdvantageMap, localizeAdvantageProbes, localizeAdvantageQuestion } from "../data/personal-advantage-content-locales";
import { getPersonalAdvantageDisplayLabels, getPersonalAdvantageUiCopy } from "../data/personal-advantage-locales";
import { advantageChapterCopy, advantageQuestions } from "../data/personal-advantage-questions";
import { advantageSignals } from "../data/personal-advantage-signals";
import { curatedAdvantageSynergies } from "../data/personal-advantage-synergies";
import { getDiscoverySurface } from "../data/search-discovery";
import { locales } from "../lib/i18n/config";
import { getLanguageSwitchTarget } from "../lib/i18n/routing";
import { answerSignature, buildAdvantageCandidates, buildAdvantageSignalProfiles, buildPersonalAdvantageMap, normalizeAdvantageEvidence, generateAdvantageProbes, getActiveAdvantageQuestions } from "../lib/personal-advantage-engine";
import { clearAdvantageState, parsePersistedAdvantageState, personalAdvantageStorageKey, readAdvantageState, serializeAdvantageState, writeAdvantageState } from "../lib/personal-advantage-persistence";
import type { AdvantageAnswer, AdvantageAnswerSet, AdvantageCandidate, AdvantageProbe, PersistedAdvantageState } from "../types/personal-advantage";

const otherLocales = locales.filter((locale) => locale !== "de");
const uiBaseline: Record<string, string> = {
  en: "6cd0e50d0eca0f386d4ad278dd8cd8184b4760d12433771f96f6e363c98e7666", es: "dbbe270620adb54ba882f12e5987e6e5dea45e8c5cbc0f7ef4edce3a95bf275d", tr: "c6f04deff90945c6b62b13e06c85f3dfd0cf7519511d71ff3c540ecf77673e9c", pl: "e45026b1fc6cc849b70e5e73e097c4cd28f2f73f8a9ce0f80dd87e502d0f5ced", el: "c01d6d6312242ff1310dae9619248d466b8f3b898cb5ad81f68bd90bbd5328ed", ru: "569e1d202430299db08ec942a2e1acb07ef881fee18d3c5822a5d6b1827ebf1b",
};
const displayFields = new Set(["title", "prompt", "instruction", "label", "definition", "contexts", "overusePatterns", "possibleMultipliers", "synthesis", "recognition", "killers", "shadow", "counterweight", "multiplier", "explanation", "experiment", "amplifierEnvironments", "shadows", "counterweights", "missingMultiplier", "detail", "showsUp", "powerfulWhen", "tryThis", "watchFor", "experiments", "reminder"]);
function decisionPayload(value: unknown, field = ""): unknown {
  if (typeof value === "string") return displayFields.has(field) ? "<display>" : value;
  if (Array.isArray(value)) return value.map((item) => decisionPayload(item, field));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decisionPayload(item, key)]));
  return value;
}
function answersForSignals(signalIds: readonly string[]): Record<string, AdvantageAnswer> {
  const targets = new Set(signalIds);
  const answers: Record<string, AdvantageAnswer> = {};
  for (const question of advantageQuestions) {
    const matching = question.options.filter(({ effects }) => effects.some(({ signalId }) => targets.has(signalId)));
    if (!matching.length) continue;
    const values = matching.slice(0, question.type === "multi" ? question.maxSelections ?? 1 : 1).map(({ id }) => id);
    answers[question.id] = { value: question.type === "multi" ? values : values[0] };
  }
  answers.q21 = { value: signalIds.slice(0, 3) };
  answers.q44 = { value: signalIds[0] ?? "" };
  answers.q46 = { value: signalIds.slice(0, 3) };
  return answers;
}
const strongestProbeAnswers = (probes: readonly AdvantageProbe[]) => Object.fromEntries(probes.map((probe) => [probe.id, probe.options.reduce((best, option) => option.interaction > best.interaction ? option : best).id]));
const systemsAnswers = answersForSignals(["systems-thinking", "communication-clarity"]);

for (const question of advantageQuestions) test(`German Advantage ${question.id}: all authored options and instructions retain IDs/order/weights`, () => {
  const snapshot = structuredClone(question);
  const copy = advantageGermanQuestions[question.id];
  const de = localizeAdvantageQuestion(question, "de");
  assert.ok(copy);
  assert.equal(de.title, copy.title);
  assert.equal(de.prompt, copy.prompt);
  assert.notEqual(de.prompt, question.prompt);
  assert.deepEqual(Object.keys(copy.options), question.options.map(({ id }) => id));
  assert.equal(Boolean(copy.instruction), Boolean(question.instruction));
  if (question.instruction) assert.equal(de.instruction, copy.instruction);
  for (const option of de.options) assert.equal(option.label, copy.options[option.id]);
  assert.deepEqual(decisionPayload(de), decisionPayload(question));
  assert.deepEqual(question, snapshot);
  for (const locale of otherLocales) assert.equal(localizeAdvantageQuestion(question, locale), question);
});

test("German Advantage chapters and every adaptive signal label/definition/context/multiplier are complete", () => {
  assert.deepEqual(Object.keys(advantageGermanQuestions), advantageQuestions.map(({ id }) => id));
  assert.equal(advantageQuestions.reduce((count, question) => count + question.options.length, 0), 435);
  assert.deepEqual(Object.keys(advantageGermanSignals), advantageSignals.map(({ id }) => id));
  assert.equal(advantageSignals.length, 58);
  for (const chapter of advantageChapterCopy) {
    assert.notEqual(getAdvantageChapterDisplay(chapter.id, "de").label, chapter.label);
    for (const locale of otherLocales) assert.equal(getAdvantageChapterDisplay(chapter.id, locale), chapter);
  }
  for (const source of advantageSignals) {
    const de = getAdvantageSignalDisplay(source.id, "de");
    assert.equal(de.label, advantageGermanSignals[source.id][0]);
    assert.notEqual(de.definition, source.definition);
    assert.equal(source.overusePatterns.length, 1, "new overuse patterns need their own German copy");
    assert.deepEqual(decisionPayload(de), decisionPayload(source));
    for (const locale of otherLocales) assert.equal(getAdvantageSignalDisplay(source.id, locale), source);
  }
  const copy = getPersonalAdvantageUiCopy("de");
  assert.equal(copy.onePager, "Dein persönlicher Vorteil auf einer Seite");
  assert.doesNotMatch(copy.languageNotice, /englische Originaltexte|Prüfung folgt/u);
  assert.doesNotMatch(JSON.stringify(copy), /Core Advantage|Advantage Map|My Hidden Edge|Personal Advantage Mapping/u);
  assert.doesNotMatch(JSON.stringify(getDiscoverySurface("personal-advantage", "de").copy), /Brain Manual|Unfair Advantage/u);
  assert.equal(getPersonalAdvantageDisplayLabels("de").overview, "Überblick");
});

test("Advantage English and the other five UI dictionaries remain byte-for-byte source-compatible", () => {
  for (const locale of otherLocales) assert.equal(createHash("sha256").update(JSON.stringify(getPersonalAdvantageUiCopy(locale))).digest("hex"), uiBaseline[locale], locale);
});

test("all 71 curated Advantage results, fallback statements and composed shadows translate after evaluation", () => {
  assert.equal(curatedAdvantageSynergies.length, 71);
  for (const source of curatedAdvantageSynergies) {
    const candidate: AdvantageCandidate = { ...source, source: "curated", evidenceStrength: 17, interactionStrength: .8, explanatoryPower: .6, contextFit: .7, energyAlignment: .4, contradictionPenalty: .3, calibrationModifier: .2, confidence: "supported", eligibleForCore: true, evidenceClasses: ["outcome"] };
    const de = localizeAdvantageCandidate(candidate, "de");
    assert.notEqual(de.label, source.label);
    assert.notEqual(de.synthesis, source.synthesis);
    assert.deepEqual(decisionPayload(de), decisionPayload(candidate));
    const sharedSignalLabel = advantageSignals.find((signal) => signal.label === source.label);
    if (sharedSignalLabel) assert.equal(de.label, getAdvantageSignalDisplay(sharedSignalLabel.id, "de").label, "the same authored label must remain consistent in adaptive questions and results");
  }
  const source = buildPersonalAdvantageMap({}, [], {}, {});
  const exhaustive = { ...source, experiments: Object.values(advantageGermanStatements).map(([english]) => english) };
  assert.deepEqual(localizeAdvantageMap(exhaustive, "de").experiments, Object.values(advantageGermanStatements).map(([, german]) => german));
  for (const pair of [["creative-recombination", "network-position"], ["opportunity-recognition", "network-position"], ["learning-speed", "systems-thinking"]]) {
    const candidates = buildAdvantageCandidates(answersForSignals(pair));
    for (const candidate of candidates) assert.deepEqual(decisionPayload(localizeAdvantageCandidate(candidate, "de")), decisionPayload(candidate));
  }
  assert.throws(() => localizeAdvantageQuestion({ ...advantageQuestions[0], id: "q999" }, "de"), /Missing German Advantage display copy/);
  assert.throws(() => localizeAdvantageMap({ ...source, reminder: "An unregistered new recommendation." }, "de"), /Unmapped German Advantage/);
});

test("adaptive options/probes, weak evidence, calibration and 200 varied Advantage maps preserve all decisions", () => {
  let seed = 918;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  const cases: AdvantageAnswerSet[] = [{}, systemsAnswers, answersForSignals(["domain-depth", "creative-recombination"]), { ...systemsAnswers, q8: { value: "struggle" }, q59: { value: ["systems-thinking", "communication-clarity"] } }, { ...systemsAnswers, q54: { value: "", freeText: "An optional private experience" }, q55: { value: "strong" } }];
  for (let i = 0; i < 200; i++) cases.push(Object.fromEntries(advantageQuestions.filter((question) => question.options.length && random() > .15).map((question) => [question.id, { value: question.type === "multi" ? question.options.filter(() => random() > .6).slice(0, question.maxSelections).map(({ id }) => id) : question.options[Math.floor(random() * question.options.length)].id }])));
  const archetypes = new Set<string>();
  const confidence = new Set<string>();
  const branches = new Set<string>();
  for (const input of cases) {
    const snapshot = structuredClone(input);
    const probes = generateAdvantageProbes(input);
    const translated = localizeAdvantageProbes(probes, "de");
    assert.deepEqual(decisionPayload(translated), decisionPayload(probes));
    probes.forEach(({ archetype }) => archetypes.add(archetype));
    assert.deepEqual(generateAdvantageProbes(input), probes);
    const candidates = buildAdvantageCandidates(input);
    for (const candidate of candidates) assert.deepEqual(decisionPayload(localizeAdvantageCandidate(candidate, "de")), decisionPayload(candidate));
    for (const locale of otherLocales) assert.equal(localizeAdvantageProbes(probes, locale), probes);
    const probeAnswers = strongestProbeAnswers(probes);
    for (const calibration of [{}, Object.fromEntries(candidates.slice(0, 3).map(({ id }) => [id, "very-true" as const])), Object.fromEntries(candidates.slice(0, 3).map(({ id }) => [id, "not-really" as const]))]) {
      const source = buildPersonalAdvantageMap(input, probes, probeAnswers, calibration);
      const de = localizeAdvantageMap(source, "de");
      confidence.add(source.coreAdvantage.confidence);
      assert.deepEqual(decisionPayload(de), decisionPayload(source));
      assert.notEqual(de.coreAdvantage.synthesis, source.coreAdvantage.synthesis);
      assert.deepEqual(buildPersonalAdvantageMap(input, probes, probeAnswers, calibration), source);
      for (const locale of otherLocales) assert.equal(localizeAdvantageMap(source, locale), source);
    }
    for (const question of getActiveAdvantageQuestions(input)) {
      if (question.condition) branches.add(question.id);
      if (question.type === "adaptive-signals") {
        const canonicalOptions = buildAdvantageSignalProfiles(input).filter(({ support }) => support > 0).slice(0, 6).map(({ signal }) => ({ id: signal.id, label: signal.label }));
        const localizedOptions = canonicalOptions.map((option) => ({ ...option, label: getAdvantageSignalDisplay(option.id, "de").label }));
        assert.deepEqual(decisionPayload(localizedOptions), decisionPayload(canonicalOptions));
        for (const option of localizedOptions) assert.deepEqual(normalizeAdvantageEvidence({ [question.id]: { value: question.id === "q44" ? option.id : [option.id] } }), normalizeAdvantageEvidence({ [question.id]: { value: question.id === "q44" ? canonicalOptions.find(({ id }) => id === option.id)!.id : [option.id] } }));
      }
    }
    assert.deepEqual(input, snapshot);
  }
  assert.equal(archetypes.size, 10);
  assert.deepEqual([...confidence].sort(), ["emerging", "supported", "strong-pattern"].sort());
  assert.deepEqual([...branches].sort(), advantageQuestions.filter(({ condition }) => condition).map(({ id }) => id).sort());
});

test("Advantage progress, probes, calibration and result resume survive locale switching and restart", () => {
  const store = new Map<string, string>();
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value), removeItem: (key: string) => store.delete(key) } } });
  try {
    const probes = generateAdvantageProbes(systemsAnswers);
    for (const phase of ["questions", "probes", "calibration", "reveal", "result"] as const) {
      const state: PersistedAdvantageState = { schemaVersion: 1, phase, questionId: phase === "questions" ? "q21" : null, answers: { ...systemsAnswers, q23: { value: "", freeText: "private note never persisted" } }, probeAnswers: strongestProbeAnswers(probes), calibration: { "systems-translation": "very-true" }, updatedAt: "2026-10-05T08:00:00.000Z" };
      writeAdvantageState(state);
      const raw = store.get(personalAdvantageStorageKey)!;
      assert.doesNotMatch(raw, /private note|freeText/u);
      const resumed = readAdvantageState()!;
      assert.equal(answerSignature(resumed.answers), answerSignature(state.answers));
      const source = buildPersonalAdvantageMap(resumed.answers, probes, resumed.probeAnswers, resumed.calibration);
      for (const locale of locales) {
        localizeAdvantageMap(source, locale);
        localizeAdvantageProbes(probes, locale);
        getActiveAdvantageQuestions(resumed.answers).forEach((question) => localizeAdvantageQuestion(question, locale));
        assert.equal(store.get(personalAdvantageStorageKey), raw);
        assert.deepEqual(readAdvantageState(), resumed);
      }
      assert.deepEqual(parsePersistedAdvantageState(serializeAdvantageState(resumed)), resumed);
    }
    assert.equal(getLanguageSwitchTarget("/tools/personal-advantage", "en"), "/en/tools/personal-advantage");
    assert.equal(getLanguageSwitchTarget("/en/tools/personal-advantage", "de"), "/tools/personal-advantage");
    clearAdvantageState();
    assert.equal(readAdvantageState(), null);
  } finally { if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow); else Reflect.deleteProperty(globalThis, "window"); }
});

test("German Advantage one-pager, share cards and dialog show translated result copy in all formats", () => {
  const probes = generateAdvantageProbes(systemsAnswers);
  const map = localizeAdvantageMap(buildPersonalAdvantageMap(systemsAnswers, probes, strongestProbeAnswers(probes), {}), "de");
  const copy = getPersonalAdvantageUiCopy("de");
  for (const format of ["story", "portrait", "square"] as const) {
    const html = renderToStaticMarkup(createElement(PersonalAdvantageShareCard, { copy, locale: "de", format, map, sections: new Set(["advantage", "stack", "hidden", "shadow", "reminder"] as const) }));
    assert.match(html, /PERSÖNLICHER VORTEIL/u);
    assert.match(html, /Dein persönlicher Vorteil auf einer Seite/u);
    assert.match(html, /Systeme verständlich machen/u);
    assert.match(html, /Eine Hypothese/u);
    assert.doesNotMatch(html, /Systems Translation|Personal Advantage Mapping|My Advantage/u);
  }
  const html = renderToStaticMarkup(createElement(LocaleProvider, { locale: "de" } as ComponentProps<typeof LocaleProvider>, createElement(CanonicalSiteUrlProvider, { canonicalSiteUrl: "https://btshq.online" } as ComponentProps<typeof CanonicalSiteUrlProvider>, createElement(PersonalAdvantageShareDialog, { copy, locale: "de", map, onClose: () => {} }))));
  assert.match(html, /Text \+ Link kopieren/u);
  assert.match(html, /Mein Vorteil/u);
  assert.doesNotMatch(html, /PERSONAL ADVANTAGE|Core Advantage|Square ·/u);
  const experience = readFileSync(new URL("../components/personal-advantage/personal-advantage-experience.tsx", import.meta.url), "utf8");
  assert.match(experience, /<OnePager copy=\{copy\} map=\{map\}/u);
  assert.match(experience, /getAdvantageSignalDisplay\(item\.signalId, locale\)\.definition/u);
  assert.match(experience, /localizeAdvantageMap\(buildPersonalAdvantageMap\(answers, probes, probeAnswers, calibration\), locale\)/u);
});
