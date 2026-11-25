import assert from "node:assert/strict";
import test from "node:test";
import { loadSource } from "./helpers/load-source";
import * as countries from "../lib/analytics/country-reach";
import * as periods from "../lib/analytics/reach-periods";
import * as publicPageViews from "../lib/analytics/public-page-view";

const origin = "https://btshq.online";

test("reach accepts a bounded same-origin public pathname and sends only the platform country to PostgreSQL", async () => {
  let active = true;
  const calls: unknown[] = [];
  const { POST } = loadSource<typeof import("../app/api/reach/view/route")>("app/api/reach/view/route.ts", {
    "@/lib/supabase/server": { getSupabaseServerClient: () => ({
      rpc: async (name: string, args: unknown) => { calls.push([name, args]); return { error: null }; },
    }) },
    "@/lib/analytics/first-party-config": { firstPartyReachEnabled: () => active },
    "@/lib/analytics/country-reach": countries,
    "@/lib/analytics/public-page-view": publicPageViews,
    "@/lib/analytics/reach-diagnostics": { reachDiagnostic: () => {} },
  }, { URL, Response, TextDecoder });
  const request = (body: string, additions = {}, url = origin + "/api/reach/view") => new Request(url, {
    method: "POST", body: body.startsWith("/") ? JSON.stringify({ pathname: body, eventId: "11111111-1111-4111-8111-111111111111", at: new Date().toISOString() }) : body,
    headers: {
      origin, "x-btshq-reach-consent": "v1", "sec-fetch-site": "same-origin", "x-vercel-ip-country": "DE", referer: origin + "/", ...additions,
    },
  });
  active = false;
  assert.equal((await POST(request("/writing"))).status, 404);
  active = true;
  for (const path of ["/admin", "/life-alignment/team", "/private", "/writing?token=redacted", "/en/writing#answer"]) {
    assert.equal((await POST(request(path))).status, 400);
  }
  for (const headers of [{ "x-btshq-reach-consent": "" }, { "x-btshq-test": "synthetic" }, { "sec-gpc": "1" }, { dnt: "1" }, { origin: "https://other.invalid" },
    { cookie: "synthetic=1" }, { authorization: "synthetic" }, { referer: origin + "/tools/example" }]) {
    assert.equal((await POST(request("/writing", headers))).status, 403);
  }
  assert.equal((await POST(request("/writing", {}, origin + "/api/reach/view?test=1"))).status, 403);
  assert.equal((await POST(request("x".repeat(257)))).status, 413);
  assert.equal((await POST(request("/writing", { "x-vercel-ip-country": "ZZ" }))).status, 503);
  assert.equal((await POST(request("/writing", { "user-agent": "TestCrawler" }))).status, 202);
  assert.deepEqual(calls, []);
  assert.equal((await POST(request("/en/writing"))).status, 204);
  assert.equal(calls.length, 1);
  assert.deepEqual(Object.keys((calls[0] as [string, object])[1]).sort(), ["p_country", "p_event_id", "p_issued_at"]);
  assert.equal((calls[0] as [string, { p_country: string }])[1].p_country, "DE");
});

test("reach publishes closed, paired periods and rejects low positive differences", () => {
  const { prepareFirstPartyReach } = loadSource<typeof import("../lib/analytics/first-party-reach")>("lib/analytics/first-party-reach.ts", {
    "server-only": {},
    "@/lib/supabase/server": {},
    "./country-reach": countries,
    "./first-party-config": {},
    "./reach-periods": periods,
  });
  const now = Date.parse("2026-11-24T11:00:00Z");
  const batch = {
    updated: new Date(now).toISOString(), sinceStart: "2026-10-01", recentStart: "2026-10-25", end: "2026-11-24",
    since: [{ countryCode: "DE", pageViews: 20 }], recent: [{ countryCode: "DE", pageViews: 5 }],
    daily: [{ day: "2026-10-01", pageViews: 15 }, { day: "2026-11-23", pageViews: 5 }],
  };
  const good = prepareFirstPartyReach(batch, now);
  assert.equal(good.since.status, "available");
  assert.equal(good.recent.status, "available");
  if (good.recent.status === "available") assert.deepEqual(good.recent.growth, [{ day: "2026-11-23T00:00:00.000Z", pageViews: 5 }]);
  assert.equal(prepareFirstPartyReach({ ...batch, recent: [{ countryCode: "DE", pageViews: 19 }] }, now).since.status, "unavailable");
  assert.equal(prepareFirstPartyReach({ ...batch, end: "2026-11-23" }, now).since.status, "unavailable");
  assert.equal(prepareFirstPartyReach({ ...batch, daily: [{ day: "2026-11-23", pageViews: 3 }] }, now).since.status, "unavailable");
});
