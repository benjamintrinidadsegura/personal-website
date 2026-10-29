import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as jsxRuntime from "react/jsx-runtime";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { contextualJourneys, type ContentReference, type ContextualReference } from "../data/contextual-journeys";
import { contextualCopy } from "../data/i18n/contextual-journeys";
import { getLocalizedNextStepJourney } from "../data/find-your-next-step";
import * as journeys from "../lib/contextual-journeys";
import { locales } from "../lib/i18n/config";
import { localizeHref } from "../lib/i18n/routing";
import { mapPublicWritingArticle } from "../lib/writing/domain";
import type { PublicWritingArticle } from "../types/writing";
import { loadSource } from "./helpers/load-source";

const firstSlug = "versteh-mich-richtig";
const secondSlug = "vielleicht-hoffen-die-anderen-genauso-wie-du";
const source: ContentReference = { kind: "writing", slug: firstSlug };
const body = "An authored public article body used only by the regression fixture.";
const document = { version: 1, blocks: [{ type: "paragraph", content: [{ type: "text", text: body }] }] };
function article(slug: string, locale: (typeof locales)[number] = "de") {
  const value = mapPublicWritingArticle({
    id: slug, slug, title: `Published essay ${slug}`, deck: "Authored context", excerpt: "An authored public introduction.", body, body_json: document,
    status: "published", published_at: "2026-10-10T12:00:00Z", content_type: "essay", topics: ["Ideas"], source_locale: "de", source_revision: 3,
    translations: [
      { locale: "en", title: "Published English essay", deck: "Authored context", excerpt: "An authored translated introduction.", body, body_json: document, status: "translated", source_revision: 3 },
      { locale: "es", title: "Obsolete Spanish essay", deck: "Old context", excerpt: "An outdated translated introduction.", body, body_json: document, status: "translated", source_revision: 2 },
    ],
  }, locale);
  assert.ok(value);
  return value;
}

const { ContextualLinks } = loadSource<typeof import("../components/content/contextual-links")>("components/content/contextual-links.tsx", {
  "react/jsx-runtime": jsxRuntime, "next/link": { __esModule: true, default: ({ prefetch, ...props }: { prefetch?: boolean; href: string; children: ReactNode }) => { assert.equal(prefetch, false); return createElement("a", props); } }, "@/data/i18n/contextual-journeys": { contextualCopy },
});

function continuation(read: (slug: string, locale: (typeof locales)[number]) => Promise<PublicWritingArticle | null>) {
  return loadSource<typeof import("../components/content/content-continuation")>("components/content/content-continuation.tsx", {
    "react/jsx-runtime": jsxRuntime, "@/components/content/contextual-links": { ContextualLinks },
    "@/lib/contextual-journeys": journeys, "@/lib/writing/queries": { getPublishedWritingBySlug: read },
  }).ContentContinuation;
}

