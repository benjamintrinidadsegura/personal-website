import assert from "node:assert/strict";
import { test } from "node:test";
import { discoverItems } from "../lib/discovery";
import { visibleContentOpacity } from "../lib/discovery-universe/space";
import { planFlights, sampleFlight, canAnimateFlights, clearSearchPosition } from "../lib/discovery-universe/choreography";
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

test("readable swept paths are accepted only when they clear other content and search, even at interrupted starts",()=>{
 const point=(x:number,y:number)=>({x,y,opacity:1,scale:1,turn:0});
 const obstacle={x:400,y:300,width:400,height:160};
 const safe=planFlights([{id:"public-a",from:point(120,100),to:point(220,100),width:100,height:100}],obstacle,{width:1200,height:760});
 assert.equal(canAnimateFlights(safe,obstacle),true);
 const interrupted=planFlights([{id:"public-a",from:point(120,100),to:point(220,100),width:100,height:100},{id:"public-b",from:point(120,100),to:point(1000,100),width:100,height:100}],obstacle,{width:1200,height:760});
 assert.equal(canAnimateFlights(interrupted,obstacle),false);
 const onSearch=planFlights([{id:"public-a",from:point(500,350),to:point(200,100),width:100,height:100}],obstacle,{width:1200,height:760});
 assert.equal(canAnimateFlights(onSearch,obstacle),false);
});

test("a long caption clears the 1280px search edge without moving the search or clipping genuine results",()=>{
 const point={x:303.6,y:165,scale:1,turn:0,opacity:1},lens={x:442.5,y:314,width:380,height:218};
 const corrected=clearSearchPosition(point,300,346,3,lens,false);
 assert.equal(corrected.x+150,lens.x-8);assert.equal(corrected.y,point.y);
 assert.deepEqual(clearSearchPosition(corrected,300,346,3,lens,false),corrected);
 assert.equal(lens.x,442.5);
 const route=planFlights([{id:"clear-caption",from:corrected,to:corrected,width:300,height:346,offsetY:3}],lens,{width:1265,height:780});
 assert.equal(canAnimateFlights(route,lens),true,"a real 8px gap is safe even inside the planner's decorative detour margin");
 const mobile=clearSearchPosition({...point,x:160,y:240},260,280,-30,{x:20,y:250,width:280,height:180},true);
 assert.equal(mobile.x,160);assert.ok(mobile.y-30+140<=242);
});
