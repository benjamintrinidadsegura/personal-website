import assert from 'node:assert/strict';
import {test} from 'node:test';
import {discoveryIndex,createPublishedWritingDiscoveryItems} from '../data/discovery-index';
import {getDiscoveryUiCopy,localizeDiscoveryItems} from '../data/i18n/discovery';
import {discoverItems,normalizeSearchText} from '../lib/discovery';
import {publicUniverse,universeMatches,universeItem} from '../lib/discovery-universe/content';
import type {DiscoveryItem} from '../types/discovery';
const item=(id:string,overrides:Partial<DiscoveryItem>={}):DiscoveryItem=>({id,title:id,description:'Public record',group:'Pages',category:'Page',tags:[],keywords:[],status:'Live',href:'/about',...overrides});
const locales=['de','en','es','tr','pl','el','ru'] as const;
for(const locale of locales)test(`grounded acronyms, entities and separated counts in ${locale}`,()=>{
 const items=localizeDiscoveryItems(discoveryIndex,locale),catalog=publicUniverse(items,locale);
 for(const query of ['KI','ki','AI','ai','KI!']){
  const ranked=discoverItems(items,query),visible=universeMatches(catalog,ranked,query);
  assert.equal(visible[0]?.item.href,(locale==='de'?'':'/'+locale)+'/about');
  assert.equal(visible.length,1);assert.equal(visible[0].presentation,'match');
  assert.ok(ranked.every(m=>m.reasons.some(r=>normalizeSearchText(r.value).split(' ').includes('ai'))));
  assert.equal(ranked.some(m=>m.item.title==='Kiki Radicke'),false);
 }
 const kiki=universeMatches(catalog,discoverItems(items,'Kiki'), 'Kiki');
 assert.ok(kiki[0]?.item.href.endsWith('/people/kiki-radicke'));
 const people=discoverItems(items,'Menschen');assert.ok(people[0]?.item.group==='People');
 const copy=getDiscoveryUiCopy(locale),prefix=discoverItems(items,'K');assert.ok(prefix.length>0&&prefix.length<=6);
 assert.ok(prefix.every(x=>x.presentation==='suggestion'));
 assert.ok(!copy.resultSummary(prefix).includes(copy.count(prefix.length)));
 assert.equal(copy.resultSummary(prefix),`${copy.presentationLabels.suggestion} · ${prefix.length}`);
});
test('explicit AI topics beat incidental fragments and secondary keywords; exact named entities stay first',()=>{
 const fixture=[item('Kiki Radicke'),item('Aidan'),item('Cobalt',{description:'painting and hiking'}),item('Profile',{keywords:['AI-assisted reflection']}),item('Article',{tags:['AI']}),item('AI')];
 for(const q of ['AI','KI']){
  const r=discoverItems(fixture,q);assert.deepEqual(r.map(x=>x.item.id),['AI','Article','Profile']);
  assert.ok(r[0].score>r[1].score&&r[1].score>r[2].score);
 }
 assert.equal(discoverItems(fixture,'Kiki')[0]?.item.id,'Kiki Radicke');
 assert.equal(discoverItems([fixture[0],fixture[1],fixture[2]],'KI').length,0);
});
test('only actual supplied published Writing can add AI article coverage; canonical language survives',()=>{
 const records=createPublishedWritingDiscoveryItems([{id:'synthetic-test-only',slug:'controlled-public-ai',title:'AI',deck:'Controlled test fixture',excerpt:'Not real content',contentType:'essay',topics:['AI'],publishedAt:'2026-01-01T00:00:00Z',readingMinutes:1,language:'en',sourceLanguage:'en',availableLanguages:['en'],translationStatus:'source'}]);
 const localized=localizeDiscoveryItems([...discoveryIndex,...records],'tr');
 const r=universeMatches(publicUniverse(localized,'tr'),discoverItems(localized,'KI'),'KI');
 assert.equal(r[0].item.href,'/en/writing/controlled-public-ai');assert.equal(r[0].item.language,'en');
 assert.ok(!discoveryIndex.some(x=>x.id.startsWith('writing-')&&x.status!=='Live'));
 const base=records[0];
 for(const href of ['/admin','/account','/life-alignment/invite/private-token','/life-alignment/session/private-id','/api/internal'])assert.equal(universeItem({...base,href},'de'),null);
 assert.equal(universeItem({...base,status:'Coming Soon'},'de'),null);
});
test('multiword complete evidence wins; partial context is honest and bounded only when no complete result exists',()=>{
 const fixture=[item('AI',{tags:['Career']}),item('AI-only',{tags:['AI']}),item('Career-only',{tags:['Career']})];
 const r=discoverItems(fixture,'AI Career');assert.equal(r[0].item.id,'AI');assert.ok(r.every(m=>m.presentation==='match'));
 const partial=discoverItems(fixture.slice(1),'AI Career');assert.ok(partial.length<=3&&partial.every(m=>m.presentation==='related'));
 assert.ok(!partial.some(m=>m.presentation==='match'));
});
test('typo fallback is one edit, explicit metadata, single word and suggestion-only',()=>{
 const fixture=[item('Recruiting'),item('Other',{description:'Recruiting'})];
 for(const q of ['Recruting','Recruitting','Recruixing','Recrutiing']){
  const r=discoverItems(fixture,q);assert.equal(r[0]?.item.id,'Recruiting',q);assert.equal(r[0].presentation,'suggestion');assert.equal(r[0].reasons[0].kind,'typo');
 }
 assert.deepEqual(discoverItems(fixture,'Rcrutng'),[]);assert.deepEqual(discoverItems(fixture,'AI'),[]);
 assert.deepEqual(discoverItems(fixture,'Recruting xyz'),[]);
 assert.equal(discoverItems([item('Recruting'),...fixture],'Recruting')[0].presentation,'match');
});
test('Unicode, punctuation, prefixes, metadata edits and unknown inputs retain deterministic behavior',()=>{
 assert.deepEqual(discoverItems(discoveryIndex,'Stärken').map(m=>m.item.id),discoverItems(discoveryIndex,'Staerken').map(m=>m.item.id));
 assert.equal(normalizeSearchText('  KÜNSTLICHE—Intelligenz! '),'kuenstliche intelligenz');
 for(const q of ['', '!!!','zzqxv999'])assert.deepEqual(discoverItems(discoveryIndex,q),[]);
 const x=item('Mutable',{tags:['AI']});assert.ok(discoverItems([x],'KI').length);x.tags=[];assert.deepEqual(discoverItems([x],'KI'),[]);
});
test('actual public navigation matrix and presentation contract remain useful',()=>{
 const catalog=publicUniverse(discoveryIndex,'de');
 const matrix:Record<string,string>={'Karriere':'/find-your-next-step/career','Recruiting':'/projects/goatrecrutainer','Menschen':'/people/evgeny-vinokurov','lebe':'/life-alignment','leben':'/life-alignment','Life Alignment':'/life-alignment','Writing':'/writing','Evgeny':'/people/evgeny-vinokurov','Benjamin':'/about','World Map':'/world','EchoWall':'/echowall'};
 for(const [query,href] of Object.entries(matrix)){
  const matches=universeMatches(catalog,discoverItems(discoveryIndex,query),query);
  assert.ok(matches.some(m=>m.item.href===href),query);assert.equal(new Set(matches.map(m=>m.item.href)).size,matches.length);
  assert.ok(matches.every(m=>m.presentation&&['match','suggestion','related'].includes(m.presentation)));
 }
});
