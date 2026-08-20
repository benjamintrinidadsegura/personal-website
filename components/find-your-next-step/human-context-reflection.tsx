"use client";

import type { CSSProperties } from "react";
import { useLocale } from "@/components/i18n/locale-context";
import { fynsHumanContextCopy } from "@/data/find-your-next-step-ui-locales";

export function HumanContextReflection({
  accent,
  titleId,
}: {
  accent: string;
  titleId: string;
}) {
  const locale = useLocale();
  const copy = fynsHumanContextCopy[locale];
  return (
    <section
      aria-labelledby={titleId}
      style={{ "--human-context-accent": accent } as CSSProperties}
      className="mt-12 border-y border-white/10 bg-white/[0.018] py-8 sm:mt-14 sm:py-10"
    >
      <div className="max-w-4xl border-l-2 border-[var(--human-context-accent)] pl-5 sm:pl-7">
        <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[var(--human-context-accent)]">
          {copy.eyebrow}
        </p>
        <h3 id={titleId} className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl">
          {copy.title}
        </h3>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">
          {copy.body}
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
          {copy.privacy}
        </p>
      </div>
    </section>
  );
}
