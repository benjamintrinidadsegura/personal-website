import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LocaleProvider } from "../components/i18n/locale-context";
import { MoneyProfileShareCard } from "../components/money-profile/money-profile-share-card";
import { MoneyProfileShareDialog } from "../components/money-profile/money-profile-share-dialog";
import { CanonicalSiteUrlProvider } from "../components/site/canonical-site-url-context";
import { getMoneyChapterDisplay, getMoneyMeaningDisplay, getMoneyStressDisplay, localizeMoneyHypotheses, localizeMoneyQuestion, localizeMoneyResult, moneyGermanQuestions, moneyGermanStatements } from "../data/money-profile-content-locales";
import { getMoneyProfileDisplayLabels, getMoneyProfileUiCopy } from "../data/money-profile-locales";
import { moneyChapters, moneyInterventions, moneyProfileFamilies, moneyTensionDefinitions } from "../data/money-profile";
import { moneyQuestions } from "../data/money-profile-questions";
import { getDiscoverySurface } from "../data/search-discovery";
import { locales } from "../lib/i18n/config";
import { getLanguageSwitchTarget } from "../lib/i18n/routing";
import { collectMoneyEvidence, deriveMoneyProfile, generateMoneyCalibrationHypotheses, getVisibleMoneyQuestions } from "../lib/money-profile-engine";
import { clearMoneyProfileState, moneyProfileStorageKey, parsePersistedMoneyProfileState, readMoneyProfileState, serializeMoneyProfileState, writeMoneyProfileState } from "../lib/money-profile-persistence";
import { moneyMeaningIds, moneyStressResponseIds, type MoneyAnswerSet, type MoneyProfileResult, type PersistedMoneyProfileState } from "../types/money-profile";

const otherLocales = locales.filter((locale) => locale !== "de");
const uiBaseline: Record<string, string> = {
  en: "2585b1d67bd022704c85c7a5788b3bd9effef7a0cdab9f22a2ed96a6cc36a1cc", es: "1f09821fe6b98bf3eb3dc12e3c35e0f8016b3ef1729976f29ff1a3460cf883dc", tr: "940743b1306d76444803776b2b434ac1e7248c75060a50be233858bfedf499d9", pl: "7e7a8613bc3f38c930f968ea5fb369c6edf3021d9a0720ce0cb2d6f03d39e3d5", el: "5cba7009a527bb1dec9cc1783ec6b3c55fd285c8aa3b2fb50aa26461f522bb3c", ru: "78df528e807b416fde228be170301ea8245c95871c37b4bfb5b637b91c70f207",
};
const displayFields = new Set(["title", "prompt", "instruction", "label", "definition", "potentialStrength", "potentialTradeOff", "strength", "tradeOff", "helpfulDirection", "insight", "concept", "whyItMayHelp", "fitReason", "headline", "description", "baselineShift", "strengths", "blindSpots", "triggers", "nextSteps", "experiment", "atMyBest", "underStress", "watchFor", "whatHelps", "myNextMove", "text"]);
function decisionPayload(value: unknown, field = ""): unknown {
  if (typeof value === "string") return displayFields.has(field) ? "<display>" : value;
  if (Array.isArray(value)) return value.map((item) => decisionPayload(item, field));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decisionPayload(item, key)]));
  return value;
}
const answers = (values: Record<string, string | readonly string[]>): MoneyAnswerSet => Object.fromEntries(Object.entries(values).map(([id, value]) => [id, { value }]));
const protector = answers({ m1: ["security", "peace"], m2: "buffer", m3: "stable", m5: "safer", m6: "protect", m7: "wait", m8: "neither", m14: "separate", m20: "very", m21: "satisfying", m24: "future", m25: "buffer", m26: "solve", m29: "necessary", m36: ["none"], m37: "step" });

for (const question of moneyQuestions) test(`German Money ${question.id}: every authored option and instruction, with identical IDs/order/weights`, () => {
  const sourceSnapshot = structuredClone(question);
  const de = localizeMoneyQuestion(question, "de");
  const copy = moneyGermanQuestions[question.id];
  assert.ok(copy);
  assert.equal(de.title, copy.title);
  assert.equal(de.prompt, copy.prompt);
  assert.notEqual(de.prompt, question.prompt);
  assert.deepEqual(Object.keys(copy.options), question.options.map(({ id }) => id));
  assert.equal(Boolean(copy.instruction), Boolean(question.instruction));
  if (question.instruction) assert.equal(de.instruction, copy.instruction);
  for (const option of de.options) assert.equal(option.label, copy.options[option.id]);
  assert.deepEqual(decisionPayload(de), decisionPayload(question));
  assert.deepEqual(question, sourceSnapshot);
  for (const locale of otherLocales) assert.equal(localizeMoneyQuestion(question, locale), question);
});

