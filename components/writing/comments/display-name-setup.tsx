"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

import { setAccountDisplayNameAction } from "@/app/account/actions";
import type { WritingDictionary } from "@/data/i18n/writing";
import type { DisplayNameActionState } from "@/types/comments";

const initialState: DisplayNameActionState = null;

export function DisplayNameSetup({ copy }: { copy: WritingDictionary["discussion"] }) {
  const [state, formAction, pending] = useActionState(setAccountDisplayNameAction, initialState);
  const feedback = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state) return;
    feedback.current?.focus();
    if (state.ok) router.refresh();
  }, [router, state]);

  return <form action={formAction} noValidate className="mt-10 border-l-2 border-[#35d0e5] p-6">
    <h3 className="text-2xl font-black text-white">{copy.profileTitle}</h3>
    <p className="mt-3 leading-7 text-slate-400">{copy.profileBody}</p>
    <div ref={feedback} tabIndex={-1} role="status" aria-live="polite" className="mt-4 text-sm text-[#ffad63] outline-none">{state && !state.ok ? state.message : state?.ok ? copy.profileSaved : ""}</div>
    <label htmlFor="account-display-name" className="mt-5 block font-bold text-white">{copy.displayName} <span className="text-[#ff9a3d]">({copy.required})</span></label>
    <input id="account-display-name" name="displayName" type="text" required minLength={2} maxLength={40} autoComplete="name" aria-describedby="account-display-name-help" className="mt-3 min-h-12 w-full border border-white/15 bg-[#07192b] px-4 py-3 text-white outline-none focus-visible:border-[#35d0e5]" />
    <p id="account-display-name-help" className="mt-2 text-sm leading-6 text-slate-400">{copy.profileHelp}</p>
    <button type="submit" disabled={pending} className="mt-6 min-h-12 rounded-full bg-[#35d0e5] px-7 py-3 font-black text-[#041018] disabled:cursor-wait disabled:opacity-60">{pending ? copy.saving : copy.saveDisplayName}</button>
  </form>;
}
