import type { WritingShareFormat } from "@/types/writing";
import type { SelectedQuote } from "@/types/quote";

export function QuoteShareCard({ format, quote, originalLabel, surfaceLabel }: { format: WritingShareFormat; quote: SelectedQuote; originalLabel: string; surfaceLabel: string }) {
  const scale = quote.text.length > 170 ? "long" : quote.text.length > 105 ? "medium" : "short";
  return (
    <div aria-hidden="true" className="writing-share-card quote-share-card" data-format={format} data-scale={scale} data-variant="editorial">
      <div className="writing-share-card-safe-area">
        <header className="writing-share-card-header">
          <span className="writing-share-card-marker">BTS / {surfaceLabel}</span>
          <span className="writing-share-card-progress">{originalLabel}</span>
        </header>
        <div className="writing-share-card-content">
          <p className="writing-share-card-thought">{quote.text}</p>
        </div>
        <footer className="writing-share-card-footer">
          <div className="min-w-0">
            <p className="writing-share-card-author">{quote.attribution}</p>
            {quote.source ? <p className="writing-share-card-title">{quote.source}</p> : null}
          </div>
          <p className="writing-share-card-domain">bts.online</p>
        </footer>
      </div>
    </div>
  );
}
