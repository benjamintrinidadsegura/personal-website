import { writingEntries } from "@/data/writing";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

export function Writing() {
  return (
    <section id="writing" aria-labelledby="writing-title" className="border-t border-white/10 bg-[#081a28] px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-[90rem]">
        <div id="writing-title"><SectionHeading eyebrow="Writing / Field Notes" title="Thoughts worth keeping, questions worth sharing." description="Ein digitales Magazin für Gedanken über Arbeit, Identität, Mut und die Geschichten, die wir über uns selbst erzählen." /></div>
        <div className="mt-16 border-t border-white/15">
          {writingEntries.map((entry, index) => (
            <article key={entry.title} className="group grid gap-5 border-b border-white/15 py-9 transition hover:bg-white/[0.025] sm:px-4 lg:grid-cols-[5rem_0.65fr_1.1fr_0.45fr] lg:items-center">
              <span className="font-mono text-sm text-[#35d0e5]">0{index + 1}</span>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff9a3d]">{entry.category}</p>
              <div><h3 className="text-2xl font-black text-white sm:text-3xl">{entry.title}</h3><p className="mt-3 max-w-2xl leading-7 text-slate-300">{entry.excerpt}</p></div>
              <div className="lg:text-right"><span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{entry.state}</span><p className="mt-3 font-bold text-[#35d0e5]">Preview <span aria-hidden="true">→</span></p></div>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
