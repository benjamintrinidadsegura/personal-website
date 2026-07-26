import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { EchoModerationList } from "@/components/admin/echo-moderation-list";
import { requireAdminPage } from "@/lib/admin/authorization";
import { moderationFilters, type AdminEcho, type ModerationFilter } from "@/types/echowall";

export const metadata = { title: "EchoWall Moderation | bts.online", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EchoWallAdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireAdminPage(true);
  const requested = (await searchParams).status;
  const status: ModerationFilter = moderationFilters.includes(requested as ModerationFilter) ? requested as ModerationFilter : "pending";
  const { data, error } = await supabase.rpc("list_echoes_for_moderation", { p_status: status, p_limit: 50 });
  const echoes = !error && Array.isArray(data) ? data as AdminEcho[] : [];
  return <main className="min-h-svh px-5 py-16 sm:px-8"><div className="mx-auto max-w-6xl"><header className="border-b border-white/15 pb-10"><div className="flex flex-wrap items-start justify-between gap-6"><div><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Restricted · AAL2</p><h1 className="mt-4 text-4xl font-black text-white sm:text-6xl">EchoWall moderation</h1><p className="mt-4 text-slate-400">Verified admin session · maximum 50 entries</p></div><form action={logoutAction}><button className="min-h-11 rounded-full border border-white/20 px-5 font-bold text-white">Logout</button></form></div></header>
    <nav aria-label="Moderation filters" className="my-8 flex flex-wrap gap-3">{moderationFilters.map((filter) => <Link key={filter} href={`/admin/echowall?status=${filter}`} aria-current={filter === status ? "page" : undefined} className={`min-h-11 rounded-full border px-5 py-3 font-bold capitalize ${filter === status ? "border-[#35d0e5] bg-[#35d0e5]/10 text-white" : "border-white/15 text-slate-300"}`}>{filter}</Link>)}</nav>
    {error ? <p role="alert" className="border-l-2 border-[#ff9a3d] p-6 text-slate-200">Moderation entries are temporarily unavailable.</p> : <EchoModerationList echoes={echoes} />}</div></main>;
}
