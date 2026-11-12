import assert from "node:assert/strict";
import { test } from "node:test";
import { createLabCatalog } from "../data/experience-lab/catalog";
import { createLabSearch } from "../lib/experience-lab/search";
import { composeLabSpace, edgeAnchor, type MotionPoint } from "../lib/experience-lab/space";
import type { LabMotion } from "../lib/experience-lab/motion";
import { loadSource } from "./helpers/load-source";
import * as geometry from "../lib/experience-lab/space";
import * as choreography from "../lib/experience-lab/choreography";

function fixture(reduce = false) {
  const catalog = createLabCatalog("en"), search = createLabSearch(catalog);
  let time = 0, next = 0, disconnected = 0,roomTop=0,reveals=0;
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
  const lens = { getBoundingClientRect: () => ({ left: 400, top: 200+roomTop, width: 400, height: 76 }) };
  const root = {
    style: { setProperty() {} }, getBoundingClientRect: () => ({ left: 0, top: roomTop, width: 1200, height: 680 }),
    querySelectorAll: () => records.map(record => ({ dataset: { labObject: record.id }, style: record.style, querySelector: () => record.button })),
    querySelector: (selector: string) => selector.includes("data-search-lens") ? lens
      : selector.includes("data-search-center") ? {style:{},getBoundingClientRect:lens.getBoundingClientRect}
      : selector.includes("data-space-strings") ? { setAttribute() {} }
      : records.find(record => selector.includes('"' + record.id + '"'))!.path,
  };
  const motionModule = loadSource<{startLabMotion: (root: unknown, scene: ReturnType<typeof composeLabSpace>, memory: Map<string,MotionPoint>) => LabMotion}>("lib/experience-lab/motion.ts", {
    "./space": geometry,
    "./choreography": choreography,
  }, {
    matchMedia: (query: string) => ({ matches: query.includes("reduced") && reduce, addEventListener() {}, removeEventListener() {} }),
    ResizeObserver: class { observe() {} disconnect() { disconnected++; } },
    performance: { now: () => time },
    requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++next,callback); return next; },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    document:documentStub,innerHeight:900,
  });
  const memory = new Map<string,MotionPoint>();
  const tick = (now: number) => { time = now; const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(now)); };
  return { root,search,records,memory,tick,frames,motionModule,setRoomTop:(top:number)=>{roomTop=top;},setActive:(id:string)=>{documentStub.activeElement=records.find(record=>record.id===id)!.button;},reveals:()=>reveals,disconnected: () => disconnected };
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

test("entering a full focus world preserves document-space coordinates when the intro collapses",()=>{
  const f=fixture(),scene=composeLabSpace(f.search(""),"personal-advantage");
  f.motionModule.startLabMotion(f.root,scene,f.memory).stop();
  const before={...f.memory.get("personal-advantage")!},lens={...f.memory.get("@lens")!};
  f.setRoomTop(-140);
  const motion=f.motionModule.startLabMotion(f.root,scene,f.memory);
  assert.equal(f.memory.get("personal-advantage")!.y-140,before.y);
  assert.equal(f.memory.get("@lens")!.y-140,lens.y);
  motion.pan(20);motion.release();motion.finish();
  assert.equal(f.memory.get("@room")!.x,0,"dragging cannot alter the document origin");
  assert.equal(f.memory.get("personal-advantage")!.y,scene.nodes.find(node=>node.item.id==="personal-advantage")!.desktop.y);
  motion.stop();assert.equal(f.frames.size,0);
});

test("completion reveals only the selected keyboard target and performs no idle work",()=>{
  const f=fixture(),matches=f.search("");
  f.motionModule.startLabMotion(f.root,composeLabSpace(matches,"world-map"),f.memory).stop();
  f.setActive("world-map");
  const motion=f.motionModule.startLabMotion(f.root,composeLabSpace(matches,"world-map",true),f.memory);
  assert.equal(f.reveals(),0,"input and motion cannot wait for a scroll timer");
  f.tick(1000);assert.equal(f.reveals(),1);
  assert.equal(f.frames.size,0);f.tick(2000);assert.equal(f.reveals(),1);
  motion.stop();
});