test("editorial references resolve from canonical records in seven locales with a maximum of three destinations", () => {
  for (const locale of locales) {
    const articles = [article(firstSlug, locale), article(secondSlug, locale)];
    for (const { from, next } of contextualJourneys) {
      const result = journeys.resolveContextualDestinations(from, next, locale, articles);
      assert.ok(result.length > 0 && result.length <= 3);
      assert.equal(new Set(result.map(({ href }) => href)).size, result.length);
      for (const destination of result) {
        assert.ok(destination.title && contextualCopy[locale].reasons[destination.reason]);
        assert.match(destination.href, /^\/(?:en\/|es\/|tr\/|pl\/|el\/|ru\/)?(?:writing\/|projects\/|people\/|find-your-next-step\/|world$)/u);
        assert.doesNotMatch(destination.href, /[?#%]|admin|account|invite|session/u);
      }
    }
    const project = journeys.resolveContextualDestinations({ kind: "project", slug: "goatrecrutainer" }, journeys.getContextualReferences({ kind: "project", slug: "goatrecrutainer" }), locale);
    assert.equal(project[0].href, localizeHref("/find-your-next-step/career", locale));
    assert.equal(project[0].title, getLocalizedNextStepJourney("career", locale)?.title);
  }
});

test("Writing recommendations preserve the resolved publication language and canonical identity in all locales", () => {
  for (const locale of locales) {
    const articles = [article(firstSlug, locale), article(secondSlug, locale)];
    const result = journeys.resolveContextualDestinations(source, journeys.getContextualReferences(source), locale, articles);
    assert.equal(result.length, 3);
    const target = result[0];
    const language = locale === "en" ? "en" : "de";
    assert.equal(target.language, language);
    assert.equal(target.href, localizeHref(`/writing/${secondSlug}`, language));
    assert.equal(target.title, articles[1].title);
    assert.equal(result[1].href, localizeHref("/projects/goatrecrutainer", locale));
    assert.equal(result[2].href, localizeHref("/people/kiki-radicke", locale));
  }
});

test("unavailable, withdrawn or synthetic Writing targets disappear without substituting a forthcoming article", async () => {
  for (const locale of locales) {
    for (const state of ["unavailable", "withdrawn"]) {
      const calls: string[] = [];
      const ContentContinuation = continuation(async (slug, requested) => { calls.push(slug); assert.equal(requested, locale); return null; });
      const tree = await ContentContinuation({ source, locale, article: article(firstSlug, locale) });
      assert.ok(tree, state);
      const html = renderToStaticMarkup(tree);
      assert.deepEqual(calls, [secondSlug]);
      assert.equal((html.match(/<a /gu) ?? []).length, 2);
      assert.ok(!html.includes(`/writing/${secondSlug}`));
      assert.ok(!html.includes("Coming to"));
    }
    const synthetic = { ...article(secondSlug, locale), title: "Synthetic content" };
    assert.equal(journeys.resolveContextualDestinations(source, [{ to: { kind: "writing", slug: secondSlug }, reason: "understood" }], locale, [article(firstSlug, locale), synthetic]).length, 0);
  }
});

test("an unverified Writing source or an uncurated page produces nothing and makes no extra requests", async () => {
  const ContentContinuation = continuation(async () => { throw new Error("unexpected read"); });
  assert.equal(await ContentContinuation({ source, locale: "en" }), null);
  assert.equal(await ContentContinuation({ source: { kind: "writing", slug: "unrelated" }, locale: "en", article: article("unrelated") }), null);
  assert.equal(await ContentContinuation({ source: { kind: "project", slug: "ratecom" }, locale: "en" }), null);
  assert.deepEqual(journeys.resolveContextualDestinations(source, journeys.getContextualReferences(source), "en"), []);
  assert.equal(ContextualLinks({ destinations: [], locale: "en" }), null);
});

test("self links, duplicates and unknown/private destinations are removed before the three-link cap", () => {
  const references: ContextualReference[] = [
    { to: source, reason: "understood" },
    ...["../admin", "missing", "https://external.invalid", "life-alignment/invite/token"].map((slug): ContextualReference => ({ to: { kind: "project", slug }, reason: "beyondCv" })),
    { to: { kind: "person", id: "person-unpublished" }, reason: "recruiting" },
    { to: { kind: "writing", slug: "unavailable" }, reason: "understood" },
    { to: { kind: "experience", id: "tool-find-your-next-step-problem" }, reason: "careerReflection" },
    ...journeys.getContextualReferences(source), ...journeys.getContextualReferences(source),
    { to: { kind: "world", personId: "person-evgeny-vinokurov" }, reason: "mapContext" },
  ];
  const result = journeys.resolveContextualDestinations(source, references, "en", [article(firstSlug), article(secondSlug)]);
  assert.equal(result.length, 3);
  assert.equal(new Set(result.map(({ href }) => href)).size, 3);
  assert.ok(!result.some(({ href }) => href.endsWith(firstSlug)));
  assert.deepEqual(journeys.resolveContextualDestinations({ kind: "project", slug: "missing" }, references, "en"), []);
  const worldReferences: ContextualReference[] = ["person-evgeny-vinokurov", "person-kiki-radicke", "missing"].map((personId) => ({ to: { kind: "world", personId }, reason: "mapContext" }));
  assert.equal(journeys.resolveContextualDestinations(source, worldReferences, "en", [article(firstSlug)]).length, 1);
});

test("static project and Spotlight continuations need no Writing query and retain map publication gates", async () => {
  const ContentContinuation = continuation(async () => { throw new Error("static pages must not query Writing"); });
  for (const locale of locales) {
    for (const { from } of contextualJourneys.filter(({ from }) => from.kind !== "writing")) {
      const tree = await ContentContinuation({ source: from, locale });
      assert.ok(tree);
      const html = renderToStaticMarkup(tree);
      assert.ok(html.includes(contextualCopy[locale].title));
      assert.equal((html.match(/<a /gu) ?? []).length, from.kind === "person" ? 3 : 2);
      assert.match(html, /aria-labelledby="contextual-continuation-title"/u);
      assert.match(html, /<h2 id="contextual-continuation-title"/u);
      assert.match(html, /focus-visible:outline/u);
      assert.ok(!html.includes("iframe"));
    }
  }
});

test("each Spotlight retains one curated published peer conversation without exceeding three links", () => {
  const expectedPeers: Record<string, string> = {
    "person-evgeny-vinokurov": "amr-medhat", "person-amr-medhat": "evgeny-vinokurov",
    "person-kiki-radicke": "melanie-kleinhenz", "person-melanie-kleinhenz": "kiki-radicke",
    "person-johanna-geisler": "kiki-radicke", "person-kevin-schweisfurth": "johanna-geisler",
  };
  for (const locale of locales) for (const [id, peerSlug] of Object.entries(expectedPeers)) {
    const source: ContentReference = { kind: "person", id };
    const result = journeys.resolveContextualDestinations(source, journeys.getContextualReferences(source), locale);
    assert.equal(result.length, 3);
    assert.deepEqual(result.filter(({ kind }) => kind === "person").map(({ href }) => href), [localizeHref(`/people/${peerSlug}`, locale)]);
  }
});

test("invalid or unpublished map and person records fail closed", () => {
  let invalidMap = false;
  const isolated = loadSource<typeof journeys>("lib/contextual-journeys.ts", {
    "@/data/contextual-journeys": { contextualJourneys },
    "@/data/find-your-next-step": { nextStepJourneys: [], getLocalizedNextStepJourney: () => undefined },
    "@/data/i18n/people": { getLocalizedPublishedSpotlights: () => [] },
    "@/data/i18n/projects": { getLocalizedProject: (slug: string) => slug === "goatrecrutainer" ? { slug, name: "GOATRECRUTAINER" } : undefined },
    "@/data/i18n/world-map": { getWorldMapDictionary: () => ({ breadcrumb: "World Map" }) },
    "@/data/spotlights": { publishedSpotlights: [{ id: "person-unmapped" }] },
    "@/data/world-map": { createWorldMapConnections: () => { if (invalidMap) throw new Error("invalid map context"); return []; } },
    "@/lib/i18n/routing": { localizeHref }, "@/lib/public-content-hygiene": { isPublicWritingReady: () => true },
  });
  const references: ContextualReference[] = [
    { to: { kind: "world", personId: "person-unmapped" }, reason: "mapContext" },
    { to: { kind: "person", id: "person-unpublished" }, reason: "recruiting" },
  ];
  assert.deepEqual(isolated.resolveContextualDestinations({ kind: "project", slug: "goatrecrutainer" }, references, "en"), []);
  invalidMap = true;
  assert.deepEqual(isolated.resolveContextualDestinations({ kind: "project", slug: "goatrecrutainer" }, references, "en"), []);
});

test("continuation stays server-rendered and streams after the Writing body without changing sharing", () => {
  const content = readFileSync("components/content/content-continuation.tsx", "utf8");
  const presentation = readFileSync("components/content/contextual-links.tsx", "utf8");
  const page = readFileSync("app/writing/[slug]/page.tsx", "utf8");
  assert.doesNotMatch(content + presentation, /use client|useEffect|localStorage|analytics|trackEvent/u);
  assert.match(presentation, /prefetch=\{false\}/u);
  assert.match(page, /<Suspense fallback=\{null\}><ContentContinuation/u);
  assert.ok(page.indexOf("<ContentContinuation") > page.indexOf("<WritingDocument"));
  assert.ok(page.indexOf("<ContentContinuation") < page.indexOf("<NewsletterCta"));
  assert.ok(page.includes("<ShareArticleTrigger"));
});
