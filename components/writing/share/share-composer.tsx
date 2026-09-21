"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ShareComposerHeading } from "@/components/sharing/share-composer-heading";
import { ShareFileActions } from "@/components/sharing/share-file-actions";
import { ShareCard } from "@/components/writing/share/share-card";
import type { WritingShareDictionary } from "@/data/i18n/writing-share";
import { segmentWritingThought } from "@/lib/writing/share-segmentation";
import {
  writingShareFormats,
  writingShareVariants,
  type WritingShareFormat,
  type WritingShareSource,
  type WritingShareVariant,
} from "@/types/writing";

type Feedback = "copied" | "clipboardFailed" | null;

function progressLabel(copy: WritingShareDictionary, current: number, total: number): string {
  return copy.cardProgress.replace("{current}", String(current)).replace("{total}", String(total));
}

export function ShareComposer({ copy, onClose, source }: { copy: WritingShareDictionary; onClose: () => void; source: WritingShareSource }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const [format, setFormat] = useState<WritingShareFormat>("story");
  const [variant, setVariant] = useState<WritingShareVariant>("editorial");
  const [cardIndex, setCardIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [clipboardFallback, setClipboardFallback] = useState("");
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [screenshotControlsVisible, setScreenshotControlsVisible] = useState(true);
  const segmentation = useMemo(() => segmentWritingThought(source.text, format, variant, source.language), [format, source.language, source.text, variant]);
  const selectionLabel = source.kind === "article" ? copy.selectedArticle : copy.selectedThought;
  const segments = segmentation.status === "ready" ? segmentation.segments : [];
  const safeCardIndex = Math.min(cardIndex, Math.max(segments.length - 1, 0));
  const selected = segments[safeCardIndex];

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    if (!screenshotMode) return;
    document.documentElement.dataset.writingScreenshotMode = "true";
    const hideControls = window.setTimeout(() => setScreenshotControlsVisible(false), 2_200);
    const exit = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setScreenshotMode(false);
      }
    };
    window.addEventListener("keydown", exit, true);
    return () => {
      window.clearTimeout(hideControls);
      delete document.documentElement.dataset.writingScreenshotMode;
      window.removeEventListener("keydown", exit, true);
    };
  }, [screenshotMode]);

  const requestClose = useCallback(() => {
    if (screenshotMode) {
      setScreenshotMode(false);
      return;
    }
    dialogRef.current?.close();
  }, [screenshotMode]);

  const copyContent = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setClipboardFallback("");
      setFeedback("copied");
    } catch {
      setClipboardFallback(value);
      setFeedback("clipboardFailed");
    }
  };

  const card = selected ? (
    <ShareCard
      cardIndex={safeCardIndex}
      cardTotal={segments.length}
      format={format}
      source={source}
      sourceLabel={copy.sourceLabel}
      text={selected.text}
      variant={variant}
    />
  ) : null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="writing-share-title"
      className={`writing-share-dialog ${screenshotMode ? "writing-share-dialog-screenshot" : ""}`}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClose={() => closeRef.current()}
    >
      {screenshotMode && card ? (
        <div className="writing-screenshot-surface" onPointerDown={() => setScreenshotControlsVisible(true)}>
          <p className="sr-only">{source.text}</p>
          <button type="button" data-visible={screenshotControlsVisible} onFocus={() => setScreenshotControlsVisible(true)} onClick={() => setScreenshotMode(false)} className="writing-screenshot-exit">{copy.exitScreenshot}</button>
          <div className="writing-screenshot-card">{card}</div>
        </div>
      ) : (
        <div className="writing-share-composer">
          <ShareComposerHeading closeLabel={copy.close} headingId="writing-share-title" onClose={requestClose} product={copy.sourceLabel} title={copy.dialogTitle} />

          <div className="writing-share-composer-grid">
            <section className="writing-share-preview" aria-label={selectionLabel}>
              {card ? <div ref={cardRef} className="bts-share-capture-root">{card}</div> : <p role="alert" className="max-w-md border-l-2 border-[#ff9a3d] pl-5 text-base leading-7 text-[#ffd2ad]">{copy.tooLong}</p>}
              <p className="sr-only">{source.text}</p>
            </section>

            <aside className="writing-share-controls">
              {!source.canonicalUrl ? <p className="rounded-xl border border-[#ff9a3d]/30 bg-[#ff9a3d]/[0.06] p-3 text-sm leading-6 text-slate-300">{copy.privatePreview}</p> : null}
              <div>
                <p className="writing-share-control-label">{selectionLabel}</p>
                <blockquote className="mt-2 max-h-28 overflow-auto border-l-2 border-[#35d0e5] pl-4 text-sm leading-6 text-slate-300">{source.text}</blockquote>
              </div>

              <fieldset>
                <legend className="writing-share-control-label">{copy.format}</legend>
                <div className="writing-share-choice-grid">
                  {writingShareFormats.map((value) => <button key={value} type="button" aria-pressed={format === value} onClick={() => { setFormat(value); setCardIndex(0); setFeedback(null); }} className="writing-share-choice">{copy.formats[value]}</button>)}
                </div>
              </fieldset>

              <fieldset>
                <legend className="writing-share-control-label">{copy.variant}</legend>
                <div className="writing-share-choice-grid writing-share-choice-grid-variants">
                  {writingShareVariants.map((value) => <button key={value} type="button" aria-pressed={variant === value} onClick={() => { setVariant(value); setCardIndex(0); setFeedback(null); }} className="writing-share-choice">{copy.variants[value]}</button>)}
                </div>
              </fieldset>

              {segments.length > 1 ? (
                <div className="flex items-center justify-between gap-3" aria-live="polite">
                  <button type="button" className="writing-share-secondary" onClick={() => setCardIndex((current) => Math.max(0, current - 1))} disabled={safeCardIndex === 0}>{copy.previous}</button>
                  <span className="font-mono text-xs text-slate-400">{progressLabel(copy, safeCardIndex + 1, segments.length)}</span>
                  <button type="button" className="writing-share-secondary" onClick={() => setCardIndex((current) => Math.min(segments.length - 1, current + 1))} disabled={safeCardIndex === segments.length - 1}>{copy.next}</button>
                </div>
              ) : null}

              {feedback ? <p role="status" className="text-sm text-[#9debf4]">{copy[feedback]}</p> : null}
              {feedback === "clipboardFailed" ? <textarea aria-label={copy.manualCopy} readOnly onFocus={(event) => event.currentTarget.select()} value={clipboardFallback} rows={3} className="w-full rounded-lg border border-white/15 bg-[#04111b] p-3 text-sm text-white" /> : null}

              {card ? <ShareFileActions key={`${format}:${variant}:${safeCardIndex}:${selected?.text ?? ""}`} cardRef={cardRef} fileName={`bts-writing-${source.articleSlug ?? "preview"}-${format}`} format={format} renderKey={`${format}:${variant}:${safeCardIndex}:${selected?.text ?? ""}`} text={selected?.text ?? source.text} title={source.articleTitle} url={source.canonicalUrl} /> : null}

              <div className="writing-share-actions">
                <button type="button" onClick={() => void copyContent([selected?.text ?? source.text, source.canonicalUrl].filter(Boolean).join("\n"))} className="writing-share-secondary">{copy.copyText}</button>
                {source.canonicalUrl ? <button type="button" onClick={() => void copyContent(source.canonicalUrl!)} className="writing-share-secondary">{copy.copyLink}</button> : null}
                {card ? <button type="button" onClick={() => { setScreenshotControlsVisible(true); setScreenshotMode(true); }} className="writing-share-primary">{copy.screenshotMode}</button> : null}
              </div>
              {card ? <p className="text-xs leading-5 text-slate-500">{copy.screenshotHint}</p> : null}
            </aside>
          </div>
        </div>
      )}
    </dialog>
  );
}
