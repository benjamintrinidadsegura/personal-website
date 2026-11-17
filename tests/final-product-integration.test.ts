import assert from 'node:assert/strict';
import {test} from 'node:test';
import {discoveryIndex,createPublishedWritingDiscoveryItems} from '../data/discovery-index';
import {localizeDiscoveryItems} from '../data/i18n/discovery';
import {locales} from '../lib/i18n/config';
import {publicUniverse,universeMatches,curatedUniverseMatches,curatedEntryLimit} from '../lib/discovery-universe/content';
import {discoverItems} from '../lib/discovery';
import type {PublicWritingSummary} from '../types/writing';
const article:PublicWritingSummary={id:'public-fixture',slug:'public-fixture',title:'Explicit synthetic public fixture',excerpt:'Public summary fixture',deck:'Public fixture',contentType:'essay',topics:['Ideas'],publishedAt:'2026-11-17T00:00:00Z',readingMinutes:3,language:'en',sourceLanguage:'en',availableLanguages:['en'],translationStatus:'fallback'};
for(const locale of locales)test(`deterministic public variety, diversity and full catalog: ${locale}`,()=>{
 const localized=localizeDiscoveryItems([...discoveryIndex,...createPublishedWritingDiscoveryItems([article])],locale),catalog=publicUniverse(localized,locale),all=universeMatches(catalog,[],'');
 const original=JSON.stringify(all);assert.ok(all.length>curatedEntryLimit);
 const initial=curatedUniverseMatches(all,article.id);assert.equal(initial.length,7);assert.equal(initial[0].item.id,'writing-public-fixture');
 let previous=initial.map(m=>m.item.href).sort().join('|');const people=new Set<string>();
 for(let round=1;round<=100;round++){
  const selection=curatedUniverseMatches(all,article.id,round);assert.deepEqual(selection,curatedUniverseMatches(all,article.id,round));assert.equal(selection.length,7);assert.equal(new Set(selection.map(m=>m.item.href)).size,7);
  const set=selection.map(m=>m.item.href).sort().join('|');assert.notEqual(set,previous,'deliberate refresh changes membership');previous=set;
  assert.ok(new Set(selection.map(m=>m.item.kind)).size>=5);assert.ok(selection.every(m=>all.some(a=>a.item.id===m.item.id)&&m.score===0));
  for(const m of selection.filter(m=>m.item.kind==='person'))people.add(m.item.href);
 }
 assert.ok(people.size>=3);assert.equal(JSON.stringify(all),original);
 const outside=all.find(m=>!initial.some(c=>c.item.href===m.item.href))!;const chosen=curatedUniverseMatches(all,article.id,0,outside.item.id);assert.equal(chosen[0].item.id,outside.item.id);assert.equal(chosen.length,7);
 assert.equal(curatedUniverseMatches(all,article.id,0,'private-invitation')[0].item.id,initial[0].item.id);
 for(const query of ['KI','AI','Kiki','Karriere','Recruiting','Familie','Friendship','Career','Team','Founder','Life Alignment','Evgeny','World Map','EchoWall','Writing']){
  const ranked=discoverItems(localized,query),resolved=universeMatches(catalog,ranked,query);assert.ok(resolved.length,query);assert.equal(new Set(resolved.map(m=>m.item.href)).size,resolved.length);
 }
});
test('empty and withdrawn collection never fabricate a Writing recommendation',()=>{
 assert.deepEqual(curatedUniverseMatches([],article.id,10),[]);
 const item=discoveryIndex.find(i=>i.id==='tool-life-alignment')!;
 const unsafe=[{...item,id:'private',href:'/life-alignment/relationship/invite/private'},{...item,id:'withdrawn',href:'/writing/withdrawn',status:'Coming Soon' as const}];
 const all=universeMatches(publicUniverse([...discoveryIndex,...unsafe],'de'),[],'');
 for(const round of [0,1,2,100])assert.ok(curatedUniverseMatches(all,article.id,round).every(m=>m.item.id!=='withdrawn'&&m.item.id!=='private'&&m.item.kind!=='writing'));
 assert.equal(curatedUniverseMatches(all,undefined,NaN).length,7);
});
import * as React from 'react';
import * as runtime from 'react/jsx-runtime';
import {hookHarness} from './helpers/hook-harness';
import {loadSource} from './helpers/load-source';
import * as content from '../lib/discovery-universe/content';
import * as space from '../lib/discovery-universe/space';
import {adaptiveHomeCopy} from '../data/i18n/adaptive-home';
import {getDiscoveryUiCopy,getGuidedDiscoveryPrompts} from '../data/i18n/discovery';
import {canHandoffUniverseLink} from '../lib/discovery-universe/navigation';
function nodes(value:React.ReactNode):React.ReactElement<Record<string,unknown>>[]{if(Array.isArray(value))return value.flatMap(nodes);if(!React.isValidElement<Record<string,unknown>>(value))return [];return[value,...nodes(value.props.children as React.ReactNode)];}
for(const locale of locales)test(`refresh, reset and complete-list Focus preserve search and catalog: ${locale}`,()=>{
 const h=hookHarness(),items=localizeDiscoveryItems(discoveryIndex,locale);let query='';
 const Universe=loadSource<{AdaptiveUniverse:()=>React.ReactElement<Record<string,unknown>>}>('components/home/universe/adaptive-universe.tsx',{
 'react/jsx-runtime':runtime,'react':{...h.hooks,useLayoutEffect:h.hooks.useEffect},'next/link':{__esModule:true,default:'a'},
 '@/components/discovery/discovery-results':{DiscoveryNavigationStatus:()=>null},'@/components/i18n/locale-context':{useLocale:()=>locale},'@/components/discovery/discovery-context':{useDiscovery:()=>({items,query,matches:discoverItems(items,query),setQuery:(v:string)=>{query=v;},writingStatus:'unavailable'})},
 '@/data/i18n/adaptive-home':{adaptiveHomeCopy},'@/data/i18n/discovery':{getDiscoveryUiCopy,getGuidedDiscoveryPrompts},'@/lib/discovery-universe/navigation':{canHandoffUniverseLink},'@/lib/discovery-universe/content':content,'@/lib/discovery-universe/space':space,'@/lib/discovery-universe/motion':{startUniverseMotion:()=>assert.fail('No DOM in controller fixture')},'./island-visual':{IslandVisual:()=>null},'./universe.module.css':{__esModule:true,default:new Proxy({},{get:(_,k)=>String(k)})},
 },{document:{querySelector:()=>null}}).AdaptiveUniverse;
 let tree=h.render(Universe);const pick=(key:string)=>nodes(tree).find(n=>n.props[key]!==undefined)!;const visible=()=>nodes(tree).filter(n=>n.props['data-visible']===true).map(n=>n.props['data-universe-card']);
 const first=visible();assert.ok(nodes(pick('data-universe-list')).filter(n=>n.type==='li').length>7);
 (pick('data-curated-refresh').props.onClick as ()=>void)();tree=h.render(Universe);assert.equal(tree.props['data-curation-round'],1);assert.notDeepEqual(visible(),first);assert.equal(query,'');
 const resetButton=pick('data-curated-reset');(resetButton.props.onClick as ()=>void)();tree=h.render(Universe);assert.equal(tree.props['data-curation-round'],0);assert.deepEqual(visible(),first);
 const list=pick('data-universe-list'),last=nodes(list).filter(n=>n.type==='button').at(-1)!;(last.props.onClick as ()=>void)();tree=h.render(Universe);assert.ok(nodes(tree).some(n=>n.props.id==='universe-detail'));
 const input=nodes(tree).find(n=>n.props.id==='universe-search')!;assert.equal(typeof input.props.onFocus,'function');(input.props.onFocus as ()=>void)();(input.props.onChange as (e:unknown)=>void)({target:{value:'KI'}});tree=h.render(Universe);assert.equal(query,'KI');assert.ok(!nodes(tree).some(n=>n.props['data-curated-refresh']!==undefined));assert.ok(!nodes(tree).some(n=>n.props.id==='universe-detail'));
 h.unmount();
});


test('long compact captions reserve enough room on each side of the centred lens',()=>{
 assert.equal(space.compactContentRoomHeight(139,148),640);
 assert.equal(space.compactContentRoomHeight(105,148),640);
 assert.ok(space.compactContentRoomHeight(210,148)>640);
});
