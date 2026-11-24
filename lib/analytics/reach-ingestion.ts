import "server-only";
import { minimumPublicCountryViews } from "./country-reach";
import { prepareReachPeriod, type PublicReachPeriod, type ReachDataset, type ReachPeriod } from "./reach-periods";

type AggregateBatch = {
  source: "vercel-web-analytics";
  periods: Record<ReachPeriod, unknown>;
};

function normalizeSnapshot(input: unknown): unknown {
  if (!input || typeof input !== "object" || !("countries" in input) || !Array.isArray(input.countries)) return input;
  let unknownCountry = false;
  const countries = input.countries.flatMap((row: unknown) => {
    if (!row || typeof row !== "object" || Object.keys(row).length !== 2 || !("countryCode" in row)
      || !("pageViews" in row) || typeof row.countryCode !== "string"
      || typeof row.pageViews !== "number" || !Number.isSafeInteger(row.pageViews) || row.pageViews < 0) return [row];
    const countryCode = row.countryCode.trim().toUpperCase();
    if (["", "XX", "ZZ", "UNKNOWN", "OTHERS"].includes(countryCode)) {
      unknownCountry = true;
      return [];
    }
    return [{ countryCode, pageViews: row.pageViews }];
  });
  return { ...input, countries, ...(unknownCountry ? { geography: "partial" } : {}) };
}

function publishableDays(value: unknown, from: string, to: string): Extract<PublicReachPeriod, { status: "available" }>["growth"] | null {
  if (!value || typeof value !== "object" || !("daily" in value)) return [];
  if (!Array.isArray(value.daily) || value.daily.length > 370) return null;
  const seen = new Set<number>();
  const points: { day: string; pageViews: number }[] = [];
  for (const point of value.daily) {
    const day = typeof point?.day === "string" ? Date.parse(point.day) : NaN;
    if (!Number.isFinite(day) || day % 86400000 !== 0 || day < Date.parse(from) || day >= Date.parse(to)
      || seen.has(day) || !Number.isSafeInteger(point.pageViews) || point.pageViews < 0) return null;
    seen.add(day);
    if (point.pageViews >= minimumPublicCountryViews) points.push({ day: new Date(day).toISOString(), pageViews: point.pageViews });
  }
  return points.sort((a, b) => a.day.localeCompare(b.day));
}

/** Inject a verified, read-only provider adapter. This never provisions collection or schedules work. */
export async function refreshVerifiedReach(
  load: () => Promise<AggregateBatch>,
  publish: (snapshot: ReachDataset) => Promise<void>,
  now = Date.now(),
): Promise<boolean> {
  try {
    const batch = await load();
    if (batch.source !== "vercel-web-analytics") return false;
    const since = prepareReachPeriod(normalizeSnapshot(batch.periods.since), "since", now);
    const recent = prepareReachPeriod(normalizeSnapshot(batch.periods.recent), "recent", now);
    if (since.status !== "available" || recent.status !== "available" || since.to !== recent.to || since.from > recent.from) return false;
    const totals = new Map(since.countries.map(({ countryCode, pageViews }) => [countryCode, pageViews]));
    // An apparent positive difference below the threshold is not safe to reveal
    // through subtraction of the two published periods.
    if (recent.countries.some(({ countryCode, pageViews }) => {
      const total = totals.get(countryCode);
      return total === undefined || total < pageViews || (total > pageViews && total - pageViews < minimumPublicCountryViews);
    })) return false;
    const sinceDays = publishableDays(batch.periods.since, since.from, since.to);
    const recentDays = publishableDays(batch.periods.recent, recent.from, recent.to);
    if (!sinceDays || !recentDays) return false;
    const overlapping = sinceDays.filter(({ day }) => day >= recent.from);
    if (overlapping.length !== recentDays.length || overlapping.some((point, index) =>
      point.day !== recentDays[index].day || point.pageViews !== recentDays[index].pageViews)) return false;
    await publish({ since: { ...since, growth: sinceDays }, recent: { ...recent, growth: recentDays } });
    return true;
  } catch {
    return false;
  }
}
