import { nowItems } from "@/data/now";
import { Reveal } from "@/components/ui/reveal";

export function Now() {
  return (
    <section id="now" aria-labelledby="now-title" className="border-y border-white/10 bg-[#081a28] px-5 py-20 sm:px-8">
      <Reveal className="mx-auto max-w-[90rem]">
        <div className="grid gap-8 lg:grid-cols-[0.45fr_1.55fr]">
          <header><p className="text-xs font-black uppercase tracking-[0.34em] text-[#ff9a3d]">Live transmission</p><h2 id="now-title" className="mt-3 text-5xl font-black tracking-tight text-white">Now</h2><p className="mt-4 max-w-sm leading-7 text-slate-400">Was mich gerade beschäftigt, was ich aufbaue und worauf ich meinen Fokus lege.</p></header>
          <div className="grid border-l border-t border-white/10 sm:grid-cols-2 xl:grid-cols-4">
            {nowItems.map((item, index) => <article key={item.label} className="relative min-h-44 border-b border-r border-white/10 p-6"><span className="font-mono text-xs text-slate-600">0{index + 1}</span><p className={`mt-7 text-xs font-black uppercase tracking-[0.22em] ${item.accent === "cyan" ? "text-[#35d0e5]" : "text-[#ff9a3d]"}`}>{item.label}</p><p className="mt-3 font-bold leading-6 text-white">{item.text}</p></article>)}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
