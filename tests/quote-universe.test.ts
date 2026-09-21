import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { HomeQuote } from "../components/quotes/home-quote";
import { LocaleProvider } from "../components/i18n/locale-context";
import { quoteUniverse } from "../data/quotes";
import { locales, type Locale } from "../lib/i18n/config";
import { selectQuote } from "../lib/quotes";
import type { QuoteRecord } from "../types/quote";

test("the curated universe has stable identities, meaningful volume, and complete locales", () => {
  assert.ok(quoteUniverse.length >= 24);
  assert.equal(new Set(quoteUniverse.map(({ id }) => id)).size, quoteUniverse.length);
  for (const quote of quoteUniverse) {
    assert.match(quote.id, /^btsq-[a-z0-9-]+$/u);
    assert.ok(quote.semanticFamily.length > 3);
    assert.ok(quote.themes.length > 0);
    assert.equal(quote.status, "active");
    for (const locale of locales) assert.ok(quote.variants[locale].text.length >= 24, `${quote.id}:${locale}`);
  }
});

test("daily selection is deterministic for date and locale", () => {
  const context = { locale: "en" as const, surface: "daily" as const, dateKey: "2026-09-21" };
  assert.deepEqual(selectQuote(context), selectQuote(context));
  assert.equal(selectQuote(context).fallbackLevel, "specific");
});

test("homepage quote renders semantic localized controls without client-only failure", () => {
  const TestLocaleProvider = LocaleProvider as ComponentType<{ locale: Locale; children?: ReactNode }>;
  const html = renderToStaticMarkup(createElement(TestLocaleProvider, { locale: "ru" }, createElement(HomeQuote, { dateKey: "2026-09-21" })));
  assert.match(html, /<blockquote>/u);
  assert.match(html, /data-quote-surface="daily"/u);
  assert.match(html, /Другая цитата/u);
  assert.match(html, /Поделиться/u);
});

test("locale selection returns the curated variant for the same conceptual quote", () => {
  const record = quoteUniverse[0]!;
  for (const locale of locales) {
    const selected = selectQuote({ locale, surface: "daily", dateKey: "2026-09-21" }, [record]);
    assert.equal(selected.id, record.id);
    assert.equal(selected.text, record.variants[locale].text);
  }
});

test("Life Alignment mapping uses actual snapshot, signal, and relationship context", () => {
  const self = selectQuote({ locale: "en", surface: "life-alignment", lifeAlignment: { moduleId: "self", snapshotGroup: "open", signal: "uncertain" } });
  assert.equal(self.fallbackLevel, "specific");
  const relationship = selectQuote({ locale: "en", surface: "life-alignment", lifeAlignment: { moduleId: "founder", relationshipCategories: ["potential-friction"] } });
  assert.equal(relationship.fallbackLevel, "specific");
  assert.ok(quoteUniverse.find(({ id }) => id === relationship.id)?.lifeAlignment?.moduleIds?.includes("founder"));
});

test("FYNS selection combines canonical Character and dimension metadata", () => {
  const selected = selectQuote({ locale: "de", surface: "fyns", fyns: { journey: "self", characterIds: ["builder"], dimensions: ["making"] } });
  assert.equal(selected.fallbackLevel, "specific");
  const record = quoteUniverse.find(({ id }) => id === selected.id)!;
  assert.ok(record.fyns?.characterIds?.includes("builder") || record.fyns?.dimensions?.includes("making"));
});

function variants(text: string): QuoteRecord["variants"] {
  return Object.fromEntries(locales.map((locale) => [locale, { text: `${text} ${locale} — enough curated text.` }])) as Record<Locale, { text: string }>;
}

const fixture = (id: string, family: string, product: "general" | "life-alignment" = "general"): QuoteRecord => ({
  id: `btsq-${id}`,
  variants: variants(id),
  origin: "bts-original",
  themes: ["clarity"],
  tones: ["grounded"],
  moods: ["curious"],
  products: [product],
  semanticFamily: family,
  dailyEligible: true,
  shareEligible: true,
  status: "active",
});

test("explicit fallbacks broaden from product to theme to general", () => {
  const product = fixture("product", "product", "life-alignment");
  const theme = fixture("theme", "theme");
  const general = { ...fixture("general", "general"), themes: ["rest"] as const };
  const productResult = selectQuote({ locale: "en", surface: "life-alignment", themes: ["clarity"], lifeAlignment: { moduleId: "self" } }, [product, theme, general]);
  assert.equal(productResult.id, product.id);
  assert.equal(productResult.fallbackLevel, "product");
  const themeResult = selectQuote({ locale: "en", surface: "life-alignment", themes: ["clarity"], lifeAlignment: { moduleId: "self" } }, [theme, general]);
  assert.equal(themeResult.id, theme.id);
  assert.equal(themeResult.fallbackLevel, "theme");
  const generalResult = selectQuote({ locale: "en", surface: "life-alignment", themes: ["meaning"], lifeAlignment: { moduleId: "self" } }, [general]);
  assert.equal(generalResult.fallbackLevel, "general");
});

test("Another Quote exclusions avoid exact repeats and recent semantic families when alternatives exist", () => {
  const first = fixture("first", "repeat-family");
  const sibling = fixture("sibling", "repeat-family");
  const fresh = fixture("fresh", "fresh-family");
  const next = selectQuote({ locale: "en", surface: "daily", dateKey: "2026-09-21", seed: "explore-1", excludeIds: [first.id], excludeFamilies: [first.semanticFamily] }, [first, sibling, fresh]);
  assert.equal(next.id, fresh.id);
  assert.equal(next.semanticFamily, "fresh-family");
});

test("Another Quote broadens safely when a specific result pool is exhausted", () => {
  const specific = { ...fixture("specific", "specific-family", "life-alignment"), lifeAlignment: { moduleIds: ["partner" as const] } };
  const product = fixture("product-next", "product-family", "life-alignment");
  const next = selectQuote({ locale: "en", surface: "life-alignment", seed: "explore-1", excludeIds: [specific.id], excludeFamilies: [specific.semanticFamily], lifeAlignment: { moduleId: "partner" } }, [specific, product]);
  assert.equal(next.id, product.id);
  assert.equal(next.fallbackLevel, "product");
});

test("share eligibility and BTS-original attribution are explicit and truthful", () => {
  for (const quote of quoteUniverse) {
    const selected = selectQuote({ locale: "en", surface: "daily", dateKey: "2026-09-21" }, [{ ...quote, dailyEligible: true }]);
    assert.equal(selected.shareEligible, quote.shareEligible);
    assert.equal(selected.origin, "bts-original");
    assert.equal(selected.attribution, "bts.online");
    assert.equal(quote.variants.en.attribution, undefined);
  }
});

test("share and repetition boundaries contain no identity, private result, or tracking storage", async () => {
  const [experience, dialog, adapters] = await Promise.all([
    readFile("components/quotes/quote-experience.tsx", "utf8"),
    readFile("components/quotes/quote-share-dialog.tsx", "utf8"),
    readFile("components/quotes/result-quotes.tsx", "utf8"),
  ]);
  const source = `${experience}\n${dialog}\n${adapters}`;
  for (const prohibited of ["localStorage", "sessionStorage", "document.cookie", "sessionId", "inviteToken", "accountId", "profileId", "rawAnswers", "sendBeacon"]) {
    assert.equal(source.includes(prohibited), false, prohibited);
  }
  assert.doesNotMatch(dialog, /window\.location\.href/u);
  assert.match(dialog, /safeSharePath/u);
});
