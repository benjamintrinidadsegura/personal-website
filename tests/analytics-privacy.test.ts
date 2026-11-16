import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { analyticsActivationReadiness, isPublicAnalyticsEnabled, isPublicAnalyticsRequested } from "../lib/analytics/configuration";
import { createPublicAnalyticsCatalog } from "../lib/analytics/public-catalog";
import { createPublicPageViewAllowlist, getPublicPageView } from "../lib/analytics/public-page-view";
import { createPublicBeforeSend, preparePublicAnalytics } from "../lib/analytics/vercel-adapter";
import { locales } from "../lib/i18n/config";
import { localizeHref } from "../lib/i18n/routing";

const origin = "https://btshq.online";
const requested = { BTS_PUBLIC_ANALYTICS_ENABLED: "true", VERCEL_ENV: "production", NODE_ENV: "production", SITE_URL: origin };

test("default OFF, local, test and Preview never initialize even with the activation flag", async () => {
  assert.equal(analyticsActivationReadiness, "blocked");
  assert.equal(isPublicAnalyticsRequested(requested), true);
  for (const environment of [{}, requested, { ...requested, VERCEL_ENV: "preview" }, { ...requested, NODE_ENV: "test" },
    { ...requested, NODE_ENV: "development" }, { ...requested, SITE_URL: "https://unreviewed.example" },
    { ...requested, BTS_PUBLIC_ANALYTICS_ENABLED: "false" }]) {
    assert.equal(isPublicAnalyticsEnabled(environment), false);
    assert.equal(await preparePublicAnalytics(origin, createPublicPageViewAllowlist(), environment), false);
  }
});

test("seven-locale exact allowlist only accepts canonical known public destinations", () => {
  const allowed = createPublicPageViewAllowlist({ writingSlugs: ["reviewed-story"], projectSlugs: ["ratecom"], peopleSlugs: ["evgeny-vinokurov"] });
  for (const locale of locales) {
    const filter = createPublicBeforeSend(origin, allowed);
    for (const route of ["/", "/echowall", "/world", "/writing/reviewed-story", "/projects/ratecom", "/people/evgeny-vinokurov"]) {
      const path = localizeHref(route, locale);
      const event = filter({ type: "pageview", url: origin + path + "?q=synthetic-query&token=synthetic#synthetic" });
      assert.deepEqual(event, { type: "pageview", url: origin + path });
      assert.doesNotMatch(JSON.stringify(event), /synthetic|token|\?|#/u);
    }
    for (const path of ["/life-alignment", "/life-alignment/self", "/life-alignment/invite/synthetic", "/life-alignment/session/synthetic",
      "/account/login", "/admin", "/api", "/tools/personal-advantage", "/tools/money-profile", "/find-your-next-step", "/newsletter/confirm",
      "/experience-lab", "/writing/unknown", "/people/unknown", "/projects/unknown", "/unknown", "/world/"]) {
      assert.equal(filter({ type: "pageview", url: origin + localizeHref(path, locale) }), null, path);
    }
  }
});

test("encoded/private paths, foreign origins, credentials and custom events fail closed", () => {
  const filter = createPublicBeforeSend(origin, createPublicPageViewAllowlist());
  for (const url of [origin + "/%77riting", origin + "/writing/../world", origin + "/world\\private", origin + "/en//world", "https://other.example/world", "https://person:synthetic@btshq.online/world", "/world", "not-url"]) {
    assert.equal(filter({ type: "pageview", url }), null, url);
  }
  assert.equal(filter({ type: "event", url: origin + "/world" }), null);
  const extra = { type: "pageview" as const, url: origin + "/world", payload: { answer: "synthetic" }, __cdp: "synthetic" };
  assert.deepEqual(filter(extra), { type: "pageview", url: origin + "/world" });
});

test("catalog reuses real public projects and published people without inventing Writing", () => {
  const catalog = createPublicAnalyticsCatalog([]);
  assert.ok(getPublicPageView("/projects/ratecom", catalog));
  assert.ok(getPublicPageView("/people/evgeny-vinokurov", catalog));
  assert.equal(getPublicPageView("/writing/invented", catalog), null);
  const unsafe = createPublicPageViewAllowlist({ writingSlugs: ["../account", "draft?token=synthetic", "nested/path", "UPPER"] });
  assert.equal(unsafe.size, createPublicPageViewAllowlist().size);
});

test("no application mount, duplicate collector or arbitrary event API is introduced", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.doesNotMatch(layout, /@vercel\/analytics|preparePublicAnalytics|cloudflareinsights|cdn-cgi\/rum/u);
  const adapter = readFileSync("lib/analytics/vercel-adapter.ts", "utf8");
  assert.doesNotMatch(adapter, /\btrack\(|\bidentify\(|fetch\(|sendBeacon|localStorage/u);
  assert.ok(adapter.indexOf("if (!isPublicAnalyticsEnabled") < adapter.indexOf("await import"));
});
