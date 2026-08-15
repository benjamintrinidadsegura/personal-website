import type { Metadata } from "next";
import Link from "next/link";

import { NewsletterConfirmForm } from "@/components/newsletter/newsletter-confirm-form";
import { isNewsletterConfirmationToken } from "@/lib/newsletter/security";

export const metadata: Metadata = { title: "Confirm newsletter | bts.online", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewsletterConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const supplied = (await searchParams).token;
  const token = isNewsletterConfirmationToken(supplied) ? supplied : null;
  return <article className="px-5 pb-24 pt-32 sm:px-8"><div className="mx-auto max-w-3xl"><nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400"><Link href="/newsletter" className="inline-flex min-h-11 items-center hover:text-white">Newsletter</Link> / <span aria-current="page" className="text-[#35d0e5]">Confirm</span></nav><header className="mt-8 border-b border-white/15 pb-10"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Double opt-in</p><h1 className="mt-4 text-4xl font-black text-white sm:text-6xl">One final, deliberate step.</h1><p className="mt-5 max-w-2xl leading-7 text-slate-300">Confirm only if you requested the bts.online newsletter. Opening this page alone does not subscribe you.</p></header><NewsletterConfirmForm token={token} /></div></article>;
}