test("German Money chapters, meanings, stress labels and remaining surface copy are complete", () => {
  assert.deepEqual(Object.keys(moneyGermanQuestions), moneyQuestions.map(({ id }) => id));
  assert.equal(moneyQuestions.reduce((count, question) => count + question.options.length, 0), 226);
  for (let chapter = 1; chapter <= 7; chapter++) {
    assert.notEqual(getMoneyChapterDisplay(chapter, "de"), moneyChapters[chapter - 1]);
    for (const locale of otherLocales) assert.equal(getMoneyChapterDisplay(chapter, locale), moneyChapters[chapter - 1]);
  }
  for (const id of moneyMeaningIds) assert.ok(getMoneyMeaningDisplay(id, "de").length);
  for (const id of moneyStressResponseIds) assert.ok(getMoneyStressDisplay(id, "de").length);
  const copy = getMoneyProfileUiCopy("de");
  assert.equal(copy.meaning, "Bedeutung von Geld");
  assert.equal(copy.onePager, "Mein Geldprofil auf einer Seite");
  assert.equal(copy.confidence["money-map"], "Geldmuster-Karte – ohne erzwungenen Typ");
  assert.doesNotMatch(copy.contentLanguageNotice, /englische Originaltexte|Prüfung folgt/u);
  assert.match(getDiscoverySurface("money-profile", "de").copy.boundary, /^Das Geldprofil/u);
  assert.equal(getMoneyProfileDisplayLabels("de").noTension, "Keine Spannung war stark genug, um sie als beständiges Muster darzustellen. Auch das ist ein gültiges Ergebnis.");
});

test("Money English and all five non-DE UI dictionaries remain byte-for-byte source-compatible", () => {
  for (const locale of otherLocales) assert.equal(createHash("sha256").update(JSON.stringify(getMoneyProfileUiCopy(locale))).digest("hex"), uiBaseline[locale], locale);
});

test("Money localizes every family, tension, intervention and fixed result statement without changing decisions", () => {
  const source = deriveMoneyProfile(protector);
  for (const family of moneyProfileFamilies) {
    const result = { ...source, primaryProfile: family, secondaryProfile: null, baseline: { headline: family.label, description: `${family.strength} ${family.helpfulDirection}` } };
    const de = localizeMoneyResult(result, "de");
    assert.notEqual(de.primaryProfile?.label, family.label);
    assert.notEqual(de.baseline.description, result.baseline.description);
    assert.deepEqual(decisionPayload(de), decisionPayload(result));
  }
  const exhaustive: MoneyProfileResult = {
    ...source,
    tensions: moneyTensionDefinitions.map((item) => ({ ...item, evidenceQuestionIds: ["m1"] })),
    interventions: moneyInterventions.map((item) => ({ ...item, fitReason: item.whyItMayHelp, priority: 7 })),
    strengths: Object.values(moneyGermanStatements).map(([english]) => english),
  };
  const de = localizeMoneyResult(exhaustive, "de");
  assert.deepEqual(decisionPayload(de), decisionPayload(exhaustive));
  assert.deepEqual(de.strengths, Object.values(moneyGermanStatements).map(([, german]) => german));
  for (const item of de.interventions) assert.notEqual(item.concept, moneyInterventions.find(({ id }) => id === item.id)?.concept);
  assert.throws(() => localizeMoneyQuestion({ ...moneyQuestions[0], id: "m999" }, "de"), /Missing German Money display copy/);
  assert.throws(() => localizeMoneyResult({ ...source, strengths: ["An unregistered new interpretation."] }, "de"), /Unmapped German Money/);
});

test("Money adaptive branches, calibration, mixed/weak/stress results and 200 varied answer sets preserve evaluation", () => {
  let seed = 731;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  const cases: MoneyAnswerSet[] = [{}, protector, answers({ m13: "postpone", m14: "track", m15: "drops", m18: "difficult", m19: "delay", m26: "avoid", m28: "repeatedly", m34: "stop", m36: ["admin"] }), answers({ m1: ["security", "freedom", "choices"], m2: "buffer", m3: "say-no", m5: "options", m6: "wait", m16: "pot", m17: "restricted", m21: "options", m25: "options" })];
  for (let i = 0; i < 200; i++) cases.push(Object.fromEntries(moneyQuestions.filter((question) => question.options.length && random() > .15).map((question) => [question.id, { value: question.type === "multi" ? question.options.filter(() => random() > .6).slice(0, question.maxSelections).map(({ id }) => id) : question.options[Math.floor(random() * question.options.length)].id }])));
  const confidence = new Set<string>();
  const stress = new Set<string>();
  const branches = new Set<string>();
  for (const input of cases) {
    const snapshot = structuredClone(input);
    const hypotheses = generateMoneyCalibrationHypotheses(input);
    const localizedHypotheses = localizeMoneyHypotheses(hypotheses, "de");
    assert.deepEqual(decisionPayload(localizedHypotheses), decisionPayload(hypotheses));
    for (const calibration of [{}, Object.fromEntries(hypotheses.map(({ id }) => [id, "very-true" as const])), Object.fromEntries(hypotheses.map(({ id }) => [id, "not-really" as const]))]) {
      const source = deriveMoneyProfile(input, calibration);
      const de = localizeMoneyResult(source, "de");
      confidence.add(source.confidenceMode);
      if (source.stress.primary) stress.add(source.stress.primary);
      assert.deepEqual(decisionPayload(de), decisionPayload(source));
      assert.notEqual(de.baseline.description, source.baseline.description);
      assert.deepEqual(deriveMoneyProfile(input, calibration), source);
      for (const locale of otherLocales) assert.equal(localizeMoneyResult(source, locale), source);
    }
    for (const question of getVisibleMoneyQuestions(input)) {
      if (question.condition) branches.add(question.id);
      const de = localizeMoneyQuestion(question, "de");
      assert.deepEqual(collectMoneyEvidence({ [de.id]: { value: de.options[0].id } }), collectMoneyEvidence({ [question.id]: { value: question.options[0].id } }));
    }
    assert.deepEqual(input, snapshot);
  }
  assert.deepEqual([...confidence].sort(), ["clear-pattern", "context-dependent", "mixed-profile", "money-map"].sort());
  assert.deepEqual([...stress].sort(), [...moneyStressResponseIds].sort());
  assert.deepEqual([...branches].sort(), ["m39", "m40", "m41"]);
});

