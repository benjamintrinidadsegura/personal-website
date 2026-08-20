import { getAboutContent } from "@/data/i18n/about";
import { getHomeCopy } from "@/data/i18n/home";
import { Reveal } from "@/components/ui/reveal";
import Link from "next/link";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";

export async function About() {
  const locale = await getLocale();
  const { positioning, values } = getAboutContent(locale);
  const copy = getHomeCopy(locale).homeAbout;
  return (
    <section id="about" aria-labelledby="about-title" className="border-t border-white/10 bg-[#081a28] px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-[90rem]">
        <div className="grid min-w-0 grid-cols-1 gap-12 lg:grid-cols-[0.45fr_1.1fr]">
          <header><p className="text-xs font-black uppercase tracking-[0.34em] text-[#35d0e5]">{copy.eyebrow}</p><h2 id="about-title" className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl">{copy.title}</h2></header>
          <div className="space-y-6 text-lg leading-9 text-slate-200">
            <p className="text-2xl font-black leading-snug text-white">{positioning.primary}</p>
            <p>{positioning.explanation}</p>
            <p>{copy.connection}</p>
            <Link href={localizeHref("/about", locale)} className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-6 py-3 font-black text-white transition hover:border-[#35d0e5] hover:text-[#35d0e5]">{copy.cta} →</Link>
          </div>
        </div>
        <ol className="mt-16 grid border-l border-t border-white/10 sm:grid-cols-2 xl:grid-cols-4">
          {values.map((value, index) => <li key={value.title} className="border-b border-r border-white/10 p-7 sm:p-9"><span className="font-mono text-xs text-[#ff9a3d]">{copy.principle} 0{index + 1}</span><h3 className="mt-8 text-2xl font-black text-white">{value.title}</h3><p className="mt-4 leading-7 text-slate-400">{value.description}</p></li>)}
        </ol>
      </Reveal>
    </section>
  );
}
