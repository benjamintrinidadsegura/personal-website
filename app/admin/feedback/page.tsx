import Link from "next/link";

import { requireAdminPage } from "@/lib/admin/authorization";
import {
  feedbackAdminFilters,
  type AdminFeedbackSummary,
  type FeedbackAdminFilter,
} from "@/types/feedback";

export const metadata = { title: "Feedback | BTS Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});

const sourceLabels: Record<AdminFeedbackSummary["source_context"], string> = {
  home: "Home",
  writing: "Writing",
  fyns: "Find Your Next Step",
  "world-map": "World Map",
  "life-alignment": "Life Alignment",
  projects: "Projects",
  people: "People",
  discovery: "Discovery",
  other: "Other",
};

function contactDisplay(item: AdminFeedbackSummary): string {
  return item.contact_method && item.contact_value
    ? `${item.contact_method} · ${item.contact_value}`
    : "Not provided";
}

export default async function FeedbackAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; result?: string }>;
}) {
  const { supabase } = await requireAdminPage(true);
  const query = await searchParams;
  const filter: FeedbackAdminFilter = feedbackAdminFilters.includes(query.status as FeedbackAdminFilter)
    ? query.status as FeedbackAdminFilter
    : "active";
  const { data, error } = await supabase.rpc("list_private_feedback", {
    p_filter: filter,
    p_limit: 50,
  });
  const feedback = !error && Array.isArray(data) ? data as AdminFeedbackSummary[] : [];

  return (
    <div className="min-h-svh px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400">
          <Link href="/admin" className="inline-flex min-h-11 items-center hover:text-white">BTS Studio</Link> / <span aria-current="page" className="text-[#35d0e5]">Feedback</span>
        </nav>
        <header className="mt-5 border-b border-white/15 pb-10">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Private inbox · AAL2</p>
          <h1 className="mt-4 text-4xl font-black text-white sm:text-6xl">Feedback</h1>
          <p className="mt-4 max-w-2xl text-slate-400">Private messages from the Digital HQ. Maximum 50 entries per view.</p>
        </header>

        {query.result === "deleted" ? <p role="status" className="mt-7 border-l-2 border-emerald-300 p-5 text-emerald-200">Feedback permanently deleted.</p> : null}

        <nav aria-label="Feedback filters" className="my-8 flex flex-wrap gap-3">
          {feedbackAdminFilters.map((candidate) => (
            <Link
              key={candidate}
              href={candidate === "active" ? "/admin/feedback" : `/admin/feedback?status=${candidate}`}
              aria-current={candidate === filter ? "page" : undefined}
              className={`min-h-11 rounded-full border px-5 py-3 font-bold capitalize ${candidate === filter ? "border-[#35d0e5] bg-[#35d0e5]/10 text-white" : "border-white/15 text-slate-300"}`}
            >
              {candidate}
            </Link>
          ))}
        </nav>

        {error ? (
          <p role="alert" className="border-l-2 border-[#ff9a3d] p-6 text-slate-200">Feedback is temporarily unavailable.</p>
        ) : feedback.length === 0 ? (
          <p className="border-l-2 border-[#35d0e5] p-7 text-slate-300">No feedback in this view.</p>
        ) : (
          <ol className="grid gap-4">
            {feedback.map((item) => (
              <li key={item.id}>
                <Link href={`/admin/feedback/${item.id}`} className="grid min-w-0 gap-5 border border-white/15 bg-white/[0.02] p-5 transition hover:border-[#35d0e5]/55 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5] sm:p-7 lg:grid-cols-[12rem_1fr_auto]">
                  <div>
                    <p className="font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">Status</p>
                    <p className="mt-1 font-mono text-xs font-black uppercase tracking-[0.16em] text-[#35d0e5]">{item.status}</p>
                    <p className="mt-4 font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">Source</p>
                    <p className="mt-1 text-sm text-slate-300">{sourceLabels[item.source_context]}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">Name</p>
                    <h2 className="mt-1 break-words font-black text-white [overflow-wrap:anywhere]">{item.name || "Not provided"}</h2>
                    <p className="mt-4 font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">Contact</p>
                    <p className="mt-1 break-words text-sm text-slate-300 [overflow-wrap:anywhere]">{contactDisplay(item)}</p>
                    <p className="mt-4 font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">Message</p>
                    <p className="mt-1 break-words leading-7 text-slate-300 [overflow-wrap:anywhere]">{item.message_preview}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">Submitted</p>
                    <time dateTime={item.created_at} className="mt-1 block font-mono text-xs text-slate-400">{dateFormatter.format(new Date(item.created_at))}</time>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
