import "server-only";
import { reachProjectId } from "./country-reach";
import { createPublicPageViewAllowlist } from "./public-page-view";

const day = 86400000;
const endpoint = "https://api.vercel.com/v1/query/web-analytics/visits/aggregate";
const routeFilter = `environment eq 'production' and requestPath in (${[...createPublicPageViewAllowlist()].sort().map((path) => "'"+path+"'").join(",")})`;

type Window = { from: string; to: string };

/** Provider adapter only. Calling it requires separate approval of the source and publication scope. */
export async function readVercelReach(
  access: { token: string; teamId: string; publishApproved: true },
  periods: { since: Window; recent: Window },
  now = Date.now(),
  request: typeof fetch = fetch,
) {
  async function loadWindow({ from, to }: Window) {
    const start = Date.parse(from);
    const end = Date.parse(to);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start % day || end % day || end <= start
      || end > now || end - start > 30 * day || now - start > 31 * day) throw new Error("Reach window out of range");

    const query = async (dimension: "day" | "country") => {
      const url = new URL(endpoint);
      url.search = new URLSearchParams({
        projectId: reachProjectId, teamId: access.teamId, since: from, until: new Date(end - 1).toISOString(),
        by: dimension, filter: routeFilter, limit: dimension === "day" ? "30" : "250",
      }).toString();
      const response = await request(url, {
        method: "GET", headers: { Authorization: `Bearer ${access.token}` }, cache: "no-store",
        redirect: "error", signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) throw new Error("Reach provider request failed");
      const payload: { version?: unknown; data?: unknown } = await response.json();
      if (payload?.version !== 1 || !Array.isArray(payload.data) || payload.data.length > 251) throw new Error("Unexpected aggregate response");
      return payload.data.map((value: unknown) => {
        if (!value || typeof value !== "object" || !("pageviews" in value) || typeof value.pageviews !== "number"
          || !Number.isSafeInteger(value.pageviews) || value.pageviews < 0) throw new Error("Invalid page-view count");
        return { row: value, pageViews: value.pageviews };
      });
    };

    const [countryRows, dayRows] = await Promise.all([query("country"), query("day")]);
    const countries = countryRows.map(({ row, pageViews }) => {
      if (!("country" in row) || row.country === null || typeof row.country === "string") {
        return { countryCode: "country" in row && typeof row.country === "string" ? row.country : "", pageViews };
      }
      throw new Error("Unexpected country grouping");
    });
    const daily = dayRows.map(({ row, pageViews }) => {
      if (!("timestamp" in row) || typeof row.timestamp !== "string") throw new Error("Unexpected daily grouping");
      return { day: row.timestamp, pageViews };
    });
    return { version: 1, source: "vercel-web-analytics", metric: "pageviews", projectId: reachProjectId,
      provenance: "owner-approved-aggregate", publicDisplayApproved: access.publishApproved, routeScope: "public-allowlist-v1",
      periodStart: from, periodEnd: to, retrievedAt: new Date(now).toISOString(), geography: "complete", countries, daily };
  }

  if (access.publishApproved !== true || !access.token || !access.teamId || periods.since.to !== periods.recent.to
    || Date.parse(periods.since.from) > Date.parse(periods.recent.from)) throw new Error("Reach source not approved or periods inconsistent");
  const [since, recent] = await Promise.all([loadWindow(periods.since), loadWindow(periods.recent)]);
  return { source: "vercel-web-analytics" as const, periods: { since, recent } };
}