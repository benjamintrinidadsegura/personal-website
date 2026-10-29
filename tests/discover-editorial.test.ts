import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

import * as nextStep from "../data/find-your-next-step";
import * as about from "../data/i18n/about";
import { discoverCopy } from "../data/i18n/discover";
import { homeViewsCopy } from "../data/i18n/home-views";
import * as people from "../data/i18n/people";
import { quoteDictionaries } from "../data/i18n/quotes";
import * as writing from "../data/i18n/writing";
import * as worldMap from "../data/world-map";
import * as config from "../lib/i18n/config";
import * as routing from "../lib/i18n/routing";
import * as quotes from "../lib/quotes";
import type { PublishedWritingReadResult } from "../lib/writing/queries";
import type { PublicWritingSummary } from "../types/writing";
import { hookHarness } from "./helpers/hook-harness";
import { loadSource } from "./helpers/load-source";

const latest: PublicWritingSummary = {
  id: "published-latest", slug: "a-thought-that-stays", title: "A thought that stays",
  deck: "An authored introduction.", excerpt: "An authored excerpt.", contentType: "essay", topics: ["Ideas"],
  publishedAt: "2026-10-25T12:00:00Z", readingMinutes: 4, language: "en", sourceLanguage: "en", availableLanguages: ["en"], translationStatus: "source",
};

type DiscoverProps = { locale: config.Locale; publishedWritingResult: PublishedWritingReadResult; dateKey: string };
const QuoteMarker = (props: object) => React.createElement("div", { "data-quote-props": JSON.stringify(props) });
function discoverComponent(spotlights = people) {
  return loadSource<{ DiscoverHome: (props: DiscoverProps) => React.ReactElement }>("components/home/discover-home.tsx", {
    "react/jsx-runtime": jsxRuntime,
    "next/link": { __esModule: true, default: "a" },
    "next/image": { __esModule: true, default: "img" },
    "@/components/quotes/quote-experience": { QuoteExperience: QuoteMarker },
    "@/data/find-your-next-step": nextStep, "@/data/i18n/about": about,
    "@/data/i18n/discover": { discoverCopy }, "@/data/i18n/home-views": { homeViewsCopy },
    "@/data/i18n/people": spotlights, "@/data/i18n/writing": writing,
    "@/data/world-map": worldMap, "@/lib/i18n/config": config, "@/lib/i18n/routing": routing,
  }).DiscoverHome;
}

function elements(node: React.ReactNode): React.ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as React.ReactNode)];
}

test("Discover leads with the latest public snapshot, then the same daily quote, human, four paths and a verified continuation", () => {
  const DiscoverHome = discoverComponent();
  for (const locale of config.locales) {
    const tree = DiscoverHome({ locale, dateKey: "2026-10-26", publishedWritingResult: { status: "data", data: [latest, { ...latest, id: "older", slug: "older", title: "Older writing" }] } });
    const nodes = elements(tree);
    const sections = nodes.filter(({ type }) => type === "section" || type === "nav").map(({ props }) => props.id);
    assert.deepEqual(sections, ["discover-featured", "discover-human", "discover-paths", "discover-continue"]);
    const articles = nodes.filter(({ type }) => type === "article");
    assert.equal(articles.length, 1);
    assert.equal(articles[0].props["data-discover-writing"], latest.id);
    const quote = nodes.find(({ type }) => type === QuoteMarker)!;
    assert.deepEqual(quote.props.context, { surface: "daily", dateKey: "2026-10-26" });
    assert.equal(quote.props.variant, "daily");
    assert.equal(quote.props.presentation, "compact");
    assert.equal(quote.props.safeSharePath, "/");
    assert.ok(nodes.indexOf(articles[0]) < nodes.indexOf(quote), "mobile DOM order must lead with Writing");
    const nav = nodes.find(({ type }) => type === "nav")!;
    const pathLinks = elements(nav).filter(({ props }) => typeof props.href === "string");
    assert.deepEqual(pathLinks.map(({ props }) => props.href), ["/#building", "/writing", "/people", nextStep.findYourNextStep.href].map((href) => routing.localizeHref(href, locale)));
    const html = renderToStaticMarkup(tree);
    assert.ok(html.includes(discoverCopy[locale].featured));
    assert.ok(html.includes(about.getAboutContent(locale).positioning.name));
    assert.ok(html.includes(routing.localizeHref("/about", locale)));
    assert.ok(!html.includes("Older writing"));
    const ids = nodes.flatMap(({ props }) => typeof props.id === "string" ? [props.id] : []);
    assert.equal(new Set(ids).size, ids.length);
    for (const node of nodes) if (node.props["aria-labelledby"]) assert.ok(ids.includes(node.props["aria-labelledby"] as string));
  }
});

