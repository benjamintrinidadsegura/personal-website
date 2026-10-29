import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement, type ReactElement, type ReactNode } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

import * as pulseData from "../data/hq-pulse";
import * as pulseCopy from "../data/i18n/hq-pulse";
import * as humanPulse from "../data/human-pulse";
import * as homeCopy from "../data/i18n/home";
import * as errorCopy from "../data/i18n/errors";
import * as shareCopy from "../data/i18n/writing-share";
import * as writingData from "../data/writing";
import * as discoveryData from "../data/discovery-index";
import * as homeView from "../lib/home-view";
import * as routing from "../lib/i18n/routing";
import { locales, type Locale } from "../lib/i18n/config";
import type { PublishedWritingReadResult } from "../lib/writing/queries";
import type { PublicWritingSummary } from "../types/writing";
import { loadSource } from "./helpers/load-source";

const articles: PublicWritingSummary[] = Array.from({ length: 4 }, (_, index) => ({
  id: `article-${index}`, slug: `article-${index}`, title: `Published article ${index}`,
  deck: "An authored deck", excerpt: "An authored invitation to read.", contentType: "essay",
  topics: ["Ideas"], publishedAt: `2026-10-0${9 - index}T12:00:00Z`, readingMinutes: 3,
  language: "de", sourceLanguage: "de", availableLanguages: ["de"], translationStatus: "source",
}));

const sectionNames = ["Hero", "HomeQuote", "HqPulse", "CurrentlyBuilding", "Writing", "Interviews", "EchoWallPreview", "About", "Feedback", "Contact"];

async function home(locale: Locale, result: PublishedWritingReadResult) {
  const sections = Object.fromEntries(sectionNames.map((name) => [name, (props: object) => createElement("section", { ...props, "data-section": name })]));
  const dependencies: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    "@/components/home/home-views": { HomeViews: () => null },
    "@/components/home/discover-home": { DiscoverHome: () => null },
    "@/lib/home-view": homeView,
    "@/lib/i18n/server": { getLocale: async () => locale },
    "@/lib/writing/queries": { getPublishedWritingResult: async (requested: Locale) => { assert.equal(requested, locale); return result; } },
  };
  for (const name of sectionNames) {
    const filename = name === "EchoWallPreview" ? "echowall-preview" : name.replace(/[A-Z]/gu, (letter, offset) => `${offset ? "-" : ""}${letter.toLowerCase()}`);
    dependencies[`@/components/${name === "HomeQuote" ? "quotes" : "sections"}/${filename}`] = { [name]: sections[name] };
  }
  const page = loadSource<{ default: () => Promise<ReactElement<{ discover: ReactElement<{ locale: Locale; publishedWritingResult: PublishedWritingReadResult; dateKey: string }>; explore: ReactElement<{ children: ReactElement[] }> }>>; revalidate: number }>("app/page.tsx", dependencies);
  return { page, sections, tree: await page.default() };
}

test("home preserves the complete Explore section order and shares the same localized Writing snapshot", async () => {
  for (const locale of locales) {
    for (const result of [{ status: "data", data: articles }, { status: "data", data: [] }, { status: "unavailable", data: [] }] satisfies PublishedWritingReadResult[]) {
      const { page, sections, tree } = await home(locale, result);
      assert.equal(page.revalidate, 300);
      const children = tree.props.explore.props.children;
      assert.deepEqual(children.map((child) => child.type), sectionNames.map((name) => sections[name]));
      const pulse = children[2] as ReactElement<{ publishedWriting: PublicWritingSummary[] }>;
      const writing = children[4] as ReactElement<{ publishedWriting: PublicWritingSummary[]; publishedWritingStatus: string }>;
      assert.equal(pulse.props.publishedWriting, result.data);
      assert.equal(writing.props.publishedWriting, result.data);
      assert.equal(writing.props.publishedWritingStatus, result.status);
      const quote = children[1] as ReactElement<{ dateKey: string }>;
      assert.match(quote.props.dateKey, /^\d{4}-\d{2}-\d{2}$/u);
      assert.equal(tree.props.discover.props.locale, locale);
      assert.equal(tree.props.discover.props.publishedWritingResult, result, "Discover must receive the same public snapshot without another query");
      assert.equal(tree.props.discover.props.dateKey, quote.props.dateKey, "both views must use one UTC date key");
    }
  }
});

