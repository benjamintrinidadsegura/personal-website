import assert from "node:assert/strict";
import test from "node:test";
import { loadSource } from "./helpers/load-source";
import { renderToStaticMarkup } from "react-dom/server";
import { ServerDocumentNotice, serverDocumentCopy, serverCoverageCopy } from "../components/community/server-document-notice";
import { locales } from "../lib/i18n/config";
import * as localeConfig from "../lib/i18n/config";
import * as routing from "../lib/i18n/routing";
import * as contract from "../lib/insights/contract";
import * as jsx from "react/jsx-runtime";
import { webcrypto } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const configuration = loadSource<typeof import("../lib/analytics/public-view-source")>("lib/analytics/public-view-source.ts", { "server-only": {}, "./first-party-config": { firstPartyReachRuntime: (env: NodeJS.ProcessEnv) => env.VERCEL_ENV === "production" } });
test("source is exclusive, legacy by default, unknown OFF and server source Production-only", () => {
  assert.equal(configuration.publicViewSource({ NODE_ENV: "production",}), "legacy");
  assert.equal(configuration.publicViewSource({ NODE_ENV: "production", BTS_PUBLIC_VIEW_SOURCE: "unknown" }), "off");
  assert.equal(configuration.serverDocumentsEnabled({ NODE_ENV: "production", BTS_PUBLIC_VIEW_SOURCE: "server-document", VERCEL_ENV: "preview", BTS_REACH_ENABLED: "true", BTS_INSIGHTS_MODE: "collect" }), false);
  assert.equal(configuration.serverDocumentsEnabled({ NODE_ENV: "production", BTS_PUBLIC_VIEW_SOURCE: "server-document", VERCEL_ENV: "production", BTS_REACH_ENABLED: "true", BTS_INSIGHTS_MODE: "collect" }), true);
});
let enabled = true, publication = true;
const calls: Record<string, unknown>[] = [];
const adapter = loadSource<typeof import("../lib/analytics/server-documents")>("lib/analytics/server-documents.ts", {
  "server-only": {}, "node:crypto": { randomUUID: () => "11111111-1111-4111-8111-111111111111" },
  "@/lib/i18n/routing": { stripLocalePrefix: (s: string) => s.replace(/^\/(en|de|pl|es|tr|el|ru)(?=\/)/, "") },
  "@/lib/insights/catalog": { staticInsightsCatalog: () => [{ href: "/tools/money-profile", event: "tool_view", id: "tool:" + "a".repeat(32) }] },
  "@/lib/writing/queries": { getPublishedWritingDocumentTarget: async () => publication ? { status: "data", article: { id: "22222222-2222-4222-8222-222222222222" } } : { status: "missing" } },
  "@/lib/supabase/server": { getSupabaseServerClient: () => ({ rpc: async (_name: string, args: Record<string, unknown>) => { calls.push(args); return { data: "recorded", error: calls.length % 2 === 1 ? {} : null }; } }) },
  "./country-reach": { isReachCountry: (c: string) => c === "DE" }, "./public-view-source": { serverDocumentsEnabled: () => enabled },
});
const request = (path = "/tools/money-profile", extra: Record<string, string> = {}, method = "GET") => new Request("https://btshq.online" + path, { method, headers: { accept: "text/html", "sec-fetch-mode": "navigate", "sec-fetch-dest": "document", "x-vercel-ip-country": "DE", ...extra } });
test("only approved normal document requests pass; no SPA, prefetch, private or query counting", () => {
  for (const p of ["/account", "/admin/insights", "/auth/callback", "/tools/money-profile?result=secret", "/writing/private/result", "/unknown"]) assert.equal(adapter.eligibleServerDocument(request(p), 200), null);
  for (const headers of [{ dnt: "1" }, { "sec-gpc": "1" }, { rsc: "1" }, { "next-router-prefetch": "1" }, { purpose: "prefetch" }, { purpose: "navigate", "sec-purpose": "prefetch" }, { "sec-fetch-mode": "cors" }, { "sec-fetch-dest": "empty" }, { "user-agent": "crawler" }] as Record<string, string>[]) assert.equal(adapter.eligibleServerDocument(request(undefined, headers), 200), null);
  assert.equal(adapter.eligibleServerDocument(request(), 302), null);
  assert.equal(adapter.eligibleServerDocument(request(undefined, { "x-bts-internal-rewrite-locale": "pl" }), 200), null);
  assert.equal(adapter.eligibleServerDocument(request(undefined, {}, "POST"), 200), null);
  enabled = false; assert.equal(adapter.eligibleServerDocument(request(), 200), null); enabled = true;
});

test("actual Proxy preserves locale response and gives the minimized event task to waitUntil", async () => {
  const captured: unknown[] = [], tasks: Promise<unknown>[] = [];
  const proxy = loadSource<typeof import("../proxy")>("proxy.ts", {
    "@/lib/community/review-boundary": { canOpenCommunityReview: () => false },
    "@supabase/ssr": { createServerClient: () => { throw new Error("No auth client in isolated anonymous fixture"); } },
    "@/lib/analytics/server-documents": { eligibleServerDocument: adapter.eligibleServerDocument, recordServerDocument: async (event: unknown) => { captured.push(event); } },
    "next/server": { NextResponse }, "@/lib/supabase/auth-cookies": {},
    "@/lib/i18n/config": localeConfig, "@/lib/i18n/routing": routing,
    "@/lib/cloudflare-web-analytics": { cloudflareAnalyticsHeader: "x-analytics", isPublicAnalyticsPath: () => true, needsAnalyticsDocumentNavigation: () => false },
  }, { process: { env: {} } });
  const response = await proxy.proxy(new NextRequest(request("/pl/tools/money-profile")), { waitUntil: (task) => { tasks.push(task); } });
  await Promise.all(tasks); assert.equal(tasks.length, 1); assert.equal(captured.length, 1);
  assert.equal(response.headers.get("Content-Language"), "pl"); assert.equal(response.status, 200);
  await proxy.proxy(new NextRequest(request("/tools/money-profile", { "x-bts-internal-rewrite-locale": "pl" })), { waitUntil: (task) => { tasks.push(task); } });
  assert.equal(tasks.length, 1, "an internal locale rewrite is not a second visitor document");
  await proxy.proxy(new NextRequest(request("/admin")), { waitUntil: (task) => { tasks.push(task); } });
  assert.equal(tasks.length, 1);
});

