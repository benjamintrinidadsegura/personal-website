import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

import { createLabCatalog } from "../data/experience-lab/catalog";
import { labCopy } from "../data/experience-lab/copy";
import { getErrorDictionary } from "../data/i18n/errors";
import { createLabSearch, normalizeLabQuery, relatedLabItems, type LabItem } from "../lib/experience-lab/search";
import * as config from "../lib/i18n/config";
import * as routing from "../lib/i18n/routing";
import * as engine from "../lib/experience-lab/search";
import * as spaceEngine from "../lib/experience-lab/space";
import * as motionEngine from "../lib/experience-lab/motion";
import { focusCopy } from "../data/experience-lab/focus-copy";
import * as contextEngine from "../lib/experience-lab/context";
import { hookHarness } from "./helpers/hook-harness";
import { loadSource } from "./helpers/load-source";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

const catalog = createLabCatalog("en");
const search = createLabSearch(catalog);

test("streaming the Lab keeps the existing seven-locale loading announcement without decorative motion", async () => {
  for (const locale of config.locales) {
    const Loading = loadSource<{ default: () => Promise<React.ReactElement> }>("app/experience-lab/loading.tsx", {
      "react/jsx-runtime": jsxRuntime,
      "@/data/i18n/errors": { getErrorDictionary },
      "@/lib/i18n/server": { getLocale: async () => locale },
    }).default;
    const html = renderToStaticMarkup(await Loading());
    assert.match(html, /role="status" data-navigation-loading/u);
    assert.ok(html.includes(getErrorDictionary(locale).loading));
    assert.doesNotMatch(html, /animate-|autofocus|<script|<input/iu);
  }
});

test("spatial windows keep every result reachable and never fill the room with unrelated content", () => {
  for (let count = 0; count <= catalog.length; count++) {
    const matches = search("").slice(0, count);
    const visited = new Set<string>();
    for (const match of matches) {
      const room = spaceEngine.composeLabSpace(matches, match.item.id);
      assert.ok(room.nodes.length <= 6);
      assert.ok(room.nodes.some(node => node.item.id === match.item.id));
      for (const node of room.nodes) {
        visited.add(node.item.id);
        for (const [point,height] of [[node.desktop,room.height.wide],[node.compact,room.height.compact]] as const) {
          assert.ok(point.x >= 15 && point.x <= 85 && point.y >= 50 && point.y <= height);
          assert.doesNotMatch(spaceEngine.labConnection({ x: 500, y: 250 }, point), /NaN|undefined/);
        }
      }
    }
    assert.equal(visited.size, count);
  }
  const ai = spaceEngine.composeLabSpace(search("AI"), "ai-notes-demo");
  const career = spaceEngine.composeLabSpace(search("Karriere"), "career");
  assert.notDeepEqual(ai.nodes.map(node => node.desktop), career.nodes.map(node => node.desktop));
  assert.equal(spaceEngine.composeLabSpace([], "").nodes.length, 0);
});

test("the real proxy rejects lab documents and Flight requests before streaming in every locale", async () => {
  const saved = { ...process.env };
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
  try {
    for (const environment of ["production", "unknown", undefined]) {
      Object.assign(process.env, { NODE_ENV: "production" });
      if (environment) process.env.VERCEL_ENV = environment; else delete process.env.VERCEL_ENV;
      for (const locale of config.locales) for (const suffix of ["", "/", "/nested"]) for (const flight of [false, true]) {
        const response = await proxy(new NextRequest(`https://lab.invalid/${locale}/experience-lab${suffix}`, {
          headers: flight ? { rsc: "1", referer: "https://lab.invalid/" } : {},
        }));
        assert.equal(response.status, 404);
        assert.equal(response.headers.get("cache-control"), "private, no-store");
        assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
        assert.equal(await response.text(), "Not Found");
      }
    }
    for (const environment of ["preview", "development"]) {
      process.env.VERCEL_ENV = environment;
      const response = await proxy(new NextRequest("https://lab.invalid/en/experience-lab"));
      assert.notEqual(response.status, 404);
    }
    delete process.env.VERCEL_ENV;
    Object.assign(process.env, { NODE_ENV: "development" });
    assert.notEqual((await proxy(new NextRequest("https://lab.invalid/experience-lab"))).status, 404);
    process.env.VERCEL_ENV = "production";
    for (const path of ["/en", "/en/writing", "/en/world", "/en/experience-lab-not-a-route"]) {
      assert.notEqual((await proxy(new NextRequest("https://lab.invalid" + path))).status, 404);
    }
  } finally {
    for (const name of Object.keys(process.env)) if (!(name in saved)) delete process.env[name];
    Object.assign(process.env, saved);
  }
});

