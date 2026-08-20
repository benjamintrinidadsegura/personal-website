"use client";

import Link from "next/link";
import { useLocale, useLocalizedHref } from "@/components/i18n/locale-context";
import { fynsErrorCopy } from "@/data/find-your-next-step-ui-locales";

export default function FindYourNextStepJourneyError({ reset }: { reset: () => void }) {
  const locale = useLocale();
  const href = useLocalizedHref();
  const copy = fynsErrorCopy[locale];
  return (
    <article className="section-lines relative min-h-[70svh] px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <section aria-labelledby="fyns-error-title" className="mx-auto max-w-4xl py-16 sm:py-24">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ffb36d]">
          {copy.eyebrow}
        </p>
        <h1 id="fyns-error-title" className="mt-5 max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">
          {copy.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          {copy.description}
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]"
          >
            {copy.retry}
          </button>
          <Link
            href={href("/find-your-next-step")}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-6 py-3 font-bold text-slate-200 hover:border-white/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]"
          >
            {copy.overview}
          </Link>
        </div>
      </section>
    </article>
  );
}
