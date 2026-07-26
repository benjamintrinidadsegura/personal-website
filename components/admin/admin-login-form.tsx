"use client";

import { useActionState } from "react";
import { loginAction, type AuthActionState } from "@/app/admin/actions";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(loginAction, null);
  return (
    <form action={action} className="mt-10 space-y-6">
      <div><label htmlFor="email" className="block text-sm font-bold text-white">E-Mail</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={254} className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-[#04111b] px-4 text-white" /></div>
      <div><label htmlFor="password" className="block text-sm font-bold text-white">Passwort</label><input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} maxLength={256} className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-[#04111b] px-4 text-white" /></div>
      {state?.message ? <p role="alert" className="text-sm text-[#ffb16a]">{state.message}</p> : null}
      <button disabled={pending} className="min-h-12 rounded-full bg-[#35d0e5] px-7 font-black text-[#041018] disabled:opacity-60">{pending ? "Prüfe…" : "Secure login"}</button>
    </form>
  );
}
