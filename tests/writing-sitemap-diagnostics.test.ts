import assert from "node:assert/strict";
import { test } from "node:test";
import nextConfig from "../next.config";
import * as spotlights from "../data/spotlights";
import * as nextStep from "../data/find-your-next-step";
import * as lifeAlignment from "../data/life-alignment";
import * as modules from "../data/life-alignment-modules";
import * as projects from "../data/projects";
import * as routing from "../lib/i18n/routing";
import * as config from "../lib/i18n/config";
import * as searchDiscovery from "../lib/search-discovery";
import { mapPublicWritingSummary } from "../lib/writing/domain";
import type { PublishedWritingReadResult } from "../lib/writing/queries";
import type * as Sitemap from "../app/sitemap";
import { loadSource } from "./helpers/load-source";
import { writingDiagnosticsHarness } from "./helpers/writing-diagnostics";

const row = {
  id: "published-fixture", slug: "published-fixture", title: "An authored public thought", deck: "An authored deck",
  excerpt: "A complete authored introduction.", body: "A complete authored article, suitable for the public reading experience.",
  body_json: { version: 1, blocks: [{ type: "paragraph", content: [{ type: "text", text: "A complete authored article, suitable for the public reading experience." }] }] },
  content_type: "essay", topics: ["Ideas"], status: "published", published_at: "2026-10-25T12:00:00Z", source_locale: "de", source_revision: 3,
};

function sitemapHarness(read: (...args: unknown[]) => Promise<PublishedWritingReadResult>, canonical = true) {
  const { diagnostics, records } = writingDiagnosticsHarness();
  const calls: unknown[][] = [];
  const sitemap = loadSource<typeof Sitemap>("app/sitemap.ts", {
    "@/data/spotlights": spotlights, "@/data/find-your-next-step": nextStep, "@/data/life-alignment": lifeAlignment,
    "@/data/life-alignment-modules": modules, "@/data/projects": projects,
    "@/lib/i18n/routing": routing, "@/lib/i18n/config": config,
    "@/lib/search-discovery": { ...searchDiscovery, getCanonicalProductionUrl: () => canonical ? new URL("https://btshq.online") : null },
    "@/lib/writing/queries": { getPublishedWritingForSitemap: (...args: unknown[]) => { calls.push(args); return read(...args); } },
    "@/lib/writing/read-diagnostics": diagnostics,
  });
  return { sitemap, records, calls };
}

test("only the sitemap adds explicit no-store protection for browser and CDN error responses", async () => {
  const rules = await nextConfig.headers!();
  const rule = rules.find(({ source }) => source === "/sitemap.xml");
  assert.ok(rule);
  const headers = Object.fromEntries(rule.headers.map(({ key, value }) => [key.toLowerCase(), value]));
  assert.match(headers["cache-control"], /private, no-store, max-age=0/u);
  assert.equal(headers["cdn-cache-control"], "no-store");
  assert.equal(headers["vercel-cdn-cache-control"], "no-store");
  assert.ok(rules.filter(({ source }) => source !== "/sitemap.xml").every(({ headers }) => headers.every(({ key }) => !/cdn-cache-control/iu.test(key))));
});

test("sitemap generation distinguishes successful empty and unavailable reads without inventing Writing URLs", async () => {
  for (const status of ["data", "unavailable"] as const) {
    const fixture = sitemapHarness(async () => ({ status, data: [] }));
    if (status === "unavailable") {
      await assert.rejects(fixture.sitemap.default(), /Sitemap temporarily unavailable\./u);
      assert.equal(fixture.records[0].state, "unavailable");
      assert.equal(fixture.records[0].emitted_url_count, 0);
      continue;
    }
    const entries = await fixture.sitemap.default();
    assert.deepEqual(entries, fixture.sitemap.createSitemap([]));
    assert.equal(entries.length, 273);
    assert.equal(entries.some(({ url }) => new URL(url).pathname.includes("/writing/published-fixture")), false);
    assert.equal(fixture.records[0].state, status === "data" ? "success" : "unavailable");
    assert.equal(fixture.records[0].accepted_count, 0);
    assert.equal(fixture.records[0].emitted_url_count, entries.length);
    assert.equal(fixture.records[0].cache_event, "handler_execution");
    assert.deepEqual(fixture.calls, [[fixture.records[0].correlation_id]]);
    assert.equal(fixture.sitemap.dynamic, "force-dynamic");
    for (const locale of config.locales) {
      assert.ok(entries.some(({ url }) => url === `https://btshq.online${routing.getLocalizedPathname("/writing", locale)}`));
    }
  }
});

