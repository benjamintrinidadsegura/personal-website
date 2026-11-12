import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import {renderToStaticMarkup} from "react-dom/server";
import {createLabCatalog} from "../data/experience-lab/catalog";
import {labCopy} from "../data/experience-lab/copy";
import {focusCopy} from "../data/experience-lab/focus-copy";
import {createLabSearch} from "../lib/experience-lab/search";
import * as context from "../lib/experience-lab/context";
import * as config from "../lib/i18n/config";
import {loadSource} from "./helpers/load-source";
import {planFlights,sampleFlight,type Flight} from "../lib/experience-lab/choreography";
import {composeLabSpace} from "../lib/experience-lab/space";
import {relatedLabItems} from "../lib/experience-lab/search";

test("Focus keeps only the original selection and at most two actual related matches, restoring the ranked constellation on return",()=>{
 for(const locale of config.locales){
  const search=createLabSearch(createLabCatalog(locale));
  for(const query of ["","AI","Community","Karriere","KI Recruiting"]){
   const matches=search(query),order=matches.map(match=>match.item.id);
   for(const match of matches){
    const before=composeLabSpace(matches,match.item.id);
    const scene=composeLabSpace(matches,match.item.id,true);
    const related=relatedLabItems(match.item,matches.map(value=>value.item));
    assert.deepEqual(new Set(scene.nodes.map(node=>node.item.id)),new Set([match.item.id,...related.map(item=>item.id)]));
    assert.equal(scene.nodes.filter(node=>node.relation).length,related.length);
    assert.ok(scene.nodes.length<=3);
    for(const node of scene.nodes.filter(node=>node.relation)){
     assert.ok(context.sharedLabTopics(match.item,node.item).length>0);
     assert.ok(node.depth>0 && node.depth<1,"related objects recede without being removed");
     assert.ok(node.focusScale<scene.nodes.find(node=>!node.relation)!.focusScale);
    }
    assert.deepEqual(composeLabSpace(matches,match.item.id),before);
    assert.deepEqual(matches.map(value=>value.item.id),order,"visual composition never re-ranks the index");
   }
  }
 }
});

test("actual match scores determine visual hierarchy without inventing matches or changing ranking",()=>{
 const matches=createLabSearch(createLabCatalog("en"))("Karriere");
 const scene=composeLabSpace(matches,matches[0].item.id);
 assert.equal(scene.nodes[0].scale,1);
 assert.ok(scene.nodes.some(node=>node.scale<scene.nodes[0].scale));
 assert.deepEqual(scene.nodes.map(node=>node.item.id),matches.map(match=>match.item.id));
 assert.ok(scene.nodes.every(node=>node.scale>=.88 && node.scale<=1));
});

test("three art directions keep the same ranked identities and genuine contextual priorities",()=>{
 for(const locale of config.locales){
  const search=createLabSearch(createLabCatalog(locale));
  for(const query of ["","AI","Karriere","People","Community","zxqv"]){
   const matches=search(query),id=matches.find(match=>match.item.id==="personal-advantage")?.item.id??matches[0]?.item.id??"";
   const scenes=(["atlas","editorial","gallery"] as const).map(direction=>composeLabSpace(matches,id,false,direction));
   assert.ok(scenes.every(scene=>JSON.stringify(scene.nodes.map(node=>node.item.id))===JSON.stringify(scenes[0].nodes.map(node=>node.item.id))));
   if(matches.length){
    assert.notDeepEqual(scenes[0].nodes.map(node=>node.desktop),scenes[1].nodes.map(node=>node.desktop));
    assert.notDeepEqual(scenes[0].nodes.map(node=>node.desktop),scenes[2].nodes.map(node=>node.desktop));
    const active=matches.find(match=>match.item.id===id)!.item;
    const related=relatedLabItems(active,scenes[0].nodes.map(node=>node.item));
    assert.ok(related.every(item=>scenes[0].nodes.find(node=>node.item.id===item.id)?.role==="feature"));
   }
   assert.deepEqual(matches.map(match=>match.item.id),search(query).map(match=>match.item.id),"art direction cannot mutate the authoritative index");
  }
 }
});

