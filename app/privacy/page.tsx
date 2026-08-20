import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/data/site";
import { newsletterControllerAddress } from "@/lib/newsletter/config";
import { getPrivacyDictionary } from "@/data/i18n/privacy";
import { getGlobalDictionary } from "@/data/i18n/global";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getPrivacyDictionary(locale);
  return createLocalizedMetadata({ locale, pathname: "/privacy", title: copy.title, description: copy.description });
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const copy = getPrivacyDictionary(locale);
  const globalCopy = getGlobalDictionary(locale);
  const controllerAddress = newsletterControllerAddress();
  return <article className="px-5 pb-24 pt-28 sm:px-8 sm:pt-36"><div className="mx-auto max-w-4xl"><nav aria-label={globalCopy.breadcrumbNavigation} className="font-mono text-xs text-slate-400"><Link href={localizeHref("/", locale)} className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link> / <span aria-current="page" className="text-[#35d0e5]">{copy.breadcrumb}</span></nav><header className="border-b border-white/15 py-14"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">{copy.eyebrow}</p><h1 className="mt-5 text-5xl font-black text-white sm:text-7xl">{copy.heading}</h1><p role="note" className="mt-8 border-l-2 border-[#ff9a3d] pl-5 text-sm leading-6 text-slate-400">{copy.legalNotice}</p></header><section id="life-alignment" aria-labelledby="life-alignment-privacy-title" className="scroll-mt-28 border-b border-white/15 py-14"><h2 id="life-alignment-privacy-title" className="text-3xl font-black text-white">Life Alignment</h2><p className="mt-5 leading-7 text-slate-300">{copy.life.local}</p><p className="mt-5 leading-7 text-slate-300">{copy.life.partner}</p><p className="mt-5 leading-7 text-slate-300">{copy.life.export}</p></section><section id="newsletter" aria-labelledby="newsletter-privacy-title" className="scroll-mt-28 py-14"><h2 id="newsletter-privacy-title" className="text-3xl font-black text-white">Newsletter</h2>{controllerAddress ? <><p className="mt-5 leading-7 text-slate-300">{copy.newsletter.controller}: {siteConfig.name}, <span className="whitespace-pre-line">{controllerAddress}</span>. {copy.newsletter.contact}: <a className="text-[#35d0e5] underline underline-offset-4" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.</p><p className="mt-5 leading-7 text-slate-300">{copy.newsletter.storage}</p><p className="mt-5 leading-7 text-slate-300">{copy.newsletter.provider}</p><p className="mt-5 leading-7 text-slate-300">{copy.newsletter.retention}</p></> : <div role="status" className="mt-6 border-l-2 border-[#ff9a3d] p-6"><p className="font-bold text-white">{copy.newsletter.disabledTitle}</p><p className="mt-2 leading-7 text-slate-400">{copy.newsletter.disabledBody}</p></div>}</section></div></article>;
}