test("localized articles use their actual content language and source fallback links directly to the canonical language", () => {
  const DiscoverHome = discoverComponent();
  for (const locale of config.locales) {
    for (const status of ["translated", "fallback"] as const) {
      const language = status === "translated" ? locale : "en";
      const article = { ...latest, language, translationStatus: status };
      const nodes = elements(DiscoverHome({ locale, dateKey: "2026-10-26", publishedWritingResult: { status: "data", data: [article] } }));
      const link = nodes.find(({ props }) => props.className === "discover-writing-link")!;
      assert.equal(link.props.href, routing.localizeHref(`/writing/${article.slug}`, language));
      assert.equal(elements(link).find(({ type }) => type === "h2")?.props.lang, language);
      assert.equal(elements(link).find(({ type }) => type === "p")?.props.lang, language);
      const notice = nodes.find(({ props }) => props.className === "discover-source-notice");
      assert.equal(Boolean(notice), status === "fallback");
      if (notice) assert.equal(notice.props.children, writing.getWritingDictionary(locale).article.sourceNotice);
    }
  }
});

test("empty and unavailable Writing have distinct localized recovery, no fabricated article, and retain daily quote and paths", () => {
  const DiscoverHome = discoverComponent();
  for (const locale of config.locales) {
    for (const status of ["data", "unavailable"] as const) {
      const nodes = elements(DiscoverHome({ locale, dateKey: "2026-10-26", publishedWritingResult: { status, data: [] } }));
      assert.equal(nodes.filter(({ type }) => type === "article").length, 0);
      assert.equal(nodes.find(({ props }) => props["data-discover-writing-state"])?.props["data-discover-writing-state"], status === "data" ? "empty" : "unavailable");
      const message = nodes.find(({ props }) => props.role === "status")!;
      assert.equal(elements(message).find(({ type }) => type === "h2")?.props.children, status === "data" ? discoverCopy[locale].emptyTitle : discoverCopy[locale].unavailableTitle);
      assert.equal(nodes.filter(({ type }) => type === QuoteMarker).length, 1);
      assert.equal(nodes.filter(({ type }) => type === "nav").length, 1);
    }
  }
  const nodes = elements(DiscoverHome({ locale: "en", dateKey: "2026-10-26", publishedWritingResult: { status: "data", data: [{ ...latest, deck: "" }] } }));
  assert.equal(nodes.find(({ props }) => props.className === "discover-writing-introduction")?.props.children, latest.excerpt);
});

