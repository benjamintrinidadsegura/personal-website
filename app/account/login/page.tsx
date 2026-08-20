import { redirect } from "next/navigation";

import { AccountLoginForm } from "@/components/account/account-login-form";
import { getAccountState } from "@/lib/account/state";
import { getLocale } from "@/lib/i18n/server";
import { localizeHref } from "@/lib/i18n/routing";
import { accountTitles, getAccountDictionary } from "@/data/i18n/account";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: "BTS Account | bts.online", description: getAccountDictionary(locale).description, robots: { index: false, follow: false } };
}
export const dynamic = "force-dynamic";

export default async function AccountLoginPage() {
  const [account, locale] = await Promise.all([getAccountState(), getLocale()]);
  const copy = getAccountDictionary(locale);
  if (account.kind === "admin") redirect(account.aal === "aal2" ? "/admin" : "/admin/mfa");
  if (account.kind === "authenticated") redirect(localizeHref("/", locale));

  return (
    <div className="flex min-h-svh items-center px-5 py-20">
      <section className="mx-auto w-full max-w-lg border border-white/15 bg-white/[0.025] p-7 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#35d0e5]">bts.online</p>
        <h1 className="mt-5 text-4xl font-black text-white">{accountTitles[locale]}</h1>
        <p className="mt-4 leading-7 text-slate-400">{copy.introduction}</p>
        <AccountLoginForm />
      </section>
    </div>
  );
}
