import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { minimumPublicCountryViews, reachProjectId } from "./country-reach";
import { firstPartyReachEnabled } from "./first-party-config";
import { inactiveReach, prepareReachPeriod, type ReachDataset, type ReachPeriod } from "./reach-periods";

const dayMs = 86400000;
const unavailable = { status: "unavailable", reason: "provider" } as const;
const providerUnavailable = { since: unavailable, recent: unavailable };

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function utcDay(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return NaN;
  const iso = value + "T00:00:00.000Z";
  const timestamp = Date.parse(iso);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === iso ? timestamp : NaN;
}

export function prepareFirstPartyReach(input: unknown, now = Date.now()): ReachDataset {
  if (!isRecord(input)) return providerUnavailable;
  const sinceStart = utcDay(input.sinceStart);
  const recentStart = utcDay(input.recentStart);
  const end = utcDay(input.end);
  const refreshed = typeof input.updated === "string" ? Date.parse(input.updated) : NaN;
  if (!Number.isFinite(refreshed) || refreshed > now || now - refreshed >= 2 * dayMs) return providerUnavailable;
  if (input.sinceStart === null && Number.isFinite(refreshed)) return { since: { status: "unavailable", reason: "suppressed" }, recent: { status: "unavailable", reason: "suppressed" } };
  if (sinceStart === end && recentStart === end) return { since: { status: "unavailable", reason: "suppressed" }, recent: { status: "unavailable", reason: "suppressed" } };
  if (!Number.isFinite(sinceStart) || !Number.isFinite(recentStart) || !Number.isFinite(end)
    || end > now || now - end >= 2 * dayMs || sinceStart > recentStart || recentStart >= end
    || recentStart !== Math.max(sinceStart, end - 30 * dayMs)) return providerUnavailable;

  function period(name: ReachPeriod, from: number) {
    const data = input as Record<string, unknown>;
    const daily = data.daily;
    if (!Array.isArray(daily) || daily.length > 365) return unavailable;
    const days = new Map<number, number>();
    for (const row of daily) {
      if (!isRecord(row)) return unavailable;
      const date = utcDay(row.day);
      if (!Number.isFinite(date) || date < sinceStart || date >= end || days.has(date)
        || typeof row.pageViews !== "number" || !Number.isSafeInteger(row.pageViews)
        || row.pageViews < minimumPublicCountryViews) return unavailable;
      days.set(date, row.pageViews);
    }

    const prepared = prepareReachPeriod({
      version: 1, source: "btshq-first-party", metric: "pageviews", projectId: reachProjectId,
      provenance: "owner-approved-aggregate", publicDisplayApproved: true, routeScope: "public-allowlist-v1",
      periodStart: new Date(from).toISOString(), periodEnd: new Date(end).toISOString(),
      retrievedAt: new Date(refreshed).toISOString(), geography: "partial", countries: data[name],
    }, name, now);
    if (prepared.status === "unavailable") return prepared;
    const growth = [...days].filter(([date]) => date >= from).sort(([a], [b]) => a - b)
      .map(([date, pageViews]) => ({ day: new Date(date).toISOString(), pageViews }));
    return { ...prepared, growth };
  }

  const since = period("since", sinceStart);
  const recent = period("recent", recentStart);
  if (since.status !== "available" && recent.status === "available") return providerUnavailable;
  if (since.status === "available" && recent.status === "available") {
    const totals = new Map(since.countries.map(({ countryCode, pageViews }) => [countryCode, pageViews]));
    if (recent.countries.some(({ countryCode, pageViews }) => {
      const difference = (totals.get(countryCode) ?? 0) - pageViews;
      return difference !== 0 && difference < minimumPublicCountryViews;
    })) return providerUnavailable;
  }
  return { since, recent };
}

export async function readFirstPartyReach(): Promise<ReachDataset> {
  if (!firstPartyReachEnabled()) return inactiveReach();
  try {
    const client = getSupabaseServerClient({ fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(2000), cache: "no-store" }) });
    const { data, error } = await client.rpc("read_public_reach_periods");
    return error ? providerUnavailable : prepareFirstPartyReach(data);
  } catch {
    return providerUnavailable;
  }
}
