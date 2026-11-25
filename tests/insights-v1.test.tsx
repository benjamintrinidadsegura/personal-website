import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import * as crypto from "node:crypto";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { loadSource } from "./helpers/load-source";
import { discoveryIndex } from "../data/discovery-index";
import { projects } from "../data/projects";
import { publishedSpotlights } from "../data/spotlights";
import * as config from "../lib/i18n/config";
import * as routing from "../lib/i18n/routing";
import * as contract from "../lib/insights/contract";
import { InsightsDashboard } from "../components/admin/insights-dashboard";

const catalog = loadSource<typeof import("../lib/insights/catalog")>("lib/insights/catalog.ts", {
  "server-only": {}, "node:crypto": crypto, "@/data/discovery-index": { discoveryIndex }, "@/data/projects": { projects },
  "@/data/spotlights": { publishedSpotlights }, "@/lib/i18n/config": config, "@/lib/i18n/routing": routing,
});
const targets = catalog.staticInsightsCatalog();
const dataReader = loadSource<typeof import("../lib/insights/read")>("lib/insights/read.ts", { "server-only": {}, "./contract": contract });
test("event catalog is explicit, public identities are stable/opaque and all locales share identities", () => {
  assert.deepEqual(contract.insightEvents, ["article_view", "tool_view", "tool_start", "tool_complete", "interview_view", "project_view", "community_view", "public_content_open"]);
  assert.equal(new Set(targets.map(({ id }) => id)).size, targets.length);
  assert.equal(new Set(targets.map(({ href }) => href)).size, targets.length);
  for (const target of targets) {
    assert.doesNotMatch(target.id, /evgeny|kiki|johanna|@/iu);
    assert.equal(catalog.localizedInsightTargets().filter(({ id }) => id === target.id).length, 7);
    if (target.lifecycle) assert.ok(["/tools/personal-advantage", "/tools/money-profile"].includes(target.href));
  }
});
test("Insights mode is independent of Reach, defaults OFF, and pause preserves maintenance", () => {
  const gate = loadSource<typeof import("../lib/insights/config")>("lib/insights/config.ts", { "server-only": {}, "@/lib/analytics/first-party-config": { firstPartyReachRuntime: (env: Record<string, string>) => env.VERCEL_ENV === "production" } });
  assert.equal(gate.insightsCollectionEnabled({ NODE_ENV: "production", BTS_REACH_ENABLED: "true", VERCEL_ENV: "production" }), false);
  assert.equal(gate.insightsCollectionEnabled({ NODE_ENV: "production", BTS_INSIGHTS_MODE: "collect", VERCEL_ENV: "preview" }), false);
  assert.equal(gate.insightsCollectionEnabled({ NODE_ENV: "production", BTS_INSIGHTS_MODE: "collect", VERCEL_ENV: "production" }), true);
  assert.equal(gate.insightsCollectionEnabled({ NODE_ENV: "production", BTS_INSIGHTS_MODE: "maintain", VERCEL_ENV: "production" }), false);
  assert.equal(gate.insightsMaintenanceEnabled({ NODE_ENV: "production", BTS_INSIGHTS_MODE: "maintain", VERCEL_ENV: "production" }), true);
});
test("API enforces separate consent, minimized payload, current published IDs and fixed supported signals", async () => {
  let enabled = false, publication = "data", failure = false, calls = 0;
  const publishedId = "11111111-1111-4111-8111-111111111111";
  const api = loadSource<typeof import("../app/api/insights/event/route")>("app/api/insights/event/route.ts", {
    "@/lib/insights/config": { insightsCollectionEnabled: () => enabled }, "@/lib/insights/catalog": catalog,
    "@/lib/insights/contract": contract, "@/lib/writing/queries": { getPublishedWritingInsightTarget: async (id: string) => ({ status: id === publishedId ? publication : "missing" }) },
    "@/lib/insights/diagnostics": { insightsDiagnostic: () => {} },
    "@/lib/supabase/server": { getSupabaseServerClient: () => ({ rpc: async (_name: string, args: Record<string, unknown>) => {
      calls++; assert.deepEqual(Object.keys(args).sort(), ["p_content_id", "p_event_id", "p_issued_at", "p_name"]); return { error: failure ? {} : null };
    } }) },
  });
  const target = targets.find(({ lifecycle }) => lifecycle)!;
  const base = { name: "tool_view", contentId: target.id, eventId: crypto.randomUUID(), at: new Date().toISOString() };
  const request = (value: unknown = base, headers = {}, url = "https://btshq.online/api/insights/event") => new Request(url, { method: "POST", body: JSON.stringify(value), headers: {
    origin: "https://btshq.online", referer: "https://btshq.online/", "sec-fetch-site": "same-origin", "content-type": "text/plain;charset=UTF-8", "x-btshq-insights-consent": "v1", ...headers,
  } });
  assert.equal((await api.POST(request())).status, 404); enabled = true;
  for (const headers of [{ "x-btshq-insights-consent": "" }, { "sec-gpc": "1" }, { dnt: "1" }, { origin: "https://other.invalid" }, { referer: "https://btshq.online/private" }, { cookie: "local=fixture" }, { authorization: "fixture" }]) assert.equal((await api.POST(request(base, headers))).status, 403);
  for (const extra of [{ answers: [1] }, { result: 99 }, { email: "local@example.invalid" }, { userId: "local" }, { pathname: "/private" }]) assert.equal((await api.POST(request({ ...base, ...extra }))).status, 400);
  assert.equal((await api.POST(request({ ...base, contentId: "/private" }))).status, 400);
  assert.equal((await api.POST(request({ ...base, name: "tool_complete", contentId: targets.find((item) => item.area === "Tools" && !item.lifecycle)!.id }))).status, 400);
  assert.equal((await api.POST(request({ ...base, at: new Date(Date.now() - 25 * 3600000).toISOString() }))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await api.POST(request())).status, 204);
  assert.equal((await api.POST(request({ ...base, name: "tool_complete" }))).status, 204);
  const article = { ...base, name: "article_view", contentId: "article:" + publishedId };
  assert.equal((await api.POST(request(article))).status, 204);
  publication = "missing"; assert.equal((await api.POST(request(article))).status, 400);
  publication = "unavailable"; assert.equal((await api.POST(request(article))).status, 503);
  failure = true; assert.equal((await api.POST(request())).status, 503);
  assert.equal(calls, 4);
});
test("untrusted reads cannot turn invalid data into fake zero or disclose unknown fields", () => {
  const empty = { startedAt: null, lastEventAt: null, maintainedAt: null, asOf: "2026-11-25T12:00:00Z", periodStart: "2026-11-19T00:00:00Z", periodEnd: "2026-11-26T00:00:00Z", metrics: [], daily: [] };
  assert.equal(dataReader.parseInsights(empty).status, "available");
  assert.equal(dataReader.parseInsights({ ...empty, metrics: [{ name: "tool_view", contentId: "x", count: 1 }] }).status, "unavailable");
  assert.equal(dataReader.parseInsights({ ...empty, asOf: "bad" }).status, "unavailable");
  assert.equal(dataReader.parseInsights({ ...empty, answers: "must not leave parser" }).status, "available");
  assert.ok(!Object.hasOwn(dataReader.parseInsights({ ...empty, answers: "private" }), "answers"));
});
test("missing current publication labels are honest without discarding genuine aggregate counts", () => {
  const markup = renderToStaticMarkup(<InsightsDashboard period="7d" collecting catalog={[]} state={{
    status: "available", startedAt: "2026-11-25T10:00:00Z", lastEventAt: "2026-11-25T11:00:00Z", maintainedAt: null,
    asOf: "2026-11-25T12:00:00Z", periodStart: "2026-11-19T00:00:00Z", periodEnd: "2026-11-26T00:00:00Z",
    metrics: [{ name: "article_view", contentId: "article:11111111-1111-4111-8111-111111111111", count: 2 }], daily: [{ day: "2026-11-25", count: 2 }],
  }} />);
  assert.match(markup, /Inhaltstitel nicht verfügbar/); assert.doesNotMatch(markup, /Archived content/); assert.match(markup, />2</);
});
for (const state of ["disabled", "unavailable", "empty"] as const) test("dashboard honest " + state + " state", () => {
  const markup = renderToStaticMarkup(<InsightsDashboard period="7d" collecting={false} catalog={targets} state={state === "empty" ? {
    status: "available", startedAt: null, lastEventAt: null, maintainedAt: null, asOf: "2026-11-25T12:00:00Z", periodStart: "2026-11-19T00:00:00Z", periodEnd: "2026-11-26T00:00:00Z", metrics: [], daily: [],
  } : { status: state }} />);
  assert.match(markup, /Dein privater Blick/); assert.doesNotMatch(markup, /12[,.]846/);
  assert.match(markup, state === "empty" ? /Noch keine Messwerte/ : state === "disabled" ? /Messung deaktiviert/ : /Messwerte nicht verfügbar/);
});
test("seven separate notices exist and unchanged product emitters do not carry answers", () => {
  const privacy = readFileSync("components/insights/privacy-choice.tsx", "utf8");
  for (const locale of config.locales) assert.match(privacy, new RegExp("\\b" + locale + ":"));
  const collector = readFileSync("components/insights/collector.tsx", "utf8");
  assert.doesNotMatch(collector, /localStorage|readAdvantageState|readMoneyProfileState|\.answers|\.result/);
  for (const file of ["lib/personal-advantage-analytics.ts", "lib/money-profile-analytics.ts"]) assert.match(readFileSync(file, "utf8"), /detail: \{ name \}/);
});
test("Founder page authorizes AAL2 before any metrics request", async () => {
  let permitted = false, reads = 0;
  const page = loadSource<typeof import("../app/admin/insights/page")>("app/admin/insights/page.tsx", {
    "react/jsx-runtime": runtime,
    "@/lib/admin/authorization": { requireAdminPage: async (aal2: boolean) => { assert.equal(aal2, true); if (!permitted) throw new Error("DENIED"); return { supabase: {} }; } },
    "@/components/admin/insights-dashboard": { InsightsDashboard }, "@/lib/insights/catalog": catalog,
    "@/lib/insights/config": { insightsCollectionEnabled: () => true, insightsMaintenanceEnabled: () => true },
    "@/lib/insights/contract": contract, "@/lib/insights/read": { readFounderInsights: async () => { reads++; return { status: "unavailable" }; } },
    "@/lib/writing/queries": { getPublishedWritingResult: async () => ({ status: "unavailable" }) },
  });
  await assert.rejects(page.default({ searchParams: Promise.resolve({}) }), /DENIED/); assert.equal(reads, 0);
  permitted = true; await page.default({ searchParams: Promise.resolve({ period: "not-a-period" }) }); assert.equal(reads, 1);
});

