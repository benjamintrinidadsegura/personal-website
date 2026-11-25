import { requireAdminPage } from "@/lib/admin/authorization";
import { InsightsDashboard } from "@/components/admin/insights-dashboard";
import { staticInsightsCatalog } from "@/lib/insights/catalog";
import { insightsCollectionEnabled, insightsMaintenanceEnabled } from "@/lib/insights/config";
import { insightPeriods, type InsightPeriod } from "@/lib/insights/contract";
import { readFounderInsights } from "@/lib/insights/read";
import { getPublishedWritingResult } from "@/lib/writing/queries";

export const metadata = { title: "BTSHQ Insights | btshq.online", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { supabase } = await requireAdminPage(true);
  const requested = (await searchParams).period;
  const period: InsightPeriod = insightPeriods.includes(requested as InsightPeriod) ? requested as InsightPeriod : "7d";
  const active = insightsMaintenanceEnabled();
  const state = active ? await readFounderInsights(supabase, period) : { status: "disabled" as const };
  const catalog = staticInsightsCatalog();
  if (state.status === "available" && state.metrics.some(({ name }) => name === "article_view")) {
    const writing = await getPublishedWritingResult("de");
    if (writing.status === "data") catalog.push(...writing.data.map((article) => ({ id: "article:" + article.id, title: article.title, href: "/writing/" + article.slug, event: "article_view" as const, area: "Writing" as const, lifecycle: false })));
  }
  return <InsightsDashboard state={state} catalog={catalog} period={period} collecting={insightsCollectionEnabled()} />;
}
