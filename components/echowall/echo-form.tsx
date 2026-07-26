"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { submitEchoAction } from "@/app/echowall/actions";
import type { EchoActionState, EchoField, SubmitEchoErrorCode } from "@/types/echowall";

const initialState: EchoActionState = null;

const errorMessages: Record<SubmitEchoErrorCode, string> = {
  INVALID_INPUT: "Bitte überprüfe deine Eingaben.",
  INVALID_REQUEST: "Die Anfrage konnte nicht verarbeitet werden.",
  INVALID_FORM_TOKEN: "Das Formular ist abgelaufen. Bitte lade die Seite neu.",
  SUBMISSION_TOO_FAST: "Das Formular wurde zu schnell abgeschickt. Bitte warte einen Moment.",
  RATE_LIMITED: "Zu viele Einreichungen. Bitte versuche es später erneut.",
  DUPLICATE: "Diese Nachricht wurde kürzlich bereits übermittelt.",
  SERVICE_UNAVAILABLE: "EchoWall ist derzeit nicht verfügbar. Bitte versuche es später erneut.",
};

type EchoFormProps = {
  formToken: string | null;
};

export function EchoForm({ formToken }: EchoFormProps) {
  const [state, formAction, isPending] = useActionState(submitEchoAction, initialState);
  const [messageLength, setMessageLength] = useState(0);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state || state.ok) return;
    const invalidField = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
    (invalidField ?? errorRef.current)?.focus();
  }, [state]);

  if (!formToken) {
    return (
      <div className="border-l-2 border-[#ff9a3d] bg-[#ff9a3d]/[0.045] p-6 sm:p-8" role="status">
        <h3 className="text-2xl font-black text-white">Submissions are temporarily unavailable.</h3>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
          Das Formular konnte nicht sicher vorbereitet werden. Bitte versuche es später erneut.
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
        <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[#35d0e5]">Submission received</p>
        <h3 className="mt-5 text-3xl font-black text-white sm:text-4xl">Your echo reached the wall.</h3>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          Deine Nachricht wurde gespeichert und wartet auf Moderation. Sie erscheint erst nach einer Freigabe öffentlich.
        </p>
        <div className="mt-8 border-y border-white/15 py-6">
          <p className="text-sm font-bold text-slate-300">Deine einmalige Löschreferenz</p>
          <p className="mt-3 break-all font-mono text-lg font-black tracking-[0.08em] text-white sm:text-xl">
            {state.deletionReference}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            Bitte sicher speichern und nicht öffentlich teilen. Diese Referenz wird später für eine Löschanfrage benötigt und kann nicht erneut angezeigt werden.
          </p>
          <button
            type="button"
            onClick={copyReference}
            className="mt-5 min-h-11 rounded-full border border-[#35d0e5]/50 px-5 py-2 text-sm font-black text-white transition hover:border-[#35d0e5] hover:text-[#35d0e5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]"
          >
            Copy reference
          </button>
          <p className="mt-3 text-sm text-slate-400" aria-live="polite">
            {copyStatus === "copied" ? "Referenz kopiert." : copyStatus === "failed" ? "Kopieren nicht möglich. Bitte markiere die Referenz manuell." : ""}
          </p>
        </div>
        <a
          href="/echowall#leave-an-echo"
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            window.location.assign("/echowall#leave-an-echo");
            window.location.reload();
          }}
          className="mt-8 inline-flex min-h-11 items-center rounded-full bg-[#35d0e5] px-6 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5] motion-reduce:transform-none"
        >
          Leave another echo
        </a>
      </div>
    );
  }

  const fieldError = (field: EchoField) =>
    state && !state.ok ? state.fieldErrors?.[field] : undefined;

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-8">
      <input type="hidden" name="formToken" value={formToken} />

      <div
        ref={errorRef}
        tabIndex={-1}
        aria-live="polite"
        className={state && !state.ok ? "border-l-2 border-[#ff9a3d] bg-[#ff9a3d]/[0.045] p-5 text-slate-200 outline-none" : "sr-only"}
      >
        {state && !state.ok ? errorMessages[state.code] : ""}
      </div>

      <div className="grid gap-7 sm:grid-cols-2">
        <div>
          <label htmlFor="echo-display-name" className="block font-bold text-white">
            Anzeigename <span className="text-[#ff9a3d]">(erforderlich)</span>
          </label>
          <p id="display-name-help" className="mt-2 text-sm leading-6 text-slate-400">Dein Name oder ein frei gewähltes Pseudonym, 2–40 Zeichen.</p>
          <input
            id="echo-display-name"
            name="displayName"
            type="text"
            required
            minLength={2}
            maxLength={40}
            autoComplete="name"
            aria-describedby={`display-name-help${fieldError("displayName") ? " display-name-error" : ""}`}
            aria-invalid={fieldError("displayName") ? true : undefined}
            className="mt-3 min-h-12 w-full border border-white/15 bg-[#07192b] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus-visible:border-[#35d0e5] focus-visible:ring-2 focus-visible:ring-[#35d0e5]/30"
          />
          {fieldError("displayName") && <p id="display-name-error" className="mt-2 text-sm text-[#ffad63]">{fieldError("displayName")}</p>}
        </div>

        <div>
          <label htmlFor="echo-category" className="block font-bold text-white">Kategorie <span className="font-normal text-slate-400">(optional)</span></label>
          <p id="category-help" className="mt-2 text-sm leading-6 text-slate-400">Hilft dabei, dein Echo später einzuordnen.</p>
          <select
            id="echo-category"
            name="category"
            aria-describedby={`category-help${fieldError("category") ? " category-error" : ""}`}
            aria-invalid={fieldError("category") ? true : undefined}
            className="mt-3 min-h-12 w-full border border-white/15 bg-[#07192b] px-4 py-3 text-white outline-none transition focus-visible:border-[#35d0e5] focus-visible:ring-2 focus-visible:ring-[#35d0e5]/30"
            defaultValue=""
          >
            <option value="">Keine Kategorie</option>
            <option value="thought">Gedanke</option>
            <option value="feedback">Feedback</option>
            <option value="reaction">Reaktion</option>
            <option value="message">Nachricht</option>
          </select>
          {fieldError("category") && <p id="category-error" className="mt-2 text-sm text-[#ffad63]">{fieldError("category")}</p>}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label htmlFor="echo-message" className="font-bold text-white">Nachricht <span className="text-[#ff9a3d]">(erforderlich)</span></label>
          <span id="message-counter" className="font-mono text-xs text-slate-500" aria-live="off">{messageLength} / 500</span>
        </div>
        <p id="message-help" className="mt-2 text-sm leading-6 text-slate-400">10–500 Zeichen, nur Plain Text. Links sind nicht erlaubt.</p>
        <textarea
          id="echo-message"
          name="message"
          required
          minLength={10}
          maxLength={500}
          rows={7}
          onChange={(event) => setMessageLength(Array.from(event.target.value).length)}
          aria-describedby={`message-help message-counter${fieldError("message") ? " message-error" : ""}`}
          aria-invalid={fieldError("message") ? true : undefined}
          className="mt-3 w-full resize-y border border-white/15 bg-[#07192b] px-4 py-3 leading-7 text-white outline-none transition placeholder:text-slate-600 focus-visible:border-[#35d0e5] focus-visible:ring-2 focus-visible:ring-[#35d0e5]/30"
        />
        {fieldError("message") && <p id="message-error" className="mt-2 text-sm text-[#ffad63]">{fieldError("message")}</p>}
      </div>

      <div>
        <label htmlFor="echo-email" className="block font-bold text-white">E-Mail-Adresse <span className="font-normal text-slate-400">(optional und privat)</span></label>
        <p id="email-help" className="mt-2 text-sm leading-6 text-slate-400">Wird nicht öffentlich angezeigt und nur getrennt vom Echo gespeichert.</p>
        <input
          id="echo-email"
          name="email"
          type="email"
          maxLength={254}
          autoComplete="email"
          aria-describedby={`email-help${fieldError("email") ? " email-error" : ""}`}
          aria-invalid={fieldError("email") ? true : undefined}
          className="mt-3 min-h-12 w-full border border-white/15 bg-[#07192b] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus-visible:border-[#35d0e5] focus-visible:ring-2 focus-visible:ring-[#35d0e5]/30"
        />
        {fieldError("email") && <p id="email-error" className="mt-2 text-sm text-[#ffad63]">{fieldError("email")}</p>}
      </div>

      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <input id="echo-website" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      </div>

      <div className="border-y border-white/10 py-6">
        <div className="flex items-start gap-4">
          <input
            id="echo-consent"
            name="consent"
            type="checkbox"
            value="true"
            required
            aria-describedby={`consent-help${fieldError("consent") ? " consent-error" : ""}`}
            aria-invalid={fieldError("consent") ? true : undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-[#35d0e5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5]"
          />
          <label htmlFor="echo-consent" className="leading-7 text-slate-300">
            Ich stimme zu, dass mein Echo zur Prüfung gespeichert und nach einer Freigabe mit meinem angegebenen Anzeigenamen öffentlich auf bts.online veröffentlicht werden darf. Eine optionale E-Mail-Adresse bleibt privat. <span className="font-bold text-[#ff9a3d]">(erforderlich)</span>
          </label>
        </div>
        <p id="consent-help" className="ml-9 mt-3 text-sm leading-6 text-slate-400">
          Eine spätere Löschung kann über die einmalige Löschreferenz oder eine verifizierte E-Mail-Adresse angefragt werden.
        </p>
        {fieldError("consent") && <p id="consent-error" className="ml-9 mt-2 text-sm text-[#ffad63]">{fieldError("consent")}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-12 items-center rounded-full bg-[#35d0e5] px-7 py-3 font-black text-[#041018] transition hover:-translate-y-0.5 hover:bg-[#73e3f1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#35d0e5] disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none"
      >
        {isPending ? "Submitting…" : "Submit echo"}
      </button>
    </form>
  );
}
