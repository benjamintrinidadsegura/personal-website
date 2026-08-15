import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { fynsContextScenes } from "../data/find-your-next-step-figures";

const root = process.cwd();

test("Context Scenes cover the overview and all four journeys with real optimized assets", () => {
  assert.deepEqual(Object.keys(fynsContextScenes), ["overview", "self", "career", "problem", "idea"]);

  for (const scene of Object.values(fynsContextScenes)) {
    assert.match(scene.src, /^\/images\/find-your-next-step\/context-scenes\/.+\.webp$/);
    assert.ok(readFileSync(join(root, "public", scene.src)).byteLength < 200_000, scene.key);
    assert.ok(scene.alt.length > 20, scene.key);
  }
});

test("scene language preserves context, revisability, and user interpretive authority", () => {
  const content = Object.values(fynsContextScenes)
    .flatMap((scene) => [scene.title, scene.description])
    .join(" ");

  assert.match(content, /Situationen|Situation/);
  assert.match(content, /Rollen wechseln|verändern/);
  assert.match(content, /nicht.*Typ|nicht.*Zuordnung|nicht.*Gründertyp/);
  assert.doesNotMatch(content, /Persönlichkeitstyp|Typ-Code|Prozent|Du bist Figur|gehört zu dir/i);
});

test("Context Scenes are static presentation, never selected from answers or account identity", () => {
  const component = readFileSync(join(root, "components/find-your-next-step/context-scene.tsx"), "utf8");
  const data = readFileSync(join(root, "data/find-your-next-step-figures.ts"), "utf8");

  assert.match(component, /<figure/);
  assert.match(component, /<figcaption/);
  assert.match(component, /alt=\{scene\.alt\}/);
  assert.doesNotMatch(`${component}\n${data}`, /useState|answers|score|percentage|account|profileId|userId|localStorage|fetch\(/i);
});
