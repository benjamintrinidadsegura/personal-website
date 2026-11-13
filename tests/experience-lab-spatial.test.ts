import assert from "node:assert/strict";
import {test} from "node:test";
import {createLabCatalog} from "../data/experience-lab/catalog";
import {createLabSearch} from "../lib/experience-lab/search";
import {composeLabSpace,dragSelection,dragStride} from "../lib/experience-lab/space";
import {locales} from "../lib/i18n/config";

for(const locale of locales) test(`reference-driven composition preserves every ranked result in ${locale}`,()=>{
 const search=createLabSearch(createLabCatalog(locale));
 const fingerprints=new Set<string>();
 for(const query of ["KI Recruiting","AI","Tools","Community","Karriere",""]){
  const matches=search(query),before=JSON.stringify(matches);
  const scene=composeLabSpace(matches,matches[0].item.id);
  fingerprints.add(JSON.stringify(scene.nodes.map(node=>node.desktop)));
  assert.deepEqual(scene.nodes.map(node=>node.item.id),matches.slice(0,6).map(match=>match.item.id));
  assert.deepEqual(composeLabSpace(matches,matches[0].item.id),scene);
  for(const node of scene.nodes){
   assert.ok(node.scale>=.5&&node.scale<=1);
   assert.ok(node.compactScale>=.48&&node.compactScale<=1);
   const focus=composeLabSpace(matches,node.item.id,true);
   assert.ok(focus.nodes.every(n=>n.item===matches.find(m=>m.item.id===n.item.id)!.item));
  }
  assert.equal(JSON.stringify(matches),before);
 }
 assert.equal(fingerprints.size,6,"one, two, three, four, five and dense results have deliberate compositions");
});

test("direct manipulation is displacement-bounded and reversible at every required width",()=>{
 for(const width of [320,390,768,1280,1440]){
  const stride=dragStride(width);
  assert.ok(stride>=180&&stride<=300);
  assert.equal(dragSelection(-stride*.31,width,2,11),2);
  assert.equal(dragSelection(-stride*.5,width,2,11),3);
  assert.equal(dragSelection(stride*.5,width,2,11),1);
  assert.equal(dragSelection(0,width,2,11),2);
  assert.equal(dragSelection(stride*100,width,0,11),0);
  assert.equal(dragSelection(-stride*100,width,10,11),10);
  assert.equal(dragSelection(-stride,width,0,1),0);
 }
});

test("supported relationship neighborhoods retain actual score differentiation",()=>{
 const matches=createLabSearch(createLabCatalog("en"))("Karriere"),copy=structuredClone(matches);
 const base=composeLabSpace(matches,matches[0].item.id);
 const lower=matches.find((match,i)=>i>0 && match.score<matches[0].score)!;
 const raised=matches.map(match=>match===lower?{...match,score:matches[0].score}:match);
 const next=composeLabSpace(raised,matches[0].item.id);
 assert.ok(next.nodes.find(n=>n.item.id===lower.item.id)!.scale>base.nodes.find(n=>n.item.id===lower.item.id)!.scale);
 assert.deepEqual(matches,copy,"visual weighting cannot write into index results");
 assert.deepEqual(next.nodes.map(n=>n.item.id),base.nodes.map(n=>n.item.id));
});
