import type { Metadata } from "next";
import Link from "next/link";

import { NewsletterUnsubscribeForm } from "@/components/newsletter/newsletter-unsubscribe-form";
import { verifyNewsletterUnsubscribeToken } from "@/lib/newsletter/security";
import { getNewsletterDictionary } from "@/data/i18n/newsletter";
import { getGlobalDictionary } from "@/data/i18n/global";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${getNewsletterDictionary(locale).unsubscribe.action} | bts.online`, robots: { index: false, follow: false } };
}
export const dynamic = "force-dynamic";

export default async function NewsletterUnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const locale = await getLocale();
  const copy = getNewsletterDictionary(locale).unsubscribe;
  const globalCopy = getGlobalDictionary(locale);
  const supplied = (await searchParams).token;
  const secret = process.env.NEWSLETTER_HASH_SECRET;
  const token = typeof supplied === "string" && secret && verifyNewsletterUnsubscribeToken(supplied, secret).valid ? supplied : null;
  return <article className="px-5 pb-24 pt-32 sm:px-8"><div className="mx-auto max-w-3xl"><nav aria-label={globalCopy.breadcrumbNavigation} className="font-mono text-xs text-slate-400"><Link href={localizeHref("/newsletter", locale)} className="inline-flex min-h-11 items-center hover:text-white">Newsletter</Link> / <span aria-current="page" className="text-[#ff9a3d]">{copy.action}</span></nav><header className="mt-8 border-b border-white/15 pb-10"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.eyebrow}</p><h1 className="mt-4 text-4xl font-black text-white sm:text-6xl">{copy.title}</h1><p className="mt-5 max-w-2xl leading-7 text-slate-300">{copy.body}</p></header><NewsletterUnsubscribeForm token={token} copy={copy} /></div></article>;
}