test("lifecycle-only browser collector sends actual consented signals, never views or answers", async () => {
  let effect: (() => (() => void)) | undefined, consent = false;
  const location = { pathname: "/tools/money-profile", search: "", hash: "" };
  const window = Object.assign(new EventTarget(), { location }), document = { visibilityState: "visible" };
  const requests: { url: string; body: string }[] = [];
  const collector = loadSource<typeof import("../components/insights/collector")>("components/insights/collector.tsx", {
    "react/jsx-runtime": jsx, react: { useRef: (value: unknown) => ({ current: value }), useEffect: (callback: () => (() => void)) => { effect = callback; } },
    "next/navigation": { usePathname: () => location.pathname, useSearchParams: () => new URLSearchParams() },
    "@/lib/i18n/routing": routing, "@/lib/insights/contract": contract,
  }, { location, window, document, navigator: { doNotTrack: "0" }, sessionStorage: { getItem: () => consent ? "yes" : null }, crypto: webcrypto,
    fetch: async (url: string, init: { body: string }) => { requests.push({ url, body: init.body }); return new Response(null, { status: 204 }); } });
  const target = { id: "tool:" + "a".repeat(32), title: "Money Profile", href: location.pathname, event: "tool_view" as const, area: "Tools" as const, lifecycle: true };
  assert.equal(collector.InsightsCollector({ targets: [target], lifecycleOnly: true }), null);
  const cleanup = effect!();
  const signal = (name: string) => window.dispatchEvent(new CustomEvent("bts:product-event", { detail: { name } }));
  const settle = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
  const start = Object.keys(contract.lifecycleSignals).find((key) => contract.lifecycleSignals[key].path === location.pathname && contract.lifecycleSignals[key].name === "tool_start")!;
  const complete = Object.keys(contract.lifecycleSignals).find((key) => contract.lifecycleSignals[key].path === location.pathname && contract.lifecycleSignals[key].name === "tool_complete")!;
  signal(start); await settle(); assert.equal(requests.length, 0);
  consent = true; window.dispatchEvent(new Event(contract.insightsChoiceEvent)); await settle(); assert.equal(requests.length, 0);
  signal(start); signal(complete); await settle(); signal(complete); await settle();
  assert.deepEqual(requests.map(({ body }) => JSON.parse(body).name), ["tool_start", "tool_complete"]);
  for (const request of requests) { assert.equal(request.url, "/api/insights/event"); assert.deepEqual(Object.keys(JSON.parse(request.body)).sort(), ["at", "contentId", "eventId", "name"]); }
  cleanup();
});
test("minimized server capture excludes cookie, IP, referrer and URL queries", () => {
  const event = adapter.eligibleServerDocument(request(undefined, { cookie: "private-cookie", referer: "https://private.invalid/secret", "x-forwarded-for": "192.0.2.1" }), 200)!;
  assert.equal(event.country, "DE");
  assert.doesNotMatch(JSON.stringify(event), /private-cookie|private.invalid|192\.0|forwarded|referer/);
  assert.equal(adapter.eligibleServerDocument(request(undefined, { "x-vercel-ip-country": "ZZ" }), 200)!.country, null);
});
test("same content identity across seven locales; bounded retries share one request UUID", async () => {
  for (const locale of locales) {
    const p = locale === "de" ? "/tools/money-profile" : "/" + locale + "/tools/money-profile";
    assert.equal(adapter.eligibleServerDocument(request(p), 200)!.target!.id, "tool:" + "a".repeat(32));
  }
  calls.length = 0; await adapter.recordServerDocument(adapter.eligibleServerDocument(request(), 200)!);
  assert.equal(calls.length, 2); assert.deepEqual(calls[0], calls[1]);
  assert.deepEqual(Object.keys(calls[0]).sort(), ["p_content_id", "p_country", "p_event_id", "p_issued_at", "p_name"]);
});
test("fresh published Writing resolution only; withdrawal generates no SQL write", async () => {
  calls.length = 0; await adapter.recordServerDocument(adapter.eligibleServerDocument(request("/writing/public-story"), 200)!);
  assert.equal(calls[0].p_content_id, "article:22222222-2222-4222-8222-222222222222");
  publication = false; calls.length = 0; await adapter.recordServerDocument(adapter.eligibleServerDocument(request("/writing/public-story"), 200)!);
  assert.equal(calls.length, 0); publication = true;
});
test("all public disclosures explicitly describe server requests and separate lifecycle consent", () => {
  for (const locale of locales) {
    assert.ok(serverDocumentCopy[locale].length > 300 && serverCoverageCopy[locale].length > 40);
    const html = renderToStaticMarkup(<ServerDocumentNotice locale={locale} />);
    assert.doesNotMatch(html, /<script|<iframe|<input/); assert.ok(html.includes("49"));
  }
});
