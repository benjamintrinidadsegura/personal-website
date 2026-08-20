import { AccountCommentForm } from "@/components/writing/comments/account-comment-form";
import { CommentForm } from "@/components/writing/comments/comment-form";
import { CommentList } from "@/components/writing/comments/comment-list";
import { DisplayNameSetup } from "@/components/writing/comments/display-name-setup";
import type { DiscussionParticipation, PublicDiscussionResult } from "@/types/comments";
import { getWritingDictionary } from "@/data/i18n/writing";
import { getLocale } from "@/lib/i18n/server";

export async function Discussion({ articleId, discussion, participation }: { articleId: string; discussion: PublicDiscussionResult; participation: DiscussionParticipation }) {
  if (discussion.status === "disabled") return null;
  const locale = await getLocale();
  const copy = getWritingDictionary(locale).discussion;
  return <section aria-labelledby="discussion-title" className="mx-auto max-w-[72ch] border-t border-white/15 py-16 sm:py-20">
    <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#35d0e5]">{copy.eyebrow}</p>
    <h2 id="discussion-title" tabIndex={-1} className="mt-4 text-4xl font-black text-white outline-none sm:text-5xl">{copy.title}</h2>
    <p className="mt-5 leading-7 text-slate-300">{copy.principle}</p>
    {discussion.status === "unavailable" ? <div role="status" className="mt-10 border-l-2 border-[#ff9a3d] p-6"><h3 className="text-xl font-black text-white">{copy.unavailableTitle}</h3><p className="mt-2 text-slate-400">{copy.unavailableBody}</p></div> : <>
      {discussion.status === "empty" ? <div className="mt-10 border-l-2 border-[#35d0e5] p-6"><h3 className="text-xl font-black text-white">{copy.emptyTitle}</h3><p className="mt-2 text-slate-400">{copy.emptyBody}</p></div> : <CommentList comments={discussion.comments} locale={locale} copy={copy} />}
      {discussion.state === "closed" ? <div role="status" className="mt-10 border-l-2 border-[#ff9a3d] p-6"><h3 className="text-xl font-black text-white">{copy.closedTitle}</h3><p className="mt-2 text-slate-400">{copy.closedBody}</p></div> : participation.kind === "guest" ? <CommentForm articleId={articleId} formToken={participation.formToken} copy={copy} /> : participation.kind === "profile-setup" ? <DisplayNameSetup copy={copy} /> : participation.kind === "account" ? <AccountCommentForm articleId={articleId} displayName={participation.displayName} formToken={participation.formToken} copy={copy} /> : <p role="status" className="mt-8 border-l-2 border-[#ff9a3d] p-5 text-slate-300">{copy.submissionUnavailable}</p>}
    </>}
  </section>;
}
