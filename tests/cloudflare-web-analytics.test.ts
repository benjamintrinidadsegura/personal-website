import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NextRequest } from "next/server";

import { privacyReleaseCopy } from "../data/i18n/privacy-release";
import { locales } from "../lib/i18n/config";
import { cloudflareAnalyticsHeader, isPublicAnalyticsPath, needsAnalyticsDocumentNavigation } from "../lib/cloudflare-web-analytics";
import { proxy } from "../proxy";

const origin = "https://btshq.online";
const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const publicPaths = ["/", "/writing", "/writing/versteh-mich-richtig", "/tools/money-profile", "/tools/personal-advantage", "/find-your-next-step", "/find-your-next-step/self", "/life-alignment", "/life-alignment/self", "/life-alignment/partner", "/life-alignment/career", "/newsletter", "/privacy"];
const privatePaths = ["/admin", "/admin/login", "/admin/writing/qa-draft", "/account/login", "/api/newsletter/provider/brevo", "/_next/static/qa.js", "/life-alignment/invite/qa-secret", "/life-alignment/session/qa-session", "/life-alignment/sessions", "/life-alignment/partner/shared-device", "/newsletter/confirm", "/newsletter/unsubscribe"];

test("the root layout and media choice do not activate the paused Cloudflare beacon", () => {
  for (const file of ["app/layout.tsx", "lib/cloudflare-web-analytics.ts", "components/spotlight/privacy-video.tsx"]) {
    assert.doesNotMatch(source(file), /cloudflareinsights\.com|data-cf-beacon|cloudflareBeacon|isCloudflareAnalyticsEnabled|\/cdn-cgi\/rum/u, file);
  }
  assert.match(source("components/spotlight/privacy-video.tsx"), /youtube-nocookie\.com/u);
});

test("all supported locales retain the public boundary around private and token-bearing routes", () => {
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

test("all seven Privacy disclosures identify Vercel and explain the paused analytics service", () => {
  const paused = { de: "ist pausiert", en: "is paused", es: "está en pausa", tr: "duraklatıldı", pl: "jest wstrzymane", el: "έχει τεθεί σε παύση", ru: "приостановлен" };
  for (const locale of locales) {
    assert.match(privacyReleaseCopy[locale].sections.hosting.body.join(" "), /Vercel/u);
    const copy = privacyReleaseCopy[locale].sections.storage.body.join(" ");
    assert.ok(copy.includes(`Cloudflare Web Analytics ${paused[locale]}`), locale);
    assert.match(copy, /FYNS/u);
    assert.match(copy, /Career/u);
    assert.match(copy, /Life Vision/u);
    assert.match(copy, /20/u);
  }
});
