"use client";

import { useActionState } from "react";

import { lookupNewsletterSubscriberAction, suppressNewsletterSubscriberAction } from "@/app/admin/newsletter/actions";

export function NewsletterSupport() {
  const [state, action, pending] = useActionState(lookupNewsletterSubscriberAction, null);
  return <div className="mt-6">
    <form action={action} className="flex flex-col gap-3 sm:flex-row"><label className="grid flex-1 gap-2 text-sm font-bold text-slate-200">Exact email address<input name="email" type="email" autoComplete="off" required maxLength={254} className="min-h-12 border border-white/20 bg-[#071821] px-4 text-white" /></label><button disabled={pending} className="min-h-12 self-end rounded-full border border-[#35d0e5]/60 px-5 font-bold text-[#35d0e5] disabled:opacity-60">{pending ? "Looking…" : "Exact lookup"}</button></form>
    {state ? <p role="status" className="mt-4 text-sm text-slate-300">{state.message}</p> : null}
    {state?.record ? <div className="mt-4 border border-white/15 p-5"><dl className="grid gap-2 text-sm"><div className="flex flex-wrap justify-between gap-3"><dt className="text-slate-500">Address</dt><dd className="break-all text-white">{state.record.email ?? "Scrubbed after status change"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Status</dt><dd className="font-bold text-white">{state.record.status}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Updated</dt><dd className="text-white">{new Date(state.record.updatedAt).toLocaleString("en-GB")}</dd></div></dl>
      {state.record.status === "confirmed" && state.record.email ? <form action={suppressNewsletterSubscriberAction} className="mt-5 border-t border-white/10 pt-5"><input type="hidden" name="email" value={state.record.email} /><label className="flex items-start gap-3 text-sm text-slate-300"><input type="checkbox" name="confirmation" value="SUPPRESS" required className="mt-1" />Suppress this exact confirmed address. This cannot create consent or restore a complaint.</label><button className="mt-4 min-h-11 rounded-full border border-[#ff9a3d]/60 px-5 font-bold text-[#ffcfaa]">Suppress address</button></form> : null}
    </div> : null}
  </div>;
}
