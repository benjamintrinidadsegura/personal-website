import Link from "next/link";

import { NewsletterEditionForm } from "@/components/admin/newsletter-edition-form";
import { NewsletterSupport } from "@/components/admin/newsletter-support";
import { requireAdminPage } from "@/lib/admin/authorization";
import { newsletterDeliveryConfiguration } from "@/lib/newsletter/config";
import { mapNewsletterEdition } from "@/lib/newsletter/edition-domain";

export const metadata = { title: "Newsletter | BTS Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
type Candidate = { id?: unknown; title?: unknown; excerpt?: unknown; published_at?: unknown };

export default async function NewsletterAdminPage() {
  const { supabase } = await requireAdminPage(true);
  const [summaryResult, writingResult, editionsResult] = await Promise.allSettled([
    supabase.rpc("get_newsletter_operational_summary"),
    supabase.rpc("list_newsletter_writing_candidates", { p_limit: 100 }),
    supabase.rpc("list_newsletter_editions", { p_limit: 50 }),
  ]);
  const summaryResponse = summaryResult.status === "fulfilled" ? summaryResult.value : null;
  const summary = !summaryResponse?.error && Array.isArray(summaryResponse?.data) ? summaryResponse.data[0] as Record<string, unknown> | undefined : undefined;
  const writingResponse = writingResult.status === "fulfilled" ? writingResult.value : null;
  const candidates = !writingResponse?.error && Array.isArray(writingResponse?.data) ? (writingResponse.data as Candidate[]).flatMap((row) => typeof row.id === "string" && typeof row.title === "string" && typeof row.excerpt === "string" && typeof row.published_at === "string" ? [{ id: row.id, title: row.title, excerpt: row.excerpt, publishedAt: row.published_at }] : []) : [];
  const editionsResponse = editionsResult.status === "fulfilled" ? editionsResult.value : null;
  const editions = !editionsResponse?.error && Array.isArray(editionsResponse?.data) ? editionsResponse.data.flatMap((row) => { const edition = mapNewsletterEdition(row as Record<string, unknown>); return edition ? [edition] : []; }) : [];
  const providerReady = newsletterDeliveryConfiguration() !== null;
  const counts = ["confirmed", "pending", "unsubscribed", "suppressed"].map((status) => ({ status, value: Number(summary?.[status] ?? 0) }));

  return <div className="min-h-svh px-5 py-16 sm:px-8"><div className="mx-auto max-w-6xl">
    <nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400"><Link href="/admin" className="inline-flex min-h-11 items-center hover:text-white">BTS Studio</Link> / <span aria-current="page" className="text-[#35d0e5]">Newsletter</span></nav>
    <header className="mt-5 border-b border-white/15 pb-10"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Delivery operations · AAL2</p><h1 className="mt-4 text-4xl font-black text-white sm:text-6xl">Writing, delivered thoughtfully.</h1><p className="mt-4 max-w-2xl text-slate-400">A deliberately small operational layer for editions sourced from published Writing.</p></header>
    <section aria-labelledby="summary-heading" className="mt-10"><h2 id="summary-heading" className="text-2xl font-black text-white">Operational summary</h2>{!summary ? <p role="alert" className="mt-5 border-l-2 border-[#ff9a3d] p-5 text-slate-300">Subscriber counts are temporarily unavailable. Writing and other Studio areas remain unaffected.</p> : <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{counts.map(({ status, value }) => <div key={status} className="border border-white/15 p-5"><dt className="font-mono text-xs uppercase tracking-[0.15em] text-slate-500">{status}</dt><dd className="mt-2 text-3xl font-black text-white">{value}</dd></div>)}</dl>}<div className={`mt-5 border-l-2 p-5 ${providerReady ? "border-emerald-400 text-emerald-200" : "border-[#ff9a3d] text-[#ffcfaa]"}`}><p className="font-bold">{providerReady ? "Delivery configuration present" : "Delivery is safely disabled"}</p><p className="mt-1 text-sm text-slate-400">{providerReady ? "Tracking-disable, sender, legal and server-only configuration gates are present. Production verification is still required." : "No email can be sent until every legal, sender, provider and tracking-disable gate is present."}</p></div></section>
    <section aria-labelledby="create-heading" className="mt-14 border-t border-white/15 pt-10"><h2 id="create-heading" className="text-2xl font-black text-white">Create from published Writing</h2><p className="mt-2 text-slate-400">Draft and unpublished articles are excluded by the authoritative database boundary.</p>{writingResponse?.error ? <p role="alert" className="mt-5 text-[#ffcfaa]">Writing candidates are temporarily unavailable.</p> : candidates.length ? <NewsletterEditionForm candidates={candidates} /> : <p className="mt-5 text-slate-400">No published Writing is currently eligible.</p>}</section>
    <section aria-labelledby="recent-heading" className="mt-14 border-t border-white/15 pt-10"><h2 id="recent-heading" className="text-2xl font-black text-white">Recent editions</h2>{editionsResponse?.error ? <p role="alert" className="mt-5 text-[#ffcfaa]">Edition operations are temporarily unavailable.</p> : editions.length === 0 ? <p className="mt-5 text-slate-400">No newsletter editions yet.</p> : <ol className="mt-6 grid gap-4">{editions.map((edition) => <li key={edition.id}><Link href={`/admin/newsletter/${edition.id}`} className="grid gap-4 border border-white/15 p-5 transition hover:border-[#35d0e5]/60 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[#35d0e5]">{edition.state}</p><h3 className="mt-2 text-xl font-black text-white">{edition.subject}</h3><p className="mt-2 text-sm text-slate-500">{edition.sentCount}/{edition.recipientCount} accepted · {edition.reconciliationCount} reconciliation</p></div><span className="font-bold text-[#35d0e5]">Preview / operate →</span></Link></li>)}</ol>}</section>
    <section aria-labelledby="support-heading" className="mt-14 border-t border-white/15 pt-10"><h2 id="support-heading" className="text-2xl font-black text-white">Subscriber support</h2><p className="mt-2 max-w-2xl text-slate-400">Exact-address lookup only. There is no subscriber directory, export, manual confirmation or consent override.</p><NewsletterSupport /></section>
  </div></div>;
}
