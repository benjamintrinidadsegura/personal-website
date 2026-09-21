import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { fynsActionRegistry } from "../data/fyns-actions";
import { fynsCharacterIds } from "../data/find-your-next-step-characters";
import { locales } from "../lib/i18n/config";
import { selectFynsAction, selectFynsActionSet } from "../lib/fyns-actions";
import type { FynsActionRecord } from "../types/fyns-action";

test("Action registry has unique IDs, complete locale variants and every V1 Character", () => {
  assert.equal(new Set(fynsActionRegistry.map(({ id }) => id)).size, fynsActionRegistry.length);
  for (const action of fynsActionRegistry) {
    assert.ok(action.semanticFamily.length > 3);
    assert.ok(action.priority > 0);
    for (const locale of locales) {
      assert.ok(action.variants[locale].title.length > 5, `${action.id}:${locale}:title`);
      assert.ok(action.variants[locale].body.length > 20, `${action.id}:${locale}:body`);
      assert.ok(action.variants[locale].reflection.length > 10, `${action.id}:${locale}:reflection`);
    }
  }
  for (const characterId of fynsCharacterIds) {
    assert.ok(fynsActionRegistry.some(({ characterIds }) => characterIds?.includes(characterId)), characterId);
  }
});

test("Character and dimension mapping select canonical differentiated Actions", () => {
  const builder = selectFynsAction({ locale: "en", journey: "self", characterIds: ["builder"], dimensions: ["making"] });
  const thinker = selectFynsAction({ locale: "en", journey: "self", characterIds: ["thinker"], dimensions: ["depth"] });
  assert.equal(builder?.id, "fynsa-builder-application");
  assert.equal(builder?.fallbackLevel, "character");
  assert.equal(thinker?.id, "fynsa-thinker-application");
  assert.notEqual(builder?.semanticFamily, thinker?.semanticFamily);
});

test("constellation mapping outranks a single Character when a supported pair exists", () => {
  const records: readonly FynsActionRecord[] = [
    fixture("fynsa-single", { characterIds: ["builder"], semanticFamily: "single" }),
    fixture("fynsa-pair", { characterIds: ["builder", "achiever"], characterPairs: ["achiever+builder"], semanticFamily: "pair" }),
    fixture("fynsa-safe", { safeGeneral: true, semanticFamily: "safe" }),
  ];
  const selected = selectFynsAction({ locale: "en", journey: "self", characterIds: ["builder", "achiever"] }, records);
  assert.equal(selected?.id, "fynsa-pair");
  assert.equal(selected?.fallbackLevel, "constellation");
});

test("journey mapping and explicit safe fallback never return an unrelated Character Action", () => {
  const career = selectFynsAction({ locale: "de", journey: "career", resultSignals: ["conversation"] });
  assert.equal(career?.id, "fynsa-career-reality-check");
  assert.equal(career?.fallbackLevel, "journey");
  const general = selectFynsAction({ locale: "de", journey: "self" });
  assert.equal(general?.id, "fynsa-general-observe");
  assert.equal(general?.fallbackLevel, "general");
});

test("selection is deterministic and Another Action avoids IDs and semantic families", () => {
  const context = { locale: "en" as const, journey: "self" as const, characterIds: ["builder" as const], dimensions: ["making" as const], seed: "same-result" };
  const first = selectFynsAction(context);
  assert.deepEqual(first, selectFynsAction(context));
  assert.ok(first);
  const another = selectFynsAction({ ...context, excludeIds: [first.id], excludeFamilies: [first.semanticFamily] });
  assert.ok(another);
  assert.notEqual(another.id, first.id);
  assert.notEqual(another.semanticFamily, first.semanticFamily);
  const set = selectFynsActionSet(context, 3);
  assert.equal(new Set(set.map(({ id }) => id)).size, set.length);
  assert.equal(new Set(set.map(({ semanticFamily }) => semanticFamily)).size, set.length);
});

test("unsupported contexts return no Action and do not broaden to a generic fallback", () => {
  assert.equal(selectFynsAction({ locale: "en", journey: "problem", unsupported: true }), null);
});

test("Action UI keeps state ephemeral and excludes free text, identity, tracking and URL payloads", async () => {
  const [component, engine] = await Promise.all([
    readFile("components/find-your-next-step/action-layer.tsx", "utf8"),
    readFile("lib/fyns-actions.ts", "utf8"),
  ]);
  const source = `${component}\n${engine}`;
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie/u);
  assert.doesNotMatch(source, /textarea|contentEditable|URLSearchParams|history\.pushState/u);
  assert.doesNotMatch(source, /analytics|identify\(|track\(/u);
  assert.match(component, /useState<Record<string, FynsActionState>>/u);
});

test("all four FYNS result screens integrate the shared Action Layer", async () => {
  const files = ["self-reflection-journey.tsx", "career-exploration-journey.tsx", "problem-journey.tsx", "idea-journey.tsx"];
  for (const file of files) {
    const source = await readFile(`components/find-your-next-step/${file}`, "utf8");
    assert.match(source, /<FynsActionLayer/u, file);
  }
  const problem = await readFile("components/find-your-next-step/problem-journey.tsx", "utf8");
  assert.match(problem, /unsupported: urgent/u);
});

function fixture(id: FynsActionRecord["id"], override: Partial<FynsActionRecord>): FynsActionRecord {
  const variant = { title: id, body: "A sufficiently specific test action body.", reflection: "What changed in this test?" };
  return {
    id,
    variants: Object.fromEntries(locales.map((locale) => [locale, variant])) as FynsActionRecord["variants"],
    kind: "experiment",
    horizon: "now",
    semanticFamily: "fixture",
    priority: 1,
    ...override,
  };
}
