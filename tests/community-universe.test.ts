import { loadSource } from "./helpers/load-source";
import * as countryReachModule from "../lib/analytics/country-reach";
import * as reachPeriodsModule from "../lib/analytics/reach-periods";
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import world from "world-atlas/countries-50m.json";
import { publicUniverse, universeMatches } from "../lib/discovery-universe/content";
import { discoverItems } from "../lib/discovery";
import { communityProductAliases } from "../data/i18n/community-search";
import { discoveryIndex } from "../data/discovery-index";
import { localizeDiscoveryItems } from "../data/i18n/discovery";
import { communityCopy } from "../data/i18n/community";
import { regionByNumericCode, regionByCountryCode } from "../data/reach-country-codes";
import { reachProjectId } from "../lib/analytics/country-reach";
import { prepareReachPeriod, reachColorIndex, inactiveReach } from "../lib/analytics/reach-periods";
import { echoFeedUrl, parseEchoFeed } from "../lib/echowall/feed";
import { echoMessageLimit, echoTextLength } from "../lib/echowall/limits";
import { locales } from "../lib/i18n/config";
import { localizeHref } from "../lib/i18n/routing";

const now = Date.parse("2026-11-24T11:00:00.000Z");
const reference = {
  version: 1, source: "vercel-web-analytics", metric: "pageviews", projectId: reachProjectId,
  provenance: "owner-approved-aggregate", publicDisplayApproved: true, routeScope: "public-allowlist-v1",
  periodStart: "2026-11-01T00:00:00.000Z", periodEnd: "2026-11-24T00:00:00.000Z",
  retrievedAt: "2026-11-24T10:00:00.000Z", geography: "complete",
  countries: [{ countryCode: "DE", pageViews: 20 }, { countryCode: "NZ", pageViews: 30 },
    { countryCode: "AU", pageViews: 30 }, { countryCode: "FR", pageViews: 4 }],
};

test("full country atlas resolves verified numeric codes and preserves unmapped geometries as neutral", () => {
  const regions = world.objects.countries.geometries;
  const mapped = regions.map((shape) => regionByNumericCode[String((shape as { id?: string }).id ?? "").padStart(3, "0")]?.[0]);
  assert.ok(new Set(mapped.filter(Boolean)).size >= 225);
  assert.equal(regionByNumericCode["276"][0], "DE");
  assert.equal(regionByNumericCode["036"][0], "AU");
  assert.equal(regionByNumericCode["004"][0], "AF");
  assert.equal(regionByCountryCode.BR, "005");
  assert.equal(regionByCountryCode.MX, "021");
  assert.equal(regionByCountryCode.ZA, "002");
  assert.equal(regionByNumericCode["-99"], undefined);
});

test("periods use the same fixed colors, suppress small values, reject stale values, and rank stable ties", () => {
  const data = prepareReachPeriod(reference, "recent", now);
  assert.equal(data.status, "available");
  if (data.status !== "available") return;
  assert.deepEqual(data.countries.map((row) => row.countryCode), ["AU", "NZ", "DE"]);
  assert.equal(data.displayedViews, 80);
  assert.equal(data.coverage, "partial");
  assert.deepEqual([undefined, 4, 5, 24, 25, 100, 500, 2000].map(reachColorIndex), [0, 0, 1, 1, 2, 3, 4, 5]);
  assert.deepEqual(prepareReachPeriod(reference, "since", now + 86400000 * 2), { status: "unavailable", reason: "stale" });
  assert.equal(prepareReachPeriod({ ...reference, periodStart: "2025-11-01T00:00:00.000Z" }, "recent", now).status, "unavailable");
  assert.equal(prepareReachPeriod({ ...reference, countries: [{ countryCode: "??", pageViews: 4 }] }, "recent", now).status, "unavailable");
  assert.equal(inactiveReach().recent.status, "unavailable");
});

test("wall pagination and search encode public input with deterministic bounds and ignore unavailable likes", () => {
  const parsed = parseEchoFeed({ q: " Alex & Anna ", page: "3", sort: "popular" }, true);
  assert.deepEqual(parsed, { keyword: "Alex & Anna", page: 3, popular: true });
  assert.equal(echoFeedUrl("/en/echowall", parsed), "/en/echowall?q=Alex+%26+Anna&sort=popular&page=3");
  assert.deepEqual(parseEchoFeed({ q: ["first", "second"], page: "-1", sort: "popular" }, false), { keyword: "", page: 1, popular: false });
  assert.equal(parseEchoFeed({ q: "🙂".repeat(9000), page: "9000000" }, false).page, 1000000);
  assert.equal(Array.from(parseEchoFeed({ q: "🙂".repeat(41) }, false).keyword).length, 40);
  assert.equal(echoMessageLimit, 500);
  assert.equal(echoTextLength(" e\u0301🙂 "), 2);
});

