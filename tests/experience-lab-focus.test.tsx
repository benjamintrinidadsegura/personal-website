import assert from "node:assert/strict";
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
   const tree=Surface({match,query:"AI",kind:"all",locale,related:[],onBack:()=>backs++,onRefine:()=>refinements++,onSelect:()=>{}});
   const html=renderToStaticMarkup(tree);
   assert.ok(html.includes(focusCopy[locale].back));assert.ok(html.includes(focusCopy[locale].why));
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
