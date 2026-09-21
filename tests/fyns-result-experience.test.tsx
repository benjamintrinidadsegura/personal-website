import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FynsCharacterShareCard } from "../components/find-your-next-step/character-share-card";
import {
  fynsCharacterIds,
  fynsCharacterMotifs,
  getFynsCharacterPresentation,
} from "../data/find-your-next-step-characters";
import { fynsCharacterShareCopy } from "../data/i18n/fyns-character-share";
import { fynsSelfCharacterMappings } from "../lib/find-your-next-step-constellation";
import { locales } from "../lib/i18n/config";
import { writingShareFormats } from "../types/writing";

const root = process.cwd();

test("all 12 canonical Characters have complete and distinct presentation metadata in seven locales", () => {
  assert.equal(fynsCharacterIds.length, 12);
  assert.equal(fynsCharacterMotifs.length, 12);
  const english = fynsCharacterIds.map((id) => getFynsCharacterPresentation(id, "en"));
  assert.equal(new Set(english.map(({ motif }) => motif)).size, 12);
  assert.equal(new Set(english.map(({ accent }) => accent)).size, 12);
  for (const locale of locales) {
    for (const id of fynsCharacterIds) {
      const presentation = getFynsCharacterPresentation(id, locale);
      assert.equal(presentation.id, id);
      assert.ok(presentation.subtitle.length > 3, `${locale}:${id}:subtitle`);
      assert.ok(presentation.identityStatement.includes(presentation.subtitle), `${locale}:${id}:identity`);
      assert.match(presentation.accent, /^#[0-9a-f]{6}$/iu, `${locale}:${id}:accent`);
    }
  }
});

test("B7 leaves the canonical dimension-to-Character assignment unchanged", () => {
  assert.deepEqual(fynsSelfCharacterMappings, {
    variety: "explorer", connection: "connector", agency: "independent", depth: "thinker",
    reliability: "stabilizer", growth: "challenger", orientation: "organizer", making: "builder",
    care: "caregiver", expression: "creator", harmony: "harmonizer", effectiveness: "achiever",
  });
});

test("the result hierarchy exposes reveal, evidence, nuance and non-ranking supporting semantics", () => {
  const characters = readFileSync(join(root, "data/find-your-next-step-characters.ts"), "utf8");
  const figure = readFileSync(join(root, "components/find-your-next-step/result-figure.tsx"), "utf8");
  assert.match(figure, /constellationCopy\.reveal/u);
  assert.match(figure, /copy\.whyThisFits/u);
  assert.match(figure, /copy\.howThisShowsUp/u);
  assert.match(figure, /data-fyns-character-role=\{dominant \? "dominant" : "supporting"\}/u);
  assert.match(figure, /character\.friction/u);
  assert.match(figure, /constellation\.tensions/u);
  assert.doesNotMatch(`${characters}\n${figure}`, /runner-up|second place|rarity|power level|\bXP\b/iu);
});

test("the Self narrative connects Character to Quote to Action before keep/share", () => {
  const source = readFileSync(join(root, "components/find-your-next-step/self-reflection-journey.tsx"), "utf8");
  const quote = source.indexOf("<FynsCharacterResultQuote");
  const action = source.indexOf("<FynsActionLayer", quote);
  const keep = source.indexOf("<FynsResultActions", action);
  assert.ok(quote >= 0 && action > quote && keep > action);
});

test("Character sharing reuses Story, Portrait and Square without private result payloads", () => {
  assert.deepEqual(writingShareFormats, ["story", "portrait", "square"]);
  const character = getFynsCharacterPresentation("builder", "en");
  for (const format of writingShareFormats) {
    const markup = renderToStaticMarkup(createElement(FynsCharacterShareCard, {
      character,
      characterLabel: "Your Character",
      format,
      supportingLabel: "Also shapes how you operate",
      supportingNames: ["Explorer"],
    }));
    assert.match(markup, new RegExp(`data-format="${format}"`));
    assert.match(markup, /Builder/u);
    assert.match(markup, /bts\.online/u);
  }
  const shareSources = ["character-share-card.tsx", "character-share-dialog.tsx"]
    .map((file) => readFileSync(join(root, "components/find-your-next-step", file), "utf8"))
    .join("\n");
  assert.doesNotMatch(shareSources, /rawAnswers|answers=|resultPayload|sessionId|accountId|userId|localStorage|searchParams/iu);
  assert.match(shareSources, /safeSharePath/u);
});

test("Character share copy is complete in all locales and remains Self-only", () => {
  for (const locale of locales) {
    const copy = fynsCharacterShareCopy[locale];
    assert.deepEqual(Object.keys(copy.formats), writingShareFormats, locale);
    for (const value of Object.values(copy)) {
      if (typeof value === "string") assert.ok(value.length > 1, locale);
    }
  }
  const self = readFileSync(join(root, "components/find-your-next-step/self-reflection-journey.tsx"), "utf8");
  assert.match(self, /characterShare=\{constellation/u);
  for (const file of ["career-exploration-journey.tsx", "problem-journey.tsx", "idea-journey.tsx"]) {
    const source = readFileSync(join(root, "components/find-your-next-step", file), "utf8");
    assert.doesNotMatch(source, /characterShare=/u, file);
  }
});

test("reveal and Screenshot Mode preserve accessibility and Reduced Motion contracts", () => {
  const css = readFileSync(join(root, "app/globals.css"), "utf8");
  const figure = readFileSync(join(root, "components/find-your-next-step/result-figure.tsx"), "utf8");
  const dialog = readFileSync(join(root, "components/find-your-next-step/character-share-dialog.tsx"), "utf8");
  assert.match(css, /\.fyns-character-reveal/u);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.fyns-character-reveal \{ animation: none; \}/u);
  assert.match(figure, /aria-hidden="true" className="fyns-character-motif"/u);
  assert.match(figure, /<h2/u);
  assert.match(figure, /<h3/u);
  assert.match(dialog, /<dialog/u);
  assert.match(dialog, /Escape/u);
  assert.match(dialog, /writing-screenshot-surface/u);
  assert.match(css, /\.writing-share-secondary,[\s\S]*\.writing-share-primary \{ min-height: 2\.75rem;/u);
});
