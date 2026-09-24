"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PersonalAdvantageShareCard, type AdvantageShareSection } from "@/components/personal-advantage/personal-advantage-share-card";
import { ShareComposerHeading } from "@/components/sharing/share-composer-heading";
import { ShareFileActions } from "@/components/sharing/share-file-actions";
import type { PersonalAdvantageUiCopy } from "@/data/personal-advantage-locales";
import { emitPersonalAdvantageEvent } from "@/lib/personal-advantage-analytics";
import { canonicalBtsShareUrl } from "@/lib/sharing/destinations";
import type { PersonalAdvantageMap } from "@/types/personal-advantage";
import { writingShareFormats, type WritingShareFormat } from "@/types/writing";

const shareSections: readonly AdvantageShareSection[] = ["advantage", "stack", "hidden", "shadow", "reminder"];

export function PersonalAdvantageShareDialog({ copy, map, onClose }: { copy: PersonalAdvantageUiCopy; map: PersonalAdvantageMap; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<WritingShareFormat>("story");
  const [selected, setSelected] = useState<Set<AdvantageShareSection>>(() => new Set(["advantage"]));
  const [feedback, setFeedback] = useState<"copied" | "failed" | null>(null);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => { dialogRef.current?.showModal(); emitPersonalAdvantageEvent("advantage_share_opened"); }, []);
  useEffect(() => {
    if (!screenshotMode) return;
    const timeout = window.setTimeout(() => setControlsVisible(false), 2_200);
    const exit = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); setScreenshotMode(false); } };
    window.addEventListener("keydown", exit, true);
    return () => { window.clearTimeout(timeout); window.removeEventListener("keydown", exit, true); };
  }, [screenshotMode]);

  const safeSections = useMemo(() => new Set([...selected].filter((section) => section !== "hidden" || map.hiddenAdvantages.length > 0)), [map.hiddenAdvantages.length, selected]);
  const shareUrl = canonicalBtsShareUrl("/tools/personal-advantage");
  const shareText = useMemo(() => {
    const lines = [copy.myAdvantage, map.coreAdvantage.label, map.coreAdvantage.signalIds.map((id) => map.stack.find(({ signalId }) => signalId === id)?.label ?? id).join(" × ")];
    if (safeSections.has("stack")) lines.push(`${copy.myStack}: ${map.stack.slice(0, 5).map(({ label }) => label).join(" · ")}`);
    if (safeSections.has("hidden") && map.hiddenAdvantages[0]) lines.push(`${copy.myHiddenEdge}: ${map.hiddenAdvantages[0].label}`);
    if (safeSections.has("shadow")) lines.push(`${copy.counterweight}: ${map.counterweights[0]}`);
    if (safeSections.has("reminder")) lines.push(`${copy.remember}: ${map.reminder}`);
    return lines.filter(Boolean).join("\n");
  }, [copy, map, safeSections]);
  const renderKey = `${format}:${[...safeSections].sort().join("-")}`;
  const card = <PersonalAdvantageShareCard copy={copy} format={format} map={map} sections={safeSections} />;

  const toggle = (section: AdvantageShareSection) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(section)) next.delete(section); else next.add(section);
    if (!next.size) next.add("advantage");
    return next;
  });
  const copySummary = async () => {
    try { await navigator.clipboard.writeText([shareText, shareUrl].filter(Boolean).join("\n")); setFeedback("copied"); emitPersonalAdvantageEvent("advantage_share_completed"); }
    catch { setFeedback("failed"); }
  };

  return (
    <dialog ref={dialogRef} aria-labelledby="personal-advantage-share-title" className={`writing-share-dialog ${screenshotMode ? "writing-share-dialog-screenshot" : ""}`} onCancel={(event) => { event.preventDefault(); if (screenshotMode) setScreenshotMode(false); else dialogRef.current?.close(); }} onClose={onClose}>
      {screenshotMode ? <div className="writing-screenshot-surface" onPointerDown={() => setControlsVisible(true)}><p className="sr-only">{shareText}</p><button type="button" data-visible={controlsVisible} onFocus={() => setControlsVisible(true)} onClick={() => setScreenshotMode(false)} className="writing-screenshot-exit">{copy.exitScreenshot}</button><div className="writing-screenshot-card">{card}</div></div> : <div className="writing-share-composer">
        <ShareComposerHeading closeLabel={copy.close} headingId="personal-advantage-share-title" onClose={() => dialogRef.current?.close()} product="PERSONAL ADVANTAGE" title={copy.shareTitle} />
        <div className="writing-share-composer-grid"><section className="writing-share-preview" aria-label={copy.onePager}><div ref={cardRef} className="bts-share-capture-root">{card}</div><p className="sr-only">{shareText}</p></section><aside className="writing-share-controls">
          <div><p className="writing-share-control-label">{copy.share}</p><p className="mt-2 text-sm leading-6 text-slate-300">{copy.shareBody}</p></div>
          <fieldset><legend className="writing-share-control-label">{copy.shareTitle}</legend><div className="grid gap-2">{shareSections.map((section) => { const disabled = section === "hidden" && !map.hiddenAdvantages.length; return <label key={section} className={`flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 ${disabled ? "opacity-40" : "cursor-pointer"}`}><input type="checkbox" checked={safeSections.has(section)} disabled={disabled} onChange={() => toggle(section)} />{copy.shareChoices[section]}</label>; })}</div></fieldset>
          <fieldset><legend className="writing-share-control-label">{copy.format}</legend><div className="writing-share-choice-grid">{writingShareFormats.map((value) => <button key={value} type="button" aria-pressed={format === value} onClick={() => setFormat(value)} className="writing-share-choice">{copy.formats[value]}</button>)}</div></fieldset>
          <ShareFileActions key={renderKey} cardRef={cardRef} fileName={`bts-personal-advantage-${format}`} format={format} renderKey={renderKey} text={shareText} title={copy.share} url={shareUrl} />
          <div className="writing-share-actions"><button type="button" onClick={() => void copySummary()} className="writing-share-secondary">{feedback === "copied" ? copy.copied : copy.copyText}</button><button type="button" onClick={() => { setControlsVisible(true); setScreenshotMode(true); }} className="writing-share-primary">{copy.screenshot}</button></div>
          {feedback === "failed" ? <p role="status" className="text-sm text-[#ffcfaa]">{copy.copyFailed}</p> : null}<p className="text-xs leading-5 text-slate-500">{copy.privateShare}</p>
        </aside></div>
      </div>}
    </dialog>
  );
}
