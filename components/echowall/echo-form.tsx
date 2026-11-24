"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";

import { issueEchoFormToken, submitEchoAction } from "@/app/echowall/actions";
import { CountryFlag } from "@/components/community/country-flag";
import { normalizeSearchText } from "@/lib/discovery";
import type { echoCountryDisplayCopy } from "@/data/i18n/echo-country-display";
import { EchoAvatar } from "./echo-avatar";
import { echoMessageLimit, echoTextLength } from "@/lib/echowall/limits";
import { useLocalizedHref } from "@/components/i18n/locale-context";
import type { livingWorldCopy } from "@/data/i18n/living-world";
import type { EchoDictionary } from "@/data/i18n/echowall";
import type { EchoActionState, EchoField } from "@/types/echowall";

const initialState: EchoActionState = null;

type EchoFormProps = {
  formToken: string | null;
  optionalLabel?: string;
  copy: EchoDictionary["form"];
  countryOptions?: { code: string; label: string }[];
  countryCopy?: (typeof livingWorldCopy)["en"];
  countryDisplayCopy?: (typeof echoCountryDisplayCopy)["en"];
  showPublicCountry?: boolean;
  showAggregateCountry?: boolean;
  submissionsDisabled?: boolean;
};

export function EchoForm({ formToken, copy, countryOptions, countryCopy, countryDisplayCopy, showPublicCountry, showAggregateCountry, submissionsDisabled, optionalLabel }: EchoFormProps) {
  const href = useLocalizedHref();
  const [currentFormToken, setCurrentFormToken] = useState(formToken);
  const [state, formAction, isPending] = useActionState<EchoActionState, FormData>(
    async (previous, data) => {
      try {
        const result = await submitEchoAction(previous, data);
        if (!result.ok && result.code === "INVALID_FORM_TOKEN") {
          // Renew only the signed form token; never resend the contribution.
          const renewed = await issueEchoFormToken();
          if (!renewed) return { ok: false, code: "SERVICE_UNAVAILABLE" };
          setCurrentFormToken(renewed);
        }
        return result;
      } catch {
        // A transport failure must keep the mounted, controlled draft intact.
        // The server may have committed: do not retry or claim success here.
        return { ok: false, code: "SERVICE_UNAVAILABLE" };
      }
    },
    initialState,
  );
  const submissionInFlight = useRef(false);
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [consent, setConsent] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [displayCountry, setDisplayCountry] = useState(false);
  const selectedCountry = countryOptions?.find(({ code }) => code === countryCode);
  const normalizedCountrySearch = normalizeSearchText(countrySearch);
  const visibleCountries = countryOptions?.filter(({ code, label }) => code === countryCode
    || normalizeSearchText(label).includes(normalizedCountrySearch) || code.toLowerCase() === normalizedCountrySearch);
  const [includeInCommunityMap, setIncludeInCommunityMap] = useState(false);
  const successRef = useRef<HTMLHeadingElement>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state) return;
    submissionInFlight.current = false;
    if (state.ok) {
      successRef.current?.focus();
      return;
    }
    const invalidField = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
    (invalidField ?? errorRef.current)?.focus();
  }, [state]);

  if (!formToken) {
    return (
      <div className="border-l-2 border-[#9bdff1] bg-[#9bdff1]/[0.045] p-6 sm:p-8" role="status">
        <h3 className="text-2xl font-black text-white">{submissionsDisabled ? countryDisplayCopy?.[2] : copy.unavailableTitle}</h3>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
          {submissionsDisabled ? countryDisplayCopy?.[3] : copy.unavailableBody}
        </p>
      </div>
    );
  }

  if (state?.ok) {
    const copyReference = async () => {
      try {
        await navigator.clipboard.writeText(state.deletionReference);
        setCopyStatus("copied");
      } catch {
        setCopyStatus("failed");
      }
    };

    return (
      <div className="border border-[#35d0e5]/35 bg-[#35d0e5]/[0.055] p-6 sm:p-10" role="status">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[#35d0e5]">{copy.receivedLabel}</p>
        <h3 ref={successRef} tabIndex={-1} className="mt-5 text-3xl font-black text-white sm:text-4xl">{copy.receivedTitle}</h3>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          {copy.receivedBody}
        </p>
        <div className="mt-8 border-y border-white/15 py-6">
          <p className="text-sm font-bold text-slate-300">{copy.deletionReference}</p>
          <p className="mt-3 break-all font-mono text-lg font-black tracking-[0.08em] text-white sm:text-xl">
            {state.deletionReference}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            {copy.deletionHelp}
          </p>
          <button
            type="button"
            onClick={copyReference}
            className="mt-5 min-h-11 rounded-full border border-[#35d0e5]/50 px-5 py-2 text-sm font-black text-white transition hover:border-[#35d0e5] hover:text-[#35d0e5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]"
          >
            {copy.copy}
          </button>
          <p className="mt-3 text-sm text-slate-400" aria-live="polite">
            {copyStatus === "copied" ? copy.copied : copyStatus === "failed" ? copy.copyFailed : ""}
          </p>
        </div>
        <a
          href={href("/echowall#leave-an-echo")}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            window.location.assign(href("/echowall#leave-an-echo"));
            window.location.reload();
          }}
          className="mt-8 inline-flex min-h-11 items-center rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5] motion-reduce:transform-none"
        >
          {copy.another}
        </a>
      </div>
    );
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    // Keep the native action for progressive enhancement and preserve the draft in the hydrated form.
    event.preventDefault();
    if (isPending || submissionInFlight.current) return;
    submissionInFlight.current = true;
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  };

  const fieldError = (field: EchoField) =>
    state && !state.ok ? state.fieldErrors?.[field] : undefined;

  return (
    <form ref={formRef} action={formAction} onSubmit={submit} noValidate className="living-echo-form space-y-3">
      <input type="hidden" name="formToken" value={currentFormToken ?? ""} />

      <div
        ref={errorRef}
        tabIndex={-1}
        aria-live="polite"
        className={state && !state.ok ? "border-l-2 border-[#9bdff1] bg-[#9bdff1]/[0.045] p-5 text-slate-200 outline-none" : "sr-only"}
      >
        {state && !state.ok ? copy.errors[state.code] : ""}
      </div>

      <div>
        <div>
          <label htmlFor="echo-display-name" className="block font-bold text-white">
            {copy.displayName} <span className="text-[#9bdff1]">({copy.required})</span>
          </label>
          <p id="display-name-help" className="mt-1 text-sm leading-5 text-slate-400">{copy.displayHelp}</p>
          <div className="mt-2 flex items-center gap-2"><EchoAvatar name={displayName} /><input
            id="echo-display-name"
            name="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            type="text"
            required
            minLength={2}
            maxLength={40}
            autoComplete="name"
            aria-describedby={`display-name-help${fieldError("displayName") ? " display-name-error" : ""}`}
            aria-invalid={fieldError("displayName") ? true : undefined}
            className="min-h-12 w-full border border-white/15 bg-[#07192b] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus-visible:border-[#35d0e5] focus-visible:ring-2 focus-visible:ring-[#35d0e5]/30"
          />
          </div>{fieldError("displayName") && <p id="display-name-error" className="mt-2 text-sm text-[#ffad63]">{fieldError("displayName")}</p>}
        </div>

      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label htmlFor="echo-message" className="font-bold text-white">{copy.message} <span className="text-[#9bdff1]">({copy.required})</span></label>
        </div>
        <p id="message-help" className="mt-1 text-sm leading-5 text-slate-400">{copy.messageHelp}</p>
        <textarea
          id="echo-message"
          name="message"
          required
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-describedby={`message-help message-counter${fieldError("message") ? " message-error" : ""}`}
          aria-invalid={fieldError("message") ? true : undefined}
          className="mt-2 w-full resize-y border border-white/15 bg-[#07192b] px-4 py-3 leading-7 text-white outline-none transition placeholder:text-slate-600 focus-visible:border-[#35d0e5] focus-visible:ring-2 focus-visible:ring-[#35d0e5]/30"
        />
        {fieldError("message") && <p id="message-error" className="mt-2 text-sm text-[#ffad63]">{fieldError("message")}</p>}
      </div>

      {visibleCountries && countryCopy && countryDisplayCopy && <fieldset className="echo-country-field grid gap-2 rounded-lg border border-[#355568] p-3">
        <legend className="px-1 font-bold">{countryCopy.country} ({copy.optional})</legend>
        <div className="grid gap-2 sm:grid-cols-2 sm:items-end">
          <div className="grid min-w-0 gap-1">
            <label htmlFor="echo-country-search" className="text-sm">{countryDisplayCopy[0]}</label>
            <input id="echo-country-search" type="search" autoComplete="off" className="community-input"
              value={countrySearch} onChange={(event) => setCountrySearch(event.target.value)} />
          </div>
          <label htmlFor="echo-country" className="sr-only">{countryCopy.country}</label>
          <div className="flex min-w-0 items-center gap-2">
            {selectedCountry && <CountryFlag code={selectedCountry.code} label={selectedCountry.label} />}
            <select id="echo-country" name="countryCode" value={countryCode} onChange={(event) => {
              setCountryCode(event.target.value);
              setDisplayCountry(false);
              setIncludeInCommunityMap(false);
            }} className="community-input w-full" aria-invalid={Boolean(fieldError("countryCode"))}
              aria-describedby={fieldError("countryCode") ? "echo-country-error" : undefined}>
              <option value="">{countryCopy.countryOmit}</option>
              {visibleCountries.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
            </select>
          </div>
        </div>
        {fieldError("countryCode") && <p id="echo-country-error" className="text-sm text-[#ffad63]">{fieldError("countryCode")}</p>}
        {showPublicCountry && <label className="flex min-h-11 items-center gap-3 text-sm text-slate-200">
          <input type="checkbox" name="displayCountry" value="true" checked={displayCountry} disabled={!countryCode}
            onChange={(event) => setDisplayCountry(event.target.checked)} className="size-5 shrink-0 accent-[#9bdff1]" />
          {countryDisplayCopy[1]}
        </label>}
        {showAggregateCountry && <label className="flex min-h-11 items-center gap-3 text-sm text-slate-200">
          <input type="checkbox" name="includeInCommunityMap" value="true" checked={includeInCommunityMap} disabled={!countryCode}
            onChange={(event) => setIncludeInCommunityMap(event.target.checked)} className="size-5 shrink-0 accent-[#9bdff1]" />
          {countryCopy.countryConsent}
        </label>}
      </fieldset>}

      <details className="rounded-lg border border-[#355568] p-3" open={fieldError("email") || fieldError("category") ? true : undefined}>
        <summary className="cursor-pointer font-bold">{optionalLabel ?? copy.category}</summary>
        <div className="mt-3 space-y-4">
      <div>
        <label htmlFor="echo-email" className="block font-bold text-white">{copy.email} <span className="font-normal text-slate-400">({copy.privateOptional})</span></label>
        <p id="email-help" className="mt-2 text-sm leading-6 text-slate-400">{copy.emailHelp}</p>
        <input
          id="echo-email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          maxLength={254}
          autoComplete="email"
          aria-describedby={`email-help${fieldError("email") ? " email-error" : ""}`}
          aria-invalid={fieldError("email") ? true : undefined}
          className="min-h-12 w-full border border-white/15 bg-[#07192b] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus-visible:border-[#35d0e5] focus-visible:ring-2 focus-visible:ring-[#35d0e5]/30"
        />
        {fieldError("email") && <p id="email-error" className="mt-2 text-sm text-[#ffad63]">{fieldError("email")}</p>}
      </div>



        <div>
          <label htmlFor="echo-category" className="block font-bold text-white">{copy.category} <span className="font-normal text-slate-400">({copy.optional})</span></label>
          <p id="category-help" className="mt-2 text-sm leading-6 text-slate-400">{copy.categoryHelp}</p>
          <select
            id="echo-category"
            name="category"
            aria-describedby={`category-help${fieldError("category") ? " category-error" : ""}`}
            aria-invalid={fieldError("category") ? true : undefined}
            className="min-h-12 w-full border border-white/15 bg-[#07192b] px-4 py-3 text-white outline-none transition focus-visible:border-[#35d0e5] focus-visible:ring-2 focus-visible:ring-[#35d0e5]/30"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">{copy.noCategory}</option>
            <option value="thought">{copy.categories.thought}</option>
            <option value="feedback">{copy.categories.feedback}</option>
            <option value="reaction">{copy.categories.reaction}</option>
            <option value="message">{copy.categories.message}</option>
          </select>
          {fieldError("category") && <p id="category-error" className="mt-2 text-sm text-[#ffad63]">{fieldError("category")}</p>}
        </div>
        </div>
      </details>

      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <input id="echo-website" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      </div>

      <div className="border-y border-white/10 py-3">
        <div className="flex items-start gap-4">
          <input
            id="echo-consent"
            name="consent"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            type="checkbox"
            value="true"
            required
            aria-describedby={`consent-help${fieldError("consent") ? " consent-error" : ""}`}
            aria-invalid={fieldError("consent") ? true : undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-[#35d0e5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]"
          />
          <label htmlFor="echo-consent" className="leading-7 text-slate-300">
            {copy.consent} <span className="font-bold text-[#9bdff1]">({copy.required})</span>
          </label>
        </div>
        <p id="consent-help" className="ml-9 mt-3 text-sm leading-6 text-slate-400">
          {copy.consentHelp}
        </p>
        {fieldError("consent") && <p id="consent-error" className="ml-9 mt-2 text-sm text-[#ffad63]">{fieldError("consent")}</p>}
      </div>

      <div className="echo-submit-row">
        <span id="message-counter" className="font-mono text-xs text-slate-300" aria-live="off">{echoTextLength(message)} / {echoMessageLimit}</span>
      <button
        type="submit"
        disabled={isPending}
        className="community-action disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? copy.submitting : copy.submit}
      </button>
      </div>
    </form>
  );
}