test("Atlas composition responds to actual content types even with unfamiliar IDs",()=>{
 const first=createLabCatalog("en")[0];
 const writing={item:{...first,id:"unfamiliar-editorial",kind:"writing" as const},score:12,matchedTopics:[]};
 const tool={item:{...first,id:"unfamiliar-tool",kind:"tool" as const},score:12,matchedTopics:[]};
 const a=composeLabSpace([writing],writing.item.id),b=composeLabSpace([tool],tool.item.id);
 assert.notDeepEqual(a.nodes[0].desktop,b.nodes[0].desktop);
 assert.notDeepEqual(a.world.wide,b.world.wide);
 assert.equal(a.nodes[0].item,writing.item);assert.equal(b.nodes[0].item,tool.item);
});

test("context explains only actual index topics and exact shared catalog metadata",()=>{
 const catalog=createLabCatalog("en"),search=createLabSearch(catalog);
 for(const query of ["AI","Karriere","KI Recruiting","Map","reflection",""])for(const match of search(query)){
  const why=context.labContext(match,query);
  assert.equal(why.searched,Boolean(query));
  assert.ok(why.topics.every(topic=>match.matchedTopics.includes(topic)&&match.item.topics.includes(topic)));
 }
 const first=catalog[0];
 assert.deepEqual(context.labContext({...search("")[0],matchedTopics:["fabricated"]},""),{searched:false,topics:[]});
 assert.deepEqual(context.sharedLabTopics(first,{...first,topics:["unrelated"]}),[]);
});

test("the inline focus surface keeps seven-locale controls, accurate evidence and public-only actions",()=>{
 for(const locale of config.locales){
  const matches=createLabSearch(createLabCatalog(locale))("AI");
  const Surface=loadSource<{FocusSurface:(props:Record<string,unknown>)=>React.ReactElement}>("components/experience-lab/focus-surface.tsx",{
   "react/jsx-runtime":jsxRuntime,"next/link":{__esModule:true,default:(props:Record<string,unknown>)=>{const safe={...props};delete safe.prefetch;return React.createElement("a",safe);}},
   "@/data/experience-lab/focus-copy":{focusCopy},"@/data/experience-lab/copy":{labCopy},"@/lib/experience-lab/context":context,
   "@/lib/i18n/config":config,"./island-visual":{IslandVisual:()=>null},
   "./experience-lab.module.css":{__esModule:true,default:new Proxy({},{get:(_o,key)=>String(key)})},
  }).FocusSurface;
  for(const match of [...matches,createLabSearch(createLabCatalog(locale))("")[0]]){
   let backs=0,refinements=0;
   const tree=Surface({match,query:"AI",kind:"all",locale,related:relatedLabItems(match.item,createLabCatalog(locale)),onBack:()=>backs++,onRefine:()=>refinements++,onSelect:()=>{}});
   const html=renderToStaticMarkup(tree);
   assert.ok(html.includes(focusCopy[locale].back));assert.ok(html.includes(focusCopy[locale].why));
   assert.match(html,/<details class="focusNotes"><summary>/);assert.doesNotMatch(html,/<details[^>]* open/);
   for(const other of relatedLabItems(match.item,createLabCatalog(locale)))assert.ok(html.includes(other.title.replaceAll("&","&amp;")),"collapsed context retains every real related destination");
   assert.match(html,/id="lab-detail" tabindex="-1"/);assert.doesNotMatch(html,/role="dialog"|aria-modal|autofocus/i);
   if(match.item.source==="demo")assert.doesNotMatch(html,/<a /);else assert.ok(html.includes('href="'+match.item.href+'"'));
   (tree.props as {onKeyDown:(e:unknown)=>void}).onKeyDown({key:"Escape",preventDefault(){}});assert.equal(backs,1);
   const children=React.Children.toArray((tree.props as {children:React.ReactNode}).children);
   const toolbar=children[0] as React.ReactElement<{children:React.ReactElement<{onClick:()=>void}>[]}>;
   toolbar.props.children[1].props.onClick();assert.equal(refinements,1);
  }
 }
});

const point=(x:number,y:number)=>({x,y,opacity:1,scale:1,turn:0});
test("choreography detours around the search envelope and stays deterministic",()=>{
 const flight:Flight={id:"move",from:point(120,120),to:point(880,500),width:100,height:80};
 const obstacle={x:350,y:180,width:300,height:200},room={width:1000,height:700};
 const plan=planFlights([flight],obstacle,room);
 assert.deepEqual(planFlights([flight],obstacle,room),plan);
 for(let i=0;i<=100;i++){
  const p=sampleFlight(plan[0],i/100);
  assert.ok(!(p.x+50>obstacle.x && p.x-50<650 && p.y+40>180 && p.y-40<380),JSON.stringify(p));
 }
 assert.deepEqual(sampleFlight(plan[0],0),flight.from);assert.deepEqual(sampleFlight(plan[0],1),flight.to);
});

