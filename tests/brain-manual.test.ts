import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { brainChapters, brainMetaPattern, brainPatternById, brainPatterns } from "../data/brain-manual";

const originalPatternIds = [
  "connector", "systems-brain", "zoom-lens", "pattern-hunter", "ecosystem-thinking", "reframer",
  "idea-engine", "okay-but-what-if", "collector-of-possibilities", "builder-curiosity", "permission-to-think-big", "worldbuilder",
  "human-pattern-recognition", "emotional-designer", "human-context-bias", "emotion-business", "meaning-layer", "narrative-brain",
  "product-personality-radar", "generic-detector", "make-it-mine", "identity-architect", "contradiction-tolerance", "future-memory",
  "curator", "quick-context-switching", "one-more-layer",
] as const;
const newPatterns = [
  ["rapid-grasp", "Rapid Grasp"],
  ["fast-response-loop", "Fast Response Loop"],
  ["high-bandwidth-processing", "High-Bandwidth Processing"],
  ["relational-thinking", "Relational Thinking"],
  ["multi-perspective-thinking", "Multi-Perspective Thinking"],
  ["process-thinking", "Process Thinking"],
] as const;

test("Brain Manual publishes all 33 canonical patterns exactly once and preserves the original 27", () => {
  assert.equal(brainPatterns.length, 33);
  assert.equal(new Set(brainPatterns.map(({ id }) => id)).size, 33);
  for (const id of originalPatternIds) assert.ok(brainPatternById.has(id), `missing original pattern: ${id}`);
  for (const [id, title] of newPatterns) assert.equal(brainPatternById.get(id)?.title, title, id);
  assert.deepEqual(brainPatterns.slice(27).map(({ id, title }) => [id, title]), newPatterns);

  const chapterPatternIds = brainChapters.flatMap(({ patternIds }) => patternIds);
  assert.equal(chapterPatternIds.length, 33);
  assert.equal(new Set(chapterPatternIds).size, 33);
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

test("the six additions retain approved depth, distinctions, and counterweights", () => {
  for (const [id] of newPatterns) {
    const pattern = brainPatternById.get(id);
    assert.ok(pattern, id);
    assert.ok(pattern.fieldNote && pattern.fieldNote.length > 25, `${id}: counterweight`);
    assert.ok(pattern.connections.length >= 6, `${id}: connections`);
    assert.ok(pattern.connections.every((connectionId) => brainPatternById.has(connectionId)), `${id}: valid connections`);
    assert.ok(pattern.examples.every((example) => example.length > 100), `${id}: concrete examples`);
  }

  assert.match(JSON.stringify(brainPatternById.get("rapid-grasp")), /Grasp fast\. Validate deliberately\./);

  const response = JSON.stringify(brainPatternById.get("fast-response-loop"));
  assert.match(response, /Fast response is not automatically better response/);
  assert.match(response, /Pause when depth matters more/);

  const bandwidth = JSON.stringify(brainPatternById.get("high-bandwidth-processing"));
  assert.match(bandwidth, /information density/i);
  assert.match(bandwidth, /bandwidth management/i);
  assert.doesNotMatch(bandwidth, /superhuman|objective cognitive superiority/i);

  const relational = JSON.stringify(brainPatternById.get("relational-thinking"));
  assert.match(relational, /reference system/i);
  assert.match(relational, /What is this in relation to/);

  const perspectives = JSON.stringify(brainPatternById.get("multi-perspective-thinking"));
  assert.match(perspectives, /Reframer changes the frame/);
  assert.match(perspectives, /viewpoint from which the same problem is examined/);
  assert.match(perspectives, /See broadly\. Decide narrowly\./);

  const process = JSON.stringify(brainPatternById.get("process-thinking"));
  assert.match(process, /Systems Thinking sees the landscape/);
  assert.match(process, /Process Thinking follows the movement/);
  assert.match(process, /repetition deserves structure/);
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

test("Cognitive Navigation is a restrained editorial cluster rather than a 34th pattern", () => {
  const locales = readFileSync(new URL("../data/brain-manual-locales.ts", import.meta.url), "utf8");
  const component = readFileSync(new URL("../components/brain-manual/brain-manual-page.tsx", import.meta.url), "utf8");
  assert.equal(brainPatternById.has("cognitive-navigation"), false);
  assert.match(locales, /title: "Cognitive Navigation"/);
  assert.match(locales, /Understand fast → Process densely → Respond fast → Switch fast/);
  assert.match(locales, /What is this in relation to/);
  assert.match(locales, /From where am I looking at it/);
  assert.match(locales, /not a clinical profile, an IQ claim or a scientific cognitive assessment/);
  assert.match(component, /<CognitiveNavigation/);
  assert.match(component, /<PatternMap/);
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
