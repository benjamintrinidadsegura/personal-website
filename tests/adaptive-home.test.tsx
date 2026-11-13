import assert from "node:assert/strict";
import { test } from "node:test";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { createWelcomeGate, localWelcomeDay, welcomeStorageKey } from "../lib/home-welcome";
import { discoveryIndex, createPublishedWritingDiscoveryItems } from "../data/discovery-index";
import { discoverItems, normalizeSearchText } from "../lib/discovery";
import { localizeDiscoveryItems, getDiscoveryUiCopy, getGuidedDiscoveryPrompts } from "../data/i18n/discovery";
import { adaptiveHomeCopy } from "../data/i18n/adaptive-home";
import * as content from "../lib/discovery-universe/content";
import { canHandoffUniverseLink } from "../lib/discovery-universe/navigation";
import * as space from "../lib/discovery-universe/space";
import { planFlights, sampleFlight } from "../lib/discovery-universe/choreography";
import { locales } from "../lib/i18n/config";
import { loadSource } from "./helpers/load-source";
import { hookHarness } from "./helpers/hook-harness";
import type { DiscoveryItem } from "../types/discovery";
import type { PublicWritingSummary } from "../types/writing";

const day = new Date(2026,10,13,22,5), tomorrow=new Date(2026,10,14,0,1);
function memoryStorage() { const values=new Map<string,string>();return {getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);},values}; }
test("welcome uses the visitor's local calendar day, not UTC or locale",()=>{assert.equal(localWelcomeDay(day),"2026-11-13");assert.equal(localWelcomeDay(tomorrow),"2026-11-14");});
test("first arrival, dismissal, mode navigation, refresh and locale share one date-only gate",()=>{
 const store=memoryStorage(),gate=createWelcomeGate();assert.equal(gate.visible(()=>store,"",day),true);
 gate.dismiss(()=>store,day);assert.deepEqual([...store.values],[[welcomeStorageKey,"2026-11-13"]]);
 for(const locale of locales){assert.equal(gate.visible(()=>store,"#home",day),false,locale);assert.equal(createWelcomeGate().visible(()=>store,"",day),false,locale);}
 assert.equal(gate.visible(()=>store,"",tomorrow),true);
});
test("deliberate deep links do not open welcome; malformed storage and storage errors leave content usable",()=>{
 const gate=createWelcomeGate(),store=memoryStorage();for(const hash of ["#writing","#building","#writing-thought-public","#now"])assert.equal(gate.visible(()=>store,hash,day),false);
 store.setItem(welcomeStorageKey,"not a date");assert.equal(gate.visible(()=>store,"",day),true);
 const blocked=()=>{throw new Error("disabled");};assert.equal(gate.visible(blocked,"",day),true);gate.dismiss(blocked,day);assert.equal(gate.visible(blocked,"",day),false);assert.equal(gate.visible(blocked,"",tomorrow),true);
});
for(const query of ["K","KI","Karriere","lebe","leben","Life Alignment","Recruiting","Menschen","AI","Writing"])test(`public Discovery finds useful real content for ${query}`,()=>{const matches=discoverItems(discoveryIndex,query);assert.ok(matches.length);assert.ok(matches.every(match=>Number.isFinite(match.score)));const publicItems=content.publicUniverse(discoveryIndex,"de");assert.ok(content.universeMatches(publicItems,matches,query).length);});
test("normalization supports punctuation, composed Unicode, German transliterations and case",()=>{assert.equal(normalizeSearchText("  ÜBER—MÜLLER!  "),normalizeSearchText("ueber mueller"));assert.equal(normalizeSearchText("Café"),normalizeSearchText("Café"));});
test("strong title, topic, description precede weak compound substring/prefix evidence",()=>{
 const item=(id:string,title:string,tags:string[],description="x"):DiscoveryItem=>({id,title,tags,description,category:"Page",keywords:[],group:"Pages",status:"Live",href:"/about"});
 const items=[item("weak","Karrierewege",[]),item("topic","x",["Karriere"]),item("title","Karriere",[]),item("description","x",[],"Karriere")];
 assert.deepEqual(discoverItems(items,"Karriere").map(match=>match.item.id),["title","topic","description","weak"]);
 assert.equal(discoverItems([item("substring","Digital",[],"Nachricht")],"it").length,0);
 assert.equal(discoverItems(items,"K").every(match=>match.presentation==="suggestion"),true);
 assert.equal(discoverItems(items,"Karriere unknown").every(match=>match.presentation==="related"),true);
 assert.deepEqual(discoverItems(items,"zzqxyzzz"),[]);
});
test("universe uses public destinations only, deduplicates hrefs, preserves ranking, and exposes no demo fallback",()=>{
 const real=discoveryIndex.find(item=>item.id==="tool-life-alignment")!;
 const unsafe=["/account","/admin","/auth/login","/life-alignment/relationship/invite/private","/life-alignment/partner/session/private","//evil.test","https://evil.test","/writing/private?token=x","/writing/%2fprivate","/people/not-a-published-profile"];
 for(const href of unsafe)assert.equal(content.universeItem({...real,href},"de"),null,href);
 assert.equal(content.universeItem({...real,status:"Coming Soon",href:undefined},"de"),null);
 const all=content.publicUniverse([...discoveryIndex,real],"de");const initialMatches=content.universeMatches(all,[],"");assert.equal(new Set(initialMatches.map(match=>match.item.href)).size,initialMatches.length);
 const matches=discoverItems(discoveryIndex,"Karriere"),seen=new Set<string>();const expected=matches.flatMap(match=>{const item=all.find(item=>item.id===match.item.id);if(!item||seen.has(item.href))return [];seen.add(item.href);return [item.id];});assert.deepEqual(content.universeMatches(all,matches,"Karriere").map(match=>match.item.id),expected);
 assert.deepEqual(content.universeMatches(all,[],"unknown"),[]);
});
test("seven-locale public adapters and canonical source-language Writing links remain correct",()=>{
 const article:PublicWritingSummary={id:"test-published",slug:"verified-test",title:"Published source",deck:"Existing deck",excerpt:"Existing excerpt",contentType:"essay",topics:["Ideas"],publishedAt:"2026-11-13T12:00:00Z",readingMinutes:3,language:"en",sourceLanguage:"en",availableLanguages:["en"],translationStatus:"fallback"};
 for(const locale of locales){const items=localizeDiscoveryItems([...discoveryIndex,...createPublishedWritingDiscoveryItems([article])],locale);const all=content.publicUniverse(items,locale);assert.ok(all.length>10);assert.equal(all.find(item=>item.id==="writing-test-published")?.href,"/en/writing/verified-test");assert.equal(all.find(item=>item.id==="writing-test-published")?.language,"en");assert.ok(Object.values(adaptiveHomeCopy[locale]).every(value=>value.length>0));}
});
test("bounded scene, actual topic relationships, reversible drag and finite motion geometry",()=>{
 const items=content.publicUniverse(discoveryIndex,"de"),matches=content.universeMatches(items,[],"");
 for(let index=0;index<matches.length;index++){const scene=space.composeUniverseSpace(matches,matches[index].item.id);assert.ok(scene.nodes.length<=6);assert.equal(new Set(scene.nodes.map(node=>node.item.id)).size,scene.nodes.length);for(const node of scene.nodes)assert.ok(Number.isFinite(node.desktop.x)&&Number.isFinite(node.compact.y));const focus=space.composeUniverseSpace(matches,matches[index].item.id,true);assert.ok(focus.nodes.length<=3);for(const node of focus.nodes.filter(node=>node.relation))assert.ok(content.sharedUniverseTopics(matches[index].item,node.item).length);}
 assert.equal(space.dragSelection(-200,1200,0,10),1);assert.equal(space.dragSelection(200,1200,1,10),0);assert.equal(space.dragSelection(0,1200,1,10),1);
 const a={x:40,y:80,opacity:1,scale:1,turn:0},b={...a,x:800,y:540};const flight=planFlights([{id:"a",from:a,to:b,width:100,height:100}],{x:400,y:250,width:160,height:100},{width:1200,height:760})[0];assert.deepEqual(sampleFlight(flight,0),a);assert.deepEqual(sampleFlight(flight,1),b);assert.deepEqual(sampleFlight(flight,.3),sampleFlight(flight,.3));
});
function nodes(value:React.ReactNode):React.ReactElement<Record<string,unknown>>[]{if(Array.isArray(value))return value.flatMap(nodes);if(!React.isValidElement<Record<string,unknown>>(value))return [];return [value,...nodes(value.props.children as React.ReactNode)];}
for(const locale of locales)test(`universe presentation and Focus retain real titles, query, accessible list and honest unavailable state: ${locale}`,()=>{
 const h=hookHarness();let query="";const items=localizeDiscoveryItems(discoveryIndex,locale);
 const Universe=loadSource<{AdaptiveUniverse:()=>React.ReactElement}>("components/home/universe/adaptive-universe.tsx",{
 "react/jsx-runtime":jsxRuntime,"react":{...h.hooks,useLayoutEffect:h.hooks.useEffect},"next/link":{__esModule:true,default:"a"},
 "@/components/discovery/discovery-results":{DiscoveryNavigationStatus:()=>null,isUnmodifiedPrimaryClick:()=>false},
 "@/components/i18n/locale-context":{useLocale:()=>locale},"@/components/discovery/discovery-context":{useDiscovery:()=>({items,query,matches:discoverItems(items,query),setQuery:(value:string)=>{query=value;},writingStatus:"unavailable"})},
 "@/data/i18n/adaptive-home":{adaptiveHomeCopy},"@/data/i18n/discovery":{getDiscoveryUiCopy,getGuidedDiscoveryPrompts},"@/lib/discovery-universe/navigation":{canHandoffUniverseLink},"@/lib/discovery-universe/content":content,"@/lib/discovery-universe/space":space,"@/lib/discovery-universe/motion":{startUniverseMotion:()=>assert.fail("No DOM in component fixture")},"./island-visual":{IslandVisual:()=>React.createElement("span")},"./universe.module.css":{__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})},
 }).AdaptiveUniverse;
 let tree=h.render(Universe);const html=renderToStaticMarkup(tree);assert.ok(html.includes(adaptiveHomeCopy[locale].writingUnavailable));assert.ok(html.includes('id="universe-search"'));assert.ok(!html.includes("source=\"demo\""));
 const input=nodes(tree).find(node=>node.props.id==="universe-search")!;(input.props.onChange as (e:unknown)=>void)({target:{value:"lebe"}});
 tree=h.render(Universe);assert.equal(nodes(tree).find(node=>node.props.id==="universe-search")!.props.value,"lebe");
 // A supported content selection opens Focus without rewriting the shared query.
 query="";tree=h.render(Universe);const card=nodes(tree).find(node=>node.props["data-space-node"]!==undefined)!;(card.props.onClick as ()=>void)();tree=h.render(Universe);assert.ok(nodes(tree).some(node=>node.props.id==="universe-detail"));assert.equal(query,"");h.unmount();
});

