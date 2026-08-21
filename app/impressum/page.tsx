import type { Metadata } from "next";
import Link from "next/link";

import { getGlobalDictionary } from "@/data/i18n/global";
import { imprintCopy } from "@/data/i18n/impressum";
import { legalOperator } from "@/data/legal";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = imprintCopy[locale];
  return createLocalizedMetadata({ locale, pathname: "/impressum", title: copy.title, description: copy.description });
}

function OperatorAddress({ country }: { country: string }) {
  return (
    <address className="mt-5 not-italic leading-8 text-slate-200">
      <strong className="text-white">{legalOperator.name}</strong><br />
      {legalOperator.address.street}<br />
      {legalOperator.address.postalCode} {legalOperator.address.city}<br />
      {country}
    </address>
  );
}

export default async function ImprintPage() {
  const locale = await getLocale();
  const copy = imprintCopy[locale];
  const globalCopy = getGlobalDictionary(locale);

  return (
    <article className="section-lines relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_78%_10%,rgba(53,208,229,0.14),transparent_28rem),radial-gradient(circle_at_12%_42%,rgba(255,122,0,0.08),transparent_22rem)]" />
      <div className="relative mx-auto max-w-4xl">
        <nav aria-label={globalCopy.breadcrumbNavigation} className="font-mono text-xs text-slate-400">
          <ol className="flex items-center gap-2">
            <li><Link href={localizeHref("/", locale)} className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[#35d0e5]">{copy.breadcrumb}</li>
          </ol>
        </nav>

        <header className="border-b border-white/15 py-14 sm:py-20">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#35d0e5]">{copy.eyebrow}</p>
          <h1 className="mt-5 break-words text-5xl font-black tracking-[-0.04em] text-white sm:text-7xl">{copy.heading}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">{copy.intro}</p>
        </header>

        <section aria-labelledby="operator-title" className="grid gap-8 border-b border-white/15 py-14 sm:grid-cols-2 sm:py-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff9a3d]">{copy.operatorStatus}</p>
            <h2 id="operator-title" className="mt-4 text-3xl font-black text-white">{copy.operatorTitle}</h2>
            <p className="mt-7 font-mono text-xs uppercase tracking-[0.16em] text-slate-500">{copy.addressLabel}</p>
            <OperatorAddress country={copy.country} />
          </div>
          <div className="min-w-0 border-l border-white/15 pl-6 sm:pl-8">
            <h2 className="text-xl font-black text-white">{copy.contactLabel}</h2>
            <a className="mt-5 inline-flex min-h-11 max-w-full items-center break-all text-[#35d0e5] underline underline-offset-4 hover:text-white" href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a>
          </div>
        </section>

        <section aria-labelledby="editorial-title" className="border-b border-white/15 py-14 sm:py-16">
          <h2 id="editorial-title" className="text-3xl font-black text-white">{copy.editorialTitle}</h2>
          <p className="mt-5 max-w-2xl leading-7 text-slate-300">{copy.editorialBody}</p>
          <OperatorAddress country={copy.country} />
        </section>

        <aside aria-labelledby="language-notice-title" className="my-12 border-t border-white/15 pt-7">
          <h2 id="language-notice-title" className="font-mono text-xs font-black uppercase tracking-[0.18em] text-slate-500">{copy.languageNoticeTitle}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{copy.germanReference}</p>
        </aside>
      </div>
    </article>
  );
}
