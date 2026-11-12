import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import {renderToStaticMarkup} from "react-dom/server";
import {identityContent,identityCopy,identityDirections,identityDirection} from "../data/visual-identity-lab";
import {locales} from "../lib/i18n/config";
import {localizeHref} from "../lib/i18n/routing";
import {loadSource} from "./helpers/load-source";

const View=loadSource<{VisualIdentityLab:(props:Record<string,unknown>)=>React.ReactElement}>("components/visual-identity-lab/visual-identity-lab.tsx",{
 "react/jsx-runtime":jsxRuntime,
 "next/link":{__esModule:true,default:(props:Record<string,unknown>)=>{const safe={...props};delete safe.prefetch;return React.createElement("a",safe);}},
 "next/image":{__esModule:true,default:(props:Record<string,unknown>)=>{const safe={...props};delete safe.fill;delete safe.unoptimized;return React.createElement("img",safe);}},
 "@/data/visual-identity-lab":{identityContent,identityCopy,identityDirections},
 "@/lib/i18n/routing":{localizeHref},
 "./visual-identity-lab.module.css":{__esModule:true,default:new Proxy({},{get:(_o,key)=>String(key)})},
}).VisualIdentityLab;

test("all 21 static studies retain localized meaning, native direction navigation and actual public destinations",()=>{
 for(const locale of locales)for(const direction of identityDirections){
  const html=renderToStaticMarkup(View({locale,direction:direction.id})),content=identityContent(locale);
  assert.equal((html.match(/<h1 /g)||[]).length,1);
  assert.match(html,/data-identity-search/);assert.match(html,/role="img"/);
  assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
  assert.ok(html.includes(identityCopy[locale].staticSearch));
  for(const d of identityDirections)assert.ok(html.includes(localizeHref("/experience-lab/identity?direction="+d.id,locale)));
  for(const href of [content.writing,content.tool])assert.ok(html.includes('href="'+href+'"'));
  if(content.person){assert.ok(html.includes(content.person.name));assert.ok(html.includes('href="'+content.person.href+'"'));}
  if(direction.id==="c")assert.ok(html.includes('href="'+content.world+'"'));
  else if(content.project)assert.ok(html.includes(content.project.name));
  assert.doesNotMatch(html,/<form|<input|<button|<script|onClick=|role="combobox"|href="https?:/i,"static search does not pretend to submit, rank or track input");
 }
});

test("direction parsing accepts only the three reviewed scenes and cannot reflect arbitrary query data",()=>{
 for(const value of [undefined,null,"",["b"],{},"https://private.invalid/",'b\" onload=bad',"B","d"])assert.equal(identityDirection(value),"a");
 assert.equal(identityDirection("b"),"b");assert.equal(identityDirection("c"),"c");
});

test("absent approved people or projects do not manufacture substitute records",()=>{
 const adapter=loadSource<{identityContent:typeof identityContent}>("data/visual-identity-lab.ts",{
  "@/data/projects":{projects:[]},"@/data/i18n/people":{getLocalizedPublishedSpotlights:()=>[]},"@/lib/i18n/routing":{localizeHref},
 }).identityContent;
 for(const locale of locales){const value=adapter(locale);assert.equal(value.person,null);assert.equal(value.project,null);assert.equal(value.writing,localizeHref("/writing",locale));}
});

test("static route fails closed before locale, query or content work outside authorized lab environments",async()=>{
 for(const env of [{VERCEL_ENV:"production"},{VERCEL_ENV:"unknown"},{NODE_ENV:"production"}]){
  const page=loadSource<{default:(props:unknown)=>Promise<unknown>}>("app/experience-lab/identity/page.tsx",{
   "react/jsx-runtime":jsxRuntime,"next/navigation":{notFound:()=>{throw new Error("LAB_NOT_FOUND");}},
   "@/components/visual-identity-lab/visual-identity-lab":{VisualIdentityLab:()=>{throw new Error("Should not render");}},
   "@/data/visual-identity-lab":{identityDirection:()=>{throw new Error("Should not parse");}},
   "@/lib/i18n/server":{getLocale:()=>{throw new Error("Should not resolve locale");}},
   "@/lib/i18n/metadata":{createLocalizedMetadata:()=>({})},
  },{process:{env}});
  await assert.rejects(page.default({get searchParams(){throw new Error("Should not read query");}}),/LAB_NOT_FOUND/);
 }
});

test("static studies cannot import adaptive search, motion, persistence or tracking and keep noindex metadata",()=>{
 const files=["components/visual-identity-lab/visual-identity-lab.tsx","data/visual-identity-lab.ts","app/experience-lab/identity/page.tsx"];
 for(const file of files)assert.doesNotMatch(readFileSync(file,"utf8"),/use client|useEffect|useState|experience-lab\/search|startLabMotion|requestAnimationFrame|fetch\(|sendBeacon|localStorage|sessionStorage|supabase/);
 assert.match(readFileSync(files[2],"utf8"),/index:false,follow:false/);
 for(const file of ["app/sitemap.ts","components/layout/header.tsx","data/discovery-index.ts"])assert.doesNotMatch(readFileSync(file,"utf8"),/experience-lab/);
});


test("content imagery cannot acquire grayscale, color mixing or destructive image filters in the static study",()=>{
 const css=readFileSync("components/visual-identity-lab/visual-identity-lab.module.css","utf8");
 assert.doesNotMatch(css,/grayscale\(|saturate\(|mix-blend-mode/);
 assert.doesNotMatch(css,/(?:^|[;{])filter:/m);
 assert.doesNotMatch(css,/\.toolImage::after/);
});
