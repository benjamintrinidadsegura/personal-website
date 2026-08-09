import type { CSSProperties } from "react";
import Link from "next/link";

import { FindYourNextStepJourneyBreadcrumb } from "@/components/find-your-next-step/find-your-next-step-journey";
import { SelfReflectionJourney } from "@/components/find-your-next-step/self-reflection-journey";
import { StatusPill } from "@/components/ui/status-pill";
import { findYourNextStep } from "@/data/find-your-next-step";
import type { NextStepJourney } from "@/types/find-your-next-step";

export function FindYourNextStepSelf({ journey }: { journey: NextStepJourney }) {
  return (
    <article
      style={{ "--journey-accent": journey.accent } as CSSProperties}
      className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[70rem] bg-[radial-gradient(circle_at_76%_12%,rgba(53,208,229,0.17),transparent_28rem),radial-gradient(circle_at_18%_42%,rgba(53,208,229,0.06),transparent_24rem)]"
      />

      <div className="relative mx-auto max-w-6xl">
        <FindYourNextStepJourneyBreadcrumb journey={journey} />

        <header className="grid gap-10 border-b border-white/15 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-24">
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-[var(--journey-accent)]">
                Find Your Next Step / Weg {journey.number}
              </p>
              <StatusPill>{journey.status}</StatusPill>
            </div>
            <h1 className="mt-7 text-[clamp(3.2rem,9vw,7.5rem)] font-black leading-[0.87] tracking-[-0.06em] text-white [overflow-wrap:anywhere]">
              {journey.title}
            </h1>
          </div>
          <p className="max-w-2xl border-l border-[var(--journey-accent)] pl-7 text-lg font-bold leading-8 text-slate-200 sm:pl-9 sm:text-xl">
            {journey.description}
          </p>
        </header>

        <SelfReflectionJourney />

        <div className="flex flex-col items-start justify-between gap-6 border-t border-white/15 py-14 sm:flex-row sm:items-center">
          <p className="max-w-xl text-slate-500">
            Diese Beta bleibt bewusst eine strukturierte Selbstreflexion – ohne Diagnose und ohne dauerhafte Speicherung.
          </p>
          <Link
            href={findYourNextStep.href}
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 py-3 font-bold text-slate-200 transition hover:border-[var(--journey-accent)]/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--journey-accent)]"
          >
            ← Zurück zu Find Your Next Step
          </Link>
        </div>
      </div>
    </article>
  );
}
