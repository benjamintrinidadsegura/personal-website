import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

import { createLabCatalog } from "../data/experience-lab/catalog";
import { labCopy } from "../data/experience-lab/copy";
import { createLabSearch, normalizeLabQuery, relatedLabItems, type LabItem } from "../lib/experience-lab/search";
import * as config from "../lib/i18n/config";
import * as routing from "../lib/i18n/routing";
import * as engine from "../lib/experience-lab/search";
import { hookHarness } from "./helpers/hook-harness";
import { loadSource } from "./helpers/load-source";

const catalog = createLabCatalog("en");
const search = createLabSearch(catalog);

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
  }
});

test("the UI reshapes real card content, preserves input focus and reveals accurate details", () => {
  for (const locale of config.locales) {
    const hooks = hookHarness();
    const Lab = loadSource<{ ExperienceLab: (props: { catalog: readonly LabItem[]; locale: config.Locale }) => React.ReactElement }>("components/experience-lab/experience-lab.tsx", {
      "react": hooks.hooks, "react/jsx-runtime": jsxRuntime,
      "next/image": { __esModule: true, default: "img" }, "next/link": { __esModule: true, default: "a" },
      "@/data/experience-lab/copy": { labCopy },
      "@/lib/experience-lab/search": engine, "@/lib/i18n/config": config, "@/lib/i18n/routing": routing,
      "./experience-lab.module.css": { __esModule: true, default: new Proxy({}, { get: (_obj, key) => String(key) }) },
    }).ExperienceLab;
    const render = () => hooks.render(() => Lab({ catalog: createLabCatalog(locale), locale }));
    const nodes = (value: React.ReactNode): React.ReactElement<Record<string, unknown>>[] => {
      if (Array.isArray(value)) return value.flatMap(nodes);
      if (!React.isValidElement<Record<string, unknown>>(value)) return [];
      return [value, ...nodes(value.props.children as React.ReactNode)];
    };
    let tree = render();
    let cards = nodes(tree).filter(node => node.props["data-lab-card"]);
    assert.equal(cards.length, catalog.length);
    const input = nodes(tree).find(node => node.props.id === "lab-search")!;
    (input.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: "Gaming" } });
    tree = render();
    cards = nodes(tree).filter(node => node.props["data-lab-card"]);
    assert.deepEqual(cards.map(node => node.props["data-lab-card"]), ["gaming-demo"]);
    const html = renderToStaticMarkup(tree);
    assert.ok(html.includes(labCopy[locale].demo));
    assert.ok(!nodes(tree).some(node => node.props.className === "open"));
    assert.equal(nodes(tree).find(node => node.props.id === "lab-search")?.props.value, "Gaming");
    const clear = nodes(tree).find(node => node.props["aria-label"] === labCopy[locale].clear)!;
    (clear.props.onClick as () => void)();
    assert.equal(nodes(render()).filter(node => node.props["data-lab-card"]).length, catalog.length);
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