for(const locale of locales)test(`welcome keyboard, recommendation dismissal and nonmodal focus ownership: ${locale}`,()=>{
 const h=hookHarness(),gate=createWelcomeGate(),store=memoryStorage(),listeners=new Map<string,(event:unknown)=>void>();let focusCount=0;
 const body={closest:()=>null},outside={closest:()=>null},inside={closest:()=>null};
 const doc={querySelector:()=>null,body,activeElement:inside,addEventListener:(name:string,fn:(event:unknown)=>void)=>listeners.set(name,fn),removeEventListener:(name:string)=>listeners.delete(name),getElementById:()=>({focus:()=>focusCount++})};
 const win={localStorage:store,location:{hash:""},addEventListener:()=>{},removeEventListener:()=>{},dispatchEvent:()=>true};
 const Welcome=loadSource<{DailyWelcome:(props:{dateKey:string})=>React.ReactElement<Record<string,unknown>>|null}>("components/home/daily-welcome.tsx",{
 "react/jsx-runtime":jsxRuntime,"react":{...h.hooks,useSyncExternalStore:(_:unknown,snapshot:()=>boolean)=>snapshot()},"next/link":{__esModule:true,default:"a"},
 "@/components/i18n/locale-context":{useLocale:()=>locale},"@/components/quotes/quote-experience":{QuoteExperience:()=>React.createElement("span")},
 "@/data/i18n/adaptive-home":{adaptiveHomeCopy},"@/lib/home-welcome":{welcomeGate:gate},"@/lib/i18n/routing":{localizeHref:(href:string,l:string)=>l==="de"?href:`/${l}${href}`},"./daily-welcome.module.css":{__esModule:true,default:{}},
 },{window:win,document:doc,Event}).DailyWelcome;
 const render=()=>h.render(()=>Welcome({dateKey:"2026-11-13"}));const tree=render()!;
 assert.equal(tree.props["aria-modal"],"false");assert.equal(doc.activeElement,inside,"arrival never captures focus");
 (tree.props.ref as {current:unknown}).current={contains:(element:unknown)=>element===inside};
 const event=(target:unknown)=>({key:"Escape",target,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}});
 listeners.get("keydown")!(event(outside));assert.ok(render(),"unrelated controls keep Escape");
 listeners.get("keydown")!(event({closest:()=>({})}));assert.ok(render(),"nested modal keeps Escape");
 const close=nodes(tree).find(node=>node.props["aria-label"]===adaptiveHomeCopy[locale].close)!;(close.props.onClick as ()=>void)();assert.equal(render(),null);assert.equal(focusCount,1);assert.equal(store.values.size,1);h.unmount();
});

