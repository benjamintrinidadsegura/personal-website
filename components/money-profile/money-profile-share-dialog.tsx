"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MoneyProfileShareCard, type MoneyShareSection } from "@/components/money-profile/money-profile-share-card";
import { ShareComposerHeading } from "@/components/sharing/share-composer-heading";
import { ShareFileActions } from "@/components/sharing/share-file-actions";
import type { MoneyProfileUiCopy } from "@/data/money-profile-locales";
import { emitMoneyProfileEvent } from "@/lib/money-profile-analytics";
import { canonicalBtsShareUrl } from "@/lib/sharing/destinations";
import type { MoneyProfileResult } from "@/types/money-profile";
import { writingShareFormats, type WritingShareFormat } from "@/types/writing";

const shareSections: readonly MoneyShareSection[] = ["profile", "meaning", "strength", "reminder"];

export function MoneyProfileShareDialog({ copy, result, onClose }: { copy: MoneyProfileUiCopy; result: MoneyProfileResult; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<WritingShareFormat>("story");
  const [selected, setSelected] = useState<Set<MoneyShareSection>>(() => new Set(["profile"]));
  const [feedback, setFeedback] = useState<"copied" | "failed" | null>(null);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => { dialogRef.current?.showModal(); emitMoneyProfileEvent("money_profile_share_opened"); }, []);
  useEffect(() => {
    if (!screenshotMode) return;
    const timeout = window.setTimeout(() => setControlsVisible(false), 2_200);
    const exit = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); setScreenshotMode(false); } };
    window.addEventListener("keydown", exit, true);
    return () => { window.clearTimeout(timeout); window.removeEventListener("keydown", exit, true); };
  }, [screenshotMode]);

  const shareUrl = canonicalBtsShareUrl("/tools/money-profile");
  const label = result.secondaryProfile && result.primaryProfile ? `${result.primaryProfile.label} × ${result.secondaryProfile.label}` : result.primaryProfile?.label ?? result.baseline.headline;
  const shareText = useMemo(() => {
    const lines = [copy.onePager, label];
    if (selected.has("meaning")) lines.push(`${copy.meaning}: ${result.meanings.map(({ label: item }) => item).join(" · ")}`);
    if (selected.has("strength")) lines.push(`${copy.atMyBest}: ${result.playbook.atMyBest}`);
    if (selected.has("reminder")) lines.push(`${copy.myNextMove}: ${result.playbook.myNextMove}`);
    return lines.join("\n");
  }, [copy, label, result, selected]);
  const renderKey = `${format}:${[...selected].sort().join("-")}`;
  const card = <MoneyProfileShareCard copy={copy} format={format} result={result} sections={selected} />;
  const toggle = (section: MoneyShareSection) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(section)) next.delete(section); else next.add(section);
    if (!next.size) next.add("profile");
    return next;
  });
  const copySummary = async () => {
    try { await navigator.clipboard.writeText([shareText, shareUrl].filter(Boolean).join("\n")); setFeedback("copied"); emitMoneyProfileEvent("money_profile_share_completed"); }
    catch { setFeedback("failed"); }
  };

  return (
    <dialog ref={dialogRef} aria-labelledby="money-profile-share-title" className={`writing-share-dialog ${screenshotMode ? "writing-share-dialog-screenshot" : ""}`} onCancel={(event) => { event.preventDefault(); if (screenshotMode) setScreenshotMode(false); else dialogRef.current?.close(); }} onClose={onClose}>
      {screenshotMode ? <div className="writing-screenshot-surface" onPointerDown={() => setControlsVisible(true)}><p className="sr-only">{shareText}</p><button type="button" data-visible={controlsVisible} onFocus={() => setControlsVisible(true)} onClick={() => setScreenshotMode(false)} className="writing-screenshot-exit">{copy.exitScreenshot}</button><div className="writing-screenshot-card">{card}</div></div> : <div className="writing-share-composer">
        <ShareComposerHeading closeLabel={copy.close} headingId="money-profile-share-title" onClose={() => dialogRef.current?.close()} product="MONEY PROFILE" title={copy.shareTitle} />
        <div className="writing-share-composer-grid"><section className="writing-share-preview" aria-label={copy.onePager}><div ref={cardRef} className="bts-share-capture-root">{card}</div><p className="sr-only">{shareText}</p></section><aside className="writing-share-controls">
          <div><p className="writing-share-control-label">{copy.share}</p><p className="mt-2 text-sm leading-6 text-slate-300">{copy.shareBody}</p></div>
          <fieldset><legend className="writing-share-control-label">{copy.shareTitle}</legend><div className="grid gap-2">{shareSections.map((section) => <label key={section} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200"><input type="checkbox" checked={selected.has(section)} onChange={() => toggle(section)} />{copy.shareChoices[section]}</label>)}</div></fieldset>
          <fieldset><legend className="writing-share-control-label">{copy.format}</legend><div className="writing-share-choice-grid">{writingShareFormats.map((value) => <button key={value} type="button" aria-pressed={format === value} onClick={() => setFormat(value)} className="writing-share-choice">{copy.formats[value]}</button>)}</div></fieldset>
          <ShareFileActions key={renderKey} cardRef={cardRef} fileName={`bts-money-profile-${format}`} format={format} renderKey={renderKey} text={shareText} title={copy.share} url={shareUrl} />
          <div className="writing-share-actions"><button type="button" onClick={() => void copySummary()} className="writing-share-secondary">{feedback === "copied" ? copy.copied : copy.copyText}</button><button type="button" onClick={() => { setControlsVisible(true); setScreenshotMode(true); }} className="writing-share-primary">{copy.screenshot}</button></div>
          {feedback === "failed" ? <p role="status" className="text-sm text-[#ffcfaa]">{copy.copyFailed}</p> : null}<p className="text-xs leading-5 text-slate-500">{copy.privateShare}</p>
        </aside></div>
      </div>}
    </dialog>
  );
}
