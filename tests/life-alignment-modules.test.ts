import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  availableLifeAlignmentModules,
  futureLifeAlignmentModules,
  lifeAlignmentModules,
} from "../data/life-alignment-modules";

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the registry represents all eight functional modules after B6", () => {
  assert.deepEqual(availableLifeAlignmentModules.map(({ id }) => id), ["self", "partner", "life-vision", "family", "friendship", "career", "team", "founder"]);
  assert.deepEqual(availableLifeAlignmentModules.map(({ mode }) => mode), ["ME", "WE", "WHERE I AM GOING", "WE", "WE", "ME", "WE", "WE"]);
  assert.deepEqual(futureLifeAlignmentModules.map(({ id }) => id), []);
  assert.equal(lifeAlignmentModules.length, 8);

  for (const entry of availableLifeAlignmentModules) {
    assert.match(entry.href, /^\/life-alignment\/(?:self|partner|friendship|founder|family|team|career|life-vision)$/u);
    assert.ok(entry.privacy.length > 20);
    assert.ok(entry.duration.length > 0);
    assert.ok(entry.scene.src.length > 0);
  }

  for (const entry of futureLifeAlignmentModules) {
    assert.equal(entry.href, null);
    assert.equal(entry.scene, null);
    assert.equal(entry.statusLabel, "Kommt später");
  }
});

test("the root route belongs to the hub and Self owns its dedicated canonical route", () => {
  const hubRoute = readSource("../app/life-alignment/page.tsx");
  const selfRoute = readSource("../app/life-alignment/self/page.tsx");

  assert.match(hubRoute, /<LifeAlignmentHub \/>/u);
  assert.doesNotMatch(hubRoute, /<LifeAlignmentExperience \/>/u);
  assert.match(selfRoute, /createLocalizedMetadata/u);
  assert.match(selfRoute, /pathname: "\/life-alignment\/self"/u);
  assert.match(selfRoute, /getLocale/u);
  assert.match(selfRoute, /<LifeAlignmentExperience \/>/u);
});

test("the approved Self implementation remains characterized and separate from the hub", () => {
  const page = readSource("../components/life-alignment/life-alignment-page.tsx");
  const journey = readSource("../components/life-alignment/life-alignment-journey.tsx");

  assert.equal(
    page,
    'import { LifeAlignmentJourney } from "./life-alignment-journey";\n\nexport function LifeAlignmentPage() {\n  return <LifeAlignmentJourney />;\n}\n',
  );
  assert.match(journey, /const sections = \[AreasSection, RealitySection, DirectionSection, ContextSection, FocusSection\] as const/u);
  assert.equal(journey.match(/<SelectionCount /gu)?.length, 4);
  assert.match(journey, /<AlignmentLandscape result=\{result\}/u);
  assert.match(journey, /<LifeAlignmentContext priority \/>/u);
  assert.match(journey, /<LifeAlignmentResultActions copyText=/u);
});

test("the hub registry introduces no persistence or answer transport", () => {
  const hub = readSource("../components/life-alignment/life-alignment-hub.tsx");
  const registry = readSource("../data/life-alignment-modules.ts");
  const implementation = `${hub}\n${registry}`;

  assert.match(hub, /futureLifeAlignmentModules\.map/u);

  for (const prohibited of ["localStorage", "sessionStorage", "document.cookie", "fetch(", "@/lib/supabase", "navigator.sendBeacon"]) {
    assert.equal(implementation.includes(prohibited), false, prohibited);
  }
});
