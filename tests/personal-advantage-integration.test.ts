import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getBrainManualUiCopy } from "../data/brain-manual-locales";
import { getPersonalAdvantageUiCopy } from "../data/personal-advantage-locales";
import { locales } from "../lib/i18n/config";
import { writingShareFormats } from "../types/writing";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("both experiences are discoverable through real product surfaces", () => {
  const header = read("../components/layout/header.tsx");
  const about = read("../app/about/page.tsx");
  const discovery = read("../data/discovery-index.ts");
  const curation = read("../data/discovery-curation.ts");
  const sitemap = read("../app/sitemap.ts");
  assert.match(header, /What's Your Unfair Advantage\?/);
  assert.match(header, /\/tools\/personal-advantage/);
  assert.match(about, /\/about\/how-my-brain-works/);
  assert.match(about, /How my brain works \+ Quirks, Patterns, Abilities/);
  assert.match(discovery, /tool-personal-advantage/);
  assert.match(discovery, /page-brain-manual/);
  assert.match(curation, /tool-personal-advantage/);
  assert.match(sitemap, /\/about\/how-my-brain-works/);
  assert.match(sitemap, /\/tools\/personal-advantage/);
});

test("privacy and locale strategy are explicit across every supported locale", () => {
  assert.deepEqual(locales, ["de", "en", "es", "tr", "pl", "el", "ru"]);
  for (const locale of locales) {
    const assessment = getPersonalAdvantageUiCopy(locale);
    const manual = getBrainManualUiCopy(locale);
    assert.ok(assessment.start.length > 2);
    assert.ok(assessment.languageNotice.length > 60);
    assert.ok(assessment.privacyBody.length > 50);
    assert.ok(manual.languageNotice.length > 40);
  }
  const privacy = read("../app/privacy/page.tsx");
  assert.match(privacy, /id="personal-advantage"/);
  assert.match(privacy, /Optional free text remains in current-page memory and is not persisted/);
  assert.match(privacy, /never raw answers, free text, constraint details or private access information/);
});

test("the result surface is deep, navigable, editable, and linked back to the Brain Manual", () => {
  const experience = read("../components/personal-advantage/personal-advantage-experience.tsx");
  const localeCopy = read("../data/personal-advantage-locales.ts");
  for (const id of ["advantage-overview", "advantage-stack", "advantage-evidence", "advantage-environment", "advantage-tradeoffs", "advantage-playbook", "advantage-onepager"]) {
    assert.match(experience, new RegExp(id));
  }
  assert.match(experience, /getActiveAdvantageQuestions/);
  assert.match(experience, /onBack/);
  assert.match(experience, /skip/);
  assert.match(experience, /selectedExperiment/);
  assert.match(experience, /\/about\/how-my-brain-works/);
  assert.match(localeCopy, /Don't believe the test\. Test the test\./);
});

test("sharing reuses the established export system with three native formats", () => {
  const dialog = read("../components/personal-advantage/personal-advantage-share-dialog.tsx");
  const card = read("../components/personal-advantage/personal-advantage-share-card.tsx");
  const css = read("../app/globals.css");
  assert.match(dialog, /writingShareFormats/);
  assert.match(dialog, /ShareComposerHeading/);
  assert.match(dialog, /ShareFileActions/);
  assert.match(dialog, /screenshotMode/);
  assert.match(dialog, /navigator\.clipboard\.writeText/);
  assert.match(card, /data-format=\{format\}/);
  assert.deepEqual(writingShareFormats, ["story", "portrait", "square"]);
  assert.match(css, /personal-advantage-share-card/);
  assert.match(css, /writing-screenshot-card/);
});
