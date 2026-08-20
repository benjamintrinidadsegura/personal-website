"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import { submitGuestCommentAction } from "@/app/writing/comments/actions";
import type { WritingDictionary } from "@/data/i18n/writing";
import type { GuestCommentActionState, GuestCommentField } from "@/types/comments";

const initialState: GuestCommentActionState = null;
export function CommentForm({ articleId, formToken, copy }: { articleId: string; formToken: string | null; copy: WritingDictionary["discussion"] }) {
  const [state, formAction, pending] = useActionState(submitGuestCommentAction, initialState);
  const [bodyLength, setBodyLength] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      router.refresh();
      feedback.current?.focus();
      return;
    }
    const invalid = form.current?.querySelector<HTMLElement>("[aria-invalid='true']");
    (invalid ?? feedback.current)?.focus();
  }, [router, state]);

  if (!formToken) return <p role="status" className="mt-8 border-l-2 border-[#ff9a3d] p-5 text-slate-300">{copy.secureUnavailable}</p>;
  if (state?.ok) return <div ref={feedback} tabIndex={-1} role="status" className="mt-8 border-l-2 border-[#35d0e5] bg-[#35d0e5]/[0.04] p-6 outline-none"><h3 className="text-xl font-black text-white">{copy.publishedTitle}</h3><p className="mt-2 text-slate-300">{copy.publishedBody}</p></div>;

  const fieldError = (field: GuestCommentField) => state && !state.ok ? state.fieldErrors?.[field] : undefined;
  return <form ref={form} action={formAction} noValidate className="mt-10 space-y-7">
    <input type="hidden" name="articleId" value={articleId} />
    <input type="hidden" name="formToken" value={formToken} />
    <div ref={feedback} tabIndex={-1} aria-live="polite" className={state && !state.ok ? "border-l-2 border-[#ff9a3d] p-5 text-slate-200 outline-none" : "sr-only"}>{state && !state.ok ? copy.errors[state.code] : ""}</div>
    <div>
      <label htmlFor="comment-display-name" className="block font-bold text-white">{copy.displayName} <span className="text-[#ff9a3d]">({copy.required})</span></label>
      <p id="comment-display-name-help" className="mt-2 text-sm leading-6 text-slate-400">{copy.displayNameHelp}</p>
      <input id="comment-display-name" name="displayName" type="text" required minLength={2} maxLength={40} autoComplete="name" aria-describedby={`comment-display-name-help${fieldError("displayName") ? " comment-display-name-error" : ""}`} aria-invalid={fieldError("displayName") ? true : undefined} className="mt-3 min-h-12 w-full border border-white/15 bg-[#07192b] px-4 py-3 text-white outline-none focus-visible:border-[#35d0e5]" />
      {fieldError("displayName") ? <p id="comment-display-name-error" className="mt-2 text-sm text-[#ffad63]">{fieldError("displayName")}</p> : null}
    </div>
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3"><label htmlFor="comment-body" className="font-bold text-white">{copy.comment} <span className="text-[#ff9a3d]">({copy.required})</span></label><span id="comment-body-count" className="font-mono text-xs text-slate-500">{bodyLength} / 3000</span></div>
      <p id="comment-body-help" className="mt-2 text-sm leading-6 text-slate-400">{copy.plainTextHelp}</p>
      <textarea id="comment-body" name="body" required minLength={2} maxLength={3000} rows={7} onChange={(event) => setBodyLength(Array.from(event.target.value).length)} aria-describedby={`comment-body-help comment-body-count${fieldError("body") ? " comment-body-error" : ""}`} aria-invalid={fieldError("body") ? true : undefined} className="mt-3 w-full resize-y border border-white/15 bg-[#07192b] px-4 py-3 leading-7 text-white outline-none focus-visible:border-[#35d0e5]" />
      {fieldError("body") ? <p id="comment-body-error" className="mt-2 text-sm text-[#ffad63]">{fieldError("body")}</p> : null}
    </div>
    <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true"><input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" /></div>
    <p className="text-sm leading-6 text-slate-400">{copy.respect}</p>
    <button type="submit" disabled={pending} className="min-h-12 rounded-full bg-[#35d0e5] px-7 py-3 font-black text-[#041018] disabled:cursor-wait disabled:opacity-60">{pending ? copy.publishing : copy.publish}</button>
  </form>;
}