test("normalization handles accents, German spelling, punctuation and bounded input", () => {
  assert.equal(normalizeLabQuery("  KÜNSTLICHE  INTELLIGENZ!? "), "kunstliche intelligenz");
  assert.equal(normalizeLabQuery("Straße / career"), "strasse career");
  assert.ok(normalizeLabQuery("x".repeat(1000)).length <= 160);
});

test("bilingual synonyms, multiple terms and typos find evidence across weighted fields", () => {
  for (const [query, expected] of [
    ["Career", "career"], ["Karriere", "career"], ["Recruiting", "goatrecrutainer"],
    ["KI Recruiting", "career-ai-demo"], ["artificial intelligence", "ai-notes-demo"],
    ["künstliche Intelligenz", "ai-notes-demo"], ["recuriting", "goatrecrutainer"],
    ["recruitng", "goatrecrutainer"], ["Relationships", "relationship"], ["Beziehungen", "relationship"],
    ["Gaming", "gaming-demo"], ["Community", "echo-wall"],
  ]) assert.ok(search(query).some(({ item }) => item.id === expected), query);
  assert.equal(search("Personal Advantage")[0].item.id, "personal-advantage");
  assert.equal(search("Gaming Relationships").length, 0);
  assert.equal(search("zxqv unmapped topic").length, 0);
});

test("empty query, categories and clearing restore stable original ordering", () => {
  assert.deepEqual(search(" ").map(({ item }) => item.id), catalog.map(item => item.id));
  assert.ok(search("career", "tool").every(({ item }) => item.kind === "tool"));
  assert.equal(search("gaming", "person").length, 0);
  assert.deepEqual(search("").map(({ item }) => item.id), catalog.map(item => item.id));
  assert.throws(() => createLabSearch([catalog[0], catalog[0]]), /unique/u);
});

test("rankings use evidence rather than predetermined item IDs or category filler", () => {
  const records: LabItem[] = [
    { id: "different-a", kind: "idea", source: "demo", title: "Ocean engineering", summary: "A narrow subject.", topics: ["ocean"], keywords: [], language: "en" },
    { id: "different-b", kind: "idea", source: "demo", title: "Another thought", summary: "Ocean engineering in practice.", topics: ["craft"], keywords: [], language: "en" },
    { id: "different-c", kind: "idea", source: "demo", title: "Unrelated", summary: "Gardens.", topics: ["craft"], keywords: [], language: "en" },
  ];
  assert.deepEqual(createLabSearch(records)("ocean engineering").map(({ item }) => item.id), ["different-a", "different-b"]);
  assert.equal(createLabSearch(records)("ocean moon").length, 0);
});

test("related cards require shared subject evidence, exclude self and are bounded", () => {
  for (const item of catalog) {
    const related = relatedLabItems(item, catalog);
    assert.ok(related.length <= 2);
    assert.ok(related.every(other => other.id !== item.id && other.topics.some(topic => item.topics.includes(topic))));
  }
});