test("Focus connections track the selected object and its evidenced satellites during motion and direct manipulation",()=>{
 const f=fixture(),matches=f.search("Community"),id=matches[0].item.id;
 f.motionModule.startLabMotion(f.root,composeLabSpace(matches,id),f.memory).stop();
 const scene=composeLabSpace(matches,id,true),motion=f.motionModule.startLabMotion(f.root,scene,f.memory);
 const verify=()=>{
  for(const node of scene.nodes.filter(node=>node.relation)){
   const active=f.memory.get("@anchor")!,extent=f.memory.get("@extent")!,point=f.memory.get(node.item.id)!;
   const end=edgeAnchor(active,point,220*point.scale,160*point.scale,point.turn);
   const start=edgeAnchor(point,active,extent.x,extent.y,active.turn);
   assert.equal(f.records.find(record=>record.id===node.item.id)!.attrs.d,geometry.labConnection(start,end));
  }
 };
 f.tick(180);verify();motion.pan(17);verify();motion.release();f.tick(1000);verify();
 assert.equal(f.frames.size,0);motion.stop();
});

test("entering Focus cannot teleport an existing connection origin",()=>{
 const f=fixture(),matches=f.search("Community"),id=matches[0].item.id;
 f.motionModule.startLabMotion(f.root,composeLabSpace(matches,id),f.memory).stop();
 const related=composeLabSpace(matches,id,true).nodes.find(node=>node.relation)!;
 const record=f.records.find(record=>record.id===related.item.id)!;
 const before=record.attrs.d;
 const motion=f.motionModule.startLabMotion(f.root,composeLabSpace(matches,id,true),f.memory);
 assert.equal(record.attrs.d,before,"the first frame must retain the previous connection, including its source");
 f.tick(1000);assert.notEqual(record.attrs.d,before);motion.stop();
});

test("the cinematic plane stays aligned while caption targets move, without frame-time geometry reads",()=>{
 const f=fixture(),scene=composeLabSpace(f.search("Community"),"goatrecrutainer");
 const motion=f.motionModule.startLabMotion(f.root,scene,f.memory);
 f.root.getBoundingClientRect=()=>{throw new Error("A render frame must not measure the room");};
 const verify=()=>{
  for(const node of scene.nodes){
   const record=f.records.find(value=>value.id===node.item.id)!,point=f.memory.get(node.item.id)!;
   assert.ok(Math.abs(point.x+Number.parseFloat(record.style["--art-dx"])*point.scale-1200*scene.world.wide.x/100)<.001);
   assert.ok(Math.abs(point.y+Number.parseFloat(record.style["--art-dy"])*point.scale-scene.world.wide.y)<.001);
  }
 };
 f.tick(180);verify();motion.pan(24);verify();motion.release();f.tick(1000);verify();
 assert.equal(f.frames.size,0);motion.stop();
});

test("an interrupted caption-to-headline change preserves painted size before its finite flight",()=>{
 const f=fixture(),matches=f.search("");
 f.motionModule.startLabMotion(f.root,composeLabSpace(matches,"personal-advantage"),f.memory).stop();
 const record=f.records.find(value=>value.id==="goatrecrutainer")!,before={...f.memory.get(record.id)!};
 record.button.offsetWidth=550;record.button.offsetHeight=400;
 const motion=f.motionModule.startLabMotion(f.root,composeLabSpace(matches,record.id),f.memory);
 assert.equal(f.memory.get(record.id)!.scale*550,before.scale*220);
 assert.equal(f.memory.get(record.id)!.scale*400,before.scale*160);
 const dimensions={...f.memory.get("@size:"+record.id)!};
 motion.pan(20);assert.deepEqual(f.memory.get("@size:"+record.id),dimensions);
 motion.release();f.tick(1000);assert.equal(f.memory.get(record.id)!.scale,1);
 assert.equal(f.frames.size,0);motion.stop();
});


test("the image anchor continues from the last sampled frame through an interrupted query",()=>{
 const f=fixture();
 f.motionModule.startLabMotion(f.root,composeLabSpace(f.search(""),"personal-advantage"),f.memory).stop();
 const first=f.motionModule.startLabMotion(f.root,composeLabSpace(f.search("AI"),"ai-notes-demo"),f.memory);
 f.tick(120);const before={...f.memory.get("@world")!};first.stop();
 const scene=composeLabSpace(f.search("People"),"person-evgeny-vinokurov");
 const next=f.motionModule.startLabMotion(f.root,scene,f.memory);
 assert.deepEqual(f.memory.get("@world"),before);
 f.tick(1000);assert.equal(f.memory.get("@world")!.x,scene.world.wide.x*12);
 assert.equal(f.memory.get("@world")!.y,scene.world.wide.y);assert.equal(f.frames.size,0);next.stop();
});