function writingSection(locale: Locale) {
  return loadSource<{ Writing: (props: { publishedWriting: readonly PublicWritingSummary[]; publishedWritingStatus: PublishedWritingReadResult["status"] }) => Promise<ReactElement> }>("components/sections/writing.tsx", {
    "react/jsx-runtime": jsxRuntime,
    "next/link": { __esModule: true, default: "a" },
    "@/data/writing": writingData,
    "@/data/i18n/home": homeCopy,
    "@/data/i18n/errors": errorCopy,
    "@/data/i18n/writing-share": shareCopy,
    "@/components/ui/section-heading": { SectionHeading: () => null },
    "@/components/ui/reveal": { Reveal: ({ children }: { children: ReactNode }) => children },
    "@/components/writing/share/share-format-signal": { ShareFormatSignal: () => null },
    "@/lib/writing/queries": { getPublishedWriting: () => assert.fail("Supplied snapshot must prevent a second read") },
    "@/lib/i18n/routing": routing,
    "@/lib/i18n/server": { getLocale: async () => locale },
  });
}

test("home Writing keeps ordered published links, labelled empty previews and unavailable recovery distinct in seven locales", async () => {
  for (const locale of locales) {
    const { Writing } = writingSection(locale);
    const published = renderToStaticMarkup(await Writing({ publishedWriting: articles, publishedWritingStatus: "data" }));
    const paths = [...published.matchAll(/href="([^"]+)"/gu)].map((match) => match[1]);
    assert.deepEqual(paths, [...articles.slice(0, 3).map(({ slug }) => routing.localizeHref(`/writing/${slug}`, locale)), routing.localizeHref("/writing", locale)]);
    assert.doesNotMatch(published, /data-writing-home-unavailable/u);

    const empty = renderToStaticMarkup(await Writing({ publishedWriting: [], publishedWritingStatus: "data" }));
    assert.match(empty, /data-writing-home-mosaic/u);
    assert.equal((empty.match(/<article /gu) ?? []).length, 3);
    assert.ok(empty.includes(homeCopy.getHomeCopy(locale).writing.preview));
    assert.equal((empty.match(/<a /gu) ?? []).length, 1, "forthcoming previews must not become article links");
    assert.doesNotMatch(empty, /data-writing-home-unavailable/u);

    const unavailable = renderToStaticMarkup(await Writing({ publishedWriting: [], publishedWritingStatus: "unavailable" }));
    assert.match(unavailable, /role="status" data-writing-home-unavailable/u);
    assert.doesNotMatch(unavailable, /data-writing-home-mosaic|<article /u);
    assert.ok(unavailable.includes(errorCopy.getErrorDictionary(locale).viewTitle));
    assert.equal((unavailable.match(/<a /gu) ?? []).length, 2);
  }
});

test("the Hero's existing #now link resolves to the mounted HQ Pulse without changing locale or section order", async () => {
  for (const locale of locales) {
    const { HqPulse } = loadSource<{ HqPulse: (props: object) => Promise<ReactElement> }>("components/sections/hq-pulse.tsx", {
      "react/jsx-runtime": jsxRuntime,
      "next/link": { __esModule: true, default: "a" },
      "@/data/discovery-index": discoveryData,
      "@/data/human-pulse": humanPulse,
      "@/data/hq-pulse": pulseData,
      "@/data/i18n/hq-pulse": pulseCopy,
      "@/lib/i18n/routing": routing,
      "@/lib/i18n/server": { getLocale: async () => locale },
    });
    const markup = renderToStaticMarkup(await HqPulse({ publishedWriting: articles }));
    assert.equal((markup.match(/id="now"/gu) ?? []).length, 1);
    assert.match(markup, /<section id="pulse"/u);
    assert.match(markup, /<header id="now"[^>]*>[\s\S]*<h2 id="pulse-title"/u);
    // Verify the unchanged incoming link rather than inventing a test-only destination.
    assert.match(readFileSync("components/sections/hero.tsx", "utf8"), /href="#now"/u);
  }
});
