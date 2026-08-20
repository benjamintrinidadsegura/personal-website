import { getHomeCopy } from "@/data/i18n/home";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import Link from "next/link";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

const formatLabel: Record<Locale, string> = {
  de: "Format", en: "Format", es: "Formato", tr: "Format", pl: "Format", el: "Μορφή", ru: "Формат",
};

export async function Interviews() {
  const locale = await getLocale();
  const copy = getHomeCopy(locale).interviews;
  const question = copy.guidingQuestion;
  return (
    <section id="interviews" aria-labelledby="interviews-title" className="section-lines border-t border-white/10 px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-[90rem]">
        <div id="interviews-title"><SectionHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} accent="orange" /></div>
        <blockquote className="relative my-16 max-w-5xl border-l-2 border-[#35d0e5] py-3 pl-7 text-2xl font-black leading-snug text-white sm:text-4xl">“{question}”<footer className="mt-5 font-mono text-xs font-normal uppercase tracking-[0.22em] text-slate-500">{copy.quoteLabel}</footer></blockquote>
        <div className="grid border-l border-t border-white/10 lg:grid-cols-3">
          {copy.formats.map((format, index) => <article key={format.title} className="min-h-72 border-b border-r border-white/10 p-7 sm:p-9"><div className="flex items-center justify-between"><span className="font-mono text-sm text-[#ff9a3d]">{formatLabel[locale]} 0{index + 1}</span><span aria-hidden="true" className="text-3xl font-light text-white/15">◌</span></div><h3 className="mt-14 text-2xl font-black text-white">{format.title}</h3><p className="mt-4 leading-7 text-slate-300">{format.description}</p><p className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-[#35d0e5]">{format.focus}</p></article>)}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-5 border-l-2 border-[#ff7a00] bg-white/[0.025] p-7 sm:flex-row sm:items-center sm:p-9"><div><p className="text-2xl font-black text-white">{copy.countTitle}</p><p className="mt-3 max-w-3xl leading-7 text-slate-400">{copy.countDescription}</p></div><Link href={localizeHref("/people", locale)} className="shrink-0 rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1]">{copy.cta} →</Link></div>
      </Reveal>
    </section>
  );
}