test("crossing routes protect solid surfaces while preserving interruption coordinates",()=>{
 const flights=[{id:"first",from:point(150,130),to:point(850,130),width:120,height:100},
  {id:"second",from:point(850,130),to:point(150,130),width:120,height:100}];
 const plan=planFlights(flights,{x:400,y:320,width:200,height:100},{width:1000,height:700});
 for(let i=1;i<100;i++){
  const p=sampleFlight(plan[0],i/100),q=sampleFlight(plan[1],i/100);
  if(p.opacity>.6 && q.opacity>.6)assert.ok(Math.abs(p.x-q.x)>=120 || Math.abs(p.y-q.y)>=100);
 }
 const mid=sampleFlight(plan[1],.4),next=planFlights([{...flights[1],from:mid,to:point(180,550)}],{x:400,y:320,width:200,height:100},{width:1000,height:700});
 assert.deepEqual(sampleFlight(next[0],0),mid);
});

test("a moving search envelope stays clear of solid surfaces during Focus and return",()=>{
 const flight:Flight={id:"selected",from:point(200,290),to:point(320,460),width:245,height:160};
 const obstacle={x:150,y:85,width:390,height:240,fromX:435,fromY:135};
 for(const reverse of[false,true]){
  const f=reverse?{...flight,from:flight.to,to:flight.from}:flight;
  const o=reverse?{...obstacle,x:435,y:135,fromX:150,fromY:85}:obstacle;
  const plan=planFlights([f],o,{width:1320,height:760});
  for(let i=0;i<=100;i++){
   const t=i/100,p=sampleFlight(plan[0],t),x=o.fromX+(o.x-o.fromX)*t,y=o.fromY+(o.y-o.fromY)*t;
   assert.ok(p.x>=flight.width/2 && p.x<=1320-flight.width/2 && p.y>=flight.height/2 && p.y<=760-flight.height/2,"a search detour must stay inside the universe");
   if(p.opacity>.6)assert.ok(!(p.x+122>x+8 && p.x-122<x+o.width-8 && p.y+80>y+8 && p.y-80<y+o.height-8));
  }
 }
});


test("Human Liquid Universe keeps sparse and dense ranked collections intact and the selected artwork anchored through Focus",()=>{
 for(const locale of config.locales){
  const search=createLabSearch(createLabCatalog(locale));
  for(const [query,count] of [["zxqv",0],["KI Recruiting",1],["AI",2],["Tools",3],["Community",4],["Karriere",5],["",11]] as const){
   const matches=search(query),original=JSON.stringify(matches);
   assert.equal(matches.length,count);
   for(const id of count?matches.map(match=>match.item.id):[""]){
    const explore=composeLabSpace(matches,id),focus=composeLabSpace(matches,id,true);
    assert.equal(explore.canvas,true);assert.deepEqual(explore.height,{wide:760,compact:640});
    assert.ok(explore.nodes.length<=6);
    assert.deepEqual(explore.nodes.map(node=>node.item.id),matches.slice(explore.start,explore.end).map(match=>match.item.id));
    if(count){
     const before=explore.nodes.find(node=>node.item.id===id)!,after=focus.nodes.find(node=>node.item.id===id)!;
     assert.deepEqual(after.desktop,before.desktop);assert.deepEqual(after.compact,before.compact);
     assert.equal(after.item,before.item,"Focus retains the original approved content object");
     assert.equal(explore.nodes.filter(node=>node.role!=="note").length,Math.min(3,explore.nodes.length));
    }else assert.equal(focus.nodes.length,0);
   }
   assert.equal(JSON.stringify(matches),original,"sparse composition and Focus cannot mutate ranking or catalog data");
  }
 }
});


test("the consolidated content visuals cannot acquire grayscale, color-blend filters or a background-photo scene",()=>{
 const css=readFileSync("components/experience-lab/experience-lab.module.css","utf8");
 assert.doesNotMatch(css,/grayscale\(|saturate\(|mix-blend-mode|(?:^|[;{])filter:/m);
 assert.doesNotMatch(readFileSync("components/experience-lab/experience-lab.tsx","utf8"),/className=\{styles.landscape\}/);
});
