import { Reveal } from "@/components/ui/reveal";
import { getHomeCopy } from "@/data/i18n/home";
import { getLocale } from "@/lib/i18n/server";

export async function Now() {
  const locale = await getLocale();
  const copy = getHomeCopy(locale).now;
  return (
    <section id="now" aria-labelledby="now-title" className="border-y border-white/10 bg-[#081a28] px-5 py-20 sm:px-8">
      <Reveal className="mx-auto max-w-[90rem]">
        <div className="grid gap-8 lg:grid-cols-[0.45fr_1.55fr]">
          <header><p className="text-xs font-black uppercase tracking-[0.34em] text-[#ff9a3d]">{copy.eyebrow}</p><h2 id="now-title" className="mt-3 text-5xl font-black tracking-tight text-white">Now</h2><p className="mt-4 max-w-sm leading-7 text-slate-400">{copy.description}</p></header>
          <div className="grid border-l border-t border-white/10 sm:grid-cols-2 xl:grid-cols-4">
            {copy.items.map((item, index) => <article key={item} className="relative min-h-44 border-b border-r border-white/10 p-6"><span className="font-mono text-xs text-slate-600">0{index + 1}</span><p className={`mt-7 text-xs font-black uppercase tracking-[0.22em] ${index % 2 === 0 ? "text-[#35d0e5]" : "text-[#ff9a3d]"}`}>{copy.labels[index]}</p><p className="mt-3 font-bold leading-6 text-white">{item}</p></article>)}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
