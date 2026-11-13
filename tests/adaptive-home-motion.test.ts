import assert from "node:assert/strict";
import { test } from "node:test";
import { discoveryIndex } from "../data/discovery-index";
import { publicUniverse, universeMatches } from "../lib/discovery-universe/content";
import { composeUniverseSpace, type MotionPoint } from "../lib/discovery-universe/space";
import type { UniverseMotion } from "../lib/discovery-universe/motion";
import * as geometry from "../lib/discovery-universe/space";
import * as choreography from "../lib/discovery-universe/choreography";
import { loadSource } from "./helpers/load-source";
function fixture(reduce = false, compact = false, height = 760) {
  const catalog = publicUniverse(discoveryIndex,"en"), search = () => universeMatches(catalog,[],"");
  let time = 0, next = 0, disconnected = 0,roomTop=0,reveals=0,managedListeners=0,width=1200;
  let resizeHandler=()=>{};
  const documentStub:{activeElement:unknown}={activeElement:null};
  const frames = new Map<number, FrameRequestCallback>();
  const records = catalog.map(item => ({
    id: item.id, style: {} as Record<string,string>, attrs: {} as Record<string,string>,
    button:{offsetWidth:220,offsetHeight:160,getBoundingClientRect:()=>({top:950,bottom:1110}),scrollIntoView(){reveals++;}},
    path: { style: {}, setAttribute(key: string,value: string) { records.find(record => record.path === this)!.attrs[key] = value; } },
  }));
  for (const record of records) Object.defineProperty(record.style, "setProperty", {
    value: (key: string, value: string) => { record.style[key] = value; },
  });
  const centerStyle: Record<string,string> = {};
  const lens = { getBoundingClientRect: () => ({ left: 400, top: 200+roomTop, width: 400, height: 76 }) };
  const root = {
    dataset: {} as Record<string,string>,
    style: { setProperty() {} }, getBoundingClientRect: () => ({ left: 0, top: roomTop, width, height }),
    querySelectorAll: () => records.map(record => ({ dataset: { universeObject: record.id }, style: record.style, querySelector: () => record.button })),
    querySelector: (selector: string) => selector.includes("data-search-lens") ? lens
      : selector.includes("data-search-center") ? {style:centerStyle,getBoundingClientRect:lens.getBoundingClientRect}
      : selector.includes("data-space-strings") ? { setAttribute() {} }
      : records.find(record => selector.includes('"' + record.id + '"'))!.path,
  };
  const motionModule = loadSource<{startUniverseMotion: (root: unknown, scene: ReturnType<typeof composeUniverseSpace>, memory: Map<string,MotionPoint>) => UniverseMotion}>("lib/discovery-universe/motion.ts", {
    "./space": geometry,
    "./choreography": choreography,
  }, {
    matchMedia: (query: string) => ({ matches: query.includes("reduced") ? reduce : compact, addEventListener() {managedListeners++;}, removeEventListener() {managedListeners--;} }),
    ResizeObserver: class { constructor(callback:()=>void){resizeHandler=callback;} observe() {} disconnect() { disconnected++; } },
    performance: { now: () => time },
    requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++next,callback); return next; },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    document:documentStub,innerHeight:900,
  });
  const nativeElements = records.map(record => ({dataset:{universeObject:record.id},style:record.style,inert:false,querySelector:()=>record.button}));
  root.querySelectorAll=()=>nativeElements;
  const memory = new Map<string,MotionPoint>();
  const tick = (now: number) => { time = now; const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(now)); };
  return { setWidth:(value:number)=>{width=value;},resize:()=>resizeHandler(),root,search,records,nativeElements,centerStyle,lens,memory,tick,frames,motionModule,setRoomTop:(top:number)=>{roomTop=top;},setActive:(id:string)=>{documentStub.activeElement=records.find(record=>record.id===id)!.button;},reveals:()=>reveals,disconnected: () => disconnected, listeners: () => managedListeners };
}

