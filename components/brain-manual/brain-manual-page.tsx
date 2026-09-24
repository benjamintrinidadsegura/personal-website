import Link from "next/link";

import { getLocalizedBrainManual, type BrainManualUiCopy } from "@/data/brain-manual-locales";
import type { BrainChapter } from "@/data/brain-manual";
import type { Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";

const chapterAccents = ["#35d0e5", "#ff9a3d", "#b8a5ff", "#77e5b5", "#f4d06f", "#ff8b9f"] as const;
const domainPositions = [
  "md:left-[7%] md:top-[11%]",
  "md:left-[3%] md:top-[48%]",
  "md:left-[15%] md:top-[77%]",
  "md:right-[9%] md:top-[11%]",
  "md:right-[3%] md:top-[48%]",
  "md:right-[15%] md:top-[77%]",
] as const;

export function BrainManualPage({ locale }: { locale: Locale }) {
  const manual = getLocalizedBrainManual(locale);
  const { chapters, metaPattern, patternById, ui: copy } = manual;

  return (
    <article className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[78rem] bg-[radial-gradient(circle_at_78%_12%,rgba(184,165,255,0.16),transparent_32rem),radial-gradient(circle_at_12%_36%,rgba(53,208,229,0.11),transparent_25rem)]" />
      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400">
          <Link className="inline-flex min-h-11 items-center hover:text-white" href={localizeHref("/about", locale)}>{copy.back}</Link>
          <span aria-hidden="true"> / </span><span aria-current="page" className="text-[#b8a5ff]">{copy.breadcrumb}</span>
        </nav>

        <header className="grid min-h-[76svh] items-center gap-12 border-b border-white/15 py-16 lg:grid-cols-[1fr_.62fr]">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[.28em] text-[#b8a5ff]">{copy.eyebrow}</p>
            <h1 className="mt-7 max-w-5xl text-[clamp(3.5rem,8.5vw,8.4rem)] font-black leading-[.86] tracking-[-.066em] text-white">{copy.title} <span className="text-[#35d0e5]">+</span><br />{copy.subtitle}</h1>
          </div>
          <div className="border-l-2 border-[#ff9a3d] pl-7">
            <p className="text-xl font-bold leading-9 text-white">{copy.description}</p>
            <p className="mt-7 font-mono text-xs uppercase tracking-[.16em] text-[#35d0e5]">{copy.aegisCredit}</p>
            <p className="mt-6 text-sm leading-6 text-slate-500">{copy.languageNotice}</p>
          </div>
        </header>

        <div className="grid gap-14 py-16 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <details className="rounded-2xl border border-white/10 bg-[#071824]/85 p-4 lg:hidden">
              <summary className="min-h-11 cursor-pointer font-bold text-white">{copy.jump}</summary>
              <ChapterLinks chapters={chapters} copy={copy} />
            </details>
            <nav aria-label={copy.jump} className="hidden border-l border-white/15 pl-5 lg:block">
              <p className="font-mono text-[10px] font-black uppercase tracking-[.2em] text-slate-500">{copy.jump}</p>
              <ChapterLinks chapters={chapters} copy={copy} />
            </nav>
          </aside>

          <div className="min-w-0">
            <PatternMap copy={copy.patternMap} />

            {chapters.map((chapter, chapterIndex) => (
              <section key={chapter.id} id={`chapter-${chapter.id}`} aria-labelledby={`chapter-${chapter.id}-title`} className="scroll-mt-28 border-b border-white/15 py-20 sm:py-28">
                <header className="grid gap-6 lg:grid-cols-[.25fr_1fr]">
                  <p style={{ color: chapterAccents[chapterIndex] }} className="font-mono text-xs font-black uppercase tracking-[.25em]">{copy.chapter} {chapter.number} · {chapter.patternIds.length} {copy.patterns}</p>
                  <div><h2 id={`chapter-${chapter.id}-title`} className="text-5xl font-black leading-[.94] tracking-[-.045em] text-white sm:text-7xl">{chapter.title}</h2><p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">{chapter.introduction}</p></div>
                </header>

                <div className="mt-16 space-y-20">
                  {chapter.patternIds.map((patternId, patternIndex) => {
                    const pattern = patternById.get(patternId);
                    if (!pattern) return null;
                    const split = (chapterIndex + patternIndex) % 3 === 1;
                    return (
                      <section key={pattern.id} id={`pattern-${pattern.id}`} aria-labelledby={`${pattern.id}-title`} className="scroll-mt-28">
                        <div className={`grid gap-8 ${split ? "lg:grid-cols-[.78fr_1.22fr]" : "lg:grid-cols-[1.22fr_.78fr]"}`}>
                          <div className={split ? "lg:order-2" : ""}>
                            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-slate-500">{chapter.number}.{String(patternIndex + 1).padStart(2, "0")}</p>
                            <h3 lang="en" id={`${pattern.id}-title`} className="mt-4 text-4xl font-black leading-none tracking-[-.04em] text-white sm:text-6xl">{pattern.title}</h3>
                            <p className="mt-7 text-xl font-bold leading-8 text-slate-100">{pattern.thesis}</p>
                            <p className="mt-6 leading-8 text-slate-400">{pattern.observation}</p>
                          </div>
                          <div className={`border-l-2 p-6 sm:p-8 ${split ? "lg:order-1" : ""}`} style={{ borderColor: chapterAccents[chapterIndex], background: `${chapterAccents[chapterIndex]}0d` }}>
                            <p className="font-mono text-[10px] font-black uppercase tracking-[.2em]" style={{ color: chapterAccents[chapterIndex] }}>{copy.strength}</p>
                            <p className="mt-4 leading-7 text-slate-200">{pattern.strength}</p>
                            <p className="mt-8 font-mono text-[10px] font-black uppercase tracking-[.2em] text-[#ffbd7c]">{copy.tradeoff}</p>
                            <p className="mt-4 leading-7 text-slate-300">{pattern.tradeoff}</p>
                          </div>
                        </div>
                        <div className="mt-8 grid gap-5 md:grid-cols-[1fr_.62fr]">
                          <div className="border-t border-white/10 pt-6"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-slate-500">{copy.showsUp}</p><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">{pattern.examples.map((example) => <li key={example} className="border-l border-white/15 pl-4">{example}</li>)}</ul></div>
                          <div className="border-t border-white/10 pt-6"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-slate-500">{copy.connected}</p><p className="mt-3 text-xs leading-5 text-slate-500">{copy.connectionsNote}</p><div className="mt-4 flex flex-wrap gap-2">{pattern.connections.map((id) => <a lang="en" key={id} href={`#pattern-${id}`} className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-3 text-xs font-bold text-slate-300 hover:border-[#35d0e5]/50 hover:text-white">{patternById.get(id)?.title ?? id}</a>)}</div></div>
                        </div>
                        {pattern.fieldNote ? <blockquote className="mt-8 border-y border-white/10 py-7 text-2xl font-black leading-9 text-white"><span className="mb-3 block font-mono text-[10px] uppercase tracking-[.2em] text-[#b8a5ff]">{copy.fieldNote}</span>“{pattern.fieldNote}”</blockquote> : null}
                      </section>
                    );
                  })}
                </div>
              </section>
            ))}

            <section aria-labelledby="meta-pattern-title" className="py-24">
              <p className="font-mono text-xs font-black uppercase tracking-[.22em] text-[#ff9a3d]">{copy.metaPattern}</p>
              <h2 id="meta-pattern-title" className="mt-5 text-5xl font-black text-white sm:text-7xl">{metaPattern.title}</h2>
              <p className="mt-8 max-w-4xl text-3xl font-black leading-tight text-[#35d0e5]">{metaPattern.thesis}</p>
              <p className="mt-7 max-w-4xl text-lg leading-9 text-slate-300">{metaPattern.body}</p>
              <p className="mt-8 border-l-2 border-[#ff9a3d] pl-6 text-xl font-black text-white">{metaPattern.counterweight}</p>
            </section>
          </div>
        </div>

        <section className="rounded-[2rem] border border-[#35d0e5]/25 bg-[linear-gradient(135deg,rgba(53,208,229,.08),rgba(184,165,255,.06))] p-8 sm:p-12">
          <p className="font-mono text-xs font-black uppercase tracking-[.22em] text-[#35d0e5]">{copy.bridgeEyebrow}</p>
          <h2 className="mt-5 max-w-4xl text-4xl font-black text-white sm:text-6xl">{copy.bridgeTitle}</h2>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{copy.bridgeBody}</p>
          <Link href={localizeHref("/tools/personal-advantage", locale)} className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] hover:bg-[#73e3f1]">{copy.bridgeCta} →</Link>
        </section>
      </div>
    </article>
  );
}

function PatternMap({ copy }: { copy: BrainManualUiCopy["patternMap"] }) {
  return (
    <section aria-labelledby="pattern-map-title" className="border-b border-white/15 pb-20">
      <div className="grid gap-6 md:grid-cols-[.72fr_1fr] md:items-end">
        <div><p className="font-mono text-xs uppercase tracking-[.2em] text-[#35d0e5]">{copy.eyebrow}</p><h2 id="pattern-map-title" className="mt-5 text-4xl font-black text-white sm:text-6xl">{copy.title}</h2></div>
        <p className="max-w-2xl border-l border-white/15 pl-5 text-base leading-7 text-slate-400">{copy.description}</p>
      </div>
      <div data-pattern-map className="mt-10 overflow-hidden border-y border-white/15 bg-[linear-gradient(135deg,rgba(7,24,36,.9),rgba(4,17,27,.72))]">
        <div className="relative grid grid-cols-2 gap-px bg-white/10 p-px md:block md:min-h-[34rem] md:bg-transparent md:p-0">
          <svg aria-hidden="true" className="absolute inset-0 hidden h-full w-full md:block" viewBox="0 0 1000 540" preserveAspectRatio="none">
            <g fill="none" stroke="rgba(53,208,229,.34)" strokeWidth="1.5"><path d="M500 268 L170 96" /><path d="M500 268 L115 270" /><path d="M500 268 L205 440" /><path d="M500 268 L830 96" /><path d="M500 268 L885 270" /><path d="M500 268 L795 440" /></g>
            <g fill="none" stroke="rgba(184,165,255,.2)" strokeWidth="1"><path d="M170 96 C330 24 670 24 830 96" /><path d="M205 440 C365 520 635 520 795 440" /><path d="M115 270 C190 174 190 174 170 96" /><path d="M885 270 C810 174 810 174 830 96" /></g>
            <g fill="#35d0e5"><circle cx="500" cy="268" r="4" /><circle cx="170" cy="96" r="3" /><circle cx="115" cy="270" r="3" /><circle cx="205" cy="440" r="3" /><circle cx="830" cy="96" r="3" /><circle cx="885" cy="270" r="3" /><circle cx="795" cy="440" r="3" /></g>
          </svg>
          <div className="col-span-2 bg-[#071824] p-6 md:absolute md:left-1/2 md:top-1/2 md:z-10 md:w-64 md:-translate-x-1/2 md:-translate-y-1/2 md:border-x md:border-[#35d0e5]/55 md:bg-[#04111b]/95 md:px-8 md:py-9 md:text-center">
            <span className="font-mono text-[10px] font-black uppercase tracking-[.24em] text-[#35d0e5]">01 / CORE</span><strong className="mt-3 block text-3xl font-black text-white md:text-4xl">{copy.centre}</strong>
          </div>
          {copy.domains.map((label, index) => (
            <div key={label} className={`relative bg-[#071824] p-5 md:absolute md:z-10 md:w-40 md:bg-transparent md:p-0 ${domainPositions[index]}`}>
              <span className="font-mono text-[10px] font-black tracking-[.16em] text-slate-600">0{index + 2}</span><strong className="mt-2 block border-l-2 border-[#b8a5ff]/60 pl-3 text-lg font-black text-slate-100 md:text-xl">{label}</strong>
            </div>
          ))}
        </div>
        <div data-counterweight-zone className="grid gap-7 border-t-2 border-[#ff9a3d]/55 bg-[#ff9a3d]/[.055] p-6 sm:p-8 md:grid-cols-[.55fr_1fr]">
          <div><p className="font-mono text-[10px] font-black uppercase tracking-[.24em] text-[#ffbd7c]">{copy.counterweight}</p><p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{copy.counterweightDescription}</p></div>
          <ol className="grid gap-px bg-white/10 sm:grid-cols-3">{copy.counterweightItems.map((item, index) => <li key={item} className="bg-[#071824] p-5"><span className="font-mono text-[10px] text-[#ff9a3d]">0{index + 1}</span><strong className="mt-2 block text-base text-white">{item}</strong></li>)}</ol>
        </div>
      </div>
    </section>
  );
}

function ChapterLinks({ chapters, copy }: { chapters: readonly BrainChapter[]; copy: BrainManualUiCopy }) {
  return <ol className="mt-4 grid gap-1">{chapters.map((chapter) => <li key={chapter.id}><a href={`#chapter-${chapter.id}`} className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"><span className="font-mono text-xs text-[#b8a5ff]">{chapter.number}</span><span>{chapter.title}</span></a></li>)}<li><a href="#meta-pattern-title" className="flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-bold text-[#35d0e5] hover:bg-white/5">{copy.metaPattern}</a></li></ol>;
}
