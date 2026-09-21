"use client";

import { useEffect, useRef, useState } from "react";

import { QuoteShareCard } from "@/components/quotes/quote-share-card";
import type { QuoteDictionary } from "@/data/i18n/quotes";
import { writingShareFormats, type WritingShareFormat } from "@/types/writing";
import type { SelectedQuote } from "@/types/quote";

type Feedback = "copied" | "copyFailed" | "shareFailed" | null;

export function QuoteShareDialog({ copy, onClose, quote, safeSharePath, surfaceLabel }: { copy: QuoteDictionary; onClose: () => void; quote: SelectedQuote; safeSharePath: string; surfaceLabel: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [format, setFormat] = useState<WritingShareFormat>("story");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => { dialogRef.current?.showModal(); }, []);
  useEffect(() => {
    if (!screenshotMode) return;
    const timeout = window.setTimeout(() => setControlsVisible(false), 2_200);
    const exit = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setScreenshotMode(false); }
    };
    window.addEventListener("keydown", exit, true);
    return () => { window.clearTimeout(timeout); window.removeEventListener("keydown", exit, true); };
  }, [screenshotMode]);

  const shareUrl = typeof window === "undefined" ? `https://bts.online${safeSharePath}` : new URL(safeSharePath, window.location.origin).toString();
  const shareText = `${quote.text}\n\n— ${quote.attribution}`;
  const copyQuote = async () => {
    try { await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`); setFeedback("copied"); }
    catch { setFeedback("copyFailed"); }
  };
  const nativeShare = async () => {
    if (typeof navigator.share !== "function") return;
    try { await navigator.share({ title: copy.dialogTitle, text: shareText, url: shareUrl }); setFeedback(null); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setFeedback("shareFailed"); }
  };
  const card = <QuoteShareCard format={format} quote={quote} originalLabel={copy.original} surfaceLabel={surfaceLabel} />;

  return (
    <dialog ref={dialogRef} aria-labelledby="quote-share-title" className={`writing-share-dialog ${screenshotMode ? "writing-share-dialog-screenshot" : ""}`} onCancel={(event) => { event.preventDefault(); if (screenshotMode) setScreenshotMode(false); else dialogRef.current?.close(); }} onClose={onClose}>
      {screenshotMode ? (
        <div className="writing-screenshot-surface" onPointerDown={() => setControlsVisible(true)}>
          <p className="sr-only">{quote.text}</p>
          <button type="button" data-visible={controlsVisible} onFocus={() => setControlsVisible(true)} onClick={() => setScreenshotMode(false)} className="writing-screenshot-exit">{copy.exitScreenshot}</button>
          <div className="writing-screenshot-card">{card}</div>
        </div>
      ) : (
        <div className="writing-share-composer">
          <header className="writing-share-composer-header">
            <div><p className="font-mono text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#35d0e5]">BTS.ONLINE / QUOTES</p><h2 id="quote-share-title" className="mt-2 text-2xl font-black text-white sm:text-3xl">{copy.dialogTitle}</h2></div>
            <button type="button" onClick={() => dialogRef.current?.close()} className="writing-share-close" aria-label={copy.close}>×</button>
          </header>
          <div className="writing-share-composer-grid">
            <section className="writing-share-preview" aria-label={copy.preview}>{card}<p className="sr-only">{quote.text}</p></section>
            <aside className="writing-share-controls">
              <div><p className="writing-share-control-label">{copy.preview}</p><blockquote className="mt-2 border-l-2 border-[#35d0e5] pl-4 text-sm leading-6 text-slate-300">{quote.text}</blockquote></div>
              <fieldset><legend className="writing-share-control-label">{copy.format}</legend><div className="writing-share-choice-grid">{writingShareFormats.map((value) => <button key={value} type="button" aria-pressed={format === value} onClick={() => { setFormat(value); setFeedback(null); }} className="writing-share-choice">{copy.formats[value]}</button>)}</div></fieldset>
              {feedback ? <p role="status" className="text-sm text-[#9debf4]">{copy[feedback]}</p> : null}
              <div className="writing-share-actions">
                <button type="button" onClick={() => void copyQuote()} className="writing-share-secondary">{feedback === "copied" ? copy.copied : copy.copy}</button>
                {typeof navigator !== "undefined" && typeof navigator.share === "function" ? <button type="button" onClick={() => void nativeShare()} className="writing-share-secondary">{copy.nativeShare}</button> : null}
                <button type="button" onClick={() => { setControlsVisible(true); setScreenshotMode(true); }} className="writing-share-primary">{copy.screenshotMode}</button>
              </div>
              <p className="text-xs leading-5 text-slate-500">{copy.screenshotHint}</p>
            </aside>
          </div>
        </div>
      )}
    </dialog>
  );
}
