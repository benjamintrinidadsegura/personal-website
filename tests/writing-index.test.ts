import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import { ShareFormatSignal } from "../components/writing/share/share-format-signal";
import { getGlobalDictionary } from "../data/i18n/global";
import * as writingCopy from "../data/i18n/writing";
import { getWritingShareDictionary } from "../data/i18n/writing-share";
import { localeDetails, locales, type Locale } from "../lib/i18n/config";
import { createLocalizedMetadata } from "../lib/i18n/metadata";
import { localizeHref } from "../lib/i18n/routing";
import type { PublicWritingSummary } from "../types/writing";

const labels = {
  de: ["Neuester Text", "Weitere Texte"],
  en: ["Latest writing", "More writing"],
  es: ["Texto más reciente", "Más textos"],
  tr: ["En yeni yazı", "Diğer yazılar"],
  pl: ["Najnowszy tekst", "Pozostałe teksty"],
  el: ["Νεότερο κείμενο", "Περισσότερα κείμενα"],
  ru: ["Самый новый текст", "Другие тексты"],
} satisfies Record<Locale, [string, string]>;

const articles: PublicWritingSummary[] = ["newest", "previous", "oldest"].map((slug, index) => ({
  id: slug, slug, title: `Article ${slug}`, deck: "An authored subtitle", excerpt: "An authored invitation to read this article.",
  contentType: "essay", topics: ["Ideas"], publishedAt: `2026-10-0${5 - index}T12:00:00.000Z`, readingMinutes: 3,
  language: "de", sourceLanguage: "de", availableLanguages: ["de"], translationStatus: "source",
}));

const compiledPage = ts.transpileModule(readFileSync(new URL("../app/writing/page.tsx", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;

function loadIndex(locale: Locale, published: PublicWritingSummary[]) {
  // Render the current production page with fixture data; no server, database,
  // newsletter or request-header integration is required for these UI checks.
  const exports = {};
  const dependencies: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    "next/link": { __esModule: true, default: "a" },
    "@/components/newsletter/newsletter-cta": { NewsletterCta: () => null },
    "@/components/writing/share/share-format-signal": { ShareFormatSignal },
    "@/data/i18n/writing": writingCopy,
    "@/data/i18n/writing-share": { getWritingShareDictionary },
    "@/data/i18n/global": { getGlobalDictionary },
    "@/lib/i18n/metadata": { createLocalizedMetadata },
    "@/lib/i18n/routing": { localizeHref },
    "@/lib/i18n/server": { getLocale: async () => locale },
    "@/lib/writing/queries": { getPublishedWriting: async (requested: Locale) => { assert.equal(requested, locale); return published; } },
    "@/lib/i18n/config": { localeDetails },
  };
  runInNewContext(compiledPage, { exports, require: (name: string) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected index dependency: ${name}`);
    return dependencies[name];
  } });
  return exports as { default: () => Promise<ReactElement>; generateMetadata: () => Promise<Metadata> };
}

test("Writing index labels describe newest and remaining writing in every supported locale", () => {
  assert.deepEqual(Object.keys(labels), locales);
  for (const locale of locales) {
    const copy = writingCopy.getWritingDictionary(locale).page;
    assert.deepEqual([copy.featured, copy.latest], labels[locale], locale);
  }
});

test("Writing index public query selects published articles newest-first", () => {
  const query = readFileSync(new URL("../lib/writing/queries.ts", import.meta.url), "utf8");
  assert.match(query, /\.eq\("status", "published"\)/u);
  assert.match(query, /\.not\("published_at", "is", null\)/u);
  assert.match(query, /\.order\("published_at", \{ ascending: false \}\)/u);
});

test("Writing index renders the newest article once in the hero and preserves the remaining order and localized URLs", async () => {
  for (const locale of locales) {
    const html = renderToStaticMarkup(await loadIndex(locale, articles).default());
    const copy = writingCopy.getWritingDictionary(locale).page;
    assert.ok(html.includes(`>${copy.featured}</p>`), locale);
    assert.ok(html.includes(`>${copy.latest}</h2>`), locale);
    const links = [...html.matchAll(/<a href="([^"]+)"[^>]*class="writing-index-(?:featured|row)\b/gu)].map((match) => match[1]);
    assert.deepEqual(links, articles.map((article) => localizeHref(`/writing/${article.slug}`, locale)), locale);
    const remaining = html.slice(html.indexOf("<ol"));
    assert.equal(remaining.includes("/writing/newest"), false, locale);
    assert.ok(remaining.indexOf("/writing/previous") < remaining.indexOf("/writing/oldest"), locale);
  }
});

test("Writing index with one article displays only the newest hero", async () => {
  for (const locale of locales) {
    const html = renderToStaticMarkup(await loadIndex(locale, articles.slice(0, 1)).default());
    assert.match(html, /id="featured-writing-title"/u);
    assert.doesNotMatch(html, /id="latest-writing-title"|data-writing-index-mosaic/u);
    assert.equal([...html.matchAll(/href="[^"]*\/writing\/newest"/gu)].length, 1, locale);
  }
});

test("Writing index with no published articles retains its localized empty state", async () => {
  for (const locale of locales) {
    const html = renderToStaticMarkup(await loadIndex(locale, []).default());
    assert.ok(html.includes(writingCopy.getWritingDictionary(locale).page.firstTitle), locale);
    assert.match(html, /id="empty-writing-title"/u);
    assert.doesNotMatch(html, /id="featured-writing-title"|id="latest-writing-title"/u);
  }
});

test("Writing index metadata and canonical URLs remain localized", async () => {
  for (const locale of locales) {
    const metadata = await loadIndex(locale, articles).generateMetadata();
    assert.equal(metadata.title, "Writing | btshq.online");
    assert.equal(metadata.description, writingCopy.getWritingDictionary(locale).page.description);
    assert.equal(metadata.alternates?.canonical, localizeHref("/writing", locale));
  }
});
