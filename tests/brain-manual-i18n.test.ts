import assert from "node:assert/strict";
import test from "node:test";

import { brainChapters, brainPatterns } from "../data/brain-manual";
import { getLocalizedBrainManual } from "../data/brain-manual-locales";
import { locales } from "../lib/i18n/config";

const translatedLocales = locales.filter((locale) => locale !== "en");

test("all seven Brain Manual editions preserve one canonical 27-pattern structure", () => {
  for (const locale of locales) {
    const manual = getLocalizedBrainManual(locale);
    assert.equal(manual.patterns.length, 27, locale);
    assert.equal(manual.chapters.length, 6, locale);
    assert.deepEqual(manual.patterns.map(({ id }) => id), brainPatterns.map(({ id }) => id), locale);
    assert.deepEqual(manual.patterns.map(({ title }) => title), brainPatterns.map(({ title }) => title), `${locale}: canonical titles`);
    assert.deepEqual(manual.chapters.map(({ id, patternIds }) => ({ id, patternIds })), brainChapters.map(({ id, patternIds }) => ({ id, patternIds })), `${locale}: chapter taxonomy`);
    assert.equal(manual.patternById.size, 27, locale);
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
