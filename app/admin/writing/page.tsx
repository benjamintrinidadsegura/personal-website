import Link from "next/link";

import { createWritingDraftAction } from "@/app/admin/writing/actions";
import { requireAdminPage } from "@/lib/admin/authorization";
import { listWritingDiscussionModerationSummaries } from "@/lib/comments/moderation-queries";
import { mapAdminWritingArticle } from "@/lib/writing/domain";
import type { WritingDiscussionModerationSummary } from "@/types/comment-moderation";

export const metadata = { title: "Writing | BTS Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});

const discussionStateStyles = {
  open: "border-emerald-300/40 text-emerald-300",
  closed: "border-[#ffb36d]/45 text-[#ffca96]",
  disabled: "border-slate-400/40 text-slate-300",
} as const;

function DiscussionOverview({ summary }: { summary: WritingDiscussionModerationSummary | null }) {
  if (!summary) {
    return (
      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-slate-500">Discussion · Unavailable</p>
        <p className="mt-2 text-sm text-slate-500">Moderation information could not be loaded. Article management remains available.</p>
      </div>
    );
  }

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-slate-500">Discussion</p>
        <span className={`rounded-full border px-2.5 py-1 font-mono text-[0.65rem] font-black uppercase tracking-[0.14em] ${discussionStateStyles[summary.state]}`}>
          {summary.state}
        </span>
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <div className="flex gap-1.5"><dt className="text-slate-500">Visible</dt><dd className="font-bold text-slate-200">{summary.counts.visible}</dd></div>
        <div className={`flex gap-1.5 ${summary.counts.held > 0 ? "rounded bg-[#ffb36d]/10 px-2 text-[#ffca96]" : ""}`}><dt className={summary.counts.held > 0 ? "font-bold" : "text-slate-500"}>Held</dt><dd className="font-black">{summary.counts.held}</dd></div>
        <div className={`flex gap-1.5 ${summary.counts.spam > 0 ? "rounded bg-red-300/10 px-2 text-red-200" : ""}`}><dt className={summary.counts.spam > 0 ? "font-bold" : "text-slate-500"}>Spam</dt><dd className="font-black">{summary.counts.spam}</dd></div>
        <div className="flex gap-1.5"><dt className="text-slate-500">Removed</dt><dd className="font-bold text-slate-300">{summary.counts.removed}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-slate-500">
        {summary.latestCommentAt ? `Latest activity ${dateFormatter.format(new Date(summary.latestCommentAt))}` : "No comment activity yet"}
      </p>
    </div>
  );
}

export default async function AdminWritingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { supabase } = await requireAdminPage(true);
  const summariesPromise = listWritingDiscussionModerationSummaries(100).catch(() => ({ status: "unavailable" as const, data: null }));
  const { data, error } = await supabase.rpc("list_writing_articles", { p_limit: 100 });
  const summaryResult = await summariesPromise;
  const summaries = summaryResult.status === "data"
    ? new Map(summaryResult.data.map((summary) => [summary.articleId, summary]))
    : null;
  const articles = !error && Array.isArray(data)
    ? data.map((row) => mapAdminWritingArticle(row)).filter((article) => article !== null)
    : [];
  const creationFailed = (await searchParams).error === "create";

  return (
    <div className="min-h-svh px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400">
          <Link href="/admin" className="inline-flex min-h-11 items-center hover:text-white">BTS Studio</Link> / <span aria-current="page" className="text-[#35d0e5]">Writing</span>
        </nav>
        <header className="mt-5 flex flex-wrap items-end justify-between gap-6 border-b border-white/15 pb-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Publishing</p>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-6xl">Writing</h1>
          </div>
          <form action={createWritingDraftAction}><button className="min-h-12 rounded-full bg-[#35d0e5] px-6 font-black text-[#041018]">New draft</button></form>
        </header>

        {creationFailed ? <p role="alert" className="mt-8 border-l-2 border-[#ff9a3d] p-5 text-[#ffcfaa]">Der Entwurf konnte nicht erstellt werden.</p> : null}
        {error ? (
          <p role="alert" className="mt-8 border-l-2 border-[#ff9a3d] p-5 text-slate-200">Writing ist vorübergehend nicht verfügbar.</p>
        ) : articles.length === 0 ? (
          <p className="mt-10 border-l-2 border-[#35d0e5] p-6 text-slate-300">Noch keine Writing-Artikel vorhanden.</p>
        ) : (
          <ol className="mt-10 grid gap-4">
            {articles.map((article) => (
              <li key={article.id}>
                <article className="grid gap-5 border border-white/15 bg-white/[0.02] p-6 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className={`font-mono text-xs font-black uppercase tracking-[0.18em] ${article.status === "published" ? "text-emerald-300" : "text-[#ffb36d]"}`}>{article.status === "published" ? "Published" : "Draft"}</p>
                    <h2 className="mt-3 break-words text-2xl font-black text-white">{article.title || "Unbenannter Entwurf"}</h2>
                    <p className="mt-2 text-sm text-slate-500">Zuletzt geändert {dateFormatter.format(new Date(article.updatedAt))}</p>
                    {article.status === "published" ? <DiscussionOverview summary={summaries?.get(article.id) ?? null} /> : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/admin/writing/${article.id}`} className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 font-bold text-white">Edit / open</Link>
                    {article.status === "published" && article.slug ? <Link href={`/writing/${article.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-[#35d0e5]/50 px-5 font-bold text-[#35d0e5]">Public article</Link> : null}
                  </div>
                </article>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
