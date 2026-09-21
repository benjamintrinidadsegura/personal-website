"use client";

import { useId, useState } from "react";

import { QuoteShareDialog } from "@/components/quotes/quote-share-dialog";
import { ShareIcon } from "@/components/sharing/share-icon";
import { useLocale } from "@/components/i18n/locale-context";
import { quoteDictionaries } from "@/data/i18n/quotes";
import { selectQuote } from "@/lib/quotes";
import type { QuoteSelectionContext, SelectedQuote } from "@/types/quote";

type ContextWithoutLocale = Omit<QuoteSelectionContext, "locale" | "excludeIds" | "excludeFamilies" | "seed">;

export function QuoteExperience({ context, description, safeSharePath = "/", title, variant = "result" }: { context: ContextWithoutLocale; description?: string; safeSharePath?: string; title?: string; variant?: "daily" | "result" | "fyns" }) {
  const locale = useLocale();
  const copy = quoteDictionaries[locale];
  const headingId = useId();
  const [history, setHistory] = useState<SelectedQuote[]>(() => [selectQuote({ ...context, locale })]);
  const [shareOpen, setShareOpen] = useState(false);
  const current = history.at(-1)!;
  const eyebrow = variant === "daily" ? copy.dailyEyebrow : variant === "fyns" ? copy.fynsEyebrow : copy.reminderEyebrow;
  const surfaceTitle = title ?? (variant === "daily" ? copy.dailyTitle : eyebrow);
  const surfaceDescription = description ?? (variant === "daily" ? copy.dailyBody : undefined);

  const another = () => {
    const next = selectQuote({
      ...context,
      locale,
      seed: `explore-${history.length}`,
      excludeIds: history.map(({ id }) => id),
      excludeFamilies: history.slice(-4).map(({ semanticFamily }) => semanticFamily),
    });
    setHistory((previous) => [...previous.slice(-11), next]);
  };

  return (
    <section aria-labelledby={headingId} className={`quote-experience ${variant === "daily" ? "quote-experience-daily" : "quote-experience-result"}`} data-quote-surface={context.surface} data-quote-id={current.id}>
      <div className="quote-experience-copy">
        <p className="quote-experience-eyebrow">{eyebrow}</p>
        <h2 id={headingId} className="quote-experience-title">{surfaceTitle}</h2>
        {surfaceDescription ? <p className="quote-experience-description">{surfaceDescription}</p> : null}
      </div>
      <div className="quote-experience-quote">
        <blockquote>
          <p>“{current.text}”</p>
          <footer><cite>{current.attribution}</cite><span aria-hidden="true"> · </span><span>{copy.original}</span></footer>
        </blockquote>
        <div className="quote-experience-actions">
          <button type="button" onClick={another}>{copy.another}</button>
          {current.shareEligible ? <button type="button" onClick={() => setShareOpen(true)} className="bts-share-action quote-experience-share"><ShareIcon /><span>{copy.share}</span></button> : null}
        </div>
      </div>
      {shareOpen ? <QuoteShareDialog copy={copy} onClose={() => setShareOpen(false)} quote={current} safeSharePath={safeSharePath} surfaceLabel={eyebrow} /> : null}
    </section>
  );
}
