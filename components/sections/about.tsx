import { aboutPositioning, values } from "@/data/about";
import { Reveal } from "@/components/ui/reveal";
import Link from "next/link";

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="border-t border-white/10 bg-[#081a28] px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-[90rem]">
        <div className="grid min-w-0 grid-cols-1 gap-12 lg:grid-cols-[0.45fr_1.1fr]">
          <header><p className="text-xs font-black uppercase tracking-[0.34em] text-[#35d0e5]">About / Positioning</p><h2 id="about-title" className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl">Make the missing context visible.</h2></header>
          <div className="space-y-6 text-lg leading-9 text-slate-200">
            <p className="text-2xl font-black leading-snug text-white">{aboutPositioning.primary}</p>
            <p>{aboutPositioning.explanation}</p>
            <p><strong className="text-white">bts.online macht den Zusammenhang sichtbar:</strong> Recruiting-Arbeit, Gespräche, Produkte und Reflexionswerkzeuge als unterschiedliche Antworten auf dieselbe Frage — welcher Kontext fehlt, bevor eine Entscheidung wirklich zum Menschen passen kann?</p>
            <Link href="/about" className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-6 py-3 font-black text-white transition hover:border-[#35d0e5] hover:text-[#35d0e5]">Positionierung & Arbeit im Zusammenhang →</Link>
          </div>
        </div>
        <ol className="mt-16 grid border-l border-t border-white/10 sm:grid-cols-2 xl:grid-cols-4">
          {values.map((value, index) => <li key={value.title} className="border-b border-r border-white/10 p-7 sm:p-9"><span className="font-mono text-xs text-[#ff9a3d]">Principle 0{index + 1}</span><h3 className="mt-8 text-2xl font-black text-white">{value.title}</h3><p className="mt-4 leading-7 text-slate-400">{value.description}</p></li>)}
        </ol>
      </Reveal>
    </section>
  );
}