test("continuation uses canonical published Spotlight/map evidence and disappears when that evidence is unavailable", () => {
  for (const locale of config.locales) {
    const connection = worldMap.createWorldMapConnections(people.getLocalizedPublishedSpotlights(locale))[0];
    assert.ok(connection);
    assert.equal(connection.entity.publicationState, "published");
    assert.ok(connection.relationships.length > 0);
    const nodes = elements(discoverComponent()({ locale, dateKey: "2026-10-26", publishedWritingResult: { status: "data", data: [] } }));
    const continuation = nodes.find(({ props }) => props.id === "discover-continue")!;
    assert.deepEqual(elements(continuation).flatMap(({ props }) => typeof props.href === "string" ? [props.href] : []), [connection.entity.sourceHref, "/world"].map((href) => routing.localizeHref(href, locale)));
    const image = elements(continuation).find(({ props }) => props.src);
    assert.equal(image?.props.src, connection.entity.image?.src);
    if (image) assert.ok(readFileSync(`public${image.props.src}`).length > 0, "only an existing content image may be used");
  }
  const DiscoverHome = discoverComponent({ ...people, getLocalizedPublishedSpotlights: () => [] });
  assert.ok(!elements(DiscoverHome({ locale: "en", dateKey: "2026-10-26", publishedWritingResult: { status: "data", data: [] } })).some(({ props }) => props.id === "discover-continue"));
});

type QuoteProps = { context: { surface: "daily"; dateKey: string }; variant: "daily"; presentation?: "compact" | "full"; description?: string };
function quoteComponent(locale: config.Locale, react: object = React) {
  return loadSource<{ QuoteExperience: (props: QuoteProps) => React.ReactElement }>("components/quotes/quote-experience.tsx", {
    "react/jsx-runtime": jsxRuntime, react,
    "@/components/quotes/quote-share-dialog": { QuoteShareDialog: "share-dialog" },
    "@/components/sharing/share-icon": { ShareIcon: () => null },
    "@/components/i18n/locale-context": { useLocale: () => locale },
    "@/data/i18n/quotes": { quoteDictionaries }, "@/lib/quotes": quotes,
  }).QuoteExperience;
}

test("compact presentation preserves the full daily quote identity, text, attribution and semantics in all seven locales", () => {
  for (const locale of config.locales) {
    const QuoteExperience = quoteComponent(locale);
    const props: QuoteProps = { context: { surface: "daily", dateKey: "2026-10-26" }, variant: "daily" };
    const full = renderToStaticMarkup(React.createElement(QuoteExperience, props));
    const compact = renderToStaticMarkup(React.createElement(QuoteExperience, { ...props, presentation: "compact" }));
    assert.equal(compact.replace(" quote-experience-compact", ""), full, "compact must only add a scoped class, leaving Explore unchanged");
    assert.ok(full.includes(`data-quote-id="${quotes.selectQuote({ ...props.context, locale }).id}"`));
    assert.match(compact, /<blockquote>[\s\S]*<cite>btshq.online<\/cite>/u);
    assert.equal((compact.match(/<button /gu) ?? []).length, 2);
  }
});

test("compact quote shuffle and sharing execute the existing handlers with the current quote and all daily share formats enabled", () => {
  for (const locale of config.locales) {
    const harness = hookHarness();
    const QuoteExperience = quoteComponent(locale, { ...harness.hooks, useId: () => "quote-test-heading" });
    const render = () => harness.render(() => QuoteExperience({ context: { surface: "daily", dateKey: "2026-10-26" }, variant: "daily", presentation: "compact", description: "" }));
    let nodes = elements(render());
    const firstId = nodes[0].props["data-quote-id"];
    (nodes.find(({ type }) => type === "button")!.props.onClick as () => void)();
    nodes = elements(render());
    assert.notEqual(nodes[0].props["data-quote-id"], firstId);
    const share = nodes.find(({ type, props }) => type === "button" && String(props.className).includes("quote-experience-share"))!;
    (share.props.onClick as () => void)();
    nodes = elements(render());
    const dialog = nodes.find(({ type }) => type === "share-dialog")!;
    assert.equal(dialog.props.safeSharePath, "/");
    assert.equal(dialog.props.socialPostEnabled, true);
    assert.equal((dialog.props.quote as { id: string }).id, nodes[0].props["data-quote-id"]);
    (dialog.props.onClose as () => void)();
    assert.equal(elements(render()).find(({ type }) => type === "share-dialog"), undefined);
    harness.unmount();
  }
});
