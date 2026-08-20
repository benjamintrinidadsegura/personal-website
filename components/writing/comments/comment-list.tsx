import type { PublicWritingComment } from "@/types/comments";
import { CommentBody } from "@/components/writing/comments/comment-body";
import { OwnedCommentControls } from "@/components/writing/comments/owned-comment-controls";
import { localeDetails, type Locale } from "@/lib/i18n/config";
import type { WritingDictionary } from "@/data/i18n/writing";

export function CommentList({ comments, locale, copy }: { comments: PublicWritingComment[]; locale: Locale; copy: WritingDictionary["discussion"] }) {
  const dateFormatter = new Intl.DateTimeFormat(localeDetails[locale].htmlLang, {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin",
  });
  return <ol className="mt-10 grid gap-5" aria-label={copy.publishedComments}>{comments.map((comment) => (
    <li key={comment.id} id={`comment-${comment.id}`} className="scroll-mt-28">
      <article className="border-l-2 border-white/15 bg-white/[0.02] p-5 sm:p-7">
        {comment.deletion === "author" ? <p className="italic text-slate-400">{copy.deleted}</p> : <>
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="max-w-full break-words font-black text-white">{comment.displayName}</h3>
          {comment.identity === "guest" ? <span className="font-mono text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">{copy.guest}</span> : null}
          {comment.isAuthor ? <span className="font-mono text-[0.65rem] font-black uppercase tracking-[0.18em] text-[#35d0e5]">{copy.author}</span> : null}
          {comment.isEdited ? <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-slate-500">{copy.edited}</span> : null}
          <span aria-hidden="true" className="text-slate-600">·</span>
          <time dateTime={comment.createdAt} className="font-mono text-xs text-slate-500">{dateFormatter.format(new Date(comment.createdAt))}</time>
        </header>
        {comment.ownerVersion && (comment.canEdit || comment.canDelete)
          ? <OwnedCommentControls key={comment.ownerVersion} commentId={comment.id} body={comment.body} ownerVersion={comment.ownerVersion} canEdit={comment.canEdit} canDelete={comment.canDelete} copy={copy} />
          : <CommentBody body={comment.body} />}
        </>}
      </article>
    </li>
  ))}</ol>;
}