test("all locales expose clear demo attribution, existing public paths and no private targets", () => {
  for (const locale of config.locales) {
    const items = createLabCatalog(locale);
    assert.equal(new Set(items.map(item => item.id)).size, items.length);
    assert.ok(items.some(item => item.source === "demo"));
    assert.ok(items.some(item => item.kind === "person"));
    for (const item of items) {
      if (item.source === "demo") assert.equal(item.href, undefined);
      else {
        assert.ok(item.href.startsWith("/"));
        assert.doesNotMatch(item.href, /invite|session|admin|account|[?#]/u);
      }
      if (item.image) assert.ok(existsSync("public" + item.image.src));
    }
    assert.ok(labCopy[locale].demo && labCopy[locale].privacy && labCopy[locale].emptyTitle);
    assert.ok(Object.values(labCopy[locale]).filter(value => typeof value === "string").every(value => value.trim().length > 0), locale);
  }
});

test("the UI reshapes real card content, preserves input focus and reveals accurate details", () => {
  for (const locale of config.locales) {
    const hooks = hookHarness();
    const css = { __esModule: true, default: new Proxy({}, { get: (_obj, key) => String(key) }) };
    const ImageMock = (props: Record<string, unknown>) => {
      const imageProps = { ...props }; delete imageProps.fill;delete imageProps.unoptimized;
      return React.createElement("img", imageProps);
    };
    const visuals = loadSource("components/experience-lab/island-visual.tsx", {
      "react/jsx-runtime": jsxRuntime, "next/image": { __esModule: true, default: ImageMock },
      "./experience-lab.module.css": css,
    });
    const focusSurface=loadSource("components/experience-lab/focus-surface.tsx",{
      "react/jsx-runtime":jsxRuntime,"next/link":{__esModule:true,default:(props:Record<string,unknown>)=>{const safe={...props};delete safe.prefetch;return React.createElement("a",safe);}},
      "@/data/experience-lab/focus-copy":{focusCopy},"@/data/experience-lab/copy":{labCopy},
      "@/lib/experience-lab/context":contextEngine,"@/lib/i18n/config":config,
      "./island-visual":visuals,"./experience-lab.module.css":css,
    });
    const Lab = loadSource<{ ExperienceLab: (props: { catalog: readonly LabItem[]; locale: config.Locale }) => React.ReactElement }>("components/experience-lab/experience-lab.tsx", {
      "react": { ...hooks.hooks, useLayoutEffect: hooks.hooks.useEffect }, "react/jsx-runtime": jsxRuntime,
      "next/image": { __esModule: true, default: "img" }, "next/link": { __esModule: true, default: "a" },
      "@/data/experience-lab/copy": { labCopy },
      "@/lib/experience-lab/search": engine, "@/lib/i18n/config": config, "@/lib/i18n/routing": routing,
      "@/lib/experience-lab/space": spaceEngine,
      "@/lib/experience-lab/motion": motionEngine,
      "@/data/experience-lab/focus-copy":{focusCopy},"@/lib/experience-lab/context":contextEngine,
      "./focus-surface":focusSurface,
      "./island-visual": visuals,
      "./experience-lab.module.css": css,
    }, { requestAnimationFrame: () => 0 }).ExperienceLab;
    const render = () => hooks.render(() => Lab({ catalog: createLabCatalog(locale), locale }));
    const nodes = (value: React.ReactNode): React.ReactElement<Record<string, unknown>>[] => {
      if (Array.isArray(value)) return value.flatMap(nodes);
      if (!React.isValidElement<Record<string, unknown>>(value)) return [];
      if(typeof value.type==="function")return [value,...nodes((value.type as (props:Record<string,unknown>)=>React.ReactNode)(value.props))];
      return [value, ...nodes(value.props.children as React.ReactNode)];
    };
    let tree = render();
    const heading = nodes(tree).find(node => node.type === "h1" && node.props.id === "lab-title")!;
    assert.equal(heading.props.children, labCopy[locale].title.replace("\n", " "));
    assert.notEqual(heading.props.className, "srOnly");
    let cards = nodes(tree).filter(node => node.props["data-lab-card"]);
    assert.equal(cards.length, spaceEngine.labWindowSize);
    assert.ok(nodes(tree).filter(node => node.props["data-connection"]).every(node => node.props["data-relevant"] === false), "neutral connectors cannot claim query relevance");
    const input = nodes(tree).find(node => node.props.id === "lab-search")!;
    (input.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: "Gaming" } });
    tree = render();
    cards = nodes(tree).filter(node => node.props["data-lab-card"]);
    assert.deepEqual(cards.map(node => node.props["data-lab-card"]), ["gaming-demo"]);
    assert.deepEqual(nodes(tree).filter(node => node.props["data-relevant"] === true).map(node => node.props["data-connection"]), ["gaming-demo"], "connection relevance must follow actual matches in every locale");
    const objects = nodes(tree).filter(node => node.props["data-lab-object"]);
    assert.equal(objects.length, catalog.length, "query changes retain object identity slots");
    assert.ok(objects.filter(node => !node.props["data-lab-card"]).every(node => node.props.inert === true && node.props["aria-hidden"] === true));
    const html = renderToStaticMarkup(tree);
    assert.ok(html.includes(labCopy[locale].demo));
    assert.ok(!nodes(tree).some(node => node.props.className === "open"));
    assert.equal(nodes(tree).find(node => node.props.id === "lab-search")?.props.value, "Gaming");
    const demoButton=nodes(tree).find(node=>node.props["data-space-node"] && node.props["aria-pressed"]===true)!;
    (demoButton.props.onClick as ()=>void)();tree=render();
    assert.equal(nodes(tree).find(node=>node.props.id==="lab-search")?.props.value,"Gaming");
    assert.equal(nodes(tree).find(node=>node.props.id==="lab-detail-title")?.props.children,createLabCatalog(locale).find(item=>item.id==="gaming-demo")?.title);
    assert.equal(nodes(tree).filter(node=>node.props["data-lab-card"]).length,1,"Focus promotes the original object instead of adding a second visual card");
    assert.equal(nodes(tree).filter(node=>node.props["data-lab-object"]).length,catalog.length,"Focus cannot remount the content identity slots");
    const returnButton=nodes(tree).find(node=>node.type==="button" && Array.isArray(node.props.children) && node.props.children.includes(focusCopy[locale].back))!;
    (returnButton.props.onClick as ()=>void)();tree=render();
    assert.equal(nodes(tree).find(node=>node.props.id==="lab-search")?.props.value,"Gaming","returning cannot clear the visitor's query");
    const clear = nodes(tree).find(node => node.props["aria-label"] === labCopy[locale].clear)!;
    (clear.props.onClick as () => void)();
    assert.equal(nodes(render()).filter(node => node.props["data-lab-card"]).length, spaceEngine.labWindowSize);
    const initialNode = nodes(render()).find(node => node.props["data-space-node"])!;
    (initialNode.props.onKeyDown as (event: { key: string; preventDefault: () => void }) => void)({ key: "End", preventDefault() {} });
    tree = render();
    assert.equal(nodes(tree).filter(node => node.props["data-lab-card"]).length, catalog.length - spaceEngine.labWindowSize);
    assert.ok(nodes(tree).find(node => node.props["aria-pressed"]===true && String(node.props["aria-label"]).includes(createLabCatalog(locale).at(-1)!.title)));
    assert.equal(nodes(tree).some(node=>node.props.id==="lab-detail"),false,"arrow navigation explores without opening Focus");
    const selected=nodes(tree).find(node=>node.props["data-space-node"] && node.props["aria-pressed"]===true)!;
    (selected.props.onClick as ()=>void)();tree=render();
    assert.equal(nodes(tree).find(node=>node.props.id==="lab-detail-title")?.props.children,createLabCatalog(locale).at(-1)?.title);
    const back=nodes(tree).find(node=>node.type==="button" && Array.isArray(node.props.children) && node.props.children.includes(focusCopy[locale].back))!;
    (back.props.onClick as ()=>void)();tree=render();
    assert.equal(nodes(tree).some(node=>node.props.id==="lab-detail"),false);
    assert.equal(nodes(tree).find(node=>node.props.id==="lab-search")?.props.value,"");
    const reset = nodes(tree).find(node => node.type === "button" && Array.isArray(node.props.children) && node.props.children[0] === labCopy[locale].reset)!;
    (reset.props.onClick as () => void)();
    tree = render();
    const room = nodes(tree).find(node => node.props["data-count"] === 6)!;
    const target = { closest: () => ({ hasAttribute: () => true }) };
    const currentTarget = { setPointerCapture() {}, hasPointerCapture: () => false, style: { setProperty() {}, removeProperty() {} } };
    const event = { button: 0, pointerId: 1, clientX: 200, clientY: 100, target, currentTarget };
    (room.props.onPointerDown as (event: unknown) => void)(event);
    (room.props.onPointerMove as (event: unknown) => void)({ ...event, clientX: 100 });
    (room.props.onPointerUp as (event: unknown) => void)({ ...event, clientX: 100 });
    let suppressed = false;
    (room.props.onClickCapture as (event: unknown) => void)({ detail: 1, preventDefault() { suppressed = true; }, stopPropagation() {} });
    assert.equal(suppressed, true, "dragging on a node must suppress its follow-up selection click");
    assert.ok(nodes(render()).find(node=>node.props["data-space-node"] && node.props["aria-pressed"]===true && String(node.props["aria-label"]).includes(createLabCatalog(locale)[3].title)));
    // Returning from a supporting object restores the pre-Focus composition.
    (reset.props.onClick as () => void)();tree=render();
    const supporter=nodes(tree).find(node=>node.props["data-space-node"] && String(node.props["aria-label"]).includes("Evgeny"))!;
    (supporter.props.onClick as ()=>void)();tree=render();
    const returnFromSupport=nodes(tree).find(node=>node.type==="button" && Array.isArray(node.props.children) && node.props.children.includes(focusCopy[locale].back))!;
    (returnFromSupport.props.onClick as ()=>void)();tree=render();
    assert.ok(nodes(tree).find(node=>node.props["data-space-node"] && node.props["aria-pressed"]===true && String(node.props["aria-label"]).includes("Personal Advantage")));
    const gestureRoom=nodes(tree).find(node=>node.props["data-count"]===6)!;
    const beforeId=nodes(tree).find(node=>node.props["data-lab-card"] && node.props["data-selected"]===true)!.props["data-lab-card"];
    const call=(name:string,e:unknown)=>(gestureRoom.props[name] as (e:unknown)=>void)(e);
    call("onPointerDown",event);
    call("onPointerMove",{...event,clientY:160});
    call("onPointerMove",{...event,clientX:0,clientY:165});
    call("onPointerUp",{...event,clientX:0,clientY:165});
    assert.equal(nodes(render()).find(node=>node.props["data-selected"]===true)!.props["data-lab-card"],beforeId,"native vertical intent cannot turn into a horizontal selection");
    call("onPointerDown",event);call("onPointerMove",{...event,clientX:0});
    call("onPointerMove",{...event,clientX:220});call("onPointerUp",{...event,clientX:220});
    assert.equal(nodes(render()).find(node=>node.props["data-selected"]===true)!.props["data-lab-card"],beforeId,"release uses the reversed final displacement, not an earlier threshold crossing");
    call("onPointerDown",event);call("onPointerMove",{...event,clientX:0});call("onPointerCancel",{...event,clientX:0});
    assert.equal(nodes(render()).find(node=>node.props["data-selected"]===true)!.props["data-lab-card"],beforeId,"cancellation never commits a new selection");
    hooks.unmount();
  }
});