test("sitemap preserves seven current translation URLs, canonical alternates and source fallback", async () => {
  const translated = config.locales.filter((locale) => locale !== "de").map((locale) => ({
    locale, title: `Authored thought ${locale}`, deck: row.deck, excerpt: row.excerpt, body: row.body,
    body_json: row.body_json, status: "translated", source_revision: 3,
  }));
  const summary = mapPublicWritingSummary({ ...row, translations: translated }, "de");
  assert.ok(summary);
  const fixture = sitemapHarness(async () => ({ status: "data", data: [summary] }));
  const writing = (await fixture.sitemap.default()).filter(({ url }) => url.includes(`/writing/${row.slug}`));
  assert.equal(writing.length, 7);
  assert.equal(new Set(writing.map(({ url }) => url)).size, 7);
  const languages = Object.fromEntries(config.locales.map((locale) => [locale, `https://btshq.online${routing.getLocalizedPathname(`/writing/${row.slug}`, locale)}`]));
  for (const entry of writing) assert.deepEqual(entry.alternates?.languages, { ...languages, "x-default": languages.de });
  assert.equal(fixture.records[0].accepted_count, 1);
  assert.equal(fixture.records[0].state, "success");
  assert.doesNotMatch(JSON.stringify(fixture.records), /published-fixture|authored|body_json|https/iu);

  const fallback = mapPublicWritingSummary({ ...row, translations: translated.map((item) => ({ ...item, source_revision: 2 })) }, "en");
  assert.ok(fallback);
  const fallbackFixture = sitemapHarness(async () => ({ status: "data", data: [fallback] }));
  const fallbackUrls = (await fallbackFixture.sitemap.default()).filter(({ url }) => url.includes(`/writing/${row.slug}`));
  assert.equal(fallbackUrls.length, 1);
  assert.equal(fallbackUrls[0].url, languages.de);
});

test("generation never restores prior article records after a withdrawn, synthetic or unavailable read", async () => {
  const summary = mapPublicWritingSummary(row, "de");
  assert.ok(summary);
  let current: PublishedWritingReadResult = { status: "data", data: [summary] };
  const fixture = sitemapHarness(async () => current);
  assert.ok((await fixture.sitemap.default()).some(({ url }) => url.includes(`/writing/${row.slug}`)));
  for (const candidate of [{ ...row, status: "draft" }, { ...row, title: "QA" }]) {
    assert.equal(mapPublicWritingSummary(candidate, "de"), null);
    current = { status: "data", data: [] };
    assert.equal((await fixture.sitemap.default()).some(({ url }) => url.includes(`/writing/${row.slug}`)), false);
  }
  current = { status: "unavailable", data: [] };
  await assert.rejects(fixture.sitemap.default(), /Sitemap temporarily unavailable/u);
  current = { status: "data", data: [summary] };
  assert.ok((await fixture.sitemap.default()).some(({ url }) => url.includes(`/writing/${row.slug}`)), "recovery is read on the very next attempt");
});

test("sitemap exceptions remain exceptions and log only safe classifications", async () => {
  const error = Object.assign(new Error("PRIVATE_TOKEN PRIVATE_PERSON PRIVATE_ARTICLE"), { code: "PGRST303", details: "PRIVATE_SESSION" });
  const fixture = sitemapHarness(async () => { throw error; });
  await assert.rejects(fixture.sitemap.default(), { message: "Sitemap temporarily unavailable." });
  assert.equal(fixture.records[0].state, "unavailable");
  assert.equal(fixture.records[0].error_class, "auth_claims");
  assert.equal(fixture.records[0].claim_reason, "unclassified");
  assert.doesNotMatch(JSON.stringify(fixture.records), /PRIVATE_/u);
});

test("missing production canonical origin still fails closed without generated URLs", async () => {
  const fixture = sitemapHarness(async () => ({ status: "data", data: [] }), false);
  assert.deepEqual(await fixture.sitemap.default(), []);
  assert.deepEqual(fixture.calls, [], "Preview never queries the publication backend");
  assert.deepEqual(fixture.records, []);
});

test("the 17-article language distribution preserves 387 URLs and removes withdrawn or stale translations", async () => {
  const rows = Array.from({ length: 17 }, (_, index) => ({
    ...row, id: `published-${index}`, slug: `published-${index}`,
    translations: config.locales.filter(locale => locale !== "de").slice(0, index < 14 ? 6 : index === 14 ? 3 : 5).map(locale => ({
      locale, title: `An authored thought ${locale}`, deck: row.deck, excerpt: row.excerpt,
      body: row.body, body_json: row.body_json, status: "translated", source_revision: 3,
    })),
  }));
  const summaries = rows.map(value => mapPublicWritingSummary(value, "de")).filter(value => value !== null);
  assert.equal(summaries.length, 17);
  let current: PublishedWritingReadResult = { status: "data", data: summaries };
  const fixture = sitemapHarness(async () => current);
  const entries = await fixture.sitemap.default();
  assert.equal(entries.length, 387);
  assert.equal(entries.filter(({ url }) => /\/writing\/published-\d+$/u.test(url)).length, 114);
  assert.equal(new Set(entries.map(({ url }) => url)).size, entries.length);
  assert.ok(entries.every(({ url }) => url.startsWith("https://btshq.online/")));

  assert.equal(mapPublicWritingSummary({ ...rows[0], status: "draft" }, "de"), null);
  current = { status: "data", data: summaries.slice(1) };
  assert.equal((await fixture.sitemap.default()).some(({ url }) => /\/writing\/published-0$/u.test(url)), false);

  const revised = mapPublicWritingSummary({ ...rows[1], source_revision: 4 }, "de");
  assert.ok(revised);
  assert.deepEqual(revised.availableLanguages, ["de"]);
  current = { status: "data", data: [revised] };
  const remaining = (await fixture.sitemap.default()).filter(({ url }) => /\/writing\/published-1$/u.test(url));
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].url, "https://btshq.online/writing/published-1");
  current = { status: "unavailable", data: [] };
  await assert.rejects(fixture.sitemap.default(), /Sitemap temporarily unavailable/u);
});
