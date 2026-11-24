import { validateCountryReach, type CountryReach } from "./country-reach";

export const reachPeriods = ["since", "recent"] as const;
export type ReachPeriod = typeof reachPeriods[number];
export type PublicReachPeriod = {
  status: "available";
  coverage: "complete" | "partial";
  from: string;
  to: string;
  updated: string;
  countries: { countryCode: string; pageViews: number }[];
  displayedViews: number;
  growth: readonly { day: string; pageViews: number }[];
  newlyRepresented: readonly string[];
} | { status: "unavailable"; reason: "inactive" | "missing" | "invalid" | "stale" | "suppressed" | "provider" };
export type ReachDataset = Record<ReachPeriod, PublicReachPeriod>;

export const reachColors = ["#17263d", "#157a89", "#4bbed7", "#72ddb0", "#b9df69", "#f4d85a"] as const;
export const reachThresholds = [5, 25, 100, 500, 2000] as const;
export function reachColorIndex(count?: number) {
  return reachThresholds.filter((threshold) => count !== undefined && count >= threshold).length;
}

export function prepareReachPeriod(
  input: unknown,
  period: ReachPeriod,
  now = Date.now(),
): PublicReachPeriod {
  const validated: CountryReach = validateCountryReach(input, now);
  if (validated.status === "unavailable") return validated;
  const { snapshot, omittedLowVolume } = validated;
  if (period === "recent" && Date.parse(snapshot.periodEnd) - Date.parse(snapshot.periodStart) > 30 * 86400000) {
    return { status: "unavailable", reason: "invalid" };
  }
  const countries = [...snapshot.countries].sort((a, b) => b.pageViews - a.pageViews || a.countryCode.localeCompare(b.countryCode, "en"));
  const displayedViews = countries.reduce((sum, country) => sum + country.pageViews, 0);
  if (!Number.isSafeInteger(displayedViews)) return { status: "unavailable", reason: "invalid" };
  return {
    status: "available", coverage: omittedLowVolume ? "partial" : snapshot.geography,
    from: snapshot.periodStart, to: snapshot.periodEnd, updated: snapshot.retrievedAt,
    countries, displayedViews, growth: [], newlyRepresented: [],
  };
}

export function inactiveReach(): ReachDataset {
  return { since: { status: "unavailable", reason: "inactive" }, recent: { status: "unavailable", reason: "inactive" } };
}
