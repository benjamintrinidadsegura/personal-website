export function ArticleBody({ body }: { body: string }) {
  const paragraphs = body.split(/\n{2,}/u).map((paragraph) => paragraph.trim()).filter(Boolean);

  return (
    <div className="space-y-7 text-lg leading-8 text-slate-300 [overflow-wrap:anywhere] sm:text-xl sm:leading-9">
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`} className="whitespace-pre-line">{paragraph}</p>
      ))}
    </div>
  );
}
