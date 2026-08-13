import Link from "next/link";

import { createWritingDraftAction } from "@/app/admin/writing/actions";
import { requireAdminPage } from "@/lib/admin/authorization";
import { mapAdminWritingArticle } from "@/lib/writing/domain";

export const metadata = { title: "Writing | BTS Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminWritingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { supabase } = await requireAdminPage(true);
  const { data, error } = await supabase.rpc("list_writing_articles", { p_limit: 100 });
  const articles = !error && Array.isArray(data) ? data.map((row) => mapAdminWritingArticle(row)).filter((article) => article !== null) : [];
  const creationFailed = (await searchParams).error === "create";

  return <div className="min-h-svh px-5 py-16 sm:px-8"><div className="mx-auto max-w-6xl"><nav aria-label="Breadcrumb" className="font-mono text-xs text-slate-400"><Link href="/admin" className="inline-flex min-h-11 items-center hover:text-white">BTS Studio</Link> / <span aria-current="page" className="text-[#35d0e5]">Writing</span></nav><header className="mt-5 flex flex-wrap items-end justify-between gap-6 border-b border-white/15 pb-10"><div><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Publishing</p><h1 className="mt-4 text-4xl font-black text-white sm:text-6xl">Writing</h1></div><form action={createWritingDraftAction}><button className="min-h-12 rounded-full bg-[#35d0e5] px-6 font-black text-[#041018]">New draft</button></form></header>{creationFailed ? <p role="alert" className="mt-8 border-l-2 border-[#ff9a3d] p-5 text-[#ffcfaa]">Der Entwurf konnte nicht erstellt werden.</p> : null}{error ? <p role="alert" className="mt-8 border-l-2 border-[#ff9a3d] p-5 text-slate-200">Writing ist vorübergehend nicht verfügbar.</p> : articles.length === 0 ? <p className="mt-10 border-l-2 border-[#35d0e5] p-6 text-slate-300">Noch keine Writing-Artikel vorhanden.</p> : <ol className="mt-10 grid gap-4">{articles.map((article) => <li key={article.id}><article className="grid gap-5 border border-white/15 bg-white/[0.02] p-6 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className={`font-mono text-xs font-black uppercase tracking-[0.18em] ${article.status === "published" ? "text-emerald-300" : "text-[#ffb36d]"}`}>{article.status === "published" ? "Published" : "Draft"}</p><h2 className="mt-3 break-words text-2xl font-black text-white">{article.title || "Unbenannter Entwurf"}</h2><p className="mt-2 text-sm text-slate-500">Zuletzt geändert {new Date(article.updatedAt).toLocaleString("de-DE")}</p></div><div className="flex flex-wrap gap-3"><Link href={`/admin/writing/${article.id}`} className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 font-bold text-white">Edit / open</Link>{article.status === "published" && article.slug ? <Link href={`/writing/${article.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-[#35d0e5]/50 px-5 font-bold text-[#35d0e5]">Public article</Link> : null}</div></article></li>)}</ol>}</div></div>;
}
