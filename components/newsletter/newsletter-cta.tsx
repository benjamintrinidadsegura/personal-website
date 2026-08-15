import Link from "next/link";

import { newsletterPromise } from "@/lib/newsletter/domain";

export function NewsletterCta() {
  return (
    <aside aria-labelledby="newsletter-cta-title" className="mx-auto max-w-[72ch] border-y border-white/15 py-12 sm:py-16">
      <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9a3d]">Newsletter / From the HQ</p>
      <h2 id="newsletter-cta-title" className="mt-4 text-3xl font-black text-white sm:text-4xl">Keep the thread going.</h2>
      <p className="mt-4 max-w-2xl leading-7 text-slate-300">{newsletterPromise.en}</p>
      <Link href="/newsletter" className="mt-7 inline-flex min-h-12 items-center rounded-full border border-[#35d0e5]/50 px-6 font-black text-[#35d0e5]">Newsletter details →</Link>
    </aside>
  );
}
