"use client";

import { useActionState, useEffect, useRef } from "react";

import { unsubscribeNewsletterAction } from "@/app/newsletter/actions";
import type { NewsletterDictionary } from "@/data/i18n/newsletter";
import type { NewsletterLifecycleActionState } from "@/types/newsletter";

export function NewsletterUnsubscribeForm({ token, copy }: { token: string | null; copy: NewsletterDictionary["unsubscribe"] }) {
  const [state, action, pending] = useActionState<NewsletterLifecycleActionState, FormData>(unsubscribeNewsletterAction, null);
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state) feedback.current?.focus(); }, [state]);

  if (!token) return <p role="alert" className="mt-8 border-l-2 border-[#ff9a3d] p-6 text-slate-300">{copy.invalid}</p>;
  if (state?.ok) return <div ref={feedback} tabIndex={-1} role="status" className="mt-8 border-l-2 border-[#35d0e5] p-6 outline-none"><h2 className="text-2xl font-black text-white">{state.status === "already_unsubscribed" ? copy.already : copy.success}</h2><p className="mt-3 text-slate-300">{copy.successBody}</p></div>;
  const error = state && !state.ok
    ? state.code === "SERVICE_UNAVAILABLE" ? copy.unavailable : copy.badLink
    : null;
  return <form action={action} className="mt-8"><input type="hidden" name="token" value={token} />{error ? <div ref={feedback} tabIndex={-1} role="alert" className="mb-6 border-l-2 border-[#ff9a3d] p-5 text-slate-300 outline-none">{error}</div> : null}<button disabled={pending} className="min-h-12 rounded-full border border-[#ff9a3d]/60 px-7 font-black text-[#ffd0a8] disabled:opacity-60">{pending ? copy.pending : copy.action}</button></form>;
}
