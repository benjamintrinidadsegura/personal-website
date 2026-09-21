import { writingShareTextScale } from "@/lib/writing/share-segmentation";
import type { WritingShareFormat, WritingShareSource, WritingShareVariant } from "@/types/writing";

export function ShareCard({
  cardIndex,
  cardTotal,
  format,
  source,
  sourceLabel,
  text,
  variant,
}: {
  cardIndex: number;
  cardTotal: number;
  format: WritingShareFormat;
  source: WritingShareSource;
  sourceLabel: string;
  text: string;
  variant: WritingShareVariant;
}) {
  const scale = writingShareTextScale(text, variant, source.language);
  const progression = cardTotal > 1 ? `${String(cardIndex + 1).padStart(2, "0")} / ${String(cardTotal).padStart(2, "0")}` : null;

  return (
    <div
      aria-hidden="true"
      className="writing-share-card"
      data-format={format}
      data-content={source.kind ?? "thought"}
      data-scale={scale}
      data-variant={variant}
    >
      <div className="writing-share-card-safe-area">
        <header className="writing-share-card-header">
          <span className="writing-share-card-marker">BTS / {sourceLabel}</span>
          {progression ? <span className="writing-share-card-progress">{progression}</span> : null}
        </header>
        <div className="writing-share-card-content">
          {variant === "marginNote" ? <span className="writing-share-card-note-label">FIELD NOTE</span> : null}
          {source.kind === "article" ? (
            <>
              <p className="writing-share-card-article-kicker">A BTS WRITING</p>
              <p className="writing-share-card-article-title">{source.articleTitle}</p>
              <p className="writing-share-card-article-teaser">{text}</p>
            </>
          ) : <p className="writing-share-card-thought">{text}</p>}
        </div>
        <footer className="writing-share-card-footer">
          <div className="min-w-0">
            <p className="writing-share-card-author">{source.authorName}</p>
            <p className="writing-share-card-title">{source.kind === "article" ? sourceLabel : source.articleTitle}</p>
          </div>
          <p className="writing-share-card-domain">{source.domain}</p>
        </footer>
      </div>
    </div>
  );
}
