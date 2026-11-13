import assert from "node:assert/strict";
import { test } from "node:test";
import { discoverItems } from "../lib/discovery";
import { visibleContentOpacity } from "../lib/discovery-universe/space";
import { planFlights, sampleFlight } from "../lib/discovery-universe/choreography";
import type { DiscoveryItem } from "../types/discovery";

test("active content has a visibility floor while retired content can leave the scene", () => {
  for (const opacity of [0, .08, .12, .4, .8, 1]) {
    assert.equal(visibleContentOpacity(opacity, 1), Math.max(.9, opacity));
    assert.equal(visibleContentOpacity(opacity, 0), opacity);
  }
  assert.equal(visibleContentOpacity(.08, .86), .86);
});

test("prepared public metadata detects in-place edits without caching visitor queries or old results", () => {
  const item: DiscoveryItem = {
    id: "controlled-public-fixture", title: "Initial title", description: "RetiredDescriptionToken",
    group: "Pages", category: "Page", status: "Live", href: "/about", tags: ["RetiredTagToken"], keywords: [],
  };
  assert.equal(discoverItems([item], "Initial title")[0]?.score, 910);
  item.title = "Changed title";
  assert.deepEqual(discoverItems([item], "Initial"), []);
  assert.equal(discoverItems([item], "Changed title")[0]?.item, item);
  item.tags[0] = "Unique editorial topic";
  assert.deepEqual(discoverItems([item], "RetiredTagToken"), []);
  assert.equal(discoverItems([item], "Unique editorial topic")[0]?.item, item);
  item.keywords.push("Distinct keyword");
  assert.equal(discoverItems([item], "Distinct keyword")[0]?.item, item);
  item.description = "Another description";
  assert.deepEqual(discoverItems([item], "RetiredDescriptionToken"), []);
  assert.deepEqual(discoverItems([item], "zzqxv999"), []);
  assert.deepEqual(discoverItems([item], ""), []);
});

test("a portrait silhouette travels around the centered search without extending beyond its approved edge positions", () => {
  const from = { x: 342, y: 165, scale: 1, turn: 0, opacity: 1 };
  const to = { ...from, x: 1125, y: 465 };
  const lens = { x: 522, y: 314, width: 380, height: 220, fromX: 522, fromY: 314 };
  const [route] = planFlights([{ id: "public-portrait-fixture", from, to, width: 300, height: 270, offsetY: -35 }], lens, { width: 1425, height: 760 });
  for (let i = 0; i <= 100; i++) {
    const p = sampleFlight(route, i / 100), centerY = p.y - 35 * p.scale;
    const overlaps = p.x + 150 * p.scale > lens.x && p.x - 150 * p.scale < lens.x + lens.width
      && centerY + 135 * p.scale > lens.y && centerY - 135 * p.scale < lens.y + lens.height;
    assert.equal(overlaps, false, `portrait crosses search at ${i}%`);
    assert.ok(p.y >= 165 && p.y <= 760 - 135);
  }
});
