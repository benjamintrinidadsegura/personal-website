import type { Metadata } from "next";
import Link from "next/link";

import { issueNewsletterFormToken } from "@/app/newsletter/actions";
import { NewsletterForm } from "@/components/newsletter/newsletter-form";
import { newsletterPromise } from "@/lib/newsletter/domain";

export const metadata: Metadata = {
  title: "Newsletter | bts.online",
  description: newsletterPromise.en,
  alternates: { canonical: "/newsletter" },
};
export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  const formToken = await issueNewsletterFormToken();
  return <article className="relative overflow-hidden px-5 pb-24 pt-28 sm:px-8 sm:pt-36"><div aria-hidden="true" className="absolute inset-x-0 top-0 h-[50rem] bg-[radial-gradient(circle_at_72%_14%,rgba(53,208,229,0.16),transparent_28rem),radial-gradient(circle_at_20%_50%,rgba(255,122,0,0.07),transparent_22rem)]" /><div className="relative mx-auto max-w-4xl"><nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400"><Link href="/" className="inline-flex min-h-11 items-center hover:text-white">Digital HQ</Link> / <span aria-current="page" className="text-[#35d0e5]">Newsletter</span></nav><header className="border-b border-white/15 py-14 sm:py-20"><p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#35d0e5]">Writing / Direct channel</p><h1 className="mt-7 text-[clamp(3.5rem,10vw,7rem)] font-black leading-[0.88] tracking-[-0.055em] text-white">Notes from<br />the Digital HQ.</h1><p className="mt-8 max-w-3xl text-xl font-bold leading-9 text-slate-200">{newsletterPromise.en}</p><p lang="de" className="mt-4 max-w-3xl leading-7 text-slate-400">{newsletterPromise.de}</p></header><section aria-labelledby="newsletter-subscribe-title" className="py-14 sm:py-20"><h2 id="newsletter-subscribe-title" className="text-3xl font-black text-white">Subscribe deliberately.</h2><p className="mt-4 max-w-2xl leading-7 text-slate-300">One email address, a clear confirmation step, and an unsubscribe link in every edition. Newsletter consent is separate from BTS Account.</p><NewsletterForm formToken={formToken} /></section></div></article>;
}
