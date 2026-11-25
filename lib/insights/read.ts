import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { insightEvents, type InsightEvent, type InsightPeriod } from "./contract";

export type InsightsData = { status: "available"; startedAt: string | null; lastEventAt: string | null; maintainedAt: string | null;
  asOf: string; periodStart: string; periodEnd: string; metrics: { name: InsightEvent; contentId: string; count: number }[]; daily: { day: string; count: number }[] };
export type InsightsState = InsightsData | { status: "disabled" | "unavailable" };
const timestamp = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));
export function parseInsights(input: unknown): InsightsState {
  if (!input || typeof input !== "object") return { status: "unavailable" };
  const row = input as Omit<InsightsData, "status">;
  if (!timestamp(row.asOf) || !timestamp(row.periodStart) || !timestamp(row.periodEnd)
    || ![row.startedAt, row.lastEventAt, row.maintainedAt].every((value) => value === null || timestamp(value))
    || !Array.isArray(row.metrics) || row.metrics.length > 10000 || !Array.isArray(row.daily) || row.daily.length > 90
    || row.metrics.some((metric) => !metric || !insightEvents.includes(metric.name) || typeof metric.contentId !== "string" || metric.contentId.length > 80 || !Number.isSafeInteger(metric.count) || metric.count <= 0)
    || row.daily.some((day) => !day || !/^\d{4}-\d{2}-\d{2}$/u.test(day.day) || !Number.isSafeInteger(day.count) || day.count <= 0)
    || new Set(row.metrics.map(({ name, contentId }) => name + contentId)).size !== row.metrics.length
    || new Set(row.daily.map(({ day }) => day)).size !== row.daily.length) return { status: "unavailable" };
  if (Date.parse(row.periodStart) > Date.parse(row.asOf) || Date.parse(row.periodEnd) <= Date.parse(row.asOf)
    || row.startedAt === null && (row.metrics.length > 0 || row.daily.length > 0)) return { status: "unavailable" };
  return { status: "available", startedAt: row.startedAt, lastEventAt: row.lastEventAt, maintainedAt: row.maintainedAt,
    asOf: row.asOf, periodStart: row.periodStart, periodEnd: row.periodEnd,
    metrics: row.metrics.map(({ name, contentId, count }) => ({ name, contentId, count })), daily: row.daily.map(({ day, count }) => ({ day, count })) };
}
/** Use the caller's verified AAL2 session, not a privileged service client. DB rechecks current admin membership. */
export async function readFounderInsights(client: SupabaseClient, period: InsightPeriod): Promise<InsightsState> {
  try { const { data, error } = await client.rpc("read_founder_insights", { p_period: period }); return error ? { status: "unavailable" } : parseInsights(data); }
  catch { return { status: "unavailable" }; }
}
