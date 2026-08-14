export function CommentBody({ body }: { body: string }) {
  const paragraphs = body.split(/\n{2,}/u).map((paragraph) => paragraph.trim()).filter(Boolean);
  return <div className="mt-5 space-y-4 leading-7 text-slate-200 [overflow-wrap:anywhere]">{paragraphs.map((paragraph, index) => (
    <p key={`${index}-${paragraph.slice(0, 24)}`} className="whitespace-pre-wrap">{paragraph}</p>
  ))}</div>;
}
