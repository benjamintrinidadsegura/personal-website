"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { submitNewsletterAction } from "@/app/newsletter/actions";
import { newsletterConsentCopy } from "@/lib/newsletter/domain";
import type {
  NewsletterField,
  NewsletterRequestActionState,
  NewsletterRequestErrorCode,
} from "@/types/newsletter";

const initialState: NewsletterRequestActionState = null;
const errorMessages: Record<NewsletterRequestErrorCode, string> = {
  INVALID_INPUT: "Please review the subscription form.",
  INVALID_REQUEST: "The subscription request could not be accepted.",
  INVALID_FORM_TOKEN: "This form has expired. Reload the page and try again.",
  SUBMISSION_TOO_FAST: "Please take a moment before submitting.",
  RATE_LIMITED: "Too many requests were made. Please try again later.",
  SERVICE_UNAVAILABLE: "Newsletter subscription is temporarily unavailable.",
};

export function NewsletterForm({ formToken }: { formToken: string | null }) {
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
        <h2 className="text-xl font-black text-white">The newsletter is being prepared.</h2>
        <p className="mt-2 leading-7 text-slate-400">Subscriptions will open after delivery and privacy configuration is complete.</p>
      </div>
    );
  }

  if (state?.ok) {
    return (
      <div ref={feedback} tabIndex={-1} role="status" className="mt-10 border-l-2 border-[#35d0e5] bg-[#35d0e5]/[0.04] p-6 outline-none">
        <h2 className="text-2xl font-black text-white">Check your inbox.</h2>
        <p className="mt-3 leading-7 text-slate-300">If this address is eligible, a confirmation email is on its way. The subscription starts only after confirmation.</p>
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
        {state && !state.ok ? errorMessages[state.code] : ""}
      </div>
      <div>
        <label htmlFor="newsletter-email" className="block font-bold text-white">Email address <span className="text-[#ff9a3d]">(required)</span></label>
        <p id="newsletter-email-help" className="mt-2 text-sm leading-6 text-slate-400">Used only for this newsletter. It is not linked to BTS Account.</p>
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
            {newsletterConsentCopy.en} <span className="font-bold text-[#ff9a3d]">(required)</span>
          </label>
        </div>
        <p id="newsletter-consent-help" className="ml-8 mt-3 text-sm leading-6 text-slate-400">
          Double opt-in is required. Read the <Link href="/privacy#newsletter" className="font-bold text-[#35d0e5] underline underline-offset-4">newsletter privacy information</Link>.
        </p>
        {fieldError("consent") ? <p id="newsletter-consent-error" className="ml-8 mt-2 text-sm text-[#ffad63]">{fieldError("consent")}</p> : null}
      </div>
      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      </div>
      <button type="submit" disabled={pending} className="min-h-12 rounded-full bg-[#35d0e5] px-7 py-3 font-black text-[#041018] disabled:cursor-wait disabled:opacity-60">
        {pending ? "Requesting…" : "Request subscription"}
      </button>
    </form>
  );
}
