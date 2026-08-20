import Link from "next/link";
import { getHomeCopy } from "@/data/i18n/home";
import { siteConfig } from "@/data/site";
import { Reveal } from "@/components/ui/reveal";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

const contactCategoriesByLocale: Record<Locale, readonly string[]> = {
  de: ["Recruiting & RaaS", "Interviews & Content", "Kooperationen", "Ideen & Ventures"],
  en: ["Recruiting & RaaS", "Interviews & Content", "Collaborations", "Ideas & Ventures"],
  es: ["Recruiting y RaaS", "Entrevistas y contenido", "Colaboraciones", "Ideas y proyectos"],
  tr: ["İşe alım ve RaaS", "Röportajlar ve içerik", "İş birlikleri", "Fikirler ve girişimler"],
  pl: ["Rekrutacja i RaaS", "Wywiady i treści", "Współpraca", "Pomysły i przedsięwzięcia"],
  el: ["Recruiting και RaaS", "Συνεντεύξεις και περιεχόμενο", "Συνεργασίες", "Ιδέες και εγχειρήματα"],
  ru: ["Рекрутинг и RaaS", "Интервью и контент", "Сотрудничество", "Идеи и проекты"],
};

export async function Contact() {
  const locale = await getLocale();
  const copy = getHomeCopy(locale).contact;
  const contactCategories = contactCategoriesByLocale[locale];
  return (
    <section id="contact" aria-labelledby="contact-title" className="contact-signal border-t border-white/10 px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mx-auto max-w-[90rem]">
        <div className="grid gap-12 border-y border-white/15 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div><p className="text-xs font-black uppercase tracking-[0.34em] text-[#35d0e5]">{copy.eyebrow}</p><h2 id="contact-title" className="mt-6 max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.04em] text-white sm:text-7xl">{copy.title}</h2><p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">{copy.introduction}</p><nav aria-label={copy.projectsAriaLabel} className="mt-9 flex flex-wrap gap-3"><Link href={localizeHref("/projects/goatrecrutainer", locale)} className="inline-flex min-h-12 items-center rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1]">{copy.goat} →</Link><Link href={localizeHref("/projects/ratecom", locale)} className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-6 py-3 font-black text-white transition hover:-translate-y-0.5 hover:border-[#ff9a3d]">{copy.ratecom} →</Link></nav></div>
          <div><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.intersections}</p><ul className="mt-5 grid gap-2">{contactCategories.map((category, index) => <li key={category} className="flex items-center gap-4 border-b border-white/10 py-3 font-bold text-slate-200"><span className="font-mono text-xs text-slate-600">0{index + 1}</span>{category}</li>)}</ul></div>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <section aria-labelledby="social-title" className="rounded-[1.75rem] border border-white/10 bg-[#071824]/75 p-6 sm:p-8"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">{copy.socialEyebrow}</p><h3 id="social-title" className="mt-4 text-2xl font-black text-white">{copy.socialTitle}</h3><p className="mt-3 max-w-2xl leading-7 text-slate-400">{copy.socialDescription}</p><ul className="mt-7 grid gap-3 sm:grid-cols-2">{siteConfig.socialLinks.map((social) => <li key={social.label}><a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={`${social.label} – ${social.context} (${copy.externalLabel})`} className="group flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-white/15 px-5 py-3 transition hover:border-[#35d0e5]/55 hover:bg-white/[0.035]"><span><strong className="block text-white">{social.label}</strong><span className="mt-1 block text-xs text-slate-500">{social.context}</span></span><span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[#35d0e5]">{copy.external}</span></a></li>)}</ul></section>
          <section aria-labelledby="booking-title" className="rounded-[1.75rem] border border-[#ff9a3d]/25 bg-[#ff9a3d]/[0.045] p-6 sm:p-8"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.bookingEyebrow}</p><h3 id="booking-title" className="mt-4 text-2xl font-black text-white">{copy.bookingTitle}</h3><p className="mt-3 leading-7 text-slate-400">{copy.bookingDescription}</p>{siteConfig.booking.url ? <a href={siteConfig.booking.url} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[#ff9a3d] px-6 py-3 font-black text-[#041018] transition hover:-translate-y-0.5">{copy.bookingAction} · {copy.external}</a> : <div role="status" className="mt-7 border-l-2 border-[#ff9a3d] pl-4"><p className="font-black text-white">{copy.bookingAction}</p><p className="mt-1 text-sm leading-6 text-slate-400">{copy.bookingUnavailable}</p></div>}</section>
        </div>
      </Reveal>
    </section>
  );
}
