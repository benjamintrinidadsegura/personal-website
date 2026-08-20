"use client";

import { useActionState } from "react";

import { loginAction, type AuthActionState } from "@/app/account/actions";
import { useLocale } from "@/components/i18n/locale-context";
import { getAccountDictionary } from "@/data/i18n/account";

export function AccountLoginForm() {
  const locale = useLocale();
  const copy = getAccountDictionary(locale);
  const [state, action, pending] = useActionState<AuthActionState, FormData>(loginAction, null);

  return (
    <form action={action} className="mt-10 space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-bold text-white">{copy.email}</label>
        <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-[#04111b] px-4 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5]" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-bold text-white">{copy.password}</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} maxLength={256} className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-[#04111b] px-4 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#35d0e5]" />
      </div>
      {state?.message ? <p role="alert" className="text-sm text-[#ffb16a]">{state.message}</p> : null}
      <button disabled={pending} className="min-h-12 rounded-full bg-[#35d0e5] px-7 font-black text-[#041018] disabled:opacity-60">
        {pending ? copy.checking : copy.login}
      </button>
    </form>
  );
}
