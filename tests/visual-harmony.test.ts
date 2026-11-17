import assert from 'node:assert/strict';
import {test} from 'node:test';
import {connectionAnchor,universeConnection,composeUniverseSpace} from '../lib/discovery-universe/space';
import {publicUniverse,universeMatches,curatedUniverseMatches} from '../lib/discovery-universe/content';
import {createDiscoveryItemsWithWriting} from '../data/discovery-index';
import {localizeDiscoveryItems} from '../data/i18n/discovery';
import {locales} from '../lib/i18n/config';

test('relationship docks and their monotone curves clear the complete search controls and painted object text',()=>{
 const source={x:720,y:420,width:420,height:220};
 for(const item of [{x:260,y:180,width:300,height:320},{x:1160,y:230,width:300,height:290},{x:1140,y:710,width:300,height:220},{x:270,y:730,width:260,height:220}]){
  const start=connectionAnchor(item,source,source.width,source.height),end=connectionAnchor(source,item,item.width,item.height);
  const values=universeConnection(start,end).match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  const inside=(p:{x:number;y:number},b:typeof source)=>Math.abs(p.x-b.x)<b.width/2&&Math.abs(p.y-b.y)<b.height/2;
  for(let i=0;i<=100;i++){
   const t=i/100,u=1-t,p={x:u**3*values[0]+3*u*u*t*values[2]+3*u*t*t*values[4]+t**3*values[6],y:u**3*values[1]+3*u*u*t*values[3]+3*u*t*t*values[5]+t**3*values[7]};
   assert.equal(inside(p,source),false);assert.equal(inside(p,item),false);
  }
 }
});

for(const locale of locales)test(`arrival hierarchy preserves indexed content, mobile slots and search ordering: ${locale}`,()=>{
 const all=universeMatches(publicUniverse(localizeDiscoveryItems(createDiscoveryItemsWithWriting([]),locale),locale),[],'');
 for(let round=0;round<=5;round++){
  const matches=curatedUniverseMatches(all,undefined,round),before=JSON.stringify(matches),id=matches[0].item.id;
  const arrival=composeUniverseSpace(matches,id,false,'atlas','discovery'),search=composeUniverseSpace(matches.slice(0,4),id,false,'atlas','search');
  assert.deepEqual(arrival.nodes.map(n=>n.item.id),search.nodes.map(n=>n.item.id));
  assert.deepEqual(arrival.nodes.map(n=>n.compact),search.nodes.map(n=>n.compact));
  assert.notEqual(arrival.nodes[0].desktop.y,arrival.nodes[1].desktop.y);
  assert.equal(search.nodes[1].desktop.y,215,'authoritative search composition stays unchanged');
  assert.equal(JSON.stringify(matches),before);
 }
});

// Exercise the real motion controller: reused mask, intermediate movement and no frame-time layout reads.
import {loadSource} from './helpers/load-source';
import * as geometry from '../lib/discovery-universe/space';
import * as choreography from '../lib/discovery-universe/choreography';
import type {UniverseMotion} from '../lib/discovery-universe/motion';
import type {MotionPoint} from '../lib/discovery-universe/space';
test('connection occlusion follows motion, reuses one mask across queries and avoids animation-frame layout reads',()=>{
 class SvgNode {
  attrs=new Map<string,string>(); children:SvgNode[]=[];parentElement:SvgNode|null=null;style:Record<string,string>={};id='';
  setAttribute(k:string,v:string){this.attrs.set(k,v);}getAttribute(k:string){return this.attrs.get(k);}
  append(...nodes:SvgNode[]){for(const node of nodes){node.parentElement=this;this.children.push(node);}}
  prepend(node:SvgNode){node.parentElement=this;this.children.unshift(node);}
  querySelector():SvgNode|null{if(this.attrs.has('data-connection-ink'))return this;for(const child of this.children){const found=child.querySelector();if(found)return found;}return null;}
 }
 let time=0,layoutReads=0,next=0;const frames=new Map<number,FrameRequestCallback>();
 const style=()=>({setProperty(){},transform:''}),path=new SvgNode(),svg=Object.assign(new SvgNode(),{ownerDocument:{createElementNS:()=>new SvgNode()}});
 const matches=universeMatches(publicUniverse(createDiscoveryItemsWithWriting([]),'en'),[],'').slice(0,1),id=matches[0].item.id;
 const button={get offsetWidth(){layoutReads++;return 220;},get offsetHeight(){layoutReads++;return 160;},children:[],getBoundingClientRect:()=>{layoutReads++;return{left:0,top:0,width:220,height:160};},querySelectorAll:()=>[]};
 const element={dataset:{universeObject:id},style:style(),querySelector:()=>button};
 const lens={getBoundingClientRect:()=>({left:400,top:200,width:400,height:76})};
 const center={style:style(),getBoundingClientRect:lens.getBoundingClientRect};
 const root={dataset:{},style:style(),getBoundingClientRect:()=>({left:0,top:0,width:1200,height:760}),querySelectorAll:()=>[element],
  querySelector:(selector:string)=>selector.includes('data-search-lens')?lens:selector.includes('data-search-center')?center:selector.includes('data-space-strings')?svg:path};
 const {startUniverseMotion}=loadSource<{startUniverseMotion:(root:unknown,scene:ReturnType<typeof composeUniverseSpace>,memory:Map<string,MotionPoint>)=>UniverseMotion}>('lib/discovery-universe/motion.ts',{
  './space':geometry,'./choreography':{...choreography,canAnimateFlights:()=>true}}, {
  matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),ResizeObserver:class{observe(){}disconnect(){}},
  performance:{now:()=>time},requestAnimationFrame:(callback:FrameRequestCallback)=>{frames.set(++next,callback);return next;},cancelAnimationFrame:(id:number)=>frames.delete(id),window:undefined,
 });
 const scene=composeUniverseSpace(matches,id),memory=new Map<string,MotionPoint>();scene.nodes[0].desktop={x:20,y:120,scale:1};
 startUniverseMotion(root,scene,memory).stop();const mask=svg.querySelector()!,original=mask.getAttribute('d');
 const moved={...scene,nodes:scene.nodes.map(node=>({...node,desktop:{...node.desktop,y:200}}))};
 const current=startUniverseMotion(root,moved,memory),before=layoutReads;
 time=80;const pending=[...frames.values()];frames.clear();for(const callback of pending)callback(time);
 assert.equal(layoutReads,before);assert.notEqual(mask.getAttribute('d'),original);assert.match(mask.getAttribute('d')!,/^M/);
 assert.equal(svg.children.length,1);assert.equal(svg.querySelector(),mask);assert.equal(path.getAttribute('mask'),'url(#'+mask.parentElement!.id+')');
 current.stop();assert.equal(frames.size,0);
});
