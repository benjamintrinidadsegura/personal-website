"use client";

import type { CSSProperties, RefObject } from "react";
import { useLocale } from "@/components/i18n/locale-context";
import { fynsHumanContextCopy } from "@/data/find-your-next-step-ui-locales";

export function FynsResultRecovery({
  accent,
  titleId,
  title,
  message,
  actionLabel,
  onAction,
  headingRef,
}: {
  accent: string;
  titleId: string;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <section
      aria-labelledby={titleId}
      style={{ "--recovery-accent": accent } as CSSProperties}
      className="py-20"
    >
      <div className="max-w-3xl border-l-2 border-[var(--recovery-accent)] bg-white/[0.025] p-6 sm:p-8">
        <h2 ref={headingRef} tabIndex={-1} id={titleId} className="text-3xl font-black text-white outline-none sm:text-4xl">
          {title}
        </h2>
        <p className="mt-5 leading-7 text-slate-300">{message}</p>
        <button
          type="button"
          onClick={onAction}
          className="mt-8 min-h-12 rounded-full bg-[var(--recovery-accent)] px-6 py-3 font-black text-[#041018] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--recovery-accent)]"
        >
          {actionLabel}
        </button>
      </div>
    </section>
  );
}

export function FynsResultSupplementFallback({
  accent,
  titleId,
  title,
}: {
  accent: string;
  titleId: string;
  title: string;
}) {
  const locale = useLocale();
  return (
    <section
      aria-labelledby={titleId}
      style={{ "--recovery-accent": accent } as CSSProperties}
      className="mt-14 border-l border-[var(--recovery-accent)]/55 bg-white/[0.018] p-5 sm:p-7"
    >
      <h3 id={titleId} className="font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {fynsHumanContextCopy[locale].recovery}
      </p>
    </section>
  );
}
