import { redirect } from "next/navigation";

import { AccountLoginForm } from "@/components/account/account-login-form";
import { getAccountState } from "@/lib/account/state";

export const metadata = { title: "BTS Account | bts.online", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountLoginPage() {
  const account = await getAccountState();
  if (account.kind === "admin") redirect(account.aal === "aal2" ? "/admin" : "/admin/mfa");
  if (account.kind === "authenticated") redirect("/");

  return (
    <div className="flex min-h-svh items-center px-5 py-20">
      <section className="mx-auto w-full max-w-lg border border-white/15 bg-white/[0.025] p-7 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">bts.online</p>
        <h1 className="mt-5 text-4xl font-black text-white">BTS Account</h1>
        <p className="mt-4 leading-7 text-slate-400">Log in to your existing bts.online account.</p>
        <AccountLoginForm />
      </section>
    </div>
  );
}
