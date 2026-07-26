import { values } from "@/data/about";
import { Reveal } from "@/components/ui/reveal";

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="border-t border-white/10 bg-[#081a28] px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-[90rem]">
        <div className="grid gap-12 lg:grid-cols-[0.45fr_1.1fr]">
          <header><p className="text-xs font-black uppercase tracking-[0.34em] text-[#35d0e5]">About / Origin</p><h2 id="about-title" className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl">The person behind the HQ.</h2></header>
          <div className="space-y-6 text-lg leading-9 text-slate-200">
            <p>Benjamin Trinidad Segura arbeitet an der Schnittstelle von Recruiting, Unternehmertum, Storytelling und Community Building.</p>
            <p>Sein beruflicher Weg ist nicht geradlinig entstanden. Genau deshalb interessiert ihn nicht nur, was Menschen beruflich machen, sondern woher sie kommen, was sie geprägt hat und welches Potenzial oft übersehen wird.</p>
            <p>Mit GOATRECRUTAINER, RateCom und weiteren Projekten entwickelt er Formate und Plattformen, die Menschen, Karrieren, Ideen und Geschichten sichtbarer machen.</p>
            <p><strong className="text-white">bts.online ist das digitale Zuhause dafür:</strong> kein abgeschlossenes Portfolio, sondern eine wachsende Dokumentation von Arbeit, Entwicklung, Begegnungen und Experimenten.</p>
          </div>
        </div>
        <ol className="mt-16 grid border-l border-t border-white/10 lg:grid-cols-3">
          {values.map((value, index) => <li key={value.title} className="border-b border-r border-white/10 p-7 sm:p-9"><span className="font-mono text-xs text-[#ff9a3d]">Principle 0{index + 1}</span><h3 className="mt-8 text-2xl font-black text-white">{value.title}</h3><p className="mt-4 leading-7 text-slate-400">{value.description}</p></li>)}
        </ol>
      </Reveal>
    </section>
  );
}
