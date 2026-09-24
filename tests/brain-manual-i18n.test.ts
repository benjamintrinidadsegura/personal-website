import assert from "node:assert/strict";
import test from "node:test";

import { brainChapters, brainPatterns } from "../data/brain-manual";
import { getLocalizedBrainManual } from "../data/brain-manual-locales";
import { locales } from "../lib/i18n/config";

const translatedLocales = locales.filter((locale) => locale !== "en");
const newPatternIds = ["rapid-grasp", "fast-response-loop", "high-bandwidth-processing", "relational-thinking", "multi-perspective-thinking", "process-thinking"] as const;

test("all seven Brain Manual editions preserve one canonical 33-pattern structure", () => {
  for (const locale of locales) {
    const manual = getLocalizedBrainManual(locale);
    assert.equal(manual.patterns.length, 33, locale);
    assert.equal(manual.chapters.length, 6, locale);
    assert.deepEqual(manual.patterns.map(({ id }) => id), brainPatterns.map(({ id }) => id), locale);
    assert.deepEqual(manual.patterns.map(({ title }) => title), brainPatterns.map(({ title }) => title), `${locale}: canonical titles`);
    assert.deepEqual(manual.chapters.map(({ id, patternIds }) => ({ id, patternIds })), brainChapters.map(({ id, patternIds }) => ({ id, patternIds })), `${locale}: chapter taxonomy`);
    assert.equal(manual.patternById.size, 33, locale);
    for (const id of newPatternIds) assert.ok(manual.patternById.has(id), `${locale}: ${id}`);
  }
});

test("every translated edition provides substantive localized editorial fields without English fallback", () => {
  for (const locale of translatedLocales) {
    const manual = getLocalizedBrainManual(locale);
    assert.doesNotMatch(manual.ui.languageNotice, /currently published in English/u, locale);
    assert.notEqual(manual.ui.title, getLocalizedBrainManual("en").ui.title, `${locale}: hero title`);
    assert.notEqual(manual.ui.connectionsNote, getLocalizedBrainManual("en").ui.connectionsNote, `${locale}: connections explanation`);
    assert.notEqual(manual.metaPattern.body, getLocalizedBrainManual("en").metaPattern.body, `${locale}: meta pattern`);
    for (const [index, pattern] of manual.patterns.entries()) {
      const canonical = brainPatterns[index];
      assert.notEqual(pattern.thesis, canonical.thesis, `${locale}/${pattern.id}: thesis fallback`);
      assert.notEqual(pattern.observation, canonical.observation, `${locale}/${pattern.id}: observation fallback`);
      assert.ok(pattern.thesis.length > 65, `${locale}/${pattern.id}: thesis depth`);
      assert.ok(pattern.observation.length > 110, `${locale}/${pattern.id}: observation depth`);
      assert.ok(pattern.strength.length > 120, `${locale}/${pattern.id}: strength depth`);
      assert.ok(pattern.tradeoff.length > 75, `${locale}/${pattern.id}: trade-off depth`);
      assert.equal(pattern.examples.length, 2, `${locale}/${pattern.id}: examples`);
      assert.ok(pattern.examples.every((example) => example.length > 105), `${locale}/${pattern.id}: example depth`);
    }
  }
});

test("all six additions are substantive and have localized counterweights in every edition", () => {
  const english = getLocalizedBrainManual("en");
  for (const locale of locales) {
    const manual = getLocalizedBrainManual(locale);
    for (const id of newPatternIds) {
      const pattern = manual.patternById.get(id);
      assert.ok(pattern, `${locale}: ${id}`);
      assert.ok(pattern.thesis.length > 95, `${locale}/${id}: thesis depth`);
      assert.ok(pattern.observation.length > 180, `${locale}/${id}: observation depth`);
      assert.ok(pattern.strength.length > 100, `${locale}/${id}: strength depth`);
      assert.ok(pattern.tradeoff.length > 105, `${locale}/${id}: trade-off depth`);
      assert.equal(pattern.examples.length, 2, `${locale}/${id}: examples`);
      assert.ok(pattern.connections.length >= 6, `${locale}/${id}: connections`);
      assert.ok(pattern.fieldNote && pattern.fieldNote.length > 15, `${locale}/${id}: counterweight`);
      if (locale !== "en") {
        const canonical = english.patternById.get(id);
        assert.notEqual(pattern.observation, canonical?.observation, `${locale}/${id}: observation fallback`);
        assert.notEqual(pattern.fieldNote, canonical?.fieldNote, `${locale}/${id}: counterweight fallback`);
      }
    }
  }
});

test("Cognitive Navigation and both distinction models are complete in all seven locales", () => {
  const english = getLocalizedBrainManual("en").cognitiveNavigation;
  for (const locale of locales) {
    const cluster = getLocalizedBrainManual(locale).cognitiveNavigation;
    assert.equal(cluster.title, "Cognitive Navigation", locale);
    assert.equal(cluster.speedItems.length, 4, `${locale}: four forms of speed`);
    assert.deepEqual(cluster.speedItems.map(({ patternId }) => patternId), ["rapid-grasp", "high-bandwidth-processing", "fast-response-loop", "quick-context-switching"], `${locale}: speed model`);
    assert.equal(cluster.distinctionItems.length, 2, `${locale}: relation/perspective distinction`);
    assert.deepEqual(cluster.distinctionItems.map(({ patternId }) => patternId), ["relational-thinking", "multi-perspective-thinking"], `${locale}: relation/perspective model`);
    assert.ok(cluster.introduction.length > 140, `${locale}: cluster depth`);
    assert.ok(cluster.disclaimer.length > 90, `${locale}: non-clinical boundary`);
    if (locale !== "en") {
      assert.notEqual(cluster.introduction, english.introduction, `${locale}: cluster fallback`);
      assert.notEqual(cluster.sequence, english.sequence, `${locale}: sequence fallback`);
    }
  }
});

test("Quick Context Switching keeps three distinct terms, its cost, and a localized counterweight in every edition", () => {
  for (const locale of locales) {
    const pattern = getLocalizedBrainManual(locale).patternById.get("quick-context-switching");
    assert.ok(pattern, locale);
    const content = JSON.stringify(pattern);
    for (const term of ["Quick Context Switching", "Context Reconstruction", "Rapid Context Acquisition"]) assert.match(content, new RegExp(term, "u"), `${locale}: ${term}`);
    assert.ok(pattern.observation.length > 180, `${locale}: distinctions`);
    assert.ok(pattern.tradeoff.length > 130, `${locale}: cost and counterweight`);
    assert.ok(pattern.fieldNote && pattern.fieldNote.length > 70, `${locale}: localized counterweight`);
  }
});

test("Aegis remains an observer, sparring partner and co-author rather than a clinical authority", () => {
  for (const locale of locales) {
    const manual = getLocalizedBrainManual(locale);
    assert.match(manual.ui.aegisCredit, /Aegis/u, locale);
    assert.doesNotMatch(manual.ui.aegisCredit, /clinical|therapy|therapist|patient|diagnos(?:e|is)/iu, locale);
    const canonicalNotes = brainPatterns.filter(({ fieldNote }) => fieldNote).length;
    assert.equal(manual.patterns.filter(({ fieldNote }) => fieldNote).length, canonicalNotes, `${locale}: field-note structure`);
  }
});
