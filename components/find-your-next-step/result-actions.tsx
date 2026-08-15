"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

interface FynsResultActionsProps {
  accent: string;
  copyText: string;
  shareTitle: string;
  shareText: string;
  printTitle: string;
}

type Feedback = {
  kind: "success" | "error";
  message: string;
} | null;

function canUseNativeShare(payload: ShareData): boolean {
  if (typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return true;
  try {
    return navigator.canShare(payload);
  } catch {
    return false;
  }
}

function copyWithTemporaryField(text: string): boolean {
  const activeElement = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  const field = document.createElement("textarea");
  field.value = text;
  field.readOnly = true;
  field.tabIndex = -1;
  field.setAttribute("aria-hidden", "true");
  field.style.position = "fixed";
  field.style.inset = "0 auto auto 0";
  field.style.opacity = "0";
  document.body.appendChild(field);

  try {
    field.focus();
    field.select();
    field.setSelectionRange(0, field.value.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
    activeElement?.focus();
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function FynsResultActions({
  accent,
  copyText,
  shareTitle,
  shareText,
  printTitle,
}: FynsResultActionsProps) {
  const [shareAvailable, setShareAvailable] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showManualCopy, setShowManualCopy] = useState(false);
  const [busyAction, setBusyAction] = useState<"copy" | "share" | null>(null);
  const sharePayload: ShareData = { title: shareTitle, text: shareText };

  useEffect(() => {
    const detectionFrame = window.requestAnimationFrame(() => {
      setShareAvailable(canUseNativeShare({ title: shareTitle, text: shareText }));
    });

    const root = document.documentElement;
    const previousMarker = root.getAttribute("data-fyns-result-print");
    root.setAttribute("data-fyns-result-print", "");
    return () => {
      window.cancelAnimationFrame(detectionFrame);
      if (previousMarker === null) root.removeAttribute("data-fyns-result-print");
      else root.setAttribute("data-fyns-result-print", previousMarker);
    };
  }, [shareText, shareTitle]);

  const handlePrint = () => {
    const originalTitle = document.title;
    try {
      document.title = printTitle;
      window.print();
    } finally {
      document.title = originalTitle;
    }
  };

  const handleCopy = async () => {
    setBusyAction("copy");
    setFeedback(null);
    setShowManualCopy(false);

    let copied = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard?.writeText(copyText);
        copied = true;
      } catch {
        copied = false;
      }
    }
    if (!copied) copied = copyWithTemporaryField(copyText);

    if (copied) {
      setFeedback({ kind: "success", message: "Zusammenfassung kopiert." });
    } else {
      setShowManualCopy(true);
      setFeedback({
        kind: "error",
        message: "Automatisches Kopieren hat nicht geklappt. Du kannst den Text hier manuell kopieren.",
      });
    }
    setBusyAction(null);
  };

  const handleShare = async () => {
    if (!canUseNativeShare(sharePayload)) return;
    setBusyAction("share");
    setFeedback(null);
    try {
      await navigator.share(sharePayload);
      setFeedback({ kind: "success", message: "Teilen geöffnet." });
    } catch (error) {
      if (!isAbortError(error)) {
        setFeedback({ kind: "error", message: "Teilen hat nicht geklappt. Bitte versuche es erneut." });
      }
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <section
      aria-labelledby="fyns-result-actions-title"
      data-fyns-result-actions
      style={{ "--result-actions-accent": accent } as CSSProperties}
      className="mt-20 border-t border-white/15 pt-14"
    >
      <div className="rounded-[1.75rem] border border-[var(--result-actions-accent)]/30 bg-[var(--result-actions-accent)]/[0.045] p-6 sm:p-8">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[var(--result-actions-accent)]">
          Für später
        </p>
        <h3 id="fyns-result-actions-title" className="mt-4 text-2xl font-black text-white sm:text-4xl">
          Kurzfassung mitnehmen
        </h3>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">
          Dein Ergebnis wird nicht gespeichert. Diese Kurzfassung enthält die zentralen Aussagen, aber nicht jede
          zusätzliche Ansicht oder Alltagshypothese. Du kannst sie jetzt drucken, kopieren oder – wenn verfügbar –
          über dein Gerät teilen.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--result-actions-accent)] px-6 py-3 text-center font-black text-[#041018] transition motion-safe:hover:-translate-y-0.5 hover:brightness-110 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--result-actions-accent)] sm:w-auto"
          >
            Drucken / als PDF speichern
          </button>
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={handleCopy}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/20 px-6 py-3 text-center font-bold text-slate-200 transition hover:border-[var(--result-actions-accent)]/65 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--result-actions-accent)] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            {busyAction === "copy" ? "Wird kopiert …" : "Kurzfassung kopieren"}
          </button>
          {shareAvailable ? (
            <button
              type="button"
              disabled={busyAction !== null}
              onClick={handleShare}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/20 px-6 py-3 text-center font-bold text-slate-200 transition hover:border-[var(--result-actions-accent)]/65 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--result-actions-accent)] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              {busyAction === "share" ? "Teilen …" : "Teilen"}
            </button>
          ) : null}
        </div>

        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`mt-5 min-h-6 text-sm font-bold ${feedback?.kind === "error" ? "text-[#ffb36d]" : "text-[var(--result-actions-accent)]"}`}
        >
          {feedback?.message ?? ""}
        </p>

        {showManualCopy ? (
          <div className="mt-5">
            <label htmlFor="fyns-manual-copy" className="block text-sm font-black text-white">
              Text zum manuellen Kopieren
            </label>
            <textarea
              id="fyns-manual-copy"
              readOnly
              value={copyText}
              rows={10}
              onFocus={(event) => event.currentTarget.select()}
              className="mt-3 w-full rounded-2xl border border-white/15 bg-[#04111b] p-4 text-sm leading-6 text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--result-actions-accent)]"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
