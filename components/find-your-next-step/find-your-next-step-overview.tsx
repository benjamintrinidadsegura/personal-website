import type { CSSProperties } from "react";
import Link from "next/link";

import { findYourNextStep, nextStepJourneys } from "@/data/find-your-next-step";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusPill } from "@/components/ui/status-pill";
import type { NextStepJourney } from "@/types/find-your-next-step";

const journeyLayouts = [
  "lg:col-span-8",
  "lg:col-span-8 lg:col-start-5",
  "lg:col-span-7 lg:col-start-2",
  "lg:col-span-9 lg:col-start-4",
] as const;

function JourneyCard({ journey, index }: { journey: NextStepJourney; index: number }) {
  return (
    <li className="grid lg:grid-cols-12">
      <Link
        href={journey.href}
        aria-label={`${journey.title} – Einstieg öffnen`}
        style={{
          "--journey-accent": journey.accent,
          background: `linear-gradient(135deg, ${journey.accent}12, rgba(255,255,255,0.012) 60%)`,
        } as CSSProperties}
        className={`group relative overflow-hidden rounded-[1.75rem] border border-white/10 p-7 outline-none transition-[border-color,transform,background-color] motion-safe:duration-300 motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none sm:p-9 lg:p-11 ${journeyLayouts[index]} hover:border-[var(--journey-accent)]/55 focus-visible:border-[var(--journey-accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--journey-accent)]`}
      >
        <span
          aria-hidden="true"
          className="absolute -right-8 -top-16 font-mono text-[clamp(8rem,20vw,16rem)] font-black leading-none text-[var(--journey-accent)] opacity-[0.045]"
        >
          {journey.number}
        </span>
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[var(--journey-accent)]">
              Weg {journey.number}
            </p>
            <StatusPill>{journey.status}</StatusPill>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <h3 className="max-w-3xl text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-5xl [overflow-wrap:anywhere]">
                {journey.title}
              </h3>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {journey.description}
              </p>
            </div>
            <span className="inline-flex min-h-11 shrink-0 items-center font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[var(--journey-accent)]">
              {journey.status === "Beta" ? "Journey öffnen" : "Weg ansehen"} <span aria-hidden="true" className="ml-2 transition-transform motion-safe:group-hover:translate-x-1">→</span>
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

export function FindYourNextStepOverview() {
  return (
    <article className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[54rem] bg-[radial-gradient(circle_at_75%_16%,rgba(53,208,229,0.14),transparent_25rem),radial-gradient(circle_at_16%_38%,rgba(255,122,0,0.07),transparent_22rem)]"
      />

      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]"
              >
                Digital HQ
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[#35d0e5]">{findYourNextStep.name}</li>
          </ol>
        </nav>

        <header className="grid min-h-[68svh] items-center gap-14 border-b border-white/15 py-16 lg:grid-cols-[1.12fr_0.88fr] lg:py-24">
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#35d0e5]">{findYourNextStep.eyebrow}</p>
              <StatusPill>{findYourNextStep.status}</StatusPill>
            </div>
            <h1 className="mt-7 text-[clamp(3.6rem,10vw,8.7rem)] font-black leading-[0.84] tracking-[-0.06em] text-white">
              Find Your<br />Next Step.
            </h1>
            <p className="mt-9 max-w-4xl text-xl font-black leading-snug text-white sm:text-3xl">
              {findYourNextStep.headline}
            </p>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              {findYourNextStep.introduction}
            </p>
          </div>

          <aside aria-labelledby="fyns-principle-title" className="border-l border-[#ff9a3d] pl-7 sm:pl-9">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">Was FYNS nicht tut</p>
            <h2 id="fyns-principle-title" className="mt-6 text-2xl font-black leading-snug text-white sm:text-3xl">
              {findYourNextStep.principleTitle}
            </h2>
            <p className="mt-6 leading-7 text-slate-400">{findYourNextStep.principleText}</p>
          </aside>
        </header>

        <section aria-labelledby="fyns-paths-title" className="border-b border-white/15 py-20 sm:py-28">
          <div id="fyns-paths-title">
            <SectionHeading
              eyebrow="Vier Ausgangspunkte / 01–04"
              title={findYourNextStep.pathsTitle}
              description={findYourNextStep.pathsDescription}
              accent="orange"
            />
          </div>
          <ol className="mt-16 grid gap-6 sm:mt-20 lg:gap-8">
            {nextStepJourneys.map((journey, index) => (
              <JourneyCard key={journey.slug} journey={journey} index={index} />
            ))}
          </ol>
        </section>

        <section aria-labelledby="fyns-help-title" className="border-b border-white/15 py-20 sm:py-24">
          <div id="fyns-help-title">
            <SectionHeading
              eyebrow="Wie FYNS helfen soll"
              title="Verstehen, einordnen, weitergehen."
              description="Keine Abkürzung zu einer fertigen Antwort, sondern eine ruhigere Struktur für den Moment zwischen Frage und Entscheidung."
            />
          </div>
          <ol className="mt-14 grid border-l border-t border-white/10 md:grid-cols-3">
            {findYourNextStep.helpSteps.map((step) => (
              <li key={step.number} className="border-b border-r border-white/10 bg-[#061521]/55 p-7 sm:p-9">
                <span className="font-mono text-xs text-[#35d0e5]">{step.number}</span>
                <h3 className="mt-9 text-2xl font-black text-white">{step.title}</h3>
                <p className="mt-4 leading-7 text-slate-400">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="fyns-development-title" className="grid gap-10 border-b border-white/15 py-20 lg:grid-cols-[0.38fr_1fr] sm:py-24">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">Aktueller Stand / Beta</p>
            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-500">Transparent by design. Keine Funktion wird vorgetäuscht, bevor sie wirklich trägt.</p>
          </div>
          <div>
            <h2 id="fyns-development-title" className="text-3xl font-black text-white sm:text-5xl">{findYourNextStep.developmentTitle}</h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{findYourNextStep.developmentText}</p>
            <div className="mt-10 border-l-2 border-[#35d0e5] bg-white/[0.025] p-6 sm:p-8">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#35d0e5]">Datenschutz in diesem Stand</p>
              <p className="mt-4 max-w-3xl leading-7 text-slate-300">{findYourNextStep.privacyText}</p>
            </div>
          </div>
        </section>

        <div className="py-20 text-center sm:py-28">
          <p className="mx-auto max-w-5xl text-[clamp(2rem,5vw,4.75rem)] font-black leading-tight tracking-[-0.04em] text-white">
            {findYourNextStep.closingText}
          </p>
          <Link
            href="/"
            className="mt-10 inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 py-3 font-bold text-slate-300 transition hover:border-[#35d0e5]/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]"
          >
            ← Zurück zum Digital HQ
          </Link>
        </div>
      </div>
    </article>
  );
}
