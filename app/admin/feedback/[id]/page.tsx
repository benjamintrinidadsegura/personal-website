import Link from "next/link";
import { notFound } from "next/navigation";

import { FeedbackAdminActions } from "@/components/admin/feedback-actions";
import { requireAdminPage } from "@/lib/admin/authorization";
import type { AdminFeedback } from "@/types/feedback";

export const metadata = { title: "Feedback detail | BTS Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});

function contactDisplay(feedback: AdminFeedback): string {
  return feedback.contact_method && feedback.contact_value
    ? `${feedback.contact_method} · ${feedback.contact_value}`
    : "Not provided";
}

export default async function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();
  const { supabase } = await requireAdminPage(true);
  const { data, error } = await supabase.rpc("get_private_feedback", { p_feedback_id: id });
  const feedback = !error && Array.isArray(data) ? data[0] as AdminFeedback | undefined : undefined;

  return (
    <div className="min-h-svh px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400">
          <Link href="/admin" className="inline-flex min-h-11 items-center hover:text-white">BTS Studio</Link> /{" "}
          <Link href="/admin/feedback" className="inline-flex min-h-11 items-center hover:text-white">Feedback</Link> /{" "}
          <span aria-current="page" className="text-[#35d0e5]">Message</span>
        </nav>
        {error ? (
          <p role="alert" className="mt-8 border-l-2 border-[#ff9a3d] p-6 text-slate-200">This feedback message is temporarily unavailable.</p>
        ) : !feedback ? (
          notFound()
        ) : (
          <article className="mt-7 border border-white/15 bg-white/[0.02] p-6 sm:p-9">
            <header className="flex flex-wrap items-start justify-between gap-5 border-b border-white/10 pb-6">
              <div>
                <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#35d0e5]">Private Feedback</p>
                <h1 className="mt-4 text-3xl font-black text-white sm:text-5xl">Feedback message</h1>
              </div>
            </header>
            <dl className="mt-7 grid gap-5 border-b border-white/10 pb-7 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-xs font-black uppercase tracking-[0.16em] text-slate-500">Name</dt>
                <dd className="mt-2 break-words text-slate-200 [overflow-wrap:anywhere]">{feedback.name || "Not provided"}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs font-black uppercase tracking-[0.16em] text-slate-500">Contact</dt>
                <dd className="mt-2 break-words text-slate-200 [overflow-wrap:anywhere]">{contactDisplay(feedback)}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs font-black uppercase tracking-[0.16em] text-slate-500">Source</dt>
                <dd className="mt-2 text-slate-200">{feedback.source_context}</dd>
              </div>
              {feedback.result_product ? <>
                <div><dt className="font-mono text-xs font-black uppercase tracking-[0.16em] text-slate-500">Result product</dt><dd className="mt-2 text-slate-200">{feedback.result_product}</dd></div>
                <div><dt className="font-mono text-xs font-black uppercase tracking-[0.16em] text-slate-500">Fit</dt><dd className="mt-2 text-slate-200">{feedback.result_fit}</dd></div>
                <div><dt className="font-mono text-xs font-black uppercase tracking-[0.16em] text-slate-500">Most useful</dt><dd className="mt-2 text-slate-200">{feedback.usefulness_category || "Not provided"}</dd></div>
                <div><dt className="font-mono text-xs font-black uppercase tracking-[0.16em] text-slate-500">Locale</dt><dd className="mt-2 text-slate-200">{feedback.locale || "Not recorded"}</dd></div>
              </> : null}
              <div>
                <dt className="font-mono text-xs font-black uppercase tracking-[0.16em] text-slate-500">Status</dt>
                <dd className="mt-2 text-slate-200">{feedback.status}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-mono text-xs font-black uppercase tracking-[0.16em] text-slate-500">Submitted</dt>
                <dd className="mt-2"><time dateTime={feedback.created_at} className="font-mono text-sm text-slate-300">{dateFormatter.format(new Date(feedback.created_at))}</time></dd>
              </div>
            </dl>
            <section aria-labelledby="feedback-message-heading" className="mt-8">
              <h2 id="feedback-message-heading" className="font-mono text-xs font-black uppercase tracking-[0.16em] text-slate-500">Message</h2>
              <p className="mt-3 whitespace-pre-wrap break-words text-lg leading-8 text-slate-200 [overflow-wrap:anywhere]">{feedback.message || "No optional comment."}</p>
            </section>
            <FeedbackAdminActions feedback={feedback} />
          </article>
        )}
      </div>
    </div>
  );
}