test("Money persisted progress survives language switches, result resume and restart without a migration", () => {
  const store = new Map<string, string>();
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value), removeItem: (key: string) => store.delete(key) } } });
  try {
    for (const phase of ["questions", "calibration", "reveal", "result"] as const) {
      const state: PersistedMoneyProfileState = { schemaVersion: 1, phase, questionId: phase === "questions" ? "m14" : null, answers: { ...protector }, calibration: { "hypothesis-protector": "very-true" }, updatedAt: "2026-10-05T08:00:00.000Z" };
      writeMoneyProfileState(state);
      const raw = store.get(moneyProfileStorageKey)!;
      const resumed = readMoneyProfileState()!;
      const source = deriveMoneyProfile(resumed.answers, resumed.calibration);
      for (const locale of locales) {
        localizeMoneyResult(source, locale);
        getVisibleMoneyQuestions(resumed.answers).forEach((question) => localizeMoneyQuestion(question, locale));
        assert.equal(store.get(moneyProfileStorageKey), raw);
        assert.deepEqual(readMoneyProfileState(), resumed);
      }
      assert.deepEqual(parsePersistedMoneyProfileState(serializeMoneyProfileState(resumed)), resumed);
    }
    assert.equal(getLanguageSwitchTarget("/tools/money-profile", "en"), "/en/tools/money-profile");
    assert.equal(getLanguageSwitchTarget("/en/tools/money-profile", "de"), "/tools/money-profile");
    clearMoneyProfileState();
    assert.equal(readMoneyProfileState(), null);
  } finally { if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow); else Reflect.deleteProperty(globalThis, "window"); }
});

test("German Money one-pager share cards and dialog render German labels and evaluated content in all formats", () => {
  const result = localizeMoneyResult(deriveMoneyProfile(protector), "de");
  const copy = getMoneyProfileUiCopy("de");
  for (const format of ["story", "portrait", "square"] as const) {
    const html = renderToStaticMarkup(createElement(MoneyProfileShareCard, { copy, locale: "de", format, result, sections: new Set(["profile", "meaning", "strength", "reminder"] as const) }));
    assert.match(html, /GELDPROFIL/u);
    assert.match(html, /Mein Geldprofil auf einer Seite/u);
    assert.match(html, /Der sichernde Typ/u);
    assert.match(html, /Bedeutung von Geld/u);
    assert.match(html, /Eine Karte deiner Muster/u);
    assert.doesNotMatch(html, /The Protector|Money Meaning|A map of patterns|My next move/u);
  }
  const dialog = renderToStaticMarkup(createElement(LocaleProvider, { locale: "de" } as ComponentProps<typeof LocaleProvider>, createElement(CanonicalSiteUrlProvider, { canonicalSiteUrl: "https://btshq.online" } as ComponentProps<typeof CanonicalSiteUrlProvider>, createElement(MoneyProfileShareDialog, { copy, locale: "de", result, onClose: () => {} }))));
  assert.match(dialog, /Sicheren Inhalt wählen/u);
  assert.match(dialog, /Text und Link kopieren/u);
  assert.match(dialog, /Meine Stärke im Umgang mit Geld/u);
  assert.doesNotMatch(dialog, /MONEY PROFILE|My Money Profile|Square ·/u);
  const experience = readFileSync(new URL("../components/money-profile/money-profile-experience.tsx", import.meta.url), "utf8");
  assert.match(experience, /<MoneyOnePager locale=\{locale\}/u);
  assert.match(experience, /getMoneyMeaningDisplay\(id, locale\)/u);
  assert.match(experience, /getMoneyStressDisplay\(result\.stress\.primary, locale\)/u);
  assert.match(experience, /<MoneyResultNavigation copy=\{copy\} locale=\{locale\}/u);
});
