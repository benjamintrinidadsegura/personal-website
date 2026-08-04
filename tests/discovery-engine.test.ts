import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { discoveryIndex } from "../data/discovery-index";
import { discoverItems, groupDiscoveryItems, normalizeDiscoveryText } from "../lib/discovery";
import type { DiscoveryItem } from "../types/discovery";

const knownStaticRoutes = new Set([
  "/",
  "/echowall",
  "/goatrecrutainer/career-spotlight",
  "/goatrecrutainer/career-spotlight/evgeny-vinokurov",
  "/projects/goatrecrutainer",
  "/projects/ratecom",
  "/projects/hobbyswap",
  "/projects/streamory",
  "/projects/byc",
  "/projects/bts-online",
]);

const knownHomeAnchors = new Set(["home", "now", "pulse", "building", "writing", "interviews", "echowall", "about", "contact"]);

test("discovery index has unique, valid records", () => {
  assert.ok(discoveryIndex.length > 0);
  assert.equal(new Set(discoveryIndex.map(({ id }) => id)).size, discoveryIndex.length);

  for (const item of discoveryIndex) {
    assert.ok(item.id);
    assert.ok(item.title);
    assert.ok(item.description);
    assert.ok(item.category);
    assert.ok(["Projects", "Insights", "Tools", "People", "Pages"].includes(item.group));
    assert.ok(["Live", "Beta", "In Development", "Coming Soon"].includes(item.status));
    assert.equal(item.href?.startsWith("/admin") ?? false, false);
  }
});

test("every discovery destination is a verified route or home anchor", () => {
  for (const { href, title } of discoveryIndex) {
    if (!href) continue;
    if (href.startsWith("/#")) {
      assert.equal(knownHomeAnchors.has(href.slice(2)), true, `${title}: ${href}`);
    } else {
      assert.equal(knownStaticRoutes.has(href), true, `${title}: ${href}`);
    }
  }
});

test("unfinished content without a page remains discoverable but not navigable", () => {
  for (const title of ["Service Spotlight", "Career Agent", "Talking Cure", "Personal Conversations", "Leidenschaft"] as const) {
    const item = discoveryIndex.find((candidate) => candidate.title === title);
    assert.ok(item, title);
    assert.equal(item.href, undefined, title);
    assert.ok(item.status === "Coming Soon" || item.status === "In Development", title);
  }
});

test("matching starts at one character and ignores casing", () => {
  assert.ok(discoverItems(discoveryIndex, "r").length > 0);
  assert.deepEqual(
    discoverItems(discoveryIndex, "Rec").map(({ item }) => item.id),
    discoverItems(discoveryIndex, "rEC").map(({ item }) => item.id),
  );
  assert.equal(normalizeDiscoveryText("  ÜBER  "), "über");
});

test("matching covers title, description, category, tags, and keywords", () => {
  const fixture: DiscoveryItem[] = [
    { id: "title", group: "Pages", title: "Needle title", description: "x", category: "x", tags: [], keywords: [], status: "Live" },
    { id: "description", group: "Pages", title: "x", description: "Needle description", category: "x", tags: [], keywords: [], status: "Live" },
    { id: "category", group: "Pages", title: "x", description: "x", category: "Needle category", tags: [], keywords: [], status: "Live" },
    { id: "tag", group: "Pages", title: "x", description: "x", category: "x", tags: ["Needle tag"], keywords: [], status: "Live" },
    { id: "keyword", group: "Pages", title: "x", description: "x", category: "x", tags: [], keywords: ["Needle keyword"], status: "Live" },
  ];

  assert.deepEqual(new Set(discoverItems(fixture, "needle").map(({ item }) => item.id)), new Set(fixture.map(({ id }) => id)));
});

test("title matches rank ahead of category, tags, keywords, and description", () => {
  const results = discoverItems(discoveryIndex, "career");
  assert.ok(results.length > 1);
  assert.equal(results[0].item.title.toLocaleLowerCase("de-DE").startsWith("career"), true);
  assert.ok(results.every((result, index) => index === 0 || results[index - 1].score >= result.score));
});

test("empty and unknown queries return no groups", () => {
  assert.deepEqual(discoverItems(discoveryIndex, ""), []);
  assert.deepEqual(discoverItems(discoveryIndex, "   "), []);
  assert.equal(groupDiscoveryItems(discoverItems(discoveryIndex, "definitely-not-present")).size, 0);
});

test("reserved semantic dimensions are not searched in v1", () => {
  const item: DiscoveryItem = {
    id: "future",
    group: "Tools",
    title: "Compass",
    description: "Orientation",
    category: "Tool",
    tags: [],
    keywords: [],
    status: "Coming Soon",
    dimensions: { goals: ["unfindable-dimension-value"] },
  };
  assert.deepEqual(discoverItems([item], "unfindable-dimension-value"), []);
});

test("header preserves navigation and exposes desktop and mobile discovery controls", () => {
  const header = readFileSync(new URL("../components/layout/header.tsx", import.meta.url), "utf8");
  const engine = readFileSync(new URL("../components/discovery/discovery-engine.tsx", import.meta.url), "utf8");

  assert.equal(header.includes("<DiscoveryEngine"), true);
  assert.equal(header.includes("setOpenDropdown(null)"), true);
  assert.equal(engine.includes("Discover the HQ"), true);
  assert.equal(engine.includes('aria-label="Discovery öffnen"'), true);
  assert.equal(engine.includes("event.metaKey || event.ctrlKey"), true);
  assert.equal(engine.includes('event.key === "Escape"'), true);
  assert.equal(engine.includes('event.key !== "Tab"'), true);
  assert.equal(engine.includes('body.dataset.discoveryScrollLock = "true"'), true);
  assert.equal(engine.includes('"aria-haspopup": "listbox"'), true);
  assert.equal(engine.includes('event.key === "ArrowDown"'), true);
  assert.equal(engine.includes('event.key === "ArrowUp"'), true);
  assert.equal(engine.includes('event.key !== "Enter"'), true);
});
