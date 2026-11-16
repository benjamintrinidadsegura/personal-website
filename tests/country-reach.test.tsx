import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { GlobalReach, GlobalReachView } from "../components/world-map/global-reach";
import { globalReachCopy } from "../data/i18n/global-reach";
import { getCountryReach, reachProjectId, validateCountryReach } from "../lib/analytics/country-reach";
import { locales } from "../lib/i18n/config";

const now = Date.parse("2026-11-16T12:00:00.000Z");
const fixture = () => ({ version: 1, source: "vercel-web-analytics", metric: "pageviews", projectId: reachProjectId,
  provenance: "owner-approved-aggregate", publicDisplayApproved: true, routeScope: "public-allowlist-v1",
  periodStart: "2026-11-09T00:00:00.000Z", periodEnd: "2026-11-16T00:00:00.000Z", retrievedAt: "2026-11-16T11:00:00.000Z",
  geography: "partial", countries: [{ countryCode: "DE", pageViews: 25 }, { countryCode: "US", pageViews: 10 }, { countryCode: "TR", pageViews: 2 }] });

test("independent aggregate accepts real country codes and omits low volume without revealing names", () => {
  const result = validateCountryReach(fixture(), now);
  assert.equal(result.status, "available");
  if (result.status !== "available") return;
  assert.equal(result.omittedLowVolume, true);
  assert.deepEqual(result.snapshot.countries, [{ countryCode: "DE", pageViews: 25 }, { countryCode: "US", pageViews: 10 }]);
  assert.equal(result.snapshot.metric, "pageviews");
});

test("invalid provenance, extra fields, duplicate countries and invalid counts are rejected", () => {
  for (const patch of [{ source: "echowall" }, { metric: "visitors" }, { projectId: "unrelated" }, { publicDisplayApproved: false },
    { routeScope: "all-routes" }, { provenance: "fixture" }, { rawIp: "synthetic" }, { geography: "unknown" },
    { countries: [{ countryCode: "DE", pageViews: -1 }] }, { countries: [{ countryCode: "DE", pageViews: 2.5 }] },
    { countries: [{ countryCode: "DE", pageViews: Number.MAX_SAFE_INTEGER + 1 }] },
    { countries: [{ countryCode: "DE", pageViews: 10, email: "synthetic" }] },
    { countries: [{ countryCode: "DE", pageViews: 10 }, { countryCode: "DE", pageViews: 10 }] },
    ...["ZZ", "Others", "XX", "EU", "de", "Berlin"].map((countryCode) => ({ countries: [{ countryCode, pageViews: 10 }] }))]) {
    assert.deepEqual(validateCountryReach({ ...fixture(), ...patch }, now), { status: "unavailable", reason: "invalid" });
  }
});

test("missing, stale, future, inconsistent and suppressed data remain honest unavailable states", () => {
  assert.deepEqual(validateCountryReach(null, now), { status: "unavailable", reason: "missing" });
  assert.deepEqual(validateCountryReach(fixture(), now + 25 * 3600000), { status: "unavailable", reason: "stale" });
  for (const patch of [{ periodStart: "2026-11-17T00:00:00.000Z" }, { periodEnd: "2026-11-17T00:00:00.000Z" },
    { retrievedAt: "2026-11-17T00:00:00.000Z" }, { periodStart: "2026-02-31T00:00:00.000Z" }, { periodStart: "invalid" }]) {
    assert.equal(validateCountryReach({ ...fixture(), ...patch }, now).status, "unavailable");
  }
  for (const countries of [[], [{ countryCode: "DE", pageViews: 0 }], [{ countryCode: "DE", pageViews: 4 }]]) {
    assert.deepEqual(validateCountryReach({ ...fixture(), countries }, now), { status: "unavailable", reason: "suppressed" });
  }
});

for (const locale of locales) {
  test(`${locale}: real view has no fake zero; synthetic aggregate is accessible and separate`, () => {
    assert.deepEqual(getCountryReach(), { status: "unavailable", reason: "inactive" });
    const live = renderToStaticMarkup(<GlobalReach locale={locale} />);
    assert.ok(live.includes(globalReachCopy[locale].unavailable));
    assert.doesNotMatch(live, /<dd>|<time|<script|<svg|<iframe/u);
    const aggregate = renderToStaticMarkup(<GlobalReachView locale={locale} snapshot={fixture()} now={now} />);
    assert.match(aggregate, /<dl|<dt>|<dd|<time/u);
    assert.match(aggregate, /Vercel Web Analytics/u);
    assert.ok(aggregate.includes(globalReachCopy[locale].partial));
    assert.ok(aggregate.includes(globalReachCopy[locale].privacy));
    assert.doesNotMatch(aggregate, /participant|sessionId|userId|email|<script/u);
    const stale = renderToStaticMarkup(<GlobalReachView locale={locale} snapshot={fixture()} now={now + 25 * 3600000} />);
    assert.ok(stale.includes(globalReachCopy[locale].unavailable));
    assert.doesNotMatch(stale, /<dd>/u);
  });
}
