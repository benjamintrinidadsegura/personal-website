import type { PublicGuestComment } from "@/types/comments";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin",
});

function CommentBody({ body }: { body: string }) {
  const paragraphs = body.split(/\n{2,}/u).map((paragraph) => paragraph.trim()).filter(Boolean);
  return <div className="mt-5 space-y-4 leading-7 text-slate-200 [overflow-wrap:anywhere]">{paragraphs.map((paragraph, index) => (
    <p key={`${index}-${paragraph.slice(0, 24)}`} className="whitespace-pre-wrap">{paragraph}</p>
  ))}</div>;
}

export function CommentList({ comments }: { comments: PublicGuestComment[] }) {
  return <ol className="mt-10 grid gap-5" aria-label="Published comments">{comments.map((comment) => (
    <li key={comment.id} id={`comment-${comment.id}`} className="scroll-mt-28">
      <article className="border-l-2 border-white/15 bg-white/[0.02] p-5 sm:p-7">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="font-black text-white">{comment.displayName}</h3>
          <span className="font-mono text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">Guest</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <time dateTime={comment.createdAt} className="font-mono text-xs text-slate-500">{dateFormatter.format(new Date(comment.createdAt))}</time>
        </header>
        <CommentBody body={comment.body} />
      </article>
    </li>
  ))}</ol>;
}
