import type { Metadata } from "next";
import Link from "next/link";

import { getGlobalDictionary } from "@/data/i18n/global";
import { getPrivacyDictionary } from "@/data/i18n/privacy";
import { privacyReleaseCopy, type PrivacyReleaseCopy } from "@/data/i18n/privacy-release";
import { legalOperator } from "@/data/legal";
import { siteConfig } from "@/data/site";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";
import { newsletterControllerAddress } from "@/lib/newsletter/config";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getPrivacyDictionary(locale);
  return createLocalizedMetadata({ locale, pathname: "/privacy", title: copy.title, description: copy.description });
}

function PrivacySections({ sections }: { sections: [string, PrivacyReleaseCopy["sections"][keyof PrivacyReleaseCopy["sections"]]][] }) {
  return sections.map(([id, section]) => (
    <section key={id} id={id} aria-labelledby={`${id}-privacy-title`} className="scroll-mt-28 border-b border-white/15 py-14 last:border-b-0">
      <h2 id={`${id}-privacy-title`} className="text-3xl font-black text-white">{section.title}</h2>
      {section.body.map((paragraph) => <p key={paragraph} className="mt-5 leading-7 text-slate-300">{paragraph}</p>)}
    </section>
  ));
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const copy = getPrivacyDictionary(locale);
  const releaseCopy = privacyReleaseCopy[locale];
  const globalCopy = getGlobalDictionary(locale);
  const configuredNewsletterControllerAddress = newsletterControllerAddress();
  const sections = Object.entries(releaseCopy.sections);

  return (
    <article className="px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div className="mx-auto max-w-4xl">
        <nav aria-label={globalCopy.breadcrumbNavigation} className="font-mono text-xs text-slate-400">
          <Link href={localizeHref("/", locale)} className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link> / <span aria-current="page" className="text-[#35d0e5]">{copy.breadcrumb}</span>
        </nav>
        <header className="border-b border-white/15 py-14">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">{copy.eyebrow}</p>
          <h1 className="mt-5 break-words text-5xl font-black text-white sm:text-7xl">{copy.heading}</h1>
          <p role="note" className="mt-8 border-l-2 border-[#ff9a3d] pl-5 text-sm leading-6 text-slate-400">{copy.legalNotice}</p>
          <aside aria-labelledby="privacy-status-title" className="mt-8 border border-[#ff9a3d]/35 bg-[#ff9a3d]/[0.045] p-6 sm:p-8">
            <h2 id="privacy-status-title" className="text-xl font-black text-white">{releaseCopy.statusTitle}</h2>
            <p className="mt-3 leading-7 text-slate-300">{releaseCopy.statusBody}</p>
            <address className="mt-5 not-italic leading-7 text-slate-200">
              <strong className="text-white">{legalOperator.name}</strong><br />
              {legalOperator.address.street}<br />
              {legalOperator.address.postalCode} {legalOperator.address.city}<br />
              {legalOperator.address.country}<br />
              <a className="break-all text-[#35d0e5] underline underline-offset-4" href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a>
            </address>
          </aside>
        </header>

        <PrivacySections sections={sections.slice(0, 3)} />

        <section id="life-alignment" aria-labelledby="life-alignment-privacy-title" className="scroll-mt-28 border-b border-white/15 py-14">
          <h2 id="life-alignment-privacy-title" className="text-3xl font-black text-white">Life Alignment</h2>
          <p className="mt-5 leading-7 text-slate-300">{copy.life.local}</p>
          <p className="mt-5 leading-7 text-slate-300">{copy.life.partner}</p>
          <p className="mt-5 leading-7 text-slate-300">{copy.life.export}</p>
        </section>

        <PrivacySections sections={sections.slice(3, 7)} />

        <section id="newsletter" aria-labelledby="newsletter-privacy-title" className="scroll-mt-28 border-b border-white/15 py-14">
          <h2 id="newsletter-privacy-title" className="text-3xl font-black text-white">Newsletter</h2>
          {configuredNewsletterControllerAddress ? <>
            <p className="mt-5 leading-7 text-slate-300">{copy.newsletter.controller}: {siteConfig.name}, <span className="whitespace-pre-line">{configuredNewsletterControllerAddress}</span>. {copy.newsletter.contact}: <a className="text-[#35d0e5] underline underline-offset-4" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.</p>
            <p className="mt-5 leading-7 text-slate-300">{copy.newsletter.storage}</p>
            <p className="mt-5 leading-7 text-slate-300">{copy.newsletter.provider}</p>
            <p className="mt-5 leading-7 text-slate-300">{copy.newsletter.retention}</p>
          </> : <div role="status" className="mt-6 border-l-2 border-[#ff9a3d] p-6"><p className="font-bold text-white">{copy.newsletter.disabledTitle}</p><p className="mt-2 leading-7 text-slate-400">{releaseCopy.newsletterDisabledBody}</p></div>}
        </section>

        <PrivacySections sections={sections.slice(7)} />
      </div>
    </article>
  );
}
