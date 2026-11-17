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
import { locales } from "../lib/i18n/config";
import { loadSource } from "./helpers/load-source";
import { hookHarness } from "./helpers/hook-harness";

function nodes(value:React.ReactNode):React.ReactElement<Record<string,unknown>>[]{if(Array.isArray(value))return value.flatMap(nodes);if(!React.isValidElement<Record<string,unknown>>(value))return [];return [value,...nodes(value.props.children as React.ReactNode)];}
for(const locale of locales)test(`return from a full-list result preserves its current query and selected visible target: ${locale}`,()=>{
 const h=hookHarness();let query="";const items=localizeDiscoveryItems(discoveryIndex,locale);
 const Universe=loadSource<{AdaptiveUniverse:()=>React.ReactElement<Record<string,unknown>>}>("components/home/universe/adaptive-universe.tsx",{
 "react/jsx-runtime":jsxRuntime,"react":{...h.hooks,useLayoutEffect:h.hooks.useEffect},"next/link":{__esModule:true,default:"a"},
 "@/components/discovery/discovery-results":{DiscoveryNavigationStatus:()=>null,isUnmodifiedPrimaryClick:()=>false},
 "@/components/i18n/locale-context":{useLocale:()=>locale},"@/components/discovery/discovery-context":{useDiscovery:()=>({items,query,matches:discoverItems(items,query),setQuery:(value:string)=>{query=value;},writingStatus:"unavailable"})},
 "@/data/i18n/adaptive-home":{adaptiveHomeCopy},"@/data/i18n/discovery":{getDiscoveryUiCopy,getGuidedDiscoveryPrompts},"@/lib/discovery-universe/navigation":{canHandoffUniverseLink},"@/lib/discovery-universe/content":content,"@/lib/discovery-universe/space":space,"@/lib/discovery-universe/motion":{startUniverseMotion:()=>assert.fail("No DOM in component fixture")},"./island-visual":{IslandVisual:()=>React.createElement("span")},"./universe.module.css":{__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})},
 },{document:{querySelector:()=>null}}).AdaptiveUniverse;

 query="Life Alignment";let tree=h.render(Universe);
 const all=content.universeMatches(content.publicUniverse(items,locale),discoverItems(items,query),query);
 const expected=all.at(-1)!.item.id;
 assert.equal(nodes(tree).find(node=>node.props["data-universe-object"]===expected)!.props["data-visible"],false,"fixture selects a result outside the current constellation");
 const list=nodes(tree).find(node=>node.props["data-universe-list"]!==undefined)!;
 const choose=nodes(list).filter(node=>node.type==="button").at(-1)!;
 (choose.props.onClick as ()=>void)();tree=h.render(Universe);
 assert.ok(nodes(tree).some(node=>node.props.id==="universe-detail"));
 (tree.props.onKeyDown as (event:unknown)=>void)({key:"Escape",defaultPrevented:false,preventDefault(){}});
 tree=h.render(Universe);
 assert.equal(query,"Life Alignment");
 assert.equal(nodes(tree).some(node=>node.props.id==="universe-detail"),false);
 const selected=nodes(tree).find(node=>node.props["data-selected"]===true)!;
 assert.equal(selected.props["data-universe-object"],expected);
 assert.equal(selected.props["data-visible"],true);
 h.unmount();
});
