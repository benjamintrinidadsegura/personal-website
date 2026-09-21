"use client";

import type { RefObject } from "react";
import { useEffect, useState } from "react";

import { useLocale } from "@/components/i18n/locale-context";
import { getShareFileDictionary } from "@/data/i18n/share-file";
import { getShareDestinationsDictionary } from "@/data/i18n/share-destinations";
import { webShareDestinations } from "@/lib/sharing/destinations";
import {
  copyShareCardFile,
  downloadShareCardFile,
  renderShareCardFile,
  shareCardFile,
  supportsNativeFileShare,
} from "@/lib/sharing/native-card-share";
import type { WritingShareFormat } from "@/types/writing";

type Feedback = "copied" | "downloaded" | "renderFailed" | "actionFailed" | null;

export function ShareFileActions({
  cardRef,
  fileName,
  format,
  renderKey,
  text,
  title,
  url,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  fileName: string;
  format: WritingShareFormat;
  renderKey: string;
  text: string;
  title: string;
  url?: string | null;
}) {
  const locale = useLocale();
  const copy = getShareFileDictionary(locale);
  const destinationsCopy = getShareDestinationsDictionary(locale);
  const [file, setFile] = useState<File | null>(null);
  const [preparing, setPreparing] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const canCopyImage = typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function";
  const canShareFile = file ? supportsNativeFileShare(navigator, file) : false;
  const webDestinations = webShareDestinations({ text, url });

  useEffect(() => {
    let cancelled = false;
    const card = cardRef.current?.querySelector<HTMLElement>(".writing-share-card");
    if (!card) {
      setPreparing(false);
      setFeedback("renderFailed");
      return;
    }
    void renderShareCardFile(card, format, fileName)
      .then((next) => { if (!cancelled) setFile(next); })
      .catch(() => { if (!cancelled) setFeedback("renderFailed"); })
      .finally(() => { if (!cancelled) setPreparing(false); });
    return () => { cancelled = true; };
  }, [cardRef, fileName, format, renderKey]);

  const share = async () => {
    if (!file) return;
    try {
      await shareCardFile(file, { title, text, url });
      setFeedback(null);
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "AbortError") return;
      setFeedback("actionFailed");
    }
  };

  const download = () => {
    if (!file) return;
    try {
      downloadShareCardFile(file);
      setFeedback("downloaded");
    } catch {
      setFeedback("actionFailed");
    }
  };

  const copyImage = async () => {
    if (!file) return;
    try {
      await copyShareCardFile(file);
      setFeedback("copied");
    } catch {
      setFeedback("actionFailed");
    }
  };

  return (
    <div className="bts-share-file-actions">
      <div role="group" aria-label={destinationsCopy.destinations} className="bts-share-destinations">
        {canShareFile ? <button type="button" onClick={() => void share()} className="writing-share-primary">{destinationsCopy.moreApps}</button> : null}
        {webDestinations ? <>
          <a data-share-destination="whatsapp" href={webDestinations.whatsapp} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="writing-share-secondary">{destinationsCopy.whatsappLink}</a>
          <a data-share-destination="linkedin" href={webDestinations.linkedin} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="writing-share-secondary">{destinationsCopy.linkedinLink}</a>
        </> : null}
      </div>
      {webDestinations ? <p className="text-xs leading-5 text-slate-500">{destinationsCopy.linkOnlyHint}</p> : null}
      <div className="writing-share-actions">
        <button type="button" onClick={download} disabled={!file || preparing} className="writing-share-secondary">{preparing ? copy.preparing : copy.downloadImage}</button>
        {canCopyImage ? <button type="button" onClick={() => void copyImage()} disabled={!file || preparing} className="writing-share-secondary">{copy.copyImage}</button> : null}
      </div>
      <p className="text-xs leading-5 text-slate-500">{canShareFile ? destinationsCopy.nativeHint : copy.fallbackHint}</p>
      {feedback ? <p role="status" className={`text-sm ${feedback === "renderFailed" || feedback === "actionFailed" ? "text-[#ffcfaa]" : "text-[#9debf4]"}`}>{feedback === "copied" ? copy.imageCopied : feedback === "downloaded" ? copy.imageDownloaded : feedback === "renderFailed" ? copy.imageFailed : copy.actionFailed}</p> : null}
    </div>
  );
}