for (const locale of locales) test(`${locale}: all public paths appear once in the localized search index`, () => {
  const items = localizeDiscoveryItems(discoveryIndex, locale);
  for (const route of ["/world", "/community#global-reach", "/community", "/echowall"]) {
    assert.equal(items.filter(({ href }) => href === localizeHref(route, locale)).length, 1);
  }
  assert.equal(items.find(({ href }) => href === localizeHref("/community", locale))?.title, communityCopy[locale].community);
});

for (const locale of locales) test(`${locale}: exact Community product aliases outrank incidental matches`, () => {
  const items = localizeDiscoveryItems(discoveryIndex, locale);
  for (const [id, route] of [["page-community", "/community"], ["page-global-reach", "/community#global-reach"], ["page-world-map", "/world"], ["tool-echowall", "/echowall"]]) {
    const item = items.find((entry) => entry.id === id);
    assert.ok(item);
    const phrases = [...new Set([item.title, ...(communityProductAliases(id, locale) ?? [])])];
    for (const phrase of phrases) {
      const match = discoverItems(items, phrase)[0];
      assert.equal(match?.item.href, localizeHref(route, locale), phrase);
      assert.equal(match?.presentation, "match", phrase);
      assert.equal(universeMatches(publicUniverse(items, locale), discoverItems(items, phrase), phrase)[0]?.item.href,
        localizeHref(route, locale), phrase);
    }
  }
});

test("community navigation has three entries and the alias resolves to its canonical anchor", () => {
  const source = (path: string) => readFileSync(path, "utf8");
  const nav = source("components/community/community-nav.tsx");
  assert.deepEqual([...nav.matchAll(/href: "([^"]+)"/gu)].map((match) => match[1]), ["/community", "/echowall", "/world"]);
  assert.match(source("app/global-reach/page.tsx"), /permanentRedirect\(localizeHref\("\/community#global-reach"/u);
  const reach = source("components/community/reach-dashboard.tsx");
  assert.ok(reach.indexOf('{top}</h2>') < reach.indexOf('{children}'));
  assert.ok(reach.indexOf('{children}') < reach.indexOf('{growth}</h2>'));
});

test("local review is environment and loopback gated, excluded from indexing, and echo writes default off", () => {
  const source = (path: string) => readFileSync(path, "utf8");
  assert.match(source("app/community-review/page.tsx"), /if \(!await isCommunityReviewEnabled\(\)\) notFound\(\)/u);
  assert.match(source("lib/community/review-boundary.ts"), /process\.env\.VERCEL \|\| process\.env\.VERCEL_ENV/u);
  assert.doesNotMatch(source("lib/search-discovery.ts"), /"\/community-review"/u);
  assert.match(source("lib/echowall/reaction-identity.ts"), /process\.env\.ECHOWALL_REACTIONS_ENABLED === "true"/u);
  assert.match(source("app/echowall/reactions.ts"), /httpOnly: true/u);
});

test("aggregate ingestion normalizes country codes, removes unknowns and rolls forward complete validated pairs only", async () => {
  const { refreshVerifiedReach } = loadSource<typeof import("../lib/analytics/reach-ingestion")>("lib/analytics/reach-ingestion.ts", {
    "server-only": {}, "./country-reach": countryReachModule, "./reach-periods": reachPeriodsModule,
  });
  const since = { ...reference, countries: [{ countryCode: " de ", pageViews: 30 }, { countryCode: "ZZ", pageViews: 8 }] };
  const recent = { ...reference, countries: [{ countryCode: "DE", pageViews: 20 }] };
  const valid = { source: "vercel-web-analytics" as const, periods: { since, recent } };
  const publishes: reachPeriodsModule.ReachDataset[] = [];
  const publish = async (value: reachPeriodsModule.ReachDataset) => { publishes.push(value); };
  assert.equal(await refreshVerifiedReach(async () => valid, publish, now), true);
  assert.deepEqual(publishes[0].since, {
    status: "available", coverage: "partial", from: reference.periodStart, to: reference.periodEnd,
    updated: reference.retrievedAt, countries: [{ countryCode: "DE", pageViews: 30 }], displayedViews: 30, growth: [], newlyRepresented: [],
  });
  for (const bad of [
    { ...recent, countries: [{ countryCode: "DE", pageViews: 29 }] },
    { ...recent, countries: [{ countryCode: "DE", pageViews: 20 }, { countryCode: "de", pageViews: 20 }] },
    { ...recent, periodEnd: "2026-11-23T00:00:00.000Z" },
  ]) assert.equal(await refreshVerifiedReach(async () => ({ ...valid, periods: { since, recent: bad } }), publish, now), false);
  assert.equal(await refreshVerifiedReach(async () => { throw new Error("provider unavailable"); }, publish, now), false);
  assert.equal(publishes.length, 1);
});
