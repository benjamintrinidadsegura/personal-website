import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

import { getLifeAlignmentHubContent } from "../data/i18n/life-alignment-modules";
import { getLifeVisionContent, getPartnerAlignmentContent, getSelfAlignmentContent } from "../data/i18n/life-alignment";
import { locales, type Locale } from "../lib/i18n/config";
import { buildLifeAlignmentClipboardSummary, buildLifeAlignmentResultText } from "../lib/life-alignment-export";
import { buildLifeAlignmentResult, formatLifeAlignmentSelectionCount, validateLifeAlignmentSection } from "../lib/life-alignment";
import { buildPartnerClipboardSummary, buildPartnerResultText } from "../lib/life-alignment-partner-export";
import { buildPartnerComparisonResult, formatPartnerSelectionCount, validatePartnerSection } from "../lib/life-alignment-partner";
import { buildLifeVisionClipboardSummary, buildLifeVisionResultText } from "../lib/life-alignment-life-vision-export";
import { buildLifeVisionResult, formatLifeVisionSelectionCount, validateLifeVisionSection } from "../lib/life-alignment-life-vision";
import type { LifeAlignmentAnswers } from "../types/life-alignment";
import type { PartnerParticipantAnswers } from "../types/life-alignment-partner";
import type { LifeVisionAnswers } from "../types/life-alignment-life-vision";
import { hasExplicitLifeUiCopy, lifeUiValue } from "../data/i18n/life-alignment-ui";

const selfAnswers: LifeAlignmentAnswers = {
  selectedAreaIds: ["work", "close-relationships", "wellbeing", "rest-play"], customLabels: { "custom-1": "", "custom-2": "" }, priorityAreaIds: ["work", "wellbeing"],
  areas: { work: { currentEmphasis: "a-lot", capacityEffect: "mixed", desiredDirection: "less" }, "close-relationships": { currentEmphasis: "workable", capacityEffect: "supportive", desiredDirection: "keep" }, wellbeing: { currentEmphasis: "little", capacityEffect: "draining", desiredDirection: "more" }, "rest-play": { currentEmphasis: "little", capacityEffect: "unclear", desiredDirection: "uncertain" } },
  constraints: ["time-attention", "income-commitment"], focusAreaId: "work", tradeoffStatus: "explore-change", authoritySources: ["intrinsic", "social"], entanglementStatus: "current", focusIntention: "A personal note that must remain exactly as written.", experimentMode: "protect",
};

const partnerA: PartnerParticipantAnswers = {
  selectedDimensionIds: ["connection", "communication", "autonomy"], sensitiveOptIns: [], comparisonConsent: true,
  dimensions: { connection: { experience: "workable", desiredDirection: "more", importance: "important", certainty: "clear", expectationClarity: "current-confirmed", differenceStance: "discuss", constraint: "none" }, communication: { experience: "less-than-needed", desiredDirection: "more", importance: "important", certainty: "clear", expectationClarity: "assumed", differenceStance: "discuss", constraint: "capacity" }, autonomy: { experience: "mixed", desiredDirection: "different", importance: "somewhat", certainty: "unsure", expectationClarity: "currently-unclear", differenceStance: "uncertain", constraint: "external" } },
};
const partnerB: PartnerParticipantAnswers = {
  selectedDimensionIds: ["connection", "communication", "shared-time"], sensitiveOptIns: [], comparisonConsent: true,
  dimensions: { connection: { experience: "workable", desiredDirection: "more", importance: "important", certainty: "clear", expectationClarity: "current-confirmed", differenceStance: "acceptable", constraint: "none" }, communication: { experience: "more-than-needed", desiredDirection: "less", importance: "important", certainty: "clear", expectationClarity: "currently-unclear", differenceStance: "acceptable", constraint: "practical" }, "shared-time": { experience: "unclear", desiredDirection: "open", importance: "somewhat", certainty: "unsure", expectationClarity: "discussed-before-current-unclear", differenceStance: "uncertain", constraint: "unclear" } },
};

const visionAnswers: LifeVisionAnswers = {
  horizon: "three-five-years", selectedAreaIds: ["work-contribution", "relationships", "rest-play"], emphasisByArea: { "work-contribution": "different", relationships: "more", "rest-play": "intentionally-open" }, protectedAreaIds: ["relationships", "rest-play"], protectionIds: ["close-relationships", "financial-floor"], sourcesByArea: { "work-contribution": ["intrinsic", "social"], relationships: ["intrinsic"], "rest-play": ["uncertain"] }, constraintIds: ["time", "money"], competingAreaIds: ["work-contribution", "relationships"], tradeoffStance: "protect-both", explorationModes: ["gather-information", "conversation", "reversible-experiment"],
};

