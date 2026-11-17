import assert from "node:assert/strict";
import { test } from "node:test";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { discoveryIndex } from "../data/discovery-index";
import { discoverItems } from "../lib/discovery";
import { localizeDiscoveryItems, getDiscoveryUiCopy, getGuidedDiscoveryPrompts } from "../data/i18n/discovery";
import { adaptiveHomeCopy } from "../data/i18n/adaptive-home";
import * as content from "../lib/discovery-universe/content";
import { canHandoffUniverseLink } from "../lib/discovery-universe/navigation";
import * as space from "../lib/discovery-universe/space";
import { locales, type Locale } from "../lib/i18n/config";
import { loadSource } from "./helpers/load-source";
import { hookHarness } from "./helpers/hook-harness";

type Node = React.ReactElement<Record<string, unknown>>;
function nodes(value: React.ReactNode): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!React.isValidElement<Record<string, unknown>>(value)) return [];
  return [value, ...nodes(value.props.children as React.ReactNode)];
}
function fixture(locale: Locale) {
  const h=hookHarness();let query="",items=localizeDiscoveryItems(discoveryIndex,locale),tree:Node;
  const frames=new Map<number,FrameRequestCallback>();let sequence=0,hidden=false,panelVisible=true,stops=0;
  const buttons=new Map<string,ReturnType<typeof element>>();let duplicate=false;
  const doc={activeElement:null as unknown,querySelector:()=>null,getElementById:(id:string)=>duplicate?body:id==="universe-search"?input:all().some(n=>n.props.id===id)?detail:null};
  function element(id:string){return {id,focus(){doc.activeElement=this;},querySelector:()=>null};}
  const input=element("universe-search"),detail=element("universe-detail"),body=element("body");doc.activeElement=body;
  const all=()=>nodes(tree);
  const room={checkVisibility:()=>panelVisible,parentElement:{querySelector:(selector:string)=>selector==="#universe-detail"&&all().some(n=>n.props.id==="universe-detail")?detail:null},querySelector:(selector:string)=>{
    if(selector==="#universe-search")return input;
    const id=selector.match(/data-universe-card="([^"]+)"/)?.[1];
    if(!id||!all().some(n=>n.props["data-universe-object"]===id&&n.props["data-visible"]===true))return null;
    if(!buttons.has(id))buttons.set(id,element(id));return buttons.get(id)!;
  }};
  const Universe=loadSource<{AdaptiveUniverse:()=>Node}>("components/home/universe/adaptive-universe.tsx",{
    "react/jsx-runtime":jsxRuntime,"react":{...h.hooks,useLayoutEffect:h.hooks.useEffect},"next/link":{__esModule:true,default:"a"},
    "@/components/discovery/discovery-results":{DiscoveryNavigationStatus:()=>null},
    "@/components/i18n/locale-context":{useLocale:()=>locale},
    "@/components/discovery/discovery-context":{useDiscovery:()=>({items,query,matches:discoverItems(items,query),setQuery:(v:string)=>{query=v;},writingStatus:"unavailable"})},
    "@/data/i18n/adaptive-home":{adaptiveHomeCopy},"@/data/i18n/discovery":{getDiscoveryUiCopy,getGuidedDiscoveryPrompts},
    "@/lib/discovery-universe/navigation":{canHandoffUniverseLink},"@/lib/discovery-universe/content":content,"@/lib/discovery-universe/space":space,
    "@/lib/discovery-universe/motion":{startUniverseMotion:()=>({stop(){stops++;},finish(){},pan(){},release(){}})},
    "./island-visual":{IslandVisual:()=>null},"./universe.module.css":{__esModule:true,default:{}},
  },{document:doc,getComputedStyle:()=>({visibility:hidden?"hidden":"visible"}),requestAnimationFrame:(cb:FrameRequestCallback)=>{frames.set(++sequence,cb);return sequence;},cancelAnimationFrame:(id:number)=>frames.delete(id)}).AdaptiveUniverse;
  const render=()=>h.render(()=>{
    const wasDetail=tree&&all().some(n=>n.props.id==="universe-detail");
    tree=Universe();
    (all().find(n=>n.props["data-count"]!==undefined)!.props.ref as {current:unknown}).current=room;
    if(wasDetail&&!all().some(n=>n.props.id==="universe-detail")&&doc.activeElement===detail)doc.activeElement=body;
    return tree;
  });
  render();
  const click=(n:Node)=>(n.props.onClick as ()=>void)();
  const card=(id:string)=>nodes(all().find(n=>n.props["data-universe-object"]===id)).find(n=>n.props["data-space-node"]!==undefined)!;
  const selected=()=>all().find(n=>n.props["data-selected"]===true)!;
  const visible=()=>all().filter(n=>n.props["data-visible"]===true).map(n=>String(n.props["data-universe-object"]));
  const enter=(id:string)=>{click(card(id));render();assert.equal(doc.activeElement,detail);};
  const leave=()=>{(tree.props.onKeyDown as (e:unknown)=>void)({key:"Escape",defaultPrevented:false,preventDefault(){}});render();};
  const change=(v:string)=>{(all().find(n=>n.props.id==="universe-search")!.props.onChange as (e:unknown)=>void)({target:{value:v}});render();};
  const tick=()=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(cb=>cb(0));};
  const assertReturn=(id:string)=>{
    assert.equal(all().some(n=>n.props.id==="universe-detail"),false);
    assert.equal(selected().props["data-universe-object"],id);
    assert.ok(visible().includes(id));assert.equal(doc.activeElement,buttons.get(id));
  };
  return {all,render,click,card,enter,leave,change,tick,assertReturn,visible,selected,doc,input,detail,
    refresh(){click(all().find(n=>n.props["data-curated-refresh"]!==undefined)!);render();},
    cloneCatalog(){items=[...items];render();},externalQuery(v:string){query=v;render();},duplicatePanel(){duplicate=true;},hide:(v:boolean)=>{hidden=v;},hidePanel(){panelVisible=false;},query:()=>query,frames,stops:()=>stops,unmount:h.unmount};
}
for(const locale of locales) {
  test("empty-query visible selection and repeated Return keep selected and focused identity: "+locale,()=>{
    const f=fixture(locale),before=f.visible();
    for(const id of before.slice(1)){f.enter(id);f.leave();f.assertReturn(id);assert.deepEqual(f.visible().sort(),before.slice().sort());}
    f.unmount();
  });
  test("Focus-related selection returns to its original valid anchor: "+locale,()=>{
    const f=fixture(locale),id=f.visible().find(id=>id==="tool-life-alignment")!;f.enter(id);
    const related=f.all().find(n=>n.props["data-focus-body"]!==undefined)!;
    const other=nodes(related).find(n=>n.type==="button");
    if(other){f.click(other);f.render();f.leave();f.assertReturn(id);}
    else {f.leave();f.assertReturn(id);}
    f.unmount();
  });
  test("a catalog rerender cannot discard an unfinished Return handoff: "+locale,()=>{
    const f=fixture(locale),id=String(f.selected().props["data-universe-object"]);f.enter(id);f.hide(true);f.leave();f.cloneCatalog();f.hide(false);f.tick();f.assertReturn(id);f.unmount();
  });
  test("clearing, perspective rotation and a newer search cancel obsolete focus work: "+locale,()=>{
    const f=fixture(locale);f.change("Life Alignment");const id=String(f.selected().props["data-universe-object"]);f.enter(id);
    f.hide(true);f.leave();f.change("");f.refresh();f.change("Evgeny");
    const input=f.all().find(n=>n.props.id==="universe-search")!;(input.props.onFocus as ()=>void)();f.doc.activeElement=f.input;f.hide(false);f.tick();
    assert.equal(f.doc.activeElement,f.input);assert.equal(f.query(),"Evgeny");assert.equal(f.all().some(n=>n.props.id==="universe-detail"),false);f.unmount();
  });
  test("shared search changes cannot resurrect an old Focus when the query returns: "+locale,()=>{
    const f=fixture(locale),id=String(f.selected().props["data-universe-object"]);f.enter(id);
    f.externalQuery("Evgeny");assert.equal(f.all().some(n=>n.props.id==="universe-detail"),false);
    f.externalQuery("");assert.equal(f.all().some(n=>n.props.id==="universe-detail"),false);f.unmount();
  });
  test("New Perspective cancels an unfinished Return without stealing keyboard focus: "+locale,()=>{
    const f=fixture(locale),id=String(f.selected().props["data-universe-object"]);f.enter(id);f.hide(true);f.leave();
    const control={id:"perspective-button"};f.doc.activeElement=control;f.refresh();f.hide(false);f.tick();
    assert.equal(f.doc.activeElement,control);assert.equal(f.all().some(n=>n.props.id==="universe-detail"),false);f.unmount();
  });
  test("a pending handoff cannot revive after the shared query changes away and back: "+locale,()=>{
    const f=fixture(locale),id=String(f.selected().props["data-universe-object"]);f.enter(id);f.hide(true);f.leave();
    f.doc.activeElement=f.input;f.externalQuery("Evgeny");f.hide(false);f.externalQuery("");f.tick();
    assert.equal(f.doc.activeElement,f.input);assert.equal(f.all().some(n=>n.props.id==="universe-detail"),false);f.unmount();
  });
  test("Focus targets the owning panel when a streamed panel duplicates document IDs: "+locale,()=>{
    const f=fixture(locale);f.duplicatePanel();const id=String(f.selected().props["data-universe-object"]);f.enter(id);f.leave();f.assertReturn(id);f.unmount();
  });
  test("a valid Return waits for actual visibility beyond four frames and releases all work: "+locale,()=>{
    const f=fixture(locale),id=String(f.selected().props["data-universe-object"]);f.enter(id);f.hide(true);f.leave();
    for(let i=0;i<8;i++)f.tick();
    assert.notEqual(f.doc.activeElement,f.detail);
    f.hide(false);f.tick();f.assertReturn(id);assert.equal(f.frames.size,0);f.unmount();
  });
  test("a hidden panel and unmount stop readiness work without an idle frame loop: "+locale,()=>{
    const f=fixture(locale),id=String(f.selected().props["data-universe-object"]);f.enter(id);f.hide(true);f.leave();
    assert.equal(f.frames.size,1);f.hidePanel();f.tick();assert.equal(f.frames.size,0);f.unmount();assert.equal(f.frames.size,0);
  });
}
