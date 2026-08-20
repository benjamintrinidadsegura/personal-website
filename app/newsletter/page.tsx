import type { Metadata } from "next";
import Link from "next/link";

import { issueNewsletterFormToken } from "@/app/newsletter/actions";
import { NewsletterForm } from "@/components/newsletter/newsletter-form";
import { newsletterConsentCopy, newsletterPromise } from "@/lib/newsletter/domain";
import { getNewsletterDictionary } from "@/data/i18n/newsletter";
import { getGlobalDictionary } from "@/data/i18n/global";
import { createLocalizedMetadata } from "@/lib/i18n/metadata";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return createLocalizedMetadata({ locale, pathname: "/newsletter", title: "Newsletter | bts.online", description: getNewsletterDictionary(locale).page.description });
}
export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  const [formToken, locale] = await Promise.all([issueNewsletterFormToken(), getLocale()]);
  const copy = getNewsletterDictionary(locale).page;
  const globalCopy = getGlobalDictionary(locale);
  const [firstTitle, secondTitle] = copy.title.split("\n");
  return <article className="relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36"><div aria-hidden="true" className="absolute inset-x-0 top-0 h-[50rem] bg-[radial-gradient(circle_at_72%_14%,rgba(53,208,229,0.16),transparent_28rem),radial-gradient(circle_at_20%_50%,rgba(255,122,0,0.07),transparent_22rem)]" /><div className="relative mx-auto max-w-4xl"><nav aria-label={globalCopy.breadcrumbNavigation} className="font-mono text-xs text-slate-400"><Link href={localizeHref("/", locale)} className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link> / <span aria-current="page" className="text-[#35d0e5]">Newsletter</span></nav><header className="border-b border-white/15 py-14 sm:py-20"><p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#35d0e5]">{copy.eyebrow}</p><h1 className="mt-7 text-[clamp(3.5rem,10vw,7rem)] font-black leading-[0.88] tracking-[-0.055em] text-white">{firstTitle}<br />{secondTitle}</h1><p className="mt-8 max-w-3xl text-xl font-bold leading-9 text-slate-200">{newsletterPromise[locale]}</p></header><section aria-labelledby="newsletter-subscribe-title" className="py-14 sm:py-20"><h2 id="newsletter-subscribe-title" className="text-3xl font-black text-white">{copy.subscribeTitle}</h2><p className="mt-4 max-w-2xl leading-7 text-slate-300">{copy.subscribeBody}</p><NewsletterForm formToken={formToken} copy={getNewsletterDictionary(locale).form} consent={newsletterConsentCopy[locale]} privacyHref={localizeHref("/privacy#newsletter", locale)} /></section></div></article>;
}
