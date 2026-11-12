import assert from "node:assert/strict";
import { test } from "node:test";
import { createLabCatalog } from "../data/experience-lab/catalog";
import { createLabSearch } from "../lib/experience-lab/search";
import { composeLabSpace, edgeAnchor, type MotionPoint } from "../lib/experience-lab/space";
import type { LabMotion } from "../lib/experience-lab/motion";
import { loadSource } from "./helpers/load-source";
import * as geometry from "../lib/experience-lab/space";

function fixture(reduce = false) {
  const catalog = createLabCatalog("en"), search = createLabSearch(catalog);
  let time = 0, next = 0, disconnected = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const records = catalog.map(item => ({
    id: item.id, style: {} as Record<string,string>, attrs: {} as Record<string,string>,
    path: { style: {}, setAttribute(key: string,value: string) { records.find(record => record.path === this)!.attrs[key] = value; } },
  }));
  const lens = { getBoundingClientRect: () => ({ left: 400, top: 200, width: 400, height: 76 }) };
  const root = {
    style: { setProperty() {} }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 680 }),
    querySelectorAll: () => records.map(record => ({ dataset: { labObject: record.id }, style: record.style, querySelector: () => ({ offsetWidth: 220, offsetHeight: 160 }) })),
    querySelector: (selector: string) => selector.includes("data-search-lens") ? lens
      : selector.includes("data-space-strings") ? { setAttribute() {} }
      : records.find(record => selector.includes('"' + record.id + '"'))!.path,
  };
  const motionModule = loadSource<{startLabMotion: (root: unknown, scene: ReturnType<typeof composeLabSpace>, memory: Map<string,MotionPoint>) => LabMotion}>("lib/experience-lab/motion.ts", {
    "./space": geometry,
  }, {
    matchMedia: (query: string) => ({ matches: query.includes("reduced") && reduce, addEventListener() {}, removeEventListener() {} }),
    ResizeObserver: class { observe() {} disconnect() { disconnected++; } },
    performance: { now: () => time },
    requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++next,callback); return next; },
    cancelAnimationFrame: (id: number) => frames.delete(id),
  });
  const memory = new Map<string,MotionPoint>();
  const tick = (now: number) => { time = now; const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(now)); };
  return { root,search,records,memory,tick,frames,motionModule,disconnected: () => disconnected };
}

test("interrupted constellation motion starts at the actual previous frame and becomes idle", () => {
  const f = fixture();
  f.motionModule.startLabMotion(f.root, composeLabSpace(f.search(""), "personal-advantage"), f.memory).stop();
  const first = f.motionModule.startLabMotion(f.root, composeLabSpace(f.search("AI"), "ai-notes-demo"), f.memory);
  f.tick(120);
  const before = { ...f.memory.get("career-ai-demo")! };
  const path = f.records.find(record => record.id === "career-ai-demo")!;
  const previousPath = path.attrs.d;
  first.stop();
  assert.equal(f.frames.size,0);
  const second = f.motionModule.startLabMotion(f.root,composeLabSpace(f.search("Karriere"),"career"),f.memory);
  assert.deepEqual(f.memory.get("career-ai-demo"),before);
  assert.equal(path.attrs.d,previousPath,"connection cannot jump ahead of its moving object");
  f.tick(1000);
  assert.equal(f.frames.size,0,"no background loop after settling");
  const stable = path.attrs.d;
  f.tick(2000);
  assert.equal(path.attrs.d,stable);
  second.stop();
  assert.equal(f.disconnected(),3);
});

test("manual dragging and explicit completion move both the object and its connection", () => {
  const f=fixture();
  const c=f.motionModule.startLabMotion(f.root,composeLabSpace(f.search("AI"),"ai-notes-demo"),f.memory);
  c.finish();
  const record=f.records.find(record=>record.id==="ai-notes-demo")!;
  const x=f.memory.get(record.id)!.x, path=record.attrs.d;
  c.pan(25);
  assert.equal(f.memory.get(record.id)!.x,x+25);
  assert.notEqual(record.attrs.d,path);
  assert.ok(record.style.transform.includes((x+25)+"px"));
  c.release();c.finish();
  assert.equal(f.memory.get(record.id)!.x,x);
  assert.equal(f.frames.size,0);
  c.stop();
});

test("reduced motion gives immediate stable endpoints without scheduling animation", () => {
  const f=fixture(true), scene=composeLabSpace(f.search("AI"),"ai-notes-demo");
  const c=f.motionModule.startLabMotion(f.root,scene,f.memory);
  assert.equal(f.frames.size,0);
  for(const node of scene.nodes){
    const point=f.memory.get(node.item.id)!;
    assert.equal(point.opacity,1);assert.equal(point.scale,1);
    assert.equal(point.x,node.desktop.x*12);assert.equal(point.y,node.desktop.y);
  }
  c.stop();
});

test("connection endpoints remain on rotated object boundaries rather than passing through text", () => {
  for(const angle of [-20,0,20]){
    const point=edgeAnchor({x:10,y:60},{x:200,y:150},200,120,angle);
    const a=-angle*Math.PI/180,dx=point.x-200,dy=point.y-150;
    const x=dx*Math.cos(a)-dy*Math.sin(a),y=dx*Math.sin(a)+dy*Math.cos(a);
    assert.ok(Math.abs((x/100)**2+(y/60)**2-1)<.00001);
  }
});
