import assert from "node:assert/strict";
import test from "node:test";
import * as contract from "../lib/analytics/country-reach";
import * as pageViews from "../lib/analytics/public-page-view";
import { loadSource } from "./helpers/load-source";

const { readVercelReach } = loadSource<typeof import("../lib/analytics/vercel-reach-source")>("lib/analytics/vercel-reach-source.ts", {
  "server-only": {}, "./country-reach": contract, "./public-page-view": pageViews,
});

test("Vercel support uses only routed production aggregates and closed UTC days", async () => {
  const calls: URL[] = [];
  const request: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    calls.push(url);
    assert.equal(url.origin, "https://api.vercel.com");
    assert.equal(init?.method, "GET");
    assert.equal(init?.redirect, "error");
    const isDay = url.searchParams.get("by") === "day";
    return Response.json({ version: 1, data: isDay
      ? [{ timestamp: "2026-11-20T00:00:00Z", pageviews: 11 }]
      : [{ country: "DE", pageviews: 11 }] });
  };
  const window = { from: "2026-11-20T00:00:00.000Z", to: "2026-11-21T00:00:00.000Z" };
  const auth = { token: "local-example", teamId: "local-team", publishApproved: true } as const;
  const now = Date.parse("2026-11-21T09:00:00Z");
  const result = await readVercelReach(auth, { since: window, recent: window }, now, request);
  assert.deepEqual(result.periods.recent.countries, [{ countryCode: "DE", pageViews: 11 }]);
  assert.deepEqual(result.periods.recent.daily, [{ day: "2026-11-20T00:00:00Z", pageViews: 11 }]);
  assert.equal(calls.length, 4);
  for (const url of calls) {
    assert.equal(url.searchParams.get("until"), "2026-11-20T23:59:59.999Z");
    const expression = url.searchParams.get("filter");
    assert.match(expression ?? "", /^environment eq 'production' and requestPath in /);
    assert.doesNotMatch(expression ?? "", /tools|session|invite|admin/);
  }
  await assert.rejects(readVercelReach(auth, { since: { ...window, from: "2026-09-01T00:00:00Z" }, recent: window }, now, request), /window out of range/);
});