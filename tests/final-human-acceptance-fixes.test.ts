import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { discoveryIndex } from "../data/discovery-index";
import { getLocalizedBrainManual } from "../data/brain-manual-locales";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Pattern Map is an editorial line map with a structurally separate counterweight zone", () => {
  const component = source("../components/brain-manual/brain-manual-page.tsx");
  const map = component.slice(component.indexOf("function PatternMap"), component.indexOf("function ChapterLinks"));
  assert.match(map, /data-pattern-map/u);
  assert.match(map, /<svg/u);
  assert.ok((map.match(/<path /gu) ?? []).length >= 4);
  assert.match(map, /data-counterweight-zone/u);
  assert.match(map, /md:min-h-\[34rem\]/u);
  assert.match(map, /grid-cols-2/u);
  assert.doesNotMatch(map, /rounded-\[2rem\]|rounded-full/u);
  const english = getLocalizedBrainManual("en").ui.patternMap;
  assert.equal(english.centre, "Connection");
  assert.deepEqual(english.domains, ["Systems", "People", "Ideas", "Identity", "Meaning", "Future"]);
  assert.deepEqual(english.counterweightItems, ["Curation", "Focus", "Deliberate Stopping"]);
});

test("desktop and mobile header share the exact canonical Tools order", () => {
  const header = source("../components/layout/header.tsx");
  const tools = header.slice(header.indexOf('id: "tools"'), header.indexOf('id: "partners"'));
  const ids = ["life-alignment", "fyns", "personal-advantage", "money-profile", "echowall"];
  const positions = ids.map((id) => tools.indexOf(`id: "${id}"`));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.match(header, /navigation\.filter/u);
  assert.match(header, /navigation\.map/u);
});

test("Discovery keeps the same curated major Tools order while retaining grouped subtools", () => {
  const toolIds = discoveryIndex.filter(({ group }) => group === "Tools").map(({ id }) => id);
  const majorIds = ["tool-life-alignment", "tool-find-your-next-step", "tool-personal-advantage", "tool-money-profile", "tool-echowall"];
  const positions = majorIds.map((id) => toolIds.indexOf(id));
  assert.ok(positions.every((position) => position >= 0), JSON.stringify(toolIds));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.ok(toolIds.indexOf("tool-life-alignment-self") < toolIds.indexOf("tool-find-your-next-step"));
});

test("Social Post composition uses canvas, framed post surface and deliberate monogram without platform chrome", () => {
  const component = source("../components/sharing/social-post-card.tsx");
  const css = source("../app/globals.css");
  assert.match(component, /social-post-canvas/u);
  assert.match(component, /<article className="social-post-surface">/u);
  assert.match(component, /social-post-avatar"><span>/u);
  assert.match(css, /social-post-surface/u);
  assert.match(css, /border-top-color/u);
  assert.match(css, /data-format="story"/u);
  assert.match(css, /data-format="portrait"/u);
  assert.match(css, /data-format="square"/u);
  assert.doesNotMatch(component.toLowerCase(), /like count|followers|repost|retweet|verified/u);
});
