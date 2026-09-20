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
                <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#35d0e5]">{feedback.status} · {feedback.source_context}</p>
                <h1 className="mt-4 break-words text-3xl font-black text-white sm:text-5xl">{feedback.name || "Name not provided"}</h1>
                <p className="mt-2 text-sm text-slate-500">User-provided display text; identity is not verified.</p>
              </div>
              <time dateTime={feedback.created_at} className="font-mono text-xs text-slate-500">{dateFormatter.format(new Date(feedback.created_at))}</time>
            </header>
            <p className="mt-8 whitespace-pre-wrap break-words text-lg leading-8 text-slate-200 [overflow-wrap:anywhere]">{feedback.message}</p>
            <FeedbackAdminActions feedback={feedback} />
          </article>
        )}
      </div>
    </div>
  );
}
