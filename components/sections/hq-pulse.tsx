import Link from "next/link";

import { discoveryIndex } from "@/data/discovery-index";
import { getHumanPulseContent } from "@/data/human-pulse";
import { createHqPulseViewModel } from "@/data/hq-pulse";
import {
  getHqPulseCopy,
  localizeHqPulseCurrentStates,
  localizeHqPulseItems,
} from "@/data/i18n/hq-pulse";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";
import type { HqPulseSource, OpenLoop } from "@/types/hq-pulse";
import type { PublicWritingSummary } from "@/types/writing";

const sourceAccent: Record<HqPulseSource, string> = {
  writing: "#b8a5ff",
  projects: "#ff9a3d",
  people: "#35d0e5",
  "world-map": "#7dd3a8",
  discovery: "#8ee8f2",
};

function OpenLoopAction({ loop, href }: { loop: OpenLoop; href: string }) {
  if (!loop.cta) return null;
  const classes = "mt-6 inline-flex min-h-11 items-center rounded-full border border-[#ff9a3d]/45 px-5 py-2.5 font-bold text-white transition hover:border-[#ff9a3d] hover:bg-[#ff9a3d]/10";
  if (href.startsWith("http")) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>{loop.cta.label} <span aria-hidden="true">↗</span></a>;
  }
  return <Link href={href} className={classes}>{loop.cta.label} <span aria-hidden="true">→</span></Link>;
}

