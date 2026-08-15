import Link from "next/link";
import { notFound } from "next/navigation";

import { NewsletterSendForm } from "@/components/admin/newsletter-send-form";
import { requireAdminPage } from "@/lib/admin/authorization";
import { mapNewsletterEdition } from "@/lib/newsletter/edition-domain";

export const metadata = { title: "Newsletter edition | BTS Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export default async function NewsletterEditionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ send?: string }> }) {
  const { supabase } = await requireAdminPage(true);
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const { data, error } = await supabase.rpc("get_newsletter_edition", { p_id: id });
  if (error) return <div className="min-h-svh px-5 py-16"><div className="mx-auto max-w-4xl"><Link href="/admin/newsletter" className="text-[#35d0e5]">← Newsletter operations</Link><p role="alert" className="mt-10 border-l-2 border-[#ff9a3d] p-6 text-slate-200">This edition is temporarily unavailable. Other Studio areas remain unaffected.</p></div></div>;
  const edition = Array.isArray(data) && data[0] ? mapNewsletterEdition(data[0] as Record<string, unknown>) : null;
  if (!edition) notFound();
  const sendStatus = (await searchParams).send;
  return <div className="min-h-svh px-5 py-16 sm:px-8"><div className="mx-auto max-w-4xl">
    <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400"><Link href="/admin" className="hover:text-white">BTS Studio</Link> / <Link href="/admin/newsletter" className="hover:text-white">Newsletter</Link> / <span aria-current="page" className="text-[#35d0e5]">Edition</span></nav>
    <header className="mt-7 border-b border-white/15 pb-8"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#35d0e5]">{edition.state} · version {edition.version}</p><h1 className="mt-3 text-3xl font-black text-white sm:text-5xl">{edition.subject}</h1></div><a href={edition.canonicalUrl} className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 font-bold text-white">Public Writing</a></div></header>
    {sendStatus ? <p role="status" className="mt-6 border-l-2 border-[#35d0e5] p-4 text-slate-200">{sendStatus === "sent" ? "Delivery completed." : sendStatus === "sending" ? "A bounded batch completed; eligible recipients remain." : sendStatus === "configuration" ? "Delivery is disabled until every Production-readiness configuration gate is present." : sendStatus === "conflict" ? "This edition changed elsewhere. Reloaded state is shown." : sendStatus === "empty" ? "There are no eligible confirmed recipients." : "Delivery stopped safely. Review failure and reconciliation counts before any next step."}</p> : null}
    <section aria-labelledby="preview-heading" className="mt-10"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Fixed template preview</p><h2 id="preview-heading" className="mt-2 text-2xl font-black text-white">Inbox snapshot</h2></div><p className="text-sm text-slate-500">No remote images · no tracking</p></div><div className="mt-5 overflow-hidden border border-white/15 bg-[#041018] p-6 sm:p-10"><p className="font-mono text-xs uppercase tracking-[0.16em] text-[#35d0e5]">bts.online · Newsletter</p>{edition.preheader ? <p className="mt-4 text-sm italic text-slate-500">Preheader: {edition.preheader}</p> : null}{edition.introduction ? <p className="mt-8 whitespace-pre-line text-lg leading-8 text-slate-300">{edition.introduction}</p> : null}<article className="mt-8"><h3 className="text-3xl font-black leading-tight text-white">{edition.articleTitle}</h3><p className="mt-5 text-lg leading-8 text-slate-300">{edition.articleExcerpt}</p><span className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#35d0e5] px-6 font-black text-[#041018]">Read the Writing</span></article><footer className="mt-12 border-t border-white/15 pt-6 text-sm leading-7 text-slate-500">Writing delivered thoughtfully.<br />Unsubscribe · Privacy · bts.online sender identity</footer></div></section>
    <section aria-labelledby="delivery-heading" className="mt-10"><h2 id="delivery-heading" className="text-2xl font-black text-white">Delivery state</h2><dl className="mt-5 grid gap-3 sm:grid-cols-4">{[["Recipients", edition.recipientCount], ["Accepted", edition.sentCount], ["Failed", edition.failedCount], ["Reconcile", edition.reconciliationCount]].map(([label, value]) => <div key={label} className="border border-white/15 p-4"><dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-2 text-2xl font-black text-white">{value}</dd></div>)}</dl></section>
    {edition.state === "draft" || edition.state === "sending" ? <NewsletterSendForm editionId={edition.id} version={edition.version} continuing={edition.state === "sending"} /> : edition.state === "failed" ? <p className="mt-8 border-l-2 border-[#ff9a3d] p-5 text-[#ffcfaa]">This edition is terminally stopped. Failed or ambiguous deliveries are not retryable in V1; reconcile provider state before creating any replacement edition.</p> : null}
  </div></div>;
}