test("lab scope has explicit noindex and no URL persistence, collection or live search imports", () => {
  const page = readFileSync("app/experience-lab/page.tsx", "utf8");
  const client = readFileSync("components/experience-lab/experience-lab.tsx", "utf8");
  assert.match(page, /index: false, follow: false/u);
  assert.doesNotMatch(page + client, /fetch\(|localStorage|sessionStorage|pushState|replaceState|sendBeacon|supabase|discovery-context|discovery-engine/iu);
  for (const file of ["app/sitemap.ts", "components/layout/header.tsx", "data/discovery-index.ts"]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /experience-lab/u);
  }
});

test("the lab route fails closed on Vercel Production before reading any catalog data", async () => {
  const page = loadSource<{ default: () => Promise<unknown> }>("app/experience-lab/page.tsx", {
    "next/navigation": { notFound: () => { throw new Error("LAB_NOT_FOUND"); } },
    "@/components/experience-lab/experience-lab": { ExperienceLab: () => null },
    "@/data/experience-lab/catalog": { createLabCatalog: () => { throw new Error("Should not read"); } },
    "@/data/experience-lab/copy": { labCopy },
    "@/lib/i18n/metadata": { createLocalizedMetadata: () => ({}) },
    "@/lib/i18n/server": { getLocale: () => { throw new Error("Should not read"); } },
    "react/jsx-runtime": jsxRuntime,
  }, { process: { env: { VERCEL_ENV: "production" } } });
  await assert.rejects(page.default(), /LAB_NOT_FOUND/u);
});

