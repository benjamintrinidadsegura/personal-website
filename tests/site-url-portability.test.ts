import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getAiSummaryCopy } from "../data/i18n/ai-summary";
import { locales } from "../lib/i18n/config";
import { createToolStructuredData, getCanonicalProductionUrl } from "../lib/search-discovery";
import { canonicalBtsShareUrl } from "../lib/sharing/destinations";
import { absoluteSiteUrl, getSiteUrl, isCanonicalIndexingEnvironment, parseSiteUrl, requireSiteUrl } from "../lib/site-url";

const PORTABLE_ORIGIN = "https://btsonline.example";

test("SITE_URL accepts one clean public origin and rejects ambiguous or credential-bearing values", () => {
  assert.equal(parseSiteUrl(PORTABLE_ORIGIN)?.origin, PORTABLE_ORIGIN);
  assert.equal(parseSiteUrl("http://localhost:3000")?.origin, "http://localhost:3000");
  for (const rejected of [
    "http://btsonline.example",
    "https://user:pass@btsonline.example",
    "https://btsonline.example:8443",
    "https://btsonline.example/path",
    "https://btsonline.example/?tracking=1",
    "https://btsonline.example/#fragment",
  ]) assert.equal(parseSiteUrl(rejected), null, rejected);
  assert.equal(requireSiteUrl({ SITE_URL: "http://localhost:3000", NODE_ENV: "development" }).origin, "http://localhost:3000");
  assert.throws(
    () => requireSiteUrl({ SITE_URL: "http://localhost:3000", NODE_ENV: "production", VERCEL_ENV: "production" }),
    /canonical HTTPS origin/u,
  );
  assert.equal(
    requireSiteUrl({ SITE_URL: "https://btshq.online", NODE_ENV: "production", VERCEL_ENV: "production" }).origin,
    "https://btshq.online",
  );
});

test("Production indexing uses configured SITE_URL while Vercel previews fail closed", () => {
  const production = { NODE_ENV: "production", VERCEL_ENV: "production", SITE_URL: PORTABLE_ORIGIN };
  const preview = { NODE_ENV: "production", VERCEL_ENV: "preview", SITE_URL: "https://branch-project.vercel.app" };
  assert.equal(getSiteUrl(production)?.origin, PORTABLE_ORIGIN);
  assert.equal(isCanonicalIndexingEnvironment(production), true);
  assert.equal(isCanonicalIndexingEnvironment(preview), false);

  const previous = { nodeEnv: process.env.NODE_ENV, vercelEnv: process.env.VERCEL_ENV, siteUrl: process.env.SITE_URL };
  try {
    Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true, enumerable: true, writable: true });
    process.env.VERCEL_ENV = "production";
    process.env.SITE_URL = PORTABLE_ORIGIN;
    assert.equal(getCanonicalProductionUrl()?.origin, PORTABLE_ORIGIN);
    process.env.VERCEL_ENV = "preview";
    assert.equal(getCanonicalProductionUrl(), null);
  } finally {
    Object.defineProperty(process.env, "NODE_ENV", { value: previous.nodeEnv, configurable: true, enumerable: true, writable: true });
    if (previous.vercelEnv === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous.vercelEnv;
    if (previous.siteUrl === undefined) delete process.env.SITE_URL; else process.env.SITE_URL = previous.siteUrl;
  }
});

test("AI prompts use the fixed public source while structured data and shares use the injected runtime origin", () => {
  const siteUrl = new URL(PORTABLE_ORIGIN);
  for (const locale of locales) {
    const prompt = getAiSummaryCopy(locale).prompt;
    assert.match(prompt, /btshq\.online/u, locale);
    assert.match(prompt, /https:\/\/btshq\.online/u, locale);
    assert.doesNotMatch(prompt, /https:\/\/btsonline\.example/u, locale);
  }

  const structured = createToolStructuredData({
    applicationCategory: "LifestyleApplication",
    description: "Portable canonical source",
    locale: "en",
    name: "Portable tool",
    pathname: "/tools/personal-advantage",
    siteUrl,
  });
  assert.equal(structured["@graph"][0].url, `${PORTABLE_ORIGIN}/en/tools/personal-advantage`);
  assert.equal(canonicalBtsShareUrl("/writing/story", siteUrl), `${PORTABLE_ORIGIN}/writing/story`);
  assert.equal(absoluteSiteUrl("/about#benjamin", siteUrl), `${PORTABLE_ORIGIN}/about#benjamin`);
});

test("release URL emitters contain no hardcoded legacy canonical origin", () => {
  const files = [
    "app/layout.tsx",
    "app/about/page.tsx",
    "app/people/[slug]/page.tsx",
    "app/writing/[slug]/page.tsx",
    "data/i18n/ai-summary.ts",
    "lib/search-discovery.ts",
    "lib/sharing/destinations.ts",
  ];
  for (const file of files) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /https:\/\/btshq\.online/u, file);
  }
  const nextConfig = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.doesNotMatch(nextConfig, /NEXT_PUBLIC_SITE_URL|env:\s*\{[\s\S]*SITE_URL/u);
});
