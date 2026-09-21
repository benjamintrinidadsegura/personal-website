"use client";

import { useEffect, useRef, useState } from "react";

import { FynsCharacterShareCard } from "@/components/find-your-next-step/character-share-card";
import { ShareComposerHeading } from "@/components/sharing/share-composer-heading";
import { ShareFileActions } from "@/components/sharing/share-file-actions";
import { canonicalBtsShareUrl } from "@/lib/sharing/destinations";
import type { FynsCharacterPresentation } from "@/data/find-your-next-step-characters";
import type { FynsCharacterShareDictionary } from "@/data/i18n/fyns-character-share";
import { writingShareFormats, type WritingShareFormat } from "@/types/writing";

type Feedback = "copied" | "copyFailed" | null;

export function FynsCharacterShareDialog({ character, copy, onClose, safeSharePath, supportingNames }: { character: FynsCharacterPresentation; copy: FynsCharacterShareDictionary; onClose: () => void; safeSharePath: string; supportingNames: readonly string[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
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

  const shareUrl = canonicalBtsShareUrl(safeSharePath);
  const shareText = `${copy.character}: ${character.name}\n${character.identityStatement}`;
  const copyResult = async () => {
    try { await navigator.clipboard.writeText([shareText, shareUrl].filter(Boolean).join("\n")); setFeedback("copied"); }
    catch { setFeedback("copyFailed"); }
  };
  const card = <FynsCharacterShareCard character={character} characterLabel={copy.character} format={format} supportingLabel={copy.supporting} supportingNames={supportingNames} />;

  return (
    <dialog ref={dialogRef} aria-labelledby="fyns-character-share-title" className={`writing-share-dialog ${screenshotMode ? "writing-share-dialog-screenshot" : ""}`} onCancel={(event) => { event.preventDefault(); if (screenshotMode) setScreenshotMode(false); else dialogRef.current?.close(); }} onClose={onClose}>
      {screenshotMode ? (
        <div className="writing-screenshot-surface" onPointerDown={() => setControlsVisible(true)}>
          <p className="sr-only">{shareText}</p>
          <button type="button" data-visible={controlsVisible} onFocus={() => setControlsVisible(true)} onClick={() => setScreenshotMode(false)} className="writing-screenshot-exit">{copy.exitScreenshot}</button>
          <div className="writing-screenshot-card">{card}</div>
        </div>
      ) : (
        <div className="writing-share-composer">
          <ShareComposerHeading closeLabel={copy.close} headingId="fyns-character-share-title" onClose={() => dialogRef.current?.close()} product="FYNS" title={copy.dialogTitle} />
          <div className="writing-share-composer-grid">
            <section className="writing-share-preview" aria-label={copy.preview}><div ref={cardRef} className="bts-share-capture-root">{card}</div><p className="sr-only">{shareText}</p></section>
            <aside className="writing-share-controls">
              <div><p className="writing-share-control-label">{copy.preview}</p><p className="mt-2 text-sm font-black text-white">{character.name}</p><p className="mt-1 text-sm leading-6 text-slate-300">{character.identityStatement}</p></div>
              <fieldset><legend className="writing-share-control-label">{copy.format}</legend><div className="writing-share-choice-grid">{writingShareFormats.map((value) => <button key={value} type="button" aria-pressed={format === value} onClick={() => { setFormat(value); setFeedback(null); }} className="writing-share-choice">{copy.formats[value]}</button>)}</div></fieldset>
              {feedback ? <p role="status" className="text-sm text-[#9debf4]">{copy[feedback]}</p> : null}
              <ShareFileActions key={`${character.id}:${format}`} cardRef={cardRef} fileName={`bts-fyns-${character.id}-${format}`} format={format} renderKey={`${character.id}:${format}`} text={shareText} title={copy.dialogTitle} url={shareUrl} />
              <div className="writing-share-actions">
                <button type="button" onClick={() => void copyResult()} className="writing-share-secondary">{feedback === "copied" ? copy.copied : copy.copy}</button>
                <button type="button" onClick={() => { setControlsVisible(true); setScreenshotMode(true); }} className="writing-share-primary">{copy.screenshotMode}</button>
              </div>
              <p className="text-xs leading-5 text-slate-500">{copy.screenshotHint}</p>
              <p className="text-xs leading-5 text-slate-500">{copy.privatePreview}</p>
            </aside>
          </div>
        </div>
      )}
    </dialog>
  );
}