test("keyboard focus waits for a newly active object to become visible and cancels cleanly", () => {
  const hooks = hookHarness(), frames = new Map<number, () => void>();
  const restoredViewports: unknown[] = [];
  const viewport = { scrollX: 0, scrollY: 137, scrollTo(options: unknown) { restoredViewports.push(options); } };
  let nextFrame = 0, injectedRoot = false, visible = false, finished = 0;
  const documentStub: { activeElement: unknown;getElementById:(id:string)=>unknown } = { activeElement: null,getElementById:()=>detail };
  const button = { focus() { documentStub.activeElement = button; } };
  const detail = { focus() { documentStub.activeElement = detail; } };
  const root = { querySelector: () => button };
  const react = {
    ...hooks.hooks,
    useLayoutEffect: hooks.hooks.useEffect,
    useRef: <T,>(initial: T) => {
      const ref = hooks.hooks.useRef(initial);
      if (!injectedRoot && initial === null) { (ref as { current: unknown }).current = root; injectedRoot = true; }
      return ref;
    },
  };
  const Lab = loadSource<{ ExperienceLab: (props: { catalog: readonly LabItem[]; locale: config.Locale }) => React.ReactElement }>("components/experience-lab/experience-lab.tsx", {
    "react": react, "react/jsx-runtime": jsxRuntime,
    "next/link": { __esModule: true, default: "a" },
    "@/data/experience-lab/copy": { labCopy }, "@/lib/experience-lab/search": engine,
    "@/data/experience-lab/focus-copy":{focusCopy},"@/lib/experience-lab/context":contextEngine,
    "./focus-surface":{FocusSurface:()=>null},
    "@/lib/experience-lab/space": spaceEngine,
    "@/lib/experience-lab/motion": { startLabMotion: () => ({ stop() {}, finish() { finished++; } }) },
    "@/lib/i18n/config": config, "@/lib/i18n/routing": routing, "./island-visual": { IslandVisual: () => null },
    "./experience-lab.module.css": { __esModule: true, default: new Proxy({}, { get: (_obj,key) => String(key) }) },
  }, {
    requestAnimationFrame: (callback: () => void) => { frames.set(++nextFrame,callback); return nextFrame; },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    getComputedStyle: () => ({ visibility: visible ? "visible" : "hidden" }),
    matchMedia:()=>({matches:true}),
    window: viewport,
    document: documentStub,
  }).ExperienceLab;
  const render = () => hooks.render(() => Lab({ catalog, locale: "en" }));
  const nodes = (value: React.ReactNode): React.ReactElement<Record<string,unknown>>[] => {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!React.isValidElement<Record<string,unknown>>(value)) return [];
    return [value,...nodes(value.props.children as React.ReactNode)];
  };
  const first = nodes(render()).find(node => node.props["data-space-node"])!;
  (first.props.onKeyDown as (event: unknown) => void)({ key: "End", preventDefault() {} });
  render();
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()); };
  flush();
  assert.equal(documentStub.activeElement,null,"hidden descendants must not receive a premature focus call");
  assert.equal(frames.size,1,"visibility must be checked again rather than losing keyboard focus");
  visible = true;
  flush();
  assert.equal(documentStub.activeElement,button);
  assert.equal(finished,1,"the keyboard destination settles before focus");
  assert.equal(frames.size,0);
  const selected=nodes(render()).find(node=>node.props["data-space-node"] && node.props["aria-pressed"]===true)!;
  (selected.props.onClick as ()=>void)();const focusedTree=render();flush();
  assert.equal(documentStub.activeElement,detail);
  assert.equal(finished,1,"entering Focus must not skip motion");
  viewport.scrollY = 999;
  (focusedTree.props as {onKeyDown:(event:unknown)=>void}).onKeyDown({key:"Escape",defaultPrevented:false,preventDefault(){}});
  render();flush();
  assert.equal(documentStub.activeElement,button);
  assert.equal(finished,1,"returning restores focus without teleporting the composition");
  assert.deepEqual(JSON.parse(JSON.stringify(restoredViewports)), [{ left: 0, top: 137, behavior: "instant" }], "reading Focus details must restore the visitor's original viewport on return");
  hooks.unmount();
});