test("life aliases and progressive alias suggestions lead to the actual public Life Alignment overview",()=>{
 for(const query of ["lebe","leben","life","Lebensausrichtung"])assert.equal(discoverItems(discoveryIndex,query)[0]?.item.id,"tool-life-alignment",query);
 const progressive=discoverItems(discoveryIndex,"lebe")[0];assert.equal(progressive.presentation,"suggestion");assert.ok(progressive.score<100);
});

test("Universe handoff acknowledges an already committed home anchor but never a cancelled or modified navigation",()=>{
 const click={button:0,defaultPrevented:false,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false};
 assert.equal(canHandoffUniverseLink(click,"/#building","https://btshq.online/"),true);
 const intercepted={...click,defaultPrevented:true};
 assert.equal(canHandoffUniverseLink(intercepted,"/#building","https://btshq.online/#building"),true);
 assert.equal(canHandoffUniverseLink(intercepted,"/#building","https://btshq.online/"),false);
 assert.equal(canHandoffUniverseLink(intercepted,"/writing","https://btshq.online/writing"),false);
 for(const key of ["metaKey","ctrlKey","shiftKey","altKey"])assert.equal(canHandoffUniverseLink({...click,[key]:true},"/#building","https://btshq.online/#building"),false);
 assert.equal(canHandoffUniverseLink({...click,button:1},"/#building","https://btshq.online/#building"),false);
 assert.equal(canHandoffUniverseLink(click,"https://other.test","https://btshq.online/"),false);
});

