import { AccountCommentForm } from "@/components/writing/comments/account-comment-form";
import { CommentForm } from "@/components/writing/comments/comment-form";
import { CommentList } from "@/components/writing/comments/comment-list";
import { DisplayNameSetup } from "@/components/writing/comments/display-name-setup";
import type { DiscussionParticipation, PublicDiscussionResult } from "@/types/comments";

export function Discussion({ articleId, discussion, participation }: { articleId: string; discussion: PublicDiscussionResult; participation: DiscussionParticipation }) {
  if (discussion.status === "disabled") return null;
  return <section aria-labelledby="discussion-title" className="mx-auto max-w-[72ch] border-t border-white/15 py-16 sm:py-20">
    <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#35d0e5]">Discussion</p>
    <h2 id="discussion-title" tabIndex={-1} className="mt-4 text-4xl font-black text-white outline-none sm:text-5xl">Continue the thought.</h2>
    <p className="mt-5 leading-7 text-slate-300">Disagreement is welcome. Disrespect isn’t.</p>
    {discussion.status === "unavailable" ? <div role="status" className="mt-10 border-l-2 border-[#ff9a3d] p-6"><h3 className="text-xl font-black text-white">Comments are temporarily unavailable.</h3><p className="mt-2 text-slate-400">The article remains available while the discussion service recovers.</p></div> : <>
      {discussion.status === "empty" ? <div className="mt-10 border-l-2 border-[#35d0e5] p-6"><h3 className="text-xl font-black text-white">No comments yet.</h3><p className="mt-2 text-slate-400">Start the discussion with a thoughtful response.</p></div> : <CommentList comments={discussion.comments} />}
      {discussion.state === "closed" ? <div role="status" className="mt-10 border-l-2 border-[#ff9a3d] p-6"><h3 className="text-xl font-black text-white">Discussion closed.</h3><p className="mt-2 text-slate-400">Existing comments remain visible, but new comments are not being accepted.</p></div> : participation.kind === "guest" ? <CommentForm articleId={articleId} formToken={participation.formToken} /> : participation.kind === "profile-setup" ? <DisplayNameSetup /> : participation.kind === "account" ? <AccountCommentForm articleId={articleId} displayName={participation.displayName} formToken={participation.formToken} /> : <p role="status" className="mt-8 border-l-2 border-[#ff9a3d] p-5 text-slate-300">Comment submission is temporarily unavailable.</p>}
    </>}
  </section>;
}
