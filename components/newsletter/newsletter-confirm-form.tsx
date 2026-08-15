"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { confirmNewsletterAction } from "@/app/newsletter/actions";
import type { NewsletterLifecycleActionState } from "@/types/newsletter";

export function NewsletterConfirmForm({ token }: { token: string | null }) {
  const [state, action, pending] = useActionState<NewsletterLifecycleActionState, FormData>(confirmNewsletterAction, null);
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state) feedback.current?.focus(); }, [state]);

  if (!token) return <p role="alert" className="mt-8 border-l-2 border-[#ff9a3d] p-6 text-slate-300">This confirmation link is invalid or incomplete.</p>;
  if (state?.ok) return <div ref={feedback} tabIndex={-1} role="status" className="mt-8 border-l-2 border-[#35d0e5] p-6 outline-none"><h2 className="text-2xl font-black text-white">{state.status === "already_confirmed" ? "Already confirmed." : "Subscription confirmed."}</h2><p className="mt-3 text-slate-300">New Writing and occasional Digital HQ updates can now arrive by email.</p><Link href="/writing" className="mt-6 inline-flex min-h-11 items-center font-bold text-[#35d0e5]">Explore Writing →</Link></div>;
  const error = state && !state.ok
    ? state.code === "SERVICE_UNAVAILABLE" ? "Confirmation is temporarily unavailable. Please try again later." : "This confirmation link is invalid or has expired."
    : null;
  return <form action={action} className="mt-8"><input type="hidden" name="token" value={token} />{error ? <div ref={feedback} tabIndex={-1} role="alert" className="mb-6 border-l-2 border-[#ff9a3d] p-5 text-slate-300 outline-none">{error}</div> : null}<button disabled={pending} className="min-h-12 rounded-full bg-[#35d0e5] px-7 font-black text-[#041018] disabled:opacity-60">{pending ? "Confirming…" : "Confirm subscription"}</button></form>;
}
