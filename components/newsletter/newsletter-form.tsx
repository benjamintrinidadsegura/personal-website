"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { submitNewsletterAction } from "@/app/newsletter/actions";
import type { NewsletterDictionary } from "@/data/i18n/newsletter";
import type {
  NewsletterField,
  NewsletterRequestActionState,
} from "@/types/newsletter";

const initialState: NewsletterRequestActionState = null;
export function NewsletterForm({ formToken, copy, consent, privacyHref }: { formToken: string | null; copy: NewsletterDictionary["form"]; consent: string; privacyHref: string }) {
  const [state, action, pending] = useActionState(submitNewsletterAction, initialState);
  const feedback = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (!state.ok) {
      const invalid = form.current?.querySelector<HTMLElement>("[aria-invalid='true']");
      (invalid ?? feedback.current)?.focus();
      return;
    }
    form.current?.reset();
    feedback.current?.focus();
  }, [state]);

  if (!formToken) {
    return (
      <div role="status" className="mt-10 border-l-2 border-[#ff9a3d] p-6">
        <h2 className="text-xl font-black text-white">{copy.preparingTitle}</h2>
        <p className="mt-2 leading-7 text-slate-400">{copy.preparingBody}</p>
      </div>
    );
  }

  if (state?.ok) {
    return (
      <div ref={feedback} tabIndex={-1} role="status" className="mt-10 border-l-2 border-[#35d0e5] bg-[#35d0e5]/[0.04] p-6 outline-none">
        <h2 className="text-2xl font-black text-white">{copy.inboxTitle}</h2>
        <p className="mt-3 leading-7 text-slate-300">{copy.inboxBody}</p>
      </div>
    );
  }

  const fieldError = (field: NewsletterField) => state && !state.ok
    ? state.fieldErrors?.[field]
    : undefined;

  return (
    <form ref={form} action={action} noValidate className="mt-10 space-y-7">
      <input type="hidden" name="formToken" value={formToken} />
      <div
        ref={feedback}
        tabIndex={-1}
        aria-live="polite"
        className={state && !state.ok ? "border-l-2 border-[#ff9a3d] p-5 text-slate-200 outline-none" : "sr-only"}
      >
        {state && !state.ok ? copy.errors[state.code] : ""}
      </div>
      <div>
        <label htmlFor="newsletter-email" className="block font-bold text-white">{copy.email} <span className="text-[#ff9a3d]">({copy.required})</span></label>
        <p id="newsletter-email-help" className="mt-2 text-sm leading-6 text-slate-400">{copy.emailHelp}</p>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          aria-describedby={`newsletter-email-help${fieldError("email") ? " newsletter-email-error" : ""}`}
          aria-invalid={fieldError("email") ? true : undefined}
          className="mt-3 min-h-12 w-full border border-white/15 bg-[#07192b] px-4 py-3 text-white outline-none focus-visible:border-[#35d0e5]"
        />
        {fieldError("email") ? <p id="newsletter-email-error" className="mt-2 text-sm text-[#ffad63]">{fieldError("email")}</p> : null}
      </div>
      <div className="border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-start gap-3">
          <input
            id="newsletter-consent"
            name="consent"
            type="checkbox"
            required
            aria-describedby={`newsletter-consent-help${fieldError("consent") ? " newsletter-consent-error" : ""}`}
            aria-invalid={fieldError("consent") ? true : undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-[#35d0e5]"
          />
          <label htmlFor="newsletter-consent" className="leading-7 text-slate-300">
            {consent} <span className="font-bold text-[#ff9a3d]">({copy.required})</span>
          </label>
        </div>
        <p id="newsletter-consent-help" className="ml-8 mt-3 text-sm leading-6 text-slate-400">
          {copy.privacyPrefix} <Link href={privacyHref} className="font-bold text-[#35d0e5] underline underline-offset-4">{copy.privacyLink}</Link>.
        </p>
        {fieldError("consent") ? <p id="newsletter-consent-error" className="ml-8 mt-2 text-sm text-[#ffad63]">{fieldError("consent")}</p> : null}
      </div>
      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      </div>
      <button type="submit" disabled={pending} className="min-h-12 rounded-full bg-[#35d0e5] px-7 py-3 font-black text-[#041018] disabled:cursor-wait disabled:opacity-60">
        {pending ? copy.requesting : copy.request}
      </button>
    </form>
  );
}
