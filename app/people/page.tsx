import type { Metadata } from "next";
import Link from "next/link";
import { getLocalizedPublishedSpotlights, getPeopleCopy } from "@/data/i18n/people";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getPeopleCopy(locale);
  return createLocalizedMetadata({ locale, pathname: "/people", title: "People / Spotlight | bts.online", description: copy.description });
}

export default async function PeoplePage() {
  const locale = await getLocale();
  const copy = getPeopleCopy(locale);
  const publishedSpotlights = getLocalizedPublishedSpotlights(locale);
  return (
    <article className="relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[52rem] bg-[radial-gradient(circle_at_76%_16%,rgba(53,208,229,0.16),transparent_29rem),radial-gradient(circle_at_18%_38%,rgba(255,122,0,0.08),transparent_22rem)]" />
      <div className="relative mx-auto max-w-[90rem]">
        <nav aria-label={copy.breadcrumbAria} className="font-mono text-xs text-slate-400">
          <ol className="flex items-center gap-2"><li><Link href={localizeHref("/", locale)} className="hover:text-white">Digital HQ</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="text-[#35d0e5]">People</li></ol>
        </nav>

        <header className="grid min-h-[68svh] items-center gap-12 border-b border-white/15 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#ff9a3d]">{copy.archiveEyebrow} / {publishedSpotlights.length.toString().padStart(2, "0")} {copy.conversations}</p>
            <h1 className="mt-7 text-[clamp(3.7rem,10vw,9rem)] font-black leading-[0.84] tracking-[-0.06em] text-white">People{" "}<br /><span className="text-[#35d0e5]">/ Spotlight</span></h1>
          </div>
          <div className="border-l-2 border-[#ff7a00] pl-7 sm:pl-9">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.editorialPremise}</p>
            <p className="mt-6 text-2xl font-black leading-snug text-white sm:text-4xl">{copy.archiveIntroduction}</p>
            <p className="mt-6 max-w-xl leading-7 text-slate-300">{copy.archiveDescription} {copy.archiveSuffix}</p>
          </div>
        </header>

        <section aria-labelledby="people-title" className="py-20 sm:py-28">
          <div className="grid gap-8 border-b border-white/15 pb-12 lg:grid-cols-[0.35fr_1fr]">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">{copy.watchReadLearn}</p>
            <div><h2 id="people-title" className="text-4xl font-black leading-tight text-white sm:text-6xl">{copy.indexTitle}</h2><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">{copy.indexDescription}</p></div>
          </div>

          <ol className="border-b border-white/15">
            {publishedSpotlights.map((spotlight, index) => (
              <li key={spotlight.id}>
                <Link href={localizeHref(`/people/${spotlight.slug}`, locale)} className="group grid gap-8 border-t border-white/10 py-12 transition hover:bg-white/[0.025] focus-visible:bg-white/[0.025] sm:px-6 lg:grid-cols-[0.16fr_0.84fr_1.2fr] lg:items-start lg:py-16">
                  <div className="flex items-center justify-between lg:block">
                    <span className="font-mono text-4xl font-black tracking-[-0.05em] text-white/15 transition group-hover:text-[#ff9a3d]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#35d0e5] lg:mt-5 lg:block">{spotlight.format}</span>
                  </div>
                  <div>
                    <h3 className="break-words text-4xl font-black leading-none tracking-[-0.035em] text-white sm:text-5xl">{spotlight.fullName}</h3>
                    {spotlight.displayName !== spotlight.fullName && <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-[#ff9a3d]">{copy.publicName} / {spotlight.displayName}</p>}
                    <p className="mt-5 font-bold leading-7 text-slate-200">{spotlight.professionalContext}</p>
                  </div>
                  <div>
                    <p className="text-xl font-black leading-snug text-white sm:text-2xl">{spotlight.shortIntroduction}</p>
                    <ul aria-label={copy.topicsLabel} className="mt-7 flex flex-wrap gap-x-4 gap-y-2">{spotlight.expertise.slice(0, 5).map((topic) => <li key={topic} className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">{topic}</li>)}</ul>
                    <p className="mt-8 font-black text-[#35d0e5]">{copy.openConversation} <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span></p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <footer className="border-t border-white/15 py-16">
          <p className="max-w-3xl text-2xl font-black leading-snug text-white">{copy.footer}</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href={localizeHref("/about", locale)} className="rounded-full border border-white/15 px-5 py-3 font-bold text-white hover:border-[#35d0e5]">{copy.aboutCta}</Link><Link href={localizeHref("/projects/goatrecrutainer", locale)} className="rounded-full border border-white/15 px-5 py-3 font-bold text-white hover:border-[#ff9a3d]">{copy.projectCta}</Link></div>
        </footer>
      </div>
    </article>
  );
}
