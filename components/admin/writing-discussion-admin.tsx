import { WritingCommentModerationList } from "@/components/admin/writing-comment-moderation-list";
import { WritingDiscussionStateControls } from "@/components/admin/writing-discussion-state-controls";
import {
  getWritingDiscussionModerationContext,
  listWritingCommentsForModeration,
} from "@/lib/comments/moderation-queries";

const countDetails = [
  { key: "visible", label: "Visible", className: "text-emerald-300" },
  { key: "held", label: "Held", className: "text-[#ffb36d]" },
  { key: "spam", label: "Spam", className: "text-red-200" },
  { key: "removed", label: "Removed", className: "text-slate-300" },
] as const;

export function WritingDiscussionAdminFallback() {
  return (
    <section aria-labelledby="discussion-administration-heading" aria-busy="true" className="mt-12 border-t border-white/15 pt-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#35d0e5]">Discussion</p>
      <h2 id="discussion-administration-heading" className="mt-3 text-3xl font-black text-white">Discussion administration</h2>
      <p role="status" className="mt-6 border-l-2 border-white/20 p-5 text-slate-400">Loading bounded moderation data…</p>
    </section>
  );
}

export async function WritingDiscussionAdmin({ articleId, published }: { articleId: string; published: boolean }) {
  if (!published) {
    return (
      <section aria-labelledby="discussion-administration-heading" className="mt-12 border-t border-white/15 pt-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#35d0e5]">Discussion</p>
        <h2 id="discussion-administration-heading" className="mt-3 text-3xl font-black text-white">Discussion administration</h2>
        <p className="mt-5 border-l-2 border-white/20 p-5 text-slate-400">Discussion becomes available after this Writing article is published.</p>
      </section>
    );
  }

  const [contextResult, commentsResult] = await Promise.allSettled([
    getWritingDiscussionModerationContext(articleId),
    listWritingCommentsForModeration(articleId, 50),
  ]);
  const context = contextResult.status === "fulfilled" ? contextResult.value : null;
  const comments = commentsResult.status === "fulfilled" ? commentsResult.value : null;
  const available = context?.status === "data" && comments?.status === "data";

  return (
    <section aria-labelledby="discussion-administration-heading" className="mt-12 border-t border-white/15 pt-10">
      <div className="max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#35d0e5]">Discussion</p>
        <h2 id="discussion-administration-heading" className="mt-3 text-3xl font-black text-white">Discussion administration</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-400">Manage this article’s public Discussion separately from Writing content, publishing, and autosave.</p>
      </div>

      {!available ? (
        <div className="mt-7 border-l-2 border-[#ffb36d] bg-[#ffb36d]/[0.04] p-5">
          <h3 className="font-black text-white">Moderation temporarily unavailable</h3>
          <p role="status" className="mt-2 text-sm leading-6 text-slate-300">The Writing editor remains available. Reload this page later to retry the bounded moderation read.</p>
        </div>
      ) : (
        <div className="mt-7 grid gap-8">
          <WritingDiscussionStateControls context={context.data} />

          <section aria-labelledby="discussion-counts-heading">
            <h3 id="discussion-counts-heading" className="text-xl font-black text-white">Moderation counts</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {countDetails.map(({ key, label, className }) => (
                <div key={key} className="border border-white/10 bg-white/[0.02] p-4">
                  <dt className="font-mono text-xs uppercase tracking-[0.14em] text-slate-500">{label}</dt>
                  <dd className={`mt-2 text-2xl font-black ${className}`}>{context.data.counts[key]}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="recent-comments-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 id="recent-comments-heading" className="text-xl font-black text-white">Recent comments</h3>
                <p className="mt-2 text-sm text-slate-400">Latest 50, newest first. Hidden content is shown here only for authorized moderation.</p>
              </div>
            </div>
            <div className="mt-4"><WritingCommentModerationList comments={comments.data} /></div>
          </section>
        </div>
      )}
    </section>
  );
}
