import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import createRobots from "../app/robots";
import { createSitemap } from "../app/sitemap";
import { canonicalIntentClusters, discoverySurfaces, getDiscoverySurface } from "../data/search-discovery";
import { locales } from "../lib/i18n/config";
import {
  createToolStructuredData,
  getLocalizedPrivateRoutePrefixes,
  getSiteVerificationMetadata,
  modelTrainingCrawlers,
  publicStaticRoutes,
  searchRetrievalCrawlers,
} from "../lib/search-discovery";
import { classifyDiscoveryReferrer, discoveryReferralCategories } from "../lib/search-discovery-analytics";

function source(relativePath: string) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

async function withProductionEnvironment<T>(callback: () => T | Promise<T>): Promise<T> {
  const previousSiteUrl = process.env.SITE_URL;
  const previousNodeEnv = process.env.NODE_ENV;
  try {
    Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true, enumerable: true, writable: true });
    process.env.SITE_URL = "https://bts.online";
    return await callback();
  } finally {
    if (previousSiteUrl === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = previousSiteUrl;
    Object.defineProperty(process.env, "NODE_ENV", { value: previousNodeEnv, configurable: true, enumerable: true, writable: true });
  }
}

test("canonical intent clusters map overlapping questions to one existing destination", () => {
  assert.equal(canonicalIntentClusters.length, 5);
  assert.equal(new Set(canonicalIntentClusters.map(({ id }) => id)).size, canonicalIntentClusters.length);
  assert.equal(new Set(canonicalIntentClusters.map(({ canonicalPath }) => canonicalPath)).size, canonicalIntentClusters.length);
  for (const cluster of canonicalIntentClusters) {
    assert.ok(cluster.questions.length >= 3, cluster.id);
    assert.ok(cluster.questions.every((question) => question.endsWith("?")), cluster.id);
    assert.ok(cluster.canonicalPath.startsWith("/"), cluster.id);
  }
});

test("the two first discovery surfaces provide substantive localized answers and explicit trust boundaries", () => {
  assert.deepEqual(Object.keys(discoverySurfaces).sort(), ["money-profile", "personal-advantage"]);
  for (const surfaceId of ["personal-advantage", "money-profile"] as const) {
    for (const locale of locales) {
      const surface = getDiscoverySurface(surfaceId, locale);
      assert.ok(surface.copy.question.length > 20, `${surfaceId}:${locale}: question`);
      assert.ok(surface.copy.answer.length > 120, `${surfaceId}:${locale}: answer`);
      assert.ok(surface.copy.boundary.length > 90, `${surfaceId}:${locale}: boundary`);
      assert.equal(surface.copy.related.length, 2, `${surfaceId}:${locale}: related routes`);
      assert.equal(surface.copy.related.every(({ href }) => href !== surface.path), true, `${surfaceId}:${locale}: no self-link`);
    }
  }

  const combined = JSON.stringify(discoverySurfaces);
  assert.doesNotMatch(combined, /science proves|guaranteed|diagnoses you|financial advice/iu);
  assert.match(discoverySurfaces["personal-advantage"].copy.en.boundary, /not a scientifically validated/u);
  assert.match(discoverySurfaces["money-profile"].copy.en.boundary, /not financial, investment, tax, credit or debt advice/u);
});

test("robots deliberately separates discovery retrieval from model training and protects localized private routes", async () => {
  await withProductionEnvironment(() => {
    const result = createRobots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const retrieval = rules.find(({ userAgent }) => Array.isArray(userAgent) && userAgent.includes("OAI-SearchBot"));
    const training = rules.find(({ userAgent }) => Array.isArray(userAgent) && userAgent.includes("GPTBot"));
    assert.ok(retrieval);
    assert.ok(training);
    assert.deepEqual(searchRetrievalCrawlers, ["Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User"]);
    assert.deepEqual(modelTrainingCrawlers, ["GPTBot"]);
    assert.equal(training.disallow, "/");
    const disallowed = Array.isArray(retrieval.disallow) ? retrieval.disallow : [retrieval.disallow];
    for (const route of getLocalizedPrivateRoutePrefixes()) assert.ok(disallowed.includes(route), route);
    assert.ok(disallowed.includes("/life-alignment/partner/shared-device"));
    assert.ok(disallowed.includes("/en/life-alignment/partner/shared-device"));
  });
});

test("sitemap contains unique canonical locale routes and excludes private and legacy aliases", async () => {
  await withProductionEnvironment(() => {
    const entries = createSitemap([]);
    const urls = entries.map(({ url }) => url);
    assert.equal(new Set(urls).size, urls.length);
    for (const route of publicStaticRoutes) {
      assert.ok(urls.includes(`https://bts.online${route === "/" ? "/" : route}`), route);
      assert.ok(urls.includes(`https://bts.online/en${route === "/" ? "" : route}`), `en:${route}`);
    }
    for (const prefix of getLocalizedPrivateRoutePrefixes()) {
      assert.equal(urls.some((url) => new URL(url).pathname.startsWith(prefix)), false, prefix);
    }
    assert.equal(urls.some((url) => url.includes("/goatrecrutainer/career-spotlight")), false);
    assert.equal(urls.some((url) => url.includes("/de/")), false);
  });
});

