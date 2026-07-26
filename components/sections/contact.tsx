import { contactCategories } from "@/data/contact";
import { siteConfig } from "@/data/site";
import { Reveal } from "@/components/ui/reveal";

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="contact-signal border-t border-white/10 px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-[90rem]">
        <div className="grid gap-12 border-y border-white/15 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div><p className="text-xs font-black uppercase tracking-[0.34em] text-[#35d0e5]">Open channel / Contact</p><h2 id="contact-title" className="mt-6 max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.04em] text-white sm:text-7xl">Let&apos;s build something meaningful.</h2><p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">Für Recruiting-Projekte, Interviews, kreative Kooperationen, Plattformideen oder Gespräche über Arbeit, Menschen und Entwicklung.</p><a href={`mailto:${siteConfig.email}?subject=Kontakt%20über%20bts.online`} className="mt-9 inline-flex min-h-12 items-center justify-center rounded-full bg-[#35d0e5] px-7 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1]">Start a conversation <span aria-hidden="true" className="ml-2">↗</span></a></div>
          <div><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">Possible intersections</p><ul className="mt-5 grid gap-2">{contactCategories.map((category, index) => <li key={category} className="flex items-center gap-4 border-b border-white/10 py-3 font-bold text-slate-200"><span className="font-mono text-xs text-slate-600">0{index + 1}</span>{category}</li>)}</ul></div>
        </div>
        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-bold text-slate-400">Find the HQ elsewhere</p><ul className="flex flex-wrap gap-3">{siteConfig.socialLinks.map((social) => <li key={social.label}>{social.url ? <a href={social.url} target="_blank" rel="noreferrer" className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold hover:border-[#35d0e5]/50">{social.label}</a> : <span className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-500" aria-label={`${social.label}: Link folgt`}>{social.label} · Coming soon</span>}</li>)}</ul></div>
      </Reveal>
    </section>
  );
}
