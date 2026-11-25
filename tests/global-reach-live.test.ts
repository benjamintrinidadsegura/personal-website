import assert from "node:assert/strict";
import test from "node:test";
import * as crypto from "node:crypto";
import { loadSource } from "./helpers/load-source";
import { locales } from "../lib/i18n/config";
import { readFileSync } from "node:fs";

test("stopping collection preserves expiry maintenance on the authorized Production runtime", () => {
  const config = loadSource<typeof import("../lib/analytics/first-party-config")>("lib/analytics/first-party-config.ts", { "server-only": {} });
  const environment = { VERCEL: "1", VERCEL_ENV: "production", NODE_ENV: "production" as const, SITE_URL: "https://btshq.online", BTS_REACH_ENABLED: "false" };
  assert.equal(config.firstPartyReachEnabled(environment), false);
  assert.equal(config.firstPartyReachRuntime(environment), true);
  assert.equal(config.firstPartyReachRuntime({ ...environment, VERCEL_ENV: "preview" }), false);
  assert.equal(config.firstPartyReachRuntime({ ...environment, SITE_URL: "http://localhost:3314" }), false);
});

test("daily refresh requires exact constant-time checked secret and fails closed", async () => {
  let enabled = true; let calls = 0; let failure = false;
  const { GET } = loadSource<typeof import("../app/api/reach/refresh/route")>("app/api/reach/refresh/route.ts", {
    "node:crypto": crypto,
    "@/lib/analytics/first-party-config": { firstPartyReachRuntime: () => enabled },
    "@/lib/insights/config": { insightsMaintenanceEnabled: () => false },
    "@/lib/supabase/server": { getSupabaseServerClient: () => ({ rpc: async () => { calls++; return { error: failure ? {} : null }; } }) },
  }, { process: { env: { CRON_SECRET: "local-fixture-cron-secret-0000000000" } }, Buffer });
  const url = "https://btshq.online/api/reach/refresh";
  assert.equal((await GET(new Request(url))).status, 401);
  assert.equal((await GET(new Request(url, { headers: { authorization: "Bearer wrong" } }))).status, 401);
  assert.equal(calls, 0);
  const request = () => new Request(url, { headers: { authorization: "Bearer local-fixture-cron-secret-0000000000" } });
  assert.equal((await GET(request())).status, 204);
  failure = true; assert.equal((await GET(request())).status, 503);
  enabled = false; assert.equal((await GET(request())).status, 404);
  assert.equal(calls, 2);
});

test("opt-in, privacy signals, query exclusion, fragment minimization and retry identity hold", async () => {
  let optIn = false; let path = "/writing"; let search = ""; let hash = "";
  let dnt = "0"; let gpc = false; let effect: (() => (() => void)) | undefined;
  const ref = { current: null as unknown };
  const requests: { body: string; credentials: string; referrerPolicy: string }[] = [];
  const window = Object.assign(new EventTarget(), { location: { get pathname() { return path; }, get search() { return search; }, get hash() { return hash; } } });
  const document = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const dependencies = {
    react: { useRef: () => ref, useEffect: (callback: () => (() => void)) => { effect = callback; } },
    "next/navigation": { usePathname: () => path, useSearchParams: () => new URLSearchParams(search) },
    "@/lib/analytics/reach-diagnostics": { reachDiagnostic: () => {} },
    "@/lib/analytics/public-page-view": { createPublicPageViewAllowlist: () => new Set(["/writing", "/community"]) },
  };
  const api = loadSource<typeof import("../components/community/reach-page-view")>("components/community/reach-page-view.tsx", dependencies, {
    window, document, sessionStorage: { getItem: () => optIn ? "yes" : null, setItem: () => { optIn = true; }, removeItem: () => { optIn = false; } },
    navigator: { get doNotTrack() { return dnt; }, get globalPrivacyControl() { return gpc; } },
    crypto: crypto.webcrypto, Event, setTimeout: (fn: () => void) => { fn(); },
    fetch: async (_url: string, args: { body: string; credentials: string; referrerPolicy: string }) => {
      requests.push(args); return new Response(null, { status: requests.length === 1 ? 503 : 204 });
    },
  });
  const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  api.ReachPageView(); let cleanup = effect!(); await settle(); assert.equal(requests.length, 0);
  api.setReachOptIn(true); await settle(); assert.equal(requests.length, 2);
  assert.equal(requests[0].body, requests[1].body, "retry must have identical event ID/time");
  assert.equal(requests[0].credentials, "omit"); assert.equal(requests[0].referrerPolicy, "origin");
  document.dispatchEvent(new Event("visibilitychange")); await settle(); assert.equal(requests.length, 2);
  cleanup(); path = "/community"; search = "?token=fixture"; api.ReachPageView(); cleanup = effect!(); await settle(); assert.equal(requests.length, 2);
  cleanup(); search = ""; hash = "#private"; api.ReachPageView(); cleanup = effect!(); await settle(); assert.equal(requests.length, 3);
  assert.doesNotMatch(requests[2].body, /#|private/u);
  cleanup(); hash = ""; dnt = "1"; api.ReachPageView(); cleanup = effect!(); await settle(); assert.equal(requests.length, 3);
  cleanup(); dnt = "0"; gpc = true; api.ReachPageView(); cleanup = effect!(); await settle(); assert.equal(requests.length, 3);
  cleanup(); gpc = false; api.setReachOptIn(false); api.ReachPageView(); cleanup = effect!(); await settle(); assert.equal(requests.length, 3);
  api.setReachOptIn(true); await settle(); assert.equal(requests.length, 3);
  assert.notEqual(JSON.parse(requests[2].body).eventId, JSON.parse(requests[0].body).eventId);
  cleanup();
});

test("seven consent notices expose measurement, replay expiry and suppression without new visual structure", () => {
  const source = readFileSync("components/community/reach-privacy-choice.tsx", "utf8");
  for (const locale of locales) assert.ok(source.includes(`"${locale}":`));
  assert.match(source, /sessionStorage/u); assert.match(source, /24/u); assert.match(source, /25/u);
  const cron = JSON.parse(readFileSync("vercel.json", "utf8"));
  assert.deepEqual(cron.crons, [{ path: "/api/reach/refresh", schedule: "7 0 * * *" }]);
});
