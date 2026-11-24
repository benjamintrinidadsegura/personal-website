import "server-only";
import { minimumPublicCountryViews } from "./country-reach";
import { prepareReachPeriod, type ReachDataset, type ReachPeriod } from "./reach-periods";

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
    await publish({ since, recent });
    return true;
  } catch {
    return false;
  }
}
