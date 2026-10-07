import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NextRequest } from "next/server";

import { privacyReleaseCopy } from "../data/i18n/privacy-release";
import { locales } from "../lib/i18n/config";
import { cloudflareAnalyticsHeader, cloudflareBeaconData, cloudflareBeaconUrl, isCloudflareAnalyticsEnabled, isPublicAnalyticsPath, needsAnalyticsDocumentNavigation } from "../lib/cloudflare-web-analytics";
import { proxy } from "../proxy";

const origin = "https://btshq.online";
const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const publicPaths = ["/", "/writing", "/writing/versteh-mich-richtig", "/tools/money-profile", "/tools/personal-advantage", "/find-your-next-step", "/find-your-next-step/self", "/life-alignment", "/life-alignment/self", "/life-alignment/partner", "/life-alignment/career", "/newsletter", "/privacy"];
const privatePaths = ["/admin", "/admin/login", "/admin/writing/qa-draft", "/account/login", "/api/newsletter/provider/brevo", "/_next/static/qa.js", "/life-alignment/invite/qa-secret", "/life-alignment/session/qa-session", "/life-alignment/sessions", "/life-alignment/partner/shared-device", "/newsletter/confirm", "/newsletter/unsubscribe"];

test("only the exact supplied Cloudflare module/config is mounted once in the global shell", () => {
  assert.equal(cloudflareBeaconUrl, "https://static.cloudflareinsights.com/beacon.min.js");
  assert.equal(cloudflareBeaconData, '{"token": "cdbaf80825cc47feaf2b19079a380f04"}');
  assert.deepEqual(Object.keys(JSON.parse(cloudflareBeaconData)), ["token"]);
  const layout = source("app/layout.tsx");
  assert.equal((layout.match(/<Script\s/gu) ?? []).length, 1);
  assert.match(layout, /analyticsEnabled \? <Script id="cloudflare-web-analytics" type="module" src=\{cloudflareBeaconUrl\} data-cf-beacon=\{cloudflareBeaconData\} strategy="afterInteractive"/u);
  assert.match(layout, /requestHeaders\.get\(cloudflareAnalyticsHeader\) === "1"/u);
  assert.match(layout, /requestHeaders\.get\("x-forwarded-host"\) \|\| requestHeaders\.get\("host"\)/u);
  assert.doesNotMatch(source("lib/cloudflare-web-analytics.ts"), /fetch\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage|cookies\(|CustomEvent|addEventListener/u);
});

test("analytics is enabled only on the production canonical btshq.online host", () => {
  const valid = { siteOrigin: origin, requestHost: "btshq.online", nodeEnv: "production" };
  assert.equal(isCloudflareAnalyticsEnabled(valid), true);
  assert.equal(isCloudflareAnalyticsEnabled({ ...valid, vercelEnv: "production" }), true);
  for (const patch of [{ nodeEnv: "development" }, { nodeEnv: "test" }, { vercelEnv: "preview" }, { vercelEnv: "development" }, { requestHost: "localhost:3000" }, { requestHost: "preview.vercel.app" }, { requestHost: "www.btshq.online" }, { requestHost: null }, { siteOrigin: "https://other.example" }, { siteOrigin: "http://btshq.online" }]) {
    assert.equal(isCloudflareAnalyticsEnabled({ ...valid, ...patch }), false);
  }
});

test("all supported locales measure public routes while excluding private and token-bearing routes", () => {
  for (const locale of locales) {
    for (const path of publicPaths) assert.equal(isPublicAnalyticsPath(`/${locale}${path === "/" ? "" : path}`), true, `${locale}/${path}`);
    for (const path of privatePaths) assert.equal(isPublicAnalyticsPath(`/${locale}${path}`), false, `${locale}/${path}`);
  }
  for (const path of ["/%61dmin/writing", "/en/life-alignment/invite%2Fqa-secret", "/account%5Clogin", "/%invalid", "/en//admin", "/%00admin"]) assert.equal(isPublicAnalyticsPath(path), false);
});

test("public SPA navigation is unchanged, with a document boundary in both directions for private routes", () => {
  for (const start of publicPaths) for (const end of publicPaths) assert.equal(needsAnalyticsDocumentNavigation(end, origin + start, origin), false);
  for (const start of privatePaths) for (const end of privatePaths) assert.equal(needsAnalyticsDocumentNavigation(end, start, origin), false);
  for (const path of privatePaths) {
    assert.equal(needsAnalyticsDocumentNavigation(path, origin + "/writing", origin), true);
    assert.equal(needsAnalyticsDocumentNavigation("/en/writing", origin + path, origin), true);
  }
  assert.equal(needsAnalyticsDocumentNavigation("/writing", null, origin), true);
  assert.equal(needsAnalyticsDocumentNavigation("/writing", "https://other.example/", origin), true);
});

test("the real proxy forces a non-Flight response before a private transition can reach a loaded SPA beacon", async () => {
  for (const path of privatePaths.filter((path) => !path.startsWith("/_next"))) {
    const response = await proxy(new NextRequest(origin + path, { headers: { rsc: "1", referer: origin + "/writing" } }));
    assert.equal(response.headers.get("content-type"), "text/html");
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(await response.text(), "");
  }
  const back = await proxy(new NextRequest(origin + "/en/writing", { headers: { rsc: "1", "next-url": "/life-alignment/session/qa-session" } }));
  assert.equal(back.headers.get("content-type"), "text/html");
});

test("proxy classification cannot be spoofed and private documents cannot leak their URL through referrers", async () => {
  // No auth or database traffic is needed to exercise request-header routing.
  const savedUrl = process.env.SUPABASE_URL;
  const savedKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
  try {
    for (const path of ["/", "/writing", "/en/tools/money-profile", "/account/login", "/admin/login", "/en/life-alignment/session/qa-session", "/newsletter/confirm"]) {
      const publicPath = isPublicAnalyticsPath(path);
      const response = await proxy(new NextRequest(origin + path, { headers: { [cloudflareAnalyticsHeader]: publicPath ? "0" : "1" } }));
      assert.equal(response.headers.get(`x-middleware-request-${cloudflareAnalyticsHeader}`), publicPath ? "1" : "0");
      if (!publicPath) assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    }
    const publicSpa = await proxy(new NextRequest(origin + "/en/writing", { headers: { rsc: "1", referer: origin + "/tools/money-profile" } }));
    assert.notEqual(publicSpa.headers.get("content-type"), "text/html");
    const forwardedHost = await proxy(new NextRequest("http://127.0.0.1:3194/writing", { headers: { host: "btshq.online", rsc: "1", referer: "http://btshq.online/" } }));
    assert.notEqual(forwardedHost.headers.get("content-type"), "text/html", "same-host public SPA survives an internal upstream origin");
  } finally {
    if (savedUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = savedUrl;
    if (savedKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY; else process.env.SUPABASE_PUBLISHABLE_KEY = savedKey;
  }
});

test("the framing CSP and existing private product event boundaries remain intact", () => {
  assert.match(source("next.config.ts"), /key: "Content-Security-Policy", value: "frame-ancestors 'none';"/u);
  assert.match(source("next.config.ts"), /skipProxyUrlNormalize: true/u, "Next must expose RSC headers to the proxy in the production runtime");
  for (const name of ["money-profile", "personal-advantage", "search-discovery"]) {
    assert.doesNotMatch(source(`lib/${name}-analytics.ts`), /fetch\(|sendBeacon|XMLHttpRequest|cloudflareinsights/u);
  }
});

test("all seven Privacy disclosures reflect cookie-free Cloudflare analytics without changing private storage promises", () => {
  for (const locale of locales) {
    const copy = privacyReleaseCopy[locale].sections.storage.body.join(" ");
    assert.match(copy, /Cloudflare Web Analytics/u);
    assert.match(copy, /Cloudflare, Inc\./u);
    assert.match(copy, /FYNS/u);
    assert.match(copy, /Career/u);
    assert.match(copy, /Life Vision/u);
    assert.match(copy, /20/u);
    assert.doesNotMatch(copy, /contains no analytics|enthält keine Webanalyse|No hay analítica|Analitik, reklam|Nie ma analityki|Δεν υπάρχουν analytics|Нет аналитики/u);
  }
});