const expectedTitles: Record<Locale, readonly [string, string, string]> = {
  de: ["Deine Life-Alignment-Momentaufnahme", "Was zwischen euch sichtbar wird", "Deine Future Direction Landscape"],
  en: ["Your Life Alignment snapshot", "What becomes visible between you", "Your Future Direction Landscape"],
  es: ["Tu panorama de Life Alignment", "Lo que se hace visible entre vosotros", "Tu paisaje de dirección futura"],
  tr: ["Life Alignment görünümün", "Aranızda görünür olanlar", "Gelecek yönü manzaran"],
  pl: ["Twój obraz Life Alignment", "Co staje się widoczne między Wami", "Twój krajobraz przyszłego kierunku"],
  el: ["Η εικόνα σου στο Life Alignment", "Τι γίνεται ορατό ανάμεσά σας", "Το τοπίο της μελλοντικής σου κατεύθυνσης"],
  ru: ["Ваш обзор Life Alignment", "Что становится видимым между вами", "Ваш ландшафт будущего направления"],
};

test("all seven locales expose complete Life hub, Self, Partner and Life Vision semantic content", () => {
  assert.deepEqual(locales, ["de", "en", "es", "tr", "pl", "el", "ru"]);
  for (const locale of locales) {
    const hub = getLifeAlignmentHubContent(locale); const self = getSelfAlignmentContent(locale); const partner = getPartnerAlignmentContent(locale); const vision = getLifeVisionContent(locale);
    assert.equal(hub.available.length, 3); assert.ok(hub.available.every(({ purpose, privacy }) => purpose.length > 30 && privacy.length > 15));
    assert.equal(self.sections.length, 5); assert.equal(self.areas.length, 8); assert.equal(Object.keys(self.experiments).length, 6);
    assert.equal(partner.sections.length, 4); assert.equal(partner.dimensions.length, 8); assert.ok(partner.dimensions.every(({ examples }) => examples.length === 3)); assert.equal(Object.keys(partner.pathCopy).length, 9);
    assert.equal(vision.sections.length, 6); assert.equal(vision.areas.length, 8); assert.equal(Object.keys(vision.exploration).length, 10);
  }
});

test("Self generated results, validation, counts and exports are deterministic in every locale", () => {
  for (const locale of locales) {
    for (let index = 0; index < 5; index += 1) assert.equal(validateLifeAlignmentSection(index, selfAnswers, locale), null);
    const output = buildLifeAlignmentResult(selfAnswers, locale); assert.equal(output.status, "complete"); if (output.status !== "complete") continue;
    assert.equal(output.result.title, expectedTitles[locale][0]); assert.equal(output.result.focusIntention, selfAnswers.focusIntention); assert.ok(output.result.insights.every(({ explanation, evidence }) => explanation.length > 25 && evidence.length > 0)); assert.ok(output.result.actionPaths.every(({ firstStep, tradeoff }) => firstStep.length > 20 && tradeoff.length > 20));
    assert.match(formatLifeAlignmentSelectionCount(4, 4, 6, "ausgewählt", locale), /^4\s/); assert.ok(buildLifeAlignmentResultText(output.result, locale).includes(output.result.title)); assert.ok(buildLifeAlignmentClipboardSummary(output.result, locale).length > 100);
  }
});

test("Partner results remain insight-first, consent-gated and free of scores or rankings in every locale", () => {
  for (const locale of locales) {
    for (let index = 0; index < 4; index += 1) assert.equal(validatePartnerSection(index, partnerA, locale), null);
    const output = buildPartnerComparisonResult({ a: partnerA, b: partnerB }, true, locale); assert.equal(output.status, "complete"); if (output.status !== "complete") continue;
    assert.equal(output.result.title, expectedTitles[locale][1]); assert.equal(output.result.experiments.length, 3); assert.equal(output.result.conversationTools.length, 2); assert.ok(output.result.findings.every(({ evidence, questions, possibleNextSteps }) => evidence.length > 0 && questions.length === 2 && possibleNextSteps.length === 3));
    assert.doesNotMatch(JSON.stringify(output.result), /"(?:score|rank|ranking|winner|percentage)"\s*:/i); assert.match(formatPartnerSelectionCount(3, locale), /^3\s/); assert.ok(buildPartnerResultText(output.result, locale).includes(output.result.title)); assert.ok(buildPartnerClipboardSummary(output.result, locale).length > 100);
  }
});

test("Life Vision keeps equivalent result depth and user-selected paths in every locale", () => {
  for (const locale of locales) {
    for (let index = 0; index < 6; index += 1) assert.equal(validateLifeVisionSection(index, visionAnswers, locale), null);
    const output = buildLifeVisionResult(visionAnswers, locale); assert.equal(output.status, "complete"); if (output.status !== "complete") continue;
    assert.equal(output.result.title, expectedTitles[locale][2]); assert.deepEqual(output.result.actionPaths.map(({ mode }) => mode), visionAnswers.explorationModes); assert.ok(output.result.insights.every(({ evidence, why }) => evidence.length > 0 && why.length > 20)); assert.ok(output.result.actionPaths.every(({ tools, reversibility }) => tools.length > 0 && reversibility.length > 20)); assert.doesNotMatch(output.result.visualSnapshot.directionSummary, /\.\./u);
    assert.match(formatLifeVisionSelectionCount(3, 3, 6, locale), /^3\s/); assert.ok(buildLifeVisionResultText(output.result, locale).includes(output.result.title)); assert.ok(buildLifeVisionClipboardSummary(output.result, locale).length > 100);
  }
});

