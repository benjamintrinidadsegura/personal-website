"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { submitResultFeedbackAction } from "@/app/feedback/result-actions";
import { getResultFeedbackCopy } from "@/data/result-feedback-locales";
import type { Locale } from "@/lib/i18n/config";
import {
  resultFeedbackFits,
  resultFeedbackMessageMaximum,
  resultFeedbackUsefulnessCategories,
  type FeedbackActionState,
  type ResultFeedbackFit,
  type ResultFeedbackProduct,
  type ResultFeedbackUsefulnessCategory,
} from "@/types/feedback";

const initialState: FeedbackActionState = null;

export function ResultFeedback({
  formToken,
  locale,
  product,
  showSensitiveFinancialWarning = false,
  onOpened,
  onSubmitted,
}: {
  formToken: string | null;
  locale: Locale;
  product: ResultFeedbackProduct;
  showSensitiveFinancialWarning?: boolean;
  onOpened?: () => void;
  onSubmitted?: () => void;
}) {
  const copy = getResultFeedbackCopy(locale);
  const [state, formAction, isPending] = useActionState(submitResultFeedbackAction, initialState);
  const [fit, setFit] = useState<ResultFeedbackFit | null>(null);
  const [usefulness, setUsefulness] = useState<ResultFeedbackUsefulnessCategory | "">("");
  const [dismissed, setDismissed] = useState(false);
  const [opened, setOpened] = useState(false);
  const [messageLength, setMessageLength] = useState(0);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const submittedNotifiedRef = useRef(false);

  useEffect(() => {
    if (state?.ok && !submittedNotifiedRef.current) { submittedNotifiedRef.current = true; onSubmitted?.(); }
    if (state && !state.ok) errorRef.current?.focus();
  }, [onSubmitted, state]);

  if (dismissed) return null;
  if (!opened) return (
    <section className="border-t border-white/10 py-12 text-center" aria-label={copy.eyebrow}>
      <p className="font-mono text-xs font-black uppercase tracking-[.2em] text-slate-500">{copy.eyebrow}</p>
      <button type="button" onClick={() => { setOpened(true); onOpened?.(); }} className="mt-5 min-h-12 rounded-full border border-white/15 px-6 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]">{copy.open}</button>
    </section>
  );
  if (state?.ok) return (
    <section role="status" aria-live="polite" className="my-12 rounded-[1.75rem] border border-[#35d0e5]/25 bg-[#35d0e5]/[.04] p-7 sm:p-9">
      <h2 className="text-3xl font-black text-white">{copy.sentTitle}</h2>
      <p className="mt-3 max-w-2xl leading-7 text-slate-300">{copy.sentBody}</p>
      <button type="button" onClick={() => setDismissed(true)} className="mt-6 min-h-11 rounded-full border border-white/15 px-5 font-bold text-white">{copy.dismiss}</button>
    </section>
  );

  const prompt = fit === "not_really" ? copy.promptMisunderstood : fit === "partly" ? copy.promptUseful : copy.promptSurprised;
  return (
    <section className="my-12 rounded-[1.75rem] border border-white/12 bg-[#071824]/72 p-6 sm:p-9" aria-labelledby={`${product}-feedback-title`}>
      <div className="flex items-start justify-between gap-5">
        <div><p className="font-mono text-xs font-black uppercase tracking-[.2em] text-[#35d0e5]">{copy.eyebrow}</p><h2 id={`${product}-feedback-title`} className="mt-4 text-3xl font-black text-white sm:text-4xl">{copy.title}</h2></div>
        <button type="button" onClick={() => setDismissed(true)} aria-label={copy.dismiss} className="min-h-11 rounded-full px-4 text-sm font-bold text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-[#35d0e5]">{copy.dismiss}</button>
      </div>
      <p className="mt-4 max-w-3xl leading-7 text-slate-400">{copy.purpose}</p>
      {!formToken ? <p role="status" className="mt-6 border-l-2 border-[#ff9a3d] pl-4 text-slate-300">{copy.error}</p> : (
        <form action={formAction} className="mt-8 grid gap-7">
          <input type="hidden" name="resultProduct" value={product} />
          <input type="hidden" name="formToken" value={formToken} />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[10000px]" />
          <fieldset>
            <legend className="sr-only">{copy.title}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {resultFeedbackFits.map((value) => <label key={value} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-full border px-5 text-center font-bold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#35d0e5] ${fit === value ? "border-[#35d0e5] bg-[#35d0e5]/10 text-white" : "border-white/12 text-slate-300"}`}><input className="sr-only" type="radio" name="resultFit" value={value} required checked={fit === value} onChange={() => setFit(value)} />{value === "mostly" ? copy.mostly : value === "partly" ? copy.partly : copy.notReally}</label>)}
            </div>
          </fieldset>
          {fit ? <>
            <fieldset><legend className="font-bold text-white">{copy.usefulnessTitle} <span className="font-normal text-slate-500">· {copy.optional}</span></legend><input type="hidden" name="usefulnessCategory" value={usefulness} /><div className="mt-3 grid gap-2 sm:grid-cols-2">{resultFeedbackUsefulnessCategories.map((value) => <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 focus-within:outline-2 focus-within:outline-[#35d0e5]"><input type="radio" checked={usefulness === value} onChange={() => setUsefulness(value)} />{copy.usefulness[value]}</label>)}</div></fieldset>
            <div><label htmlFor={`${product}-feedback-message`} className="font-bold text-white">{prompt} <span className="font-normal text-slate-500">· {copy.optional}</span></label><textarea id={`${product}-feedback-message`} name="message" maxLength={resultFeedbackMessageMaximum} rows={5} onChange={(event) => setMessageLength(Array.from(event.currentTarget.value).length)} className="mt-3 w-full rounded-[1.25rem] border border-white/15 bg-[#04111b] p-4 text-white outline-none focus:border-[#35d0e5]" /><p className="mt-2 text-right font-mono text-xs text-slate-500">{messageLength}/{resultFeedbackMessageMaximum}</p></div>
            {showSensitiveFinancialWarning ? <p className="rounded-xl border border-[#ff9a3d]/25 bg-[#ff9a3d]/[.04] p-4 text-sm leading-6 text-[#ffcfaa]">{copy.sensitiveWarning}</p> : null}
            {state && !state.ok ? <p ref={errorRef} tabIndex={-1} role="alert" className="border-l-2 border-[#ff9a3d] pl-4 text-[#ffcfaa]">{copy.error} <span className="font-bold">{copy.retry}</span></p> : null}
            <button type="submit" disabled={isPending} className="min-h-12 justify-self-start rounded-full bg-[#35d0e5] px-7 font-black text-[#041018] disabled:opacity-50">{isPending ? copy.sending : copy.submit}</button>
          </> : null}
        </form>
      )}
    </section>
  );
}
