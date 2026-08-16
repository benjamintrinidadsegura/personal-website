import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { lifeAlignmentScene } from "../data/life-alignment";
import { lifeVisionScene } from "../data/life-alignment-life-vision";
import { partnerScene } from "../data/life-alignment-partner";

const root = process.cwd();

test("Life Alignment owns a distinct optimized Context Scene", () => {
  for (const scene of [lifeAlignmentScene, partnerScene, lifeVisionScene]) {
    assert.match(scene.src, /^\/images\/life-alignment\/context-scenes\/.+\.webp$/);
    const asset = readFileSync(join(root, "public", scene.src));
    assert.ok(asset.byteLength > 40_000, scene.src);
    assert.ok(asset.byteLength < 200_000, scene.src);
    assert.equal(asset.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(asset.subarray(8, 12).toString("ascii"), "WEBP");
    assert.ok(scene.alt.length > 40);
  }
});

test("the scene is static and explicitly refuses personality or result mapping", () => {
  const genericScene = readFileSync(join(root, "components/human-context/context-scene.tsx"), "utf8");
  const lifeScene = readFileSync(join(root, "components/life-alignment/life-alignment-context.tsx"), "utf8");
  const content = `${lifeAlignmentScene.title} ${lifeAlignmentScene.description}`;
  assert.match(genericScene, /<figure/);
  assert.match(genericScene, /<figcaption/);
  assert.match(content, /keine Typen/i);
  assert.match(content, /weder dich noch dein Ergebnis/i);
  assert.doesNotMatch(`${genericScene}\n${lifeScene}`, /answers|resultCategory|account|profileId|userId|fetch\(|localStorage/i);
});

test("Partner and Life Vision scenes remain supportive and module-specific", () => {
  assert.match(`${partnerScene.title} ${partnerScene.description}`, /eigenständig|gleichberechtigt/i);
  assert.match(`${lifeVisionScene.title} ${lifeVisionScene.description}`, /Möglichkeiten|Richtung/i);
  assert.notEqual(partnerScene.src, lifeVisionScene.src);
  assert.notEqual(partnerScene.src, lifeAlignmentScene.src);
});
