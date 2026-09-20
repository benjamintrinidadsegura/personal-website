"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { submitFeedbackAction } from "@/app/feedback/actions";
import { useLocalizedHref } from "@/components/i18n/locale-context";
import type { FeedbackCopy } from "@/data/i18n/feedback";
import {
  feedbackMessageMaximum,
  feedbackNameMaximum,
  type FeedbackActionState,
  type FeedbackField,
} from "@/types/feedback";

const initialState: FeedbackActionState = null;

export function FeedbackForm({
  formToken,
  copy,
}: {
  formToken: string | null;
  copy: FeedbackCopy;
}) {
  const localizedHref = useLocalizedHref();
  const [state, formAction, isPending] = useActionState(submitFeedbackAction, initialState);
  const [messageLength, setMessageLength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state || state.ok) return;
    const invalidField = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
    (invalidField ?? errorRef.current)?.focus();
  }, [state]);

  if (!formToken) {
    return (
      <div role="status" className="rounded-[2rem] border border-[#ff9a3d]/35 bg-[#ff9a3d]/[0.045] p-6 sm:p-8">
        <h3 className="text-2xl font-black text-white">{copy.unavailableTitle}</h3>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">{copy.unavailableBody}</p>
      </div>
    );
  }

  if (state?.ok) {
    return (
      <div role="status" aria-live="polite" className="rounded-[2rem] border border-[#35d0e5]/35 bg-[#35d0e5]/[0.055] p-7 sm:p-10">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#35d0e5]">{copy.eyebrow}</p>
        <h3 className="mt-5 text-3xl font-black text-white sm:text-4xl">{copy.successTitle}</h3>
        <p className="mt-4 max-w-2xl leading-7 text-slate-300">{copy.successBody}</p>
        <a
          href={localizedHref("/#feedback")}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            window.location.assign(localizedHref("/#feedback"));
            window.location.reload();
          }}
          className="mt-7 inline-flex min-h-12 items-center rounded-full border border-[#35d0e5]/50 px-6 py-3 font-black text-white transition hover:border-[#35d0e5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]"
        >
          {copy.another}
        </a>
      </div>
    );
  }

  const fieldError = (field: FeedbackField) => state && !state.ok
    ? state.fieldErrors?.[field]
    : undefined;

  return (
    <form ref={formRef} action={formAction} noValidate className="rounded-[2rem] border border-white/15 bg-[#071824]/75 p-6 sm:p-8 lg:p-10">
      <input type="hidden" name="formToken" value={formToken} />
      <input type="hidden" name="sourceContext" value="home" />

      <div
        ref={errorRef}
        tabIndex={-1}
        aria-live="polite"
        className={state && !state.ok ? "mb-7 border-l-2 border-[#ff9a3d] bg-[#ff9a3d]/[0.045] p-5 text-slate-200 outline-none" : "sr-only"}
      >
        {state && !state.ok ? copy.errors[state.code] : ""}
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label htmlFor="private-feedback-message" className="text-lg font-black text-white">{copy.messageLabel}</label>
          <span id="private-feedback-counter" className="font-mono text-xs text-slate-500" aria-live="off">{messageLength} / {feedbackMessageMaximum}</span>
        </div>
        <p id="private-feedback-message-help" className="mt-2 text-sm leading-6 text-slate-400">{copy.messageHelp}</p>
        <textarea
          id="private-feedback-message"
          name="message"
          required
          maxLength={feedbackMessageMaximum}
          rows={9}
          onChange={(event) => setMessageLength(Array.from(event.target.value).length)}
          aria-describedby={`private-feedback-message-help private-feedback-counter${fieldError("message") ? " private-feedback-message-error" : ""}`}
          aria-invalid={fieldError("message") ? true : undefined}
          className="mt-4 min-h-56 w-full resize-y rounded-2xl border border-white/15 bg-[#04111b] px-5 py-4 leading-7 text-white outline-none transition placeholder:text-slate-600 focus-visible:border-[#35d0e5] focus-visible:ring-2 focus-visible:ring-[#35d0e5]/30"
        />
        {fieldError("message") ? <p id="private-feedback-message-error" className="mt-2 text-sm text-[#ffad63]">{fieldError("message")}</p> : null}
      </div>

      <div className="mt-7 max-w-xl">
        <label htmlFor="private-feedback-name" className="font-bold text-white">
          {copy.nameLabel} <span className="font-normal text-slate-400">({copy.optional})</span>
        </label>
        <p id="private-feedback-name-help" className="mt-2 text-sm leading-6 text-slate-400">{copy.nameHelp}</p>
        <input
          id="private-feedback-name"
          name="name"
          type="text"
          maxLength={feedbackNameMaximum}
          autoComplete="name"
          aria-describedby={`private-feedback-name-help${fieldError("name") ? " private-feedback-name-error" : ""}`}
          aria-invalid={fieldError("name") ? true : undefined}
          className="mt-3 min-h-12 w-full rounded-xl border border-white/15 bg-[#04111b] px-4 py-3 text-white outline-none transition focus-visible:border-[#35d0e5] focus-visible:ring-2 focus-visible:ring-[#35d0e5]/30"
        />
        {fieldError("name") ? <p id="private-feedback-name-error" className="mt-2 text-sm text-[#ffad63]">{fieldError("name")}</p> : null}
      </div>

      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <input id="private-feedback-website" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      </div>

      <div className="mt-8 flex flex-col gap-5 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-slate-400">
          {copy.privacy}{" "}
          <Link href={localizedHref("/privacy#feedback")} className="font-bold text-[#35d0e5] underline underline-offset-4">{copy.privacyLink}</Link>
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[#35d0e5] px-7 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5] disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none"
        >
          {isPending ? copy.submitting : copy.submit}
        </button>
      </div>
    </form>
  );
}
