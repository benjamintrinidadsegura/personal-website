import type { CSSProperties } from "react";
import Link from "next/link";

import { findYourNextStep } from "@/data/find-your-next-step";
import { StatusPill } from "@/components/ui/status-pill";
import type { NextStepJourney } from "@/types/find-your-next-step";

export function FindYourNextStepJourneyBreadcrumb({ journey }: { journey: NextStepJourney }) {
  return (
    <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="inline-flex min-h-11 items-center transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--journey-accent)]">
            Digital HQ
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href={findYourNextStep.href} className="inline-flex min-h-11 items-center transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--journey-accent)]">
            {findYourNextStep.name}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-[var(--journey-accent)]">Weg {journey.number}</li>
      </ol>
    </nav>
  );
}

export function FindYourNextStepJourney({ journey }: { journey: NextStepJourney }) {
  return (
    <article
      style={{ "--journey-accent": journey.accent } as CSSProperties}
      className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36"
    >
      <div
        aria-hidden="true"
        style={{ background: `radial-gradient(circle at 76% 16%, ${journey.accent}20, transparent 26rem)` }}
        className="absolute inset-x-0 top-0 h-[52rem]"
      />

      <div className="relative mx-auto max-w-6xl">
        <FindYourNextStepJourneyBreadcrumb journey={journey} />

        <header className="grid min-h-[64svh] items-center gap-12 border-b border-white/15 py-16 lg:grid-cols-[1.12fr_0.88fr] lg:py-24">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-[var(--journey-accent)]">
              Find Your Next Step / Weg {journey.number}
            </p>
            <h1 className="mt-7 text-[clamp(2.65rem,8vw,6.8rem)] font-black leading-[0.9] tracking-[-0.055em] text-white [overflow-wrap:anywhere]">
              {journey.title}
            </h1>
            <p className="mt-8 max-w-4xl text-lg font-black leading-snug text-white sm:text-2xl lg:text-3xl">
              {journey.description}
            </p>
          </div>

          <aside aria-label="Entwicklungsstatus" className="border-l border-[var(--journey-accent)] pl-7 sm:pl-9">
            <StatusPill>{journey.status}</StatusPill>
            <h2 className="mt-6 text-2xl font-black leading-snug text-white sm:text-3xl">Diese Journey entsteht gerade.</h2>
            <p className="mt-5 leading-7 text-slate-400">
              Diese Seite zeigt das vorbereitete Fundament. Die eigentlichen Fragen, Einordnungen und Ergebnisse werden erst in einem späteren Sprint entwickelt. Aktuell findet hier noch keine Analyse statt.
            </p>
          </aside>
        </header>

        <section aria-labelledby="journey-expectations-title" className="grid gap-10 border-b border-white/15 py-20 lg:grid-cols-[0.38fr_1fr] sm:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--journey-accent)]">Was dich hier erwartet</p>
          <div>
            <h2 id="journey-expectations-title" className="text-3xl font-black text-white sm:text-5xl">Orientierung, die bei deinem Kontext beginnt.</h2>
            <ul className="mt-10 grid border-l border-t border-white/10 sm:grid-cols-2">
              {journey.expectations.map((expectation, index) => (
                <li key={expectation} className="border-b border-r border-white/10 bg-[#061521]/55 p-6 sm:p-7">
                  <span className="font-mono text-xs text-[var(--journey-accent)]">{String(index + 1).padStart(2, "0")}</span>
                  <p className="mt-7 text-lg font-bold leading-7 text-slate-200">{expectation}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="journey-analysis-title" className="grid gap-10 border-b border-white/15 py-20 lg:grid-cols-[0.38fr_1fr] sm:py-24">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--journey-accent)]">Was später betrachtet wird</p>
            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-500">Noch keine Bewertung und kein Score – zunächst nur die geplanten Blickwinkel.</p>
          </div>
          <div>
            <h2 id="journey-analysis-title" className="text-3xl font-black text-white sm:text-5xl">Mehrere Signale statt einer vorschnellen Antwort.</h2>
            <ul className="mt-10 grid gap-x-8 sm:grid-cols-2">
              {journey.analysisAreas.map((area, index) => (
                <li key={area} className="flex min-h-16 items-start gap-4 border-b border-white/10 py-5 text-base font-bold leading-7 text-slate-300">
                  <span className="shrink-0 font-mono text-xs text-[var(--journey-accent)]">{String(index + 1).padStart(2, "0")}</span>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {journey.professionalBoundary ? (
          <aside aria-labelledby="professional-boundary-title" className="grid gap-6 border-b border-white/15 py-14 lg:grid-cols-[0.38fr_1fr]">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Einordnung</p>
            <div>
              <h2 id="professional-boundary-title" className="text-xl font-black text-white">Orientierung hat klare Grenzen.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">{journey.professionalBoundary}</p>
            </div>
          </aside>
        ) : null}

        <div className="flex flex-col items-start justify-between gap-6 py-14 sm:flex-row sm:items-center">
          <p className="max-w-xl text-slate-500">Dieser Weg ist Teil des wachsenden Find-Your-Next-Step-Fundaments.</p>
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
