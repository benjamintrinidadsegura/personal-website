import Link from "next/link";

import { newsletterPromise } from "@/lib/newsletter/domain";
import { getWritingDictionary } from "@/data/i18n/writing";
import { localizeHref } from "@/lib/i18n/routing";
import { getLocale } from "@/lib/i18n/server";

export async function NewsletterCta() {
  const locale = await getLocale();
  const copy = getWritingDictionary(locale).newsletter;
  return (
    <aside aria-labelledby="newsletter-cta-title" className="mx-auto max-w-[72ch] border-y border-white/15 py-12 sm:py-16">
      <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">{copy.eyebrow}</p>
      <h2 id="newsletter-cta-title" className="mt-4 text-3xl font-black text-white sm:text-4xl">{copy.title}</h2>
      <p className="mt-4 max-w-2xl leading-7 text-slate-300">{newsletterPromise[locale]}</p>
      <Link href={localizeHref("/newsletter", locale)} className="mt-7 inline-flex min-h-12 items-center rounded-full border border-[#35d0e5]/50 px-6 font-black text-[#35d0e5]">{copy.details} →</Link>
    </aside>
  );
}
