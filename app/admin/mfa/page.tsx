import { redirect } from "next/navigation";
import { MfaForm } from "@/components/admin/mfa-form";
import { requireAdminPage } from "@/lib/admin/authorization";

export const metadata = { title: "MFA | bts.online", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminMfaPage() {
  const { supabase, aal } = await requireAdminPage(false);
  if (aal === "aal2") redirect("/admin");
  const { data } = await supabase.auth.mfa.listFactors();
  const factor = data?.totp.find((item) => item.status === "verified") ?? null;
  return <div className="flex min-h-svh items-center px-5 py-20"><section className="mx-auto w-full max-w-2xl border border-white/15 bg-white/[0.025] p-7 sm:p-10"><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">Second factor required</p><h1 className="mt-5 text-4xl font-black text-white">Verify your session.</h1><p className="mt-4 max-w-xl leading-7 text-slate-400">BTS Studio wird erst nach einer erfolgreichen TOTP-Bestätigung freigegeben.</p><MfaForm existingFactorId={factor?.id ?? null} /></section></div>;
}
