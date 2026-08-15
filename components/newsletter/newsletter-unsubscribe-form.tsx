"use client";

import { useActionState, useEffect, useRef } from "react";

import { unsubscribeNewsletterAction } from "@/app/newsletter/actions";
import type { NewsletterLifecycleActionState } from "@/types/newsletter";

export function NewsletterUnsubscribeForm({ token }: { token: string | null }) {
  const [state, action, pending] = useActionState<NewsletterLifecycleActionState, FormData>(unsubscribeNewsletterAction, null);
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state) feedback.current?.focus(); }, [state]);

  if (!token) return <p role="alert" className="mt-8 border-l-2 border-[#ff9a3d] p-6 text-slate-300">This unsubscribe link is invalid or incomplete.</p>;
  if (state?.ok) return <div ref={feedback} tabIndex={-1} role="status" className="mt-8 border-l-2 border-[#35d0e5] p-6 outline-none"><h2 className="text-2xl font-black text-white">{state.status === "already_unsubscribed" ? "Already unsubscribed." : "You are unsubscribed."}</h2><p className="mt-3 text-slate-300">No further newsletter editions will be sent to this subscription.</p></div>;
  const error = state && !state.ok
    ? state.code === "SERVICE_UNAVAILABLE" ? "Unsubscribe is temporarily unavailable. Please try again later." : "This unsubscribe link is invalid."
    : null;
  return <form action={action} className="mt-8"><input type="hidden" name="token" value={token} />{error ? <div ref={feedback} tabIndex={-1} role="alert" className="mb-6 border-l-2 border-[#ff9a3d] p-5 text-slate-300 outline-none">{error}</div> : null}<button disabled={pending} className="min-h-12 rounded-full border border-[#ff9a3d]/60 px-7 font-black text-[#ffd0a8] disabled:opacity-60">{pending ? "Unsubscribing…" : "Unsubscribe"}</button></form>;
}
