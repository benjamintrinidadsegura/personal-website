import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { brainChapters, brainMetaPattern, brainPatternById, brainPatterns } from "../data/brain-manual";

test("Brain Manual publishes the complete 27-pattern editorial taxonomy once", () => {
  assert.equal(brainPatterns.length, 27);
  assert.equal(new Set(brainPatterns.map(({ id }) => id)).size, 27);
  const chapterPatternIds = brainChapters.flatMap(({ patternIds }) => patternIds);
  assert.equal(chapterPatternIds.length, 27);
  assert.equal(new Set(chapterPatternIds).size, 27);
  assert.deepEqual([...chapterPatternIds].sort(), brainPatterns.map(({ id }) => id).sort());

  for (const pattern of brainPatterns) {
    assert.ok(pattern.thesis.length > 80, `${pattern.id} needs a substantive thesis`);
    assert.ok(pattern.observation.length > 170, `${pattern.id} needs a substantive observation`);
    assert.ok(pattern.strength.length > 80, `${pattern.id} needs a substantive strength`);
    assert.ok(pattern.tradeoff.length > 80, `${pattern.id} needs a substantive trade-off`);
    assert.ok(pattern.examples.length >= 2, `${pattern.id} needs grounded examples`);
    assert.ok(pattern.connections.length >= 3, `${pattern.id} needs connected patterns`);
  }
});

test("Quick Context Switching preserves the three-part model and explicit counterweight", () => {
  const pattern = brainPatternById.get("quick-context-switching");
  assert.ok(pattern);
  const content = JSON.stringify(pattern);
  assert.match(content, /Quick Context Switching/);
  assert.match(content, /Context Reconstruction/);
  assert.match(content, /Rapid Context Acquisition/);
  assert.match(content, /maintaining open contexts/i);
  assert.match(content, /Switch deliberately\. Leave a re-entry point\. Close what doesn't deserve to stay open\./);
});

test("the meta-pattern names connection and curation, focus, selection, and stopping", () => {
  assert.match(brainMetaPattern.thesis, /Connection/i);
  assert.match(brainMetaPattern.body, /curation/i);
  assert.match(brainMetaPattern.body, /focus/i);
  assert.match(brainMetaPattern.body, /selection/i);
  assert.match(brainMetaPattern.body, /stopping/i);
});

test("the route is editorial, credits Aegis, and bridges into Personal Advantage Mapping", () => {
  const route = readFileSync(new URL("../app/about/how-my-brain-works/page.tsx", import.meta.url), "utf8");
  const component = readFileSync(new URL("../components/brain-manual/brain-manual-page.tsx", import.meta.url), "utf8");
  const locales = readFileSync(new URL("../data/brain-manual-locales.ts", import.meta.url), "utf8");
  assert.match(route, /\/about\/how-my-brain-works/);
  assert.match(route, /copy\.metadataTitle/);
  assert.match(component, /getLocalizedBrainManual/);
  assert.match(component, /chapters\.map/);
  assert.match(component, /copy\.aegisCredit/);
  assert.match(locales, /observer, sparring partner and writing partner/);
  assert.match(component, /\/tools\/personal-advantage/);
  assert.match(component, /lg:sticky/);
  assert.match(component, /details className=.*lg:hidden/);
});
