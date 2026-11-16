"use client";

import { useLocale } from "@/components/i18n/locale-context";
import { WritingRetryButton } from "@/components/writing/writing-retry-button";
import { getWritingDictionary } from "@/data/i18n/writing";

/** A failed public read is an operational error, never a fabricated article or a 404. */
export default function WritingError({ reset }: { reset: () => void }) {
  const locale = useLocale();
  const copy = getWritingDictionary(locale).page;
  return <section className="mx-auto max-w-4xl px-5 pb-24 pt-36" role="alert" aria-labelledby="writing-recovery-title">
    <h1 id="writing-recovery-title" className="text-3xl font-bold text-white">{copy.unavailableTitle}</h1>
    <p className="mt-4 leading-7 text-slate-300">{copy.unavailableBody}</p>
    <WritingRetryButton locale={locale} reset={reset} />
  </section>;
}