test("finite motion is interruptible, preserves the actual intermediate object and path, and cleans listeners",()=>{
 const f=fixture(),matches=f.search();
 f.motionModule.startUniverseMotion(f.root,composeUniverseSpace(matches,matches[0].item.id),f.memory).stop();
 const first=f.motionModule.startUniverseMotion(f.root,composeUniverseSpace(matches,matches[1].item.id),f.memory);f.tick(80);
 const id=matches[0].item.id,before={...f.memory.get(id)!},path=f.records.find(record=>record.id===id)!.attrs.d;first.stop();
 const second=f.motionModule.startUniverseMotion(f.root,composeUniverseSpace(matches,matches[2].item.id),f.memory);
 assert.deepEqual(f.memory.get(id),before);assert.equal(f.records.find(record=>record.id===id)!.attrs.d,path);f.tick(1000);assert.equal(f.frames.size,0);second.stop();assert.equal(f.listeners(),0);
});
test("reduced motion applies complete scene endpoints synchronously and keeps no frame loop",()=>{
 const f=fixture(true),matches=f.search();const current=f.motionModule.startUniverseMotion(f.root,composeUniverseSpace(matches,matches[1].item.id),f.memory);assert.equal(f.frames.size,0);assert.ok([...f.memory.values()].every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y)));current.stop();assert.equal(f.listeners(),0);
});
test("direct scrubbing reverses to the original coordinates and shares geometry with connections",()=>{
 const f=fixture(),matches=f.search(),id=matches[0].item.id;const current=f.motionModule.startUniverseMotion(f.root,composeUniverseSpace(matches,id),f.memory),before={...f.memory.get(id)!};
 current.pan(-100);assert.notDeepEqual(f.memory.get(id),before);assert.ok(f.records.find(record=>record.id===id)!.attrs.d.startsWith("M "));current.pan(0);assert.deepEqual(f.memory.get(id),before);current.release();current.stop();assert.equal(f.frames.size,0);
});
test("a hidden Discover scene does no animation work or geometry writes and recovers when Explore returns",()=>{
 const f=fixture(),matches=f.search(),id=matches[0].item.id;
 f.motionModule.startUniverseMotion(f.root,composeUniverseSpace(matches,id),f.memory).stop();const before=new Map(f.memory);f.setWidth(0);
 const current=f.motionModule.startUniverseMotion(f.root,composeUniverseSpace(matches,matches[1].item.id),f.memory);assert.equal(f.frames.size,0);assert.deepEqual(f.memory,before);f.setWidth(1200);f.resize();f.tick(1000);assert.ok(f.memory.size);current.stop();assert.equal(f.listeners(),0);
});


test("a mode switch mid-flight resumes to the endpoint even when the revealed scene has identical geometry",()=>{
 const f=fixture(),matches=f.search();
 f.motionModule.startUniverseMotion(f.root,composeUniverseSpace(matches,matches[0].item.id),f.memory).stop();
 const scene=composeUniverseSpace(matches,matches[1].item.id);
 const current=f.motionModule.startUniverseMotion(f.root,scene,f.memory);
 f.tick(80);assert.ok(f.frames.size>0);
 const id=matches[1].item.id,before={...f.memory.get(id)!};
 f.setWidth(0);f.resize();assert.equal(f.frames.size,0);assert.deepEqual(f.memory.get(id),before);assert.equal(f.root.dataset.motionState,"idle");
 f.setWidth(1200);f.resize();assert.ok(f.frames.size>0,"identical returning geometry must restart the cancelled flight");
 f.tick(1000);assert.equal(f.frames.size,0);assert.equal(f.root.dataset.motionState,"idle");
 const endpoint=scene.nodes.find(node=>node.item.id===id)!;
 assert.equal(f.memory.get(id)!.x,1200*endpoint.desktop.x/100);
 assert.equal(f.memory.get(id)!.y,endpoint.desktop.y);
 current.stop();assert.equal(f.listeners(),0);
});