test("new-locale generated copy uses Polish, Greek and Cyrillic scripts without baseline-language leakage", () => {
  const pl = buildLifeAlignmentResult(selfAnswers, "pl"); const el = buildLifeVisionResult(visionAnswers, "el"); const ru = buildPartnerComparisonResult({ a: partnerA, b: partnerB }, true, "ru");
  assert.equal(pl.status, "complete"); assert.equal(el.status, "complete"); assert.equal(ru.status, "complete");
  if (pl.status === "complete") assert.match(JSON.stringify(pl.result), /[ąćęłńóśźż]/i);
  if (el.status === "complete") assert.match(JSON.stringify(el.result), /[Α-Ωα-ω]/u);
  if (ru.status === "complete") assert.match(JSON.stringify(ru.result), /[А-Яа-яЁё]/u);
});

test("Life-owned rendering no longer contains binary locale flags", () => {
  const files = ["life-alignment-hub.tsx", "life-alignment-journey.tsx", "partner/partner-journey.tsx", "life-vision/life-vision-journey.tsx", "alignment-landscape.tsx", "partner/comparison-landscape.tsx", "life-vision/future-direction-landscape.tsx"];
  for (const file of files) {
    const source = readFileSync(new URL(`../components/life-alignment/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /\b(?:isEnglish|isGerman|const en)\b|locale\s*[!=]==?\s*["'](?:de|en)["']/u);
  }
  for (const file of ["result-actions.tsx", "journey-dock.tsx", "result-recovery.tsx"]) {
    const source = readFileSync(new URL(`../components/human-context/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /\b(?:isEnglish|isGerman|const en)\b|locale\s*[!=]==?\s*["'](?:de|en)["']/u);
  }
});

test("Partner handoff intro keeps four distinct native statements in every added locale", () => {
  const english = [
    "Person A answers, reviews what is included and seals their perspective.",
    "Person B takes the device and answers without seeing A's answers.",
    "The shared comparison appears only after the second consent.",
    "Where there is fear, control, violence or a lack of safety, this shared flow may not be appropriate.",
  ];
  const german = [
    "Person A antwortet, prüft die Einbeziehung und versiegelt ihre Perspektive.",
    "Person B übernimmt das Gerät und antwortet, ohne die Angaben von A zu sehen.",
    "Erst nach der zweiten Zustimmung erscheint die gemeinsame Gegenüberstellung.",
    "Bei Angst, Kontrolle, Gewalt oder fehlender Sicherheit ist dieser gemeinsame Ablauf möglicherweise nicht angemessen.",
  ];

  for (const locale of ["es", "tr", "pl", "el", "ru"] as const) {
    const translated = lifeUiValue(locale, english, german);
    assert.equal(new Set(translated).size, 4);
    assert.ok(translated.every((item) => item.length > 35));
    assert.ok(translated.every((item) => !english.includes(item)));
  }
});

function lifeSourceFiles(): string[] {
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if ([".ts", ".tsx"].includes(extname(path))) files.push(path);
    }
  };
  visit(resolve("app/life-alignment"));
  visit(resolve("components/life-alignment"));
  for (const entry of readdirSync(resolve("lib"), { withFileTypes: true })) {
    if (entry.isFile() && /^life-alignment.*\.ts$/u.test(entry.name)) files.push(resolve("lib", entry.name));
  }
  return files;
}

function staticStrings(node: ts.Node | undefined): string[] {
  if (!node) return [];
  if (ts.isStringLiteralLike(node)) return [node.text];
  if (ts.isArrayLiteralExpression(node)) return node.elements.flatMap(staticStrings);
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.flatMap((property) => ts.isPropertyAssignment(property) ? staticStrings(property.initializer) : []);
  }
  if (ts.isConditionalExpression(node)) return [...staticStrings(node.whenTrue), ...staticStrings(node.whenFalse)];
  return [];
}

test("every static Life UI source string has explicit added-locale copy", () => {
  const sources = new Set<string>();
  for (const path of lifeSourceFiles()) {
    const sourceFile = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        if (node.expression.text === "lifeUiValue") staticStrings(node.arguments[1]).forEach((value) => sources.add(value));
        if (node.expression.text === "message") staticStrings(node.arguments[0]).forEach((value) => sources.add(value));
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  for (const locale of ["es", "tr", "pl", "el", "ru"] as const) {
    const missing = [...sources].filter((source) => !hasExplicitLifeUiCopy(locale, source));
    assert.deepEqual(missing, [], `${locale} missing explicit Life UI copy`);
  }
  assert.throws(() => lifeUiValue("tr", "Unregistered Life UI source", "Nicht registriert"), /Missing explicit Life UI copy/u);
});

test("localized result prose is never passed back through the static UI-copy registry", () => {
  const comparison = readFileSync("components/life-alignment/partner/comparison-landscape.tsx", "utf8");
  assert.doesNotMatch(comparison, /lifeUiValue\(locale,\s*\[\[/u);
});
