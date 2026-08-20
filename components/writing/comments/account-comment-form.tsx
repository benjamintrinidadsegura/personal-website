"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import { submitAccountCommentAction } from "@/app/writing/comments/actions";
import type { WritingDictionary } from "@/data/i18n/writing";
import type { AccountCommentActionState } from "@/types/comments";

const initialState: AccountCommentActionState = null;
export function AccountCommentForm({ articleId, displayName, formToken, copy }: { articleId: string; displayName: string; formToken: string | null; copy: WritingDictionary["discussion"] }) {
  const [state, formAction, pending] = useActionState(submitAccountCommentAction, initialState);
  const [bodyLength, setBodyLength] = useState(0);
  const feedback = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state) return;
    feedback.current?.focus();
    if (state.ok) router.refresh();
  }, [router, state]);

  if (!formToken) return <p role="status" className="mt-8 border-l-2 border-[#ff9a3d] p-5 text-slate-300">{copy.secureAccountUnavailable}</p>;
  if (state?.ok) return <div ref={feedback} tabIndex={-1} role="status" className="mt-8 border-l-2 border-[#35d0e5] bg-[#35d0e5]/[0.04] p-6 outline-none"><h3 className="text-xl font-black text-white">{copy.publishedTitle}</h3><p className="mt-2 text-slate-300">{copy.publishedBody}</p></div>;

  return <form action={formAction} noValidate className="mt-10 space-y-7">
    <input type="hidden" name="articleId" value={articleId} />
    <input type="hidden" name="formToken" value={formToken} />
    <div ref={feedback} tabIndex={-1} aria-live="polite" className={state && !state.ok ? "border-l-2 border-[#ff9a3d] p-5 text-slate-200 outline-none" : "sr-only"}>{state && !state.ok ? copy.errors[state.code] : ""}</div>
    <p className="text-sm leading-6 text-slate-400">{copy.commentingAs} <strong className="break-words text-white">{displayName}</strong>.</p>
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3"><label htmlFor="account-comment-body" className="font-bold text-white">{copy.comment} <span className="text-[#ff9a3d]">({copy.required})</span></label><span id="account-comment-body-count" className="font-mono text-xs text-slate-500">{bodyLength} / 3000</span></div>
      <p id="account-comment-body-help" className="mt-2 text-sm leading-6 text-slate-400">{copy.plainTextHelp}</p>
      <textarea id="account-comment-body" name="body" required minLength={2} maxLength={3000} rows={7} onChange={(event) => setBodyLength(Array.from(event.target.value).length)} aria-describedby="account-comment-body-help account-comment-body-count" aria-invalid={state && !state.ok && state.code === "INVALID_INPUT" ? true : undefined} className="mt-3 w-full resize-y border border-white/15 bg-[#07192b] px-4 py-3 leading-7 text-white outline-none focus-visible:border-[#35d0e5]" />
    </div>
    <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true"><input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" /></div>
    <p className="text-sm leading-6 text-slate-400">{copy.accountIdentity}</p>
    <button type="submit" disabled={pending} className="min-h-12 rounded-full bg-[#35d0e5] px-7 py-3 font-black text-[#041018] disabled:cursor-wait disabled:opacity-60">{pending ? copy.publishing : copy.publish}</button>
  </form>;
}
