import Link from "next/link";
import type { InsightArea, InsightEvent, InsightPeriod, InsightTarget } from "@/lib/insights/contract";
import type { InsightsState } from "@/lib/insights/read";

function area(name: InsightEvent): InsightArea {
  if (name === "article_view") return "Writing";
  if (name.startsWith("tool_")) return "Tools";
  if (name === "interview_view") return "People";
  if (name === "project_view") return "Projects";
  return "Community";
}
const date = (value: string | null) => value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC" : "Not observed";
const number = (value: number) => new Intl.NumberFormat("en-GB").format(value);

export function InsightsDashboard({ state, catalog, period, collecting }: { state: InsightsState; catalog: InsightTarget[]; period: InsightPeriod; collecting: boolean }) {
  const data = state.status === "available" ? state : null;
  const groups: InsightArea[] = ["Writing", "Tools", "People", "Projects", "Community"];
  const metrics = data?.metrics ?? [];
  const ready = data?.startedAt;
  const dailyMax = Math.max(1, ...(data?.daily.map(({ count }) => count) ?? []));
  return <div className="min-h-svh px-5 py-16 sm:px-8"><div className="mx-auto max-w-6xl">
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-300"><Link href="/admin" className="inline-flex min-h-11 items-center text-[#35d0e5] underline underline-offset-4">BTS Studio</Link> / Insights</nav>
    <header className="border-b border-white/15 pb-9"><p className="font-mono text-xs uppercase tracking-[.2em] text-[#a8dce8]">Founder only · AAL2</p><h1 className="mt-4 text-4xl font-black text-[#f1ede5] sm:text-6xl">BTSHQ Insights</h1><p className="mt-5 max-w-3xl leading-7 text-slate-300">Measured interest in your published work. Event counts, never unique visitors. No answers, scores or personal profiles.</p><p className="mt-4 font-mono text-sm text-[#e7c48c]">{collecting ? "Collection enabled · separate tab opt-in required" : "Collection OFF"}</p></header>
    <nav aria-label="Insights period" className="my-7 flex flex-wrap gap-3">{(["7d", "30d", "all"] as const).map((value) => <Link key={value} href={`/admin/insights?period=${value}`} aria-current={period === value ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-bold ${period === value ? "border-[#a8dce8] bg-[#a8dce8]/10 text-white" : "border-white/20 text-slate-300"}`}>{value === "all" ? "Since measurement began" : value === "7d" ? "Last 7 UTC days" : "Last 30 UTC days"}</Link>)}</nav>
    {state.status !== "available" ? <section role={state.status === "unavailable" ? "alert" : "status"} className="border-l-2 border-[#e7c48c] bg-white/[.025] p-6"><h2 className="text-xl font-bold text-white">{state.status === "disabled" ? "Measurement is disabled" : "Insights are temporarily unavailable"}</h2><p className="mt-3 text-slate-300">{state.status === "disabled" ? "No tracking is enabled by opening this dashboard. Approved configuration and a separate visitor opt-in are required." : "No numbers are shown from failed or unverified reads. Try this page again later."}</p></section> : <>
      <dl className="grid gap-5 border-y border-white/15 py-6 text-sm sm:grid-cols-3"><div><dt className="text-slate-400">Measurement started</dt><dd className="mt-2 text-slate-100">{date(data!.startedAt)}</dd></div><div><dt className="text-slate-400">Last recorded event</dt><dd className="mt-2 text-slate-100">{date(data!.lastEventAt)}</dd></div><div><dt className="text-slate-400">Last retention maintenance</dt><dd className="mt-2 text-slate-100">{date(data!.maintainedAt)}</dd></div></dl>
      <p className="my-5 text-sm leading-6 text-slate-300">Read {date(data!.asOf)}. Today is a partial UTC day. Starts and completions are independent event totals, not a linked user funnel or completion rate.</p>
      {!ready ? <section role="status" className="my-8 border border-white/15 p-7"><h2 className="text-2xl font-bold text-[#f1ede5]">No measured events yet</h2><p className="mt-3 text-slate-300">There is no invented history. Rankings appear after real, consented events are recorded.</p></section> : <>
        <section aria-labelledby="area-summary-title" className="my-9"><h2 id="area-summary-title" className="text-2xl font-bold text-[#f1ede5]">Content overview</h2><dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{groups.map((name) => <div key={name} className="border-t-2 border-[#a8dce8]/50 bg-[#102534] p-5"><dt className="text-sm text-slate-300">{name}</dt><dd className="mt-3 text-3xl font-bold text-[#a8dce8]">{number(metrics.filter((item) => area(item.name) === name).reduce((sum, item) => sum + item.count, 0))}<span className="mt-2 block text-xs font-normal text-slate-300">events</span></dd></div>)}</dl></section>
        {groups.map((group) => {
          const relevant = metrics.filter((metric) => area(metric.name) === group);
          const ids = [...new Set(relevant.map(({ contentId }) => contentId))];
          const count = (id: string, name: InsightEvent) => relevant.find((metric) => metric.contentId === id && metric.name === name)?.count ?? 0;
          const view = group === "Writing" ? "article_view" : group === "Tools" ? "tool_view" : group === "People" ? "interview_view" : group === "Projects" ? "project_view" : "public_content_open";
          ids.sort((a, b) => count(b, view) - count(a, view) || a.localeCompare(b));
          return <section key={group} aria-labelledby={`ranking-${group}`} className="border-t border-white/15 py-9"><h2 id={`ranking-${group}`} className="text-2xl font-bold text-[#f1ede5]">{group === "People" ? "Interviews" : group} ranking</h2>{!ids.length ? <p className="mt-5 text-slate-300">No measured events in this period.</p> : <div className="mt-5 max-w-full overflow-x-auto rounded-xl border border-white/15"><table className="w-full text-left text-sm"><caption className="sr-only">{group} event counts</caption><thead className="bg-[#102534] text-[#a8dce8]"><tr><th scope="col" className="px-4 py-4">Content</th><th scope="col" className="px-3 py-4 text-right">{group === "Community" ? "Opens / views" : "Views"}</th>{group === "Tools" && <><th scope="col" className="px-3 py-4 text-right">Starts</th><th scope="col" className="px-3 py-4 text-right">Completed</th></>}</tr></thead><tbody>{ids.map((id) => {
            const target = catalog.find((item) => item.id === id);
            return <tr key={id} className="border-t border-white/10 align-top text-slate-200"><th scope="row" className="max-w-sm break-words px-4 py-4 font-medium">{target ? <Link href={target.href} className="inline-flex min-h-11 items-center text-[#a8dce8] underline underline-offset-4">{target.title}</Link> : "Content label unavailable"}</th><td className="px-3 py-4 text-right tabular-nums">{number(count(id, view) + (group === "Community" ? count(id, "community_view") : 0))}</td>{group === "Tools" && <><td className="px-3 py-4 text-right tabular-nums">{target?.lifecycle ? number(count(id, "tool_start")) : <span title="No verified lifecycle source">Unavailable</span>}</td><td className="px-3 py-4 text-right tabular-nums">{target?.lifecycle ? number(count(id, "tool_complete")) : <span title="No verified lifecycle source">Unavailable</span>}</td></>}</tr>;
          })}</tbody></table></div>}</section>;
        })}
        <section aria-labelledby="trend-title" className="border-t border-white/15 py-9"><h2 id="trend-title" className="text-2xl font-bold text-[#f1ede5]">Daily event trend</h2><p className="mt-3 text-sm text-slate-300">All event categories · up to the latest 90 UTC days of this period. Days with no row have zero recorded events.</p><table className="mt-5 w-full text-left text-sm"><caption className="sr-only">Daily UTC event totals with proportional bars</caption><thead><tr className="text-[#a8dce8]"><th scope="col" className="py-3">UTC day</th><th scope="col" className="py-3 text-right">Events</th><th scope="col" className="w-1/3 pl-4"><span className="sr-only">Relative volume</span></th></tr></thead><tbody>{data!.daily.map(({ day, count }) => <tr key={day} className="border-t border-white/10"><th scope="row" className="py-3 font-normal text-slate-200">{day}</th><td className="text-right text-slate-200 tabular-nums">{number(count)}</td><td className="pl-4"><span aria-hidden="true" className="block h-2 rounded bg-[#a8dce8]" style={{ width: `${count / dailyMax * 100}%` }} /></td></tr>)}</tbody></table></section>
      </>}
    </>}
    <aside className="mt-9 border-t border-white/15 py-6 text-sm leading-7 text-slate-300">Lifecycle V1: Personal Advantage and Money Profile. Other tools expose view counts; their starts/completions are unavailable. Counts exclude non-consenting visitors and privacy signals. No individual navigation history or unique-user estimate is available.</aside>
  </div></div>;
}