export async function HqPulse({ publishedWriting = [] }: { publishedWriting?: readonly PublicWritingSummary[] }) {
  const locale = await getLocale();
  const copy = getHqPulseCopy(locale);
  const human = getHumanPulseContent(locale);
  const view = createHqPulseViewModel({ publishedWriting, discoveryItems: discoveryIndex, human });
  const timeline = localizeHqPulseItems(view.timeline, locale);
  const currentStates = localizeHqPulseCurrentStates(view.currentStates, locale);
  const dateFormatter = new Intl.DateTimeFormat(copy.dateLocale, { day: "2-digit", month: "short", year: "numeric" });

  return (
    <section id="pulse" aria-labelledby="pulse-title" className="scroll-mt-24 border-y border-white/10 bg-[#061521] px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[90rem]">
        <header className="grid gap-8 border-b border-white/15 pb-12 lg:grid-cols-[0.42fr_1fr] lg:items-end">
          <p className="font-mono text-xs font-black uppercase tracking-[0.3em] text-[#35d0e5]">{copy.eyebrow}</p>
          <div>
            <h2 id="pulse-title" className="max-w-5xl text-4xl font-black tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl">{copy.title}</h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{copy.description}</p>
          </div>
        </header>

        <section aria-labelledby="human-pulse-title" className="border-b border-white/15 py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.42fr_1fr]">
            <header>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[#ff9a3d]">{copy.humanMarker}</p>
              <h3 id="human-pulse-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">{copy.humanTitle}</h3>
              <p className="mt-4 max-w-sm leading-7 text-slate-400">{copy.humanDescription}</p>
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <article className="min-w-0 rounded-[2rem] border border-[#35d0e5]/25 bg-[#35d0e5]/[0.045] p-6 sm:p-8 md:col-span-2">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#73e3f1]">{copy.rightNow}</p>
                <ul className="mt-7 grid gap-5 lg:grid-cols-3">
                  {human.rightNow.map((entry, index) => (
                    <li key={entry.id} className="min-w-0 border-l border-[#35d0e5]/30 pl-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{String(index + 1).padStart(2, "0")} / {entry.label}</span>
                      <p className="mt-2 text-lg font-bold leading-7 text-white [overflow-wrap:anywhere]">{entry.text}</p>
                    </li>
                  ))}
                </ul>
              </article>

              {human.onMyMind ? (
                <article className="min-w-0 rounded-[2rem] border border-[#b8a5ff]/25 bg-[#b8a5ff]/[0.04] p-6 sm:p-8">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#cbbdff]">{copy.onMyMind}</p>
                  <p className="mt-5 text-2xl font-black leading-tight tracking-tight text-white [overflow-wrap:anywhere]">{human.onMyMind.text}</p>
                  <p className="mt-5 text-sm leading-6 text-slate-400">{human.onMyMind.label}</p>
                </article>
              ) : null}

              {human.next ? (
                <article className="min-w-0 rounded-[2rem] border border-white/15 bg-white/[0.025] p-6 sm:p-8">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">{copy.next}</p>
                  <p className="mt-5 text-xl font-bold leading-8 text-white [overflow-wrap:anywhere]">{human.next.text}</p>
                </article>
              ) : null}

              <section aria-labelledby="open-loops-title" className="min-w-0 rounded-[2rem] border border-[#ff9a3d]/25 bg-[#ff9a3d]/[0.035] p-6 sm:p-8 md:col-span-2">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#ffb36f]">{copy.humanMarker}</p>
                <h4 id="open-loops-title" className="mt-3 text-2xl font-black text-white">{copy.openLoops}</h4>
                <p className="mt-3 max-w-2xl leading-7 text-slate-400">{copy.openLoopsDescription}</p>
                {human.openLoops.length > 0 ? (
                  <ul className="mt-7 grid gap-4 lg:grid-cols-2">
                    {human.openLoops.map((loop) => {
                      const href = loop.cta ? localizeHref(loop.cta.href, locale) : "";
                      return (
                        <li key={loop.id} className="min-w-0 rounded-2xl border border-white/10 bg-black/10 p-5">
                          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#ffb36f]">{copy.openLoopTypeLabels[loop.type]}</p>
                          <h5 className="mt-3 text-xl font-black text-white [overflow-wrap:anywhere]">{loop.title}</h5>
                          <p className="mt-3 leading-7 text-slate-300">{loop.context}</p>
                          <OpenLoopAction loop={loop} href={href} />
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p role="status" className="mt-7 border-l-2 border-[#ff9a3d]/55 pl-4 text-sm leading-6 text-slate-300">{copy.noOpenLoops}</p>
                )}
              </section>
            </div>
          </div>
        </section>

        <section aria-labelledby="recent-pulse-title" className="py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.42fr_1fr]">
            <header>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[#35d0e5]">{copy.systemMarker}</p>
              <h3 id="recent-pulse-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">{copy.recentTitle}</h3>
              <p className="mt-4 max-w-sm leading-7 text-slate-400">{copy.recentDescription}</p>
            </header>

            {timeline.length > 0 ? (
              <ol className="grid grid-cols-1 border-t border-white/10">
                {timeline.map((item) => {
                  const accent = sourceAccent[item.source];
                  return (
                    <li key={item.id} className="min-w-0 border-b border-white/10">
                      <Link href={localizeHref(item.href, locale)} className="group grid min-h-44 gap-5 px-1 py-7 outline-none transition hover:bg-white/[0.025] focus-visible:bg-white/[0.04] sm:grid-cols-[10rem_1fr_auto] sm:items-start sm:px-5">
                        <div>
                          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>{copy.sourceLabels[item.source]}</p>
                          <time dateTime={item.occurredAt} className="mt-3 block font-mono text-xs text-slate-500">{dateFormatter.format(new Date(item.occurredAt))}</time>
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{copy.typeLabels[item.type]}</p>
                          <h4 className="mt-2 text-xl font-black leading-tight text-white [overflow-wrap:anywhere] sm:text-2xl">{item.title}</h4>
                          <p className="mt-3 max-w-3xl leading-7 text-slate-400">{item.summary}</p>
                        </div>
                        <span className="inline-flex min-h-11 items-center font-bold text-white transition group-hover:translate-x-1" style={{ color: accent }}>{copy.openSource} <span aria-hidden="true" className="ml-2">→</span></span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p role="status" className="border-l border-white/15 py-5 pl-5 leading-7 text-slate-400">{copy.noRecent}</p>
            )}
          </div>
        </section>

        {currentStates.length > 0 ? (
          <section aria-labelledby="pulse-current-states-title" className="border-t border-white/15 pt-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h3 id="pulse-current-states-title" className="text-2xl font-black text-white">{copy.currentStatesTitle}</h3>
              <p className="max-w-xl text-sm leading-6 text-slate-500">{copy.currentStatesDescription}</p>
            </div>
            <ul className="mt-7 grid grid-cols-1 border-l border-t border-white/10 sm:grid-cols-2">
              {currentStates.map((state) => {
                const accent = sourceAccent[state.source];
                return (
                  <li key={state.id} className="min-w-0 border-b border-r border-white/10">
                    <Link href={localizeHref(state.href, locale)} className="group flex h-full min-h-56 flex-col p-6 outline-none transition hover:bg-white/[0.025] focus-visible:bg-white/[0.04] sm:p-7">
                      <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>{copy.sourceLabels[state.source]}</p>
                      <h4 className="mt-7 text-xl font-black text-white [overflow-wrap:anywhere] sm:text-2xl">{state.title}</h4>
                      <p className="mt-3 leading-7 text-slate-400">{state.summary}</p>
                      <span className="mt-auto inline-flex min-h-11 items-end pt-6 font-bold transition group-hover:translate-x-1" style={{ color: accent }}>{copy.openState} <span aria-hidden="true" className="ml-2">→</span></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </section>
  );
}