test("public project development status is not mistaken for unpublished content; genuine long-form pages remain reachable",()=>{
 const all=content.publicUniverse(discoveryIndex,"de");
 for(const id of ["project-ratecom","project-hobbyswap","project-streamory","project-byc","page-brain-manual"]){const original=discoveryIndex.find(item=>item.id===id)!;const item=all.find(item=>item.id===id);assert.ok(item,id);assert.equal(item.href,original.href);assert.equal(item.status,original.status);}
 const page=discoveryIndex.find(item=>item.id==="page-writing")!;assert.equal(content.universeItem({...page,id:"draft",status:"Coming Soon",href:"/writing/not-published"},"de"),null);
});
test("destination deduplication happens after ranking, so a weaker indexed alias cannot hide the best public result",()=>{
 const base=discoveryIndex.find(item=>item.id==="page-interviews")!;
 const records=[{...base,id:"earlier-format",title:"Conversation format"},{...base,id:"exact-title",title:"People"}];
 const catalog=content.publicUniverse(records,"en"),ranked=discoverItems(records,"People"),resolved=content.universeMatches(catalog,ranked,"People");
 assert.equal(resolved.length,1);assert.equal(resolved[0].item.id,"exact-title");assert.equal(resolved[0].item.href,"/people");
 assert.deepEqual(content.relatedUniverseItems(catalog[0],catalog),[],"same destination is never a contextual self-link");
});

test("generic content categories are never presented as meaningful contextual relationships",()=>{
 const all=content.publicUniverse(discoveryIndex,"de"),writing=all.find(item=>item.id==="page-writing")!,home=all.find(item=>item.id==="page-home")!;
 assert.deepEqual(content.sharedUniverseTopics(writing,home),[]);
 const a={...home,id:"a",href:"/about",topics:["Pages","Recruiting"]},b={...writing,id:"b",href:"/writing",topics:["Pages","Recruiting"]};
 assert.deepEqual(content.sharedUniverseTopics(a,b),["Recruiting"]);
});

test("Writing aliases reuse verified source-language canonical metadata before destination deduplication",()=>{
 const original=discoveryIndex.find(item=>item.id==="page-writing")!;
 const article={...original,id:"writing-public-fixture",title:"A public source",href:"/en/writing/source-fixture",contentLanguage:"en" as const};
 const pulse={...original,id:"pulse-writing-fixture",title:"A public source",href:"/writing/source-fixture"};
 const catalog=content.publicUniverse([pulse,article],"de");
 assert.equal(catalog.every(item=>item.href==="/en/writing/source-fixture" && item.language==="en"),true);
 assert.equal(content.universeMatches(catalog,discoverItems([pulse,article],"A public source"),"A public source").length,1);
 assert.equal(content.publicUniverse([{...pulse,status:"Coming Soon"},article],"de").length,1);
});

test("KI resolves the documented AI concept ahead of a weaker person's name prefix",()=>{
 const catalog=content.publicUniverse(discoveryIndex,"de");
 const matches=content.universeMatches(catalog,discoverItems(discoveryIndex,"KI"),"KI");
 assert.equal(matches[0]?.item.id,"page-about");
 assert.equal(matches[0]?.presentation,"match");
 const namePrefix=matches.find(match=>match.item.href==="/people/kiki-radicke");
 assert.ok(namePrefix && matches[0].score>namePrefix.score);
 assert.equal(namePrefix.presentation,"suggestion");
});