test("tool schema is small, localized and contains no authority or rating claims", () => {
  const structured = createToolStructuredData({
    applicationCategory: "LifestyleApplication",
    description: "A structured self-reflection about repeated combinations in lived experience.",
    locale: "en",
    name: "Personal Advantage Map",
    pathname: "/tools/personal-advantage",
  });
  const graph = structured["@graph"];
  assert.deepEqual(graph.map((node) => node["@type"]), ["WebPage", "WebApplication", "BreadcrumbList"]);
  assert.equal(graph[0].url, "https://bts.online/en/tools/personal-advantage");
  assert.equal(graph[0].inLanguage, "en-GB");
  const serialized = JSON.stringify(structured);
  assert.doesNotMatch(serialized, /AggregateRating|Review|Medical|diagnos/iu);
});

test("verification metadata is optional, validated and contains no invented token", () => {
  const previousGoogle = process.env.GOOGLE_SITE_VERIFICATION;
  const previousBing = process.env.BING_SITE_VERIFICATION;
  try {
    delete process.env.GOOGLE_SITE_VERIFICATION;
    delete process.env.BING_SITE_VERIFICATION;
    assert.equal(getSiteVerificationMetadata(), undefined);
    process.env.GOOGLE_SITE_VERIFICATION = "short";
    process.env.BING_SITE_VERIFICATION = "unsafe token with spaces";
    assert.equal(getSiteVerificationMetadata(), undefined);
    process.env.GOOGLE_SITE_VERIFICATION = "google-token_123456";
    process.env.BING_SITE_VERIFICATION = "bing-token.123456";
    assert.deepEqual(getSiteVerificationMetadata(), {
      google: "google-token_123456",
      other: { "msvalidate.01": "bing-token.123456" },
    });
  } finally {
    if (previousGoogle === undefined) delete process.env.GOOGLE_SITE_VERIFICATION;
    else process.env.GOOGLE_SITE_VERIFICATION = previousGoogle;
    if (previousBing === undefined) delete process.env.BING_SITE_VERIFICATION;
    else process.env.BING_SITE_VERIFICATION = previousBing;
  }
});

test("referral measurement emits only a broad allowlisted category", () => {
  assert.deepEqual(discoveryReferralCategories, ["direct", "internal", "organic-search", "ai-assistant", "external"]);
  assert.equal(classifyDiscoveryReferrer("", "https://bts.online"), "direct");
  assert.equal(classifyDiscoveryReferrer("https://bts.online/about", "https://bts.online"), "internal");
  assert.equal(classifyDiscoveryReferrer("https://www.google.de/search?q=private", "https://bts.online"), "organic-search");
  assert.equal(classifyDiscoveryReferrer("https://chatgpt.com/c/example", "https://bts.online"), "ai-assistant");
  assert.equal(classifyDiscoveryReferrer("https://example.com/path?secret=value", "https://bts.online"), "external");
  const analytics = source("lib/search-discovery-analytics.ts");
  assert.match(analytics, /"personal-advantage": "\/tools\/personal-advantage"/u);
  assert.match(analytics, /"money-profile": "\/tools\/money-profile"/u);
  assert.doesNotMatch(analytics.slice(analytics.indexOf("detail:")), /\breferrer\s*:/iu);
  assert.doesNotMatch(analytics, /searchParams/iu);
});

test("discovery copy is present in initial tool markup and private shared-device results remain noindex", () => {
  const advantage = source("components/personal-advantage/personal-advantage-experience.tsx");
  const money = source("components/money-profile/money-profile-experience.tsx");
  const advantageRoute = source("app/tools/personal-advantage/page.tsx");
  const moneyRoute = source("app/tools/money-profile/page.tsx");
  const sharedDevice = source("app/life-alignment/partner/shared-device/page.tsx");
  assert.match(advantage, /if \(!hydrated\) return <AdvantageIntro/u);
  assert.doesNotMatch(advantage, /if \(!hydrated\) return <div/u);
  assert.match(advantage, /\{primer\}/u);
  assert.match(money, /\{primer\}/u);
  assert.match(advantageRoute, /introPrimer=\{<DiscoveryPrimer locale=\{locale\} surface="personal-advantage" \/>\}/u);
  assert.match(moneyRoute, /introPrimer=\{<DiscoveryPrimer locale=\{locale\} surface="money-profile" \/>\}/u);
  assert.doesNotMatch(advantage, /data\/search-discovery/u);
  assert.doesNotMatch(money, /data\/search-discovery/u);
  assert.match(sharedDevice, /robots: \{ index: false, follow: false \}/u);
  assert.match(source("next.config.ts"), /partner\/shared-device/u);
});

test("operational search and AI discovery documentation covers release acceptance", () => {
  const documentation = source("docs/search-ai-discovery.md");
  for (const heading of [
    "Search + AI discovery principles",
    "Public and private indexing policy",
    "Canonical intent clusters",
    "Crawler policy",
    "Structured data policy",
    "Measurement",
    "Evidence and trust boundaries",
    "Release Acceptance",
    "Deferred opportunities",
  ]) assert.match(documentation, new RegExp(heading.replaceAll("+", "\\+"), "u"), heading);
  assert.match(documentation, /Google Search Console/u);
  assert.match(documentation, /Bing Webmaster Tools/u);
  assert.match(documentation, /IndexNow/u);
  assert.match(documentation, /not externally re-verified/u);
});
