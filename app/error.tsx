"use client";

import { useLocale } from "@/components/i18n/locale-context";
import { getErrorDictionary } from "@/data/i18n/errors";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = useLocale();
  const copy = getErrorDictionary(locale);
  return (
    <section className="flex min-h-[70svh] items-center px-5 pb-20 pt-32 sm:px-8" aria-labelledby="error-title">
      <div className="mx-auto w-full max-w-4xl border-l-2 border-[#ff9a3d] pl-7 sm:pl-10">
        <p className="font-mono text-xs font-black uppercase tracking-[0.25em] text-[#ff9a3d]">{copy.interrupted}</p>
        <h1 id="error-title" className="mt-5 text-4xl font-black text-white sm:text-6xl">{copy.viewTitle}</h1>
        <p className="mt-5 max-w-2xl leading-7 text-slate-300">{copy.viewBody}</p>
        <button type="button" onClick={reset} className="mt-8 min-h-12 rounded-full bg-[#35d0e5] px-7 font-black text-[#041018] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]">{copy.retry}</button>
      </div>
    </section>
  );
}