test("existing daily maintenance runs both sources independently and remains authenticated", async () => {
  const calls: string[] = []; let fail = "maintain_reach_aggregates";
  const refresh = loadSource<typeof import("../app/api/reach/refresh/route")>("app/api/reach/refresh/route.ts", {
    "node:crypto": crypto, "@/lib/analytics/first-party-config": { firstPartyReachRuntime: () => true },
    "@/lib/insights/config": { insightsMaintenanceEnabled: () => true },
    "@/lib/supabase/server": { getSupabaseServerClient: () => ({ rpc: async (name: string) => { calls.push(name); return { error: name === fail ? {} : null }; } }) },
  }, { process: { env: { CRON_SECRET: "isolated-local-insights-maintenance-fixture" } } });
  assert.equal((await refresh.GET(new Request("https://btshq.online/api/reach/refresh"))).status, 401);
  assert.deepEqual(calls, []);
  const request = () => new Request("https://btshq.online/api/reach/refresh", { headers: { authorization: "Bearer isolated-local-insights-maintenance-fixture" } });
  assert.equal((await refresh.GET(request())).status, 503);
  assert.deepEqual(calls, ["maintain_reach_aggregates", "maintain_insights_aggregates"]);
  fail = "maintain_insights_aggregates"; calls.length = 0;
  assert.equal((await refresh.GET(request())).status, 503); assert.equal(calls.length, 2);
});

