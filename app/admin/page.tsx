import Link from "next/link";

import { requireAdminPage } from "@/lib/admin/authorization";

export const metadata = { title: "BTS Studio | bts.online", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const areas = [
  { href: "/admin/writing", label: "Publishing", title: "Writing", copy: "Create, review and publish Writing.", accent: "text-[#35d0e5] hover:border-[#35d0e5]/60" },
  { href: "/admin/newsletter", label: "Delivery", title: "Newsletter", copy: "Published Writing thoughtfully delivered.", accent: "text-[#35d0e5] hover:border-[#35d0e5]/60" },
  { href: "/admin/echowall", label: "Moderation", title: "EchoWall", copy: "Moderate community submissions.", accent: "text-[#ff9a3d] hover:border-[#ff9a3d]/60" },
] as const;

export default async function AdminPage() {
  await requireAdminPage(true);
  return <div className="min-h-svh px-5 py-16 sm:px-8"><div className="mx-auto max-w-6xl"><header className="border-b border-white/15 pb-10"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Restricted · AAL2</p><h1 className="mt-4 text-4xl font-black text-white sm:text-6xl">BTS Studio</h1><p className="mt-4 text-slate-400">Publishing, newsletter operations and moderation workspace.</p></header><nav aria-label="Studio areas" className="mt-10 grid gap-5 md:grid-cols-2">{areas.map((area) => <Link key={area.href} href={area.href} className={`min-h-56 border border-white/15 bg-white/[0.025] p-7 transition ${area.accent}`}><p className="font-mono text-xs uppercase tracking-[0.2em]">{area.label}</p><h2 className="mt-8 text-3xl font-black text-white">{area.title}</h2><p className="mt-4 text-slate-400">{area.copy}</p></Link>)}</nav></div></div>;
}