test("project artwork uses existing project context without inventing a GOAT wordmark", () => {
  const Visual = loadSource<{ IslandVisual: (props: { item: LabItem; featured?: boolean }) => React.ReactElement }>("components/experience-lab/island-visual.tsx", {
    "react/jsx-runtime": jsxRuntime,
    "next/image": { __esModule: true, default: () => null },
    "./experience-lab.module.css": { __esModule: true, default: new Proxy({}, { get: (_object, key) => String(key) }) },
  }).IslandVisual;
  for (const locale of config.locales) {
    const project = createLabCatalog(locale).find(item => item.kind === "project")!;
    const before = JSON.stringify(project);
    for (const featured of [false, true]) {
      const html = renderToStaticMarkup(Visual({ item: project, featured }));
      assert.match(html, /data-project-context/);
      assert.ok(html.includes(project.summary.replaceAll("&", "&amp;")));
      assert.ok(html.includes(project.topics.slice(0, 2).join(" · ")));
      assert.doesNotMatch(html, /wordmark|GOAT<|<small>RECRUTAINER/);
      assert.equal(JSON.stringify(project), before, "presentation cannot replace approved project data");
    }
  }
});


test("connection feedback is finite and motion opt-in while semantic hierarchy survives reduced motion", () => {
  const css = readFileSync("components/experience-lab/experience-lab.module.css", "utf8");
  const declarations = [...css.matchAll(/animation:\s*([^;}]+)/g)].map(match => match[1]);
  assert.equal(declarations.length, 1, "no ambient or extra connection loops");
  assert.match(declarations[0], /connectionResponse 180ms ease-out 1/);
  assert.doesNotMatch(css, /infinite|stroke-dashoffset/);
  assert.match(css, /@media\(prefers-reduced-motion:no-preference\)\s*\{\s*\.space:focus-within[^}]+animation:/);
  const beforeMotion = css.slice(0, css.indexOf("@keyframes connectionResponse"));
  assert.match(beforeMotion, /path\[data-active=true\][^{]*\{[^}]+stroke-opacity:/);
  assert.match(beforeMotion, /path:is\(\[data-relevant=true\],\[data-related=true\]\)/);
});