test("a replaced view effect resumes the same pending identity without a stuck latch or extra view", async () => {
  let effect: (() => (() => void)) | undefined;
  let resolveRequest: ((value: Response) => void) | undefined;
  const ref = { current: null as unknown }, requests: string[] = [];
  const location = { pathname: "/community", search: "" };
  const window = Object.assign(new EventTarget(), { location });
  const document = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const collector = loadSource<typeof import("../components/insights/collector")>("components/insights/collector.tsx", {
    "react/jsx-runtime": runtime, react: { useRef: () => ref, useEffect: (callback: () => (() => void)) => { effect = callback; } },
    "next/navigation": { usePathname: () => "/community", useSearchParams: () => new URLSearchParams() },
    "@/lib/i18n/routing": routing, "@/lib/insights/contract": contract,
  }, { location, window, document, sessionStorage: { getItem: (key: string) => key === contract.insightsOptInKey ? "yes" : null },
    navigator: { doNotTrack: "0" }, crypto: crypto.webcrypto, Event, setTimeout: (fn: () => void) => { fn(); },
    fetch: (_url: string, args: { body: string }) => { requests.push(args.body); return new Promise<Response>((resolve) => { resolveRequest = resolve; }); },
  });
  const settle = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };
  const props = { enabled: true, name: "community_view" as const, contentId: "community:overview" };
  collector.InsightView(props); const cleanup = effect!(); await settle(); assert.equal(requests.length, 1);
  cleanup(); collector.InsightView(props); const finalCleanup = effect!(); await settle();
  resolveRequest!(new Response(null, { status: 503 })); await settle(); assert.equal(requests.length, 2);
  assert.equal(requests[0], requests[1]); resolveRequest!(new Response(null, { status: 204 })); await settle();
  document.dispatchEvent(new Event("visibilitychange")); await settle(); assert.equal(requests.length, 2); finalCleanup();
});
