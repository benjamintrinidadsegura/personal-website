import "server-only";
import { reachProjectId } from "@/lib/analytics/country-reach";
import { inactiveReach, prepareReachPeriod, type ReachDataset } from "@/lib/analytics/reach-periods";

export function reviewReach(state?: string): ReachDataset {
  if (state === "off") return inactiveReach();
  if (state === "empty" || state === "stale" || state === "provider") {
    const reason = state === "empty" ? "suppressed" : state;
    return { since: { status: "unavailable", reason }, recent: { status: "unavailable", reason } };
  }
  const countries = [
    ["DE", 4820], ["ES", 2140], ["US", 1680], ["GB", 940], ["TR", 710], ["FR", 450],
    ["PL", 320], ["BR", 580], ["JP", 380], ["CA", 410], ["IT", 920], ["AU", 870],
    ["ZA", 150], ["NG", 21], ["IN", 1100], ["NZ", 20], ["AR", 330], ["IS", 12], ["ID", 530],
    ["EG", 210], ["NO", 95], ["SE", 175], ["RU", 85], ["CL", 98], ["KE", 9],
  ] as const;
  const now = Date.parse("2026-11-24T11:00:00.000Z");
  const source = { version: 1, source: "vercel-web-analytics", metric: "pageviews", projectId: reachProjectId,
    provenance: "owner-approved-aggregate", publicDisplayApproved: true, routeScope: "public-allowlist-v1",
    periodEnd: "2026-11-24T00:00:00.000Z", retrievedAt: "2026-11-24T10:00:00.000Z",
    geography: state === "partial" ? "partial" : "complete" };
  const subset = state === "one" ? countries.slice(0, 1) : state === "small" ? countries.slice(0, 2) : state === "growing" ? countries.slice(0, 12) : countries;
  const since = prepareReachPeriod({ ...source, periodStart: "2026-10-01T00:00:00.000Z",
    countries: subset.map(([countryCode, pageViews]) => ({ countryCode, pageViews })) }, "since", now);
  const recent = prepareReachPeriod({ ...source, periodStart: "2026-10-25T00:00:00.000Z",
    countries: subset.map(([countryCode, pageViews], index) => ({ countryCode, pageViews: Math.round(pageViews * (0.25 + (index % 4) * .1)) })) }, "recent", now);
  const points = [42, 55, 53, 117, 101, 190, 156, 207, 284, 335, 391];
  for (const [result, factor] of [[since, 1], [recent, .62]] as const) {
    if (result.status === "available") result.growth = points.map((value, i) => ({
      day: new Date(Date.parse("2026-11-01T00:00:00.000Z") + (i + (i > 6 ? 1 : 0)) * 86400000).toISOString(),
      pageViews: Math.round(value * factor),
    }));
  }
  return { since, recent };
}
