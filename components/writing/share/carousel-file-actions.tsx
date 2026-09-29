"use client";

import { useMemo, useRef, useState, type RefObject } from "react";

import { useLocale } from "@/components/i18n/locale-context";
import { useCanonicalSiteUrl } from "@/components/site/canonical-site-url-context";
import type { WritingShareDictionary } from "@/data/i18n/writing-share";
import { getShareDestinationsDictionary } from "@/data/i18n/share-destinations";
import { getShareFileDictionary } from "@/data/i18n/share-file";
import { webShareDestinations } from "@/lib/sharing/destinations";
import {
  classifyNativeShareFailure,
  copyShareCardFile,
  downloadShareCardFile,
  hasKnownNativeMultiFileShareFailure,
  renderShareCardFile,
  shareCardFile,
  shareCardFiles,
  supportsNativeFileShare,
} from "@/lib/sharing/native-card-share";
import type { WritingShareFormat, WritingShareSource } from "@/types/writing";

type Feedback = "copied" | "downloaded" | "savedAll" | "renderFailed" | "actionFailed" | null;
type CarouselShareCapability = "unchecked" | "checking" | "supported" | "unsupported";

export function isNativeShareCancellation(error: unknown): boolean {
  return classifyNativeShareFailure(error) === "cancelled";
}

export function writingCarouselPreparationFailureCode(error: unknown): "slide_unavailable" | "font_timeout" | "image_failure" | "layout_timeout" | "canvas_unavailable" | "encode_failure" | "unknown" {
  const message = error instanceof Error ? error.message.toLocaleLowerCase() : "";
  if (message.includes("slide is unavailable")) return "slide_unavailable";
  if (message.includes("fonts timed out")) return "font_timeout";
  if (message.includes("image")) return "image_failure";
  if (message.includes("layout timed out")) return "layout_timeout";
  if (message.includes("canvas is unavailable")) return "canvas_unavailable";
  if (message.includes("encoded") || message.includes("blob")) return "encode_failure";
  return "unknown";
}

export function writingCarouselFileName(base: string, index: number, total: number): string {
  if (total <= 1) return base;
  const width = Math.max(2, String(total).length);
  return `${base}-${String(index + 1).padStart(width, "0")}-of-${String(total).padStart(width, "0")}`;
}

function placeholderFiles(base: string, total: number): File[] {
  if (typeof File === "undefined") return [];
  return Array.from({ length: total }, (_, index) => new File(
    [new Uint8Array()],
    `${writingCarouselFileName(base, index, total)}.png`,
    { type: "image/png" },
  ));
}

export function WritingCarouselFileActions({
  copy,
  currentIndex,
  deckRef,
  fileNameBase,
  format,
  source,
  total,
}: {
  copy: WritingShareDictionary;
  currentIndex: number;
  deckRef: RefObject<HTMLDivElement | null>;
  fileNameBase: string;
  format: WritingShareFormat;
  source: WritingShareSource;
  total: number;
}) {
  const locale = useLocale();
  const canonicalSiteUrl = useCanonicalSiteUrl();
  const fileCopy = getShareFileDictionary(locale);
  const destinationsCopy = getShareDestinationsDictionary(locale);
  const cacheRef = useRef(new Map<number, File>());
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const placeholders = useMemo(() => placeholderFiles(fileNameBase, total), [fileNameBase, total]);
  const canCopyImage = typeof ClipboardItem !== "undefined" && typeof navigator !== "undefined" && typeof navigator.clipboard?.write === "function";
  const canShareCurrent = typeof navigator !== "undefined" && placeholders[currentIndex] ? supportsNativeFileShare(navigator, placeholders[currentIndex]) : false;
  const hasNativeShareApi = typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof navigator.canShare === "function";
  const [carouselShareCapability, setCarouselShareCapability] = useState<CarouselShareCapability>(total > 1 && hasNativeShareApi && !hasKnownNativeMultiFileShareFailure(navigator) ? "unchecked" : "unsupported");
  const webDestinations = webShareDestinations({ text: source.kind === "article" ? "" : source.text, url: source.canonicalUrl }, canonicalSiteUrl);

  const renderSlide = async (index: number): Promise<File> => {
    const cached = cacheRef.current.get(index);
    if (cached) return cached;
    const card = deckRef.current?.querySelector<HTMLElement>(`[data-writing-carousel-slide="${index}"] .writing-share-card`);
    if (!card) throw new Error("Writing carousel slide is unavailable.");
    const file = await renderShareCardFile(card, format, writingCarouselFileName(fileNameBase, index, total));
    cacheRef.current.set(index, file);
    return file;
  };

  const withBusy = async (action: () => Promise<void>, failure: Extract<Feedback, "renderFailed" | "actionFailed"> = "actionFailed") => {
    setBusy(true);
    setFeedback(null);
    try {
      await action();
    } catch (error) {
      if (failure === "renderFailed") console.warn("[writing-carousel] PNG preparation failed", { code: writingCarouselPreparationFailureCode(error) });
      if (!isNativeShareCancellation(error)) setFeedback(failure);
    } finally {
      setBusy(false);
    }
  };

  const renderAll = async (): Promise<File[]> => {
    const files: File[] = [];
    for (let index = 0; index < total; index += 1) files.push(await renderSlide(index));
    return files;
  };

  const shareCurrent = () => withBusy(async () => {
    const file = await renderSlide(currentIndex);
    if (source.kind === "article") await shareCardFiles([file], { url: source.canonicalUrl });
    else await shareCardFile(file, { title: source.articleTitle, text: source.text, url: source.canonicalUrl });
  });

  const shareAll = () => withBusy(async () => {
    const files = await renderAll();
    if (!supportsNativeFileShare(navigator, files)) {
      setCarouselShareCapability("unsupported");
      return;
    }
    try {
      await shareCardFiles(files, { url: source.canonicalUrl });
    } catch (error) {
      if (classifyNativeShareFailure(error) === "unsupported") {
        setCarouselShareCapability("unsupported");
        return;
      }
      throw error;
    }
  });

  const prepareCarouselShare = () => withBusy(async () => {
    setCarouselShareCapability("checking");
    try {
      const files = await renderAll();
      setCarouselShareCapability(supportsNativeFileShare(navigator, files) ? "supported" : "unsupported");
    } catch (error) {
      setCarouselShareCapability("unchecked");
      throw error;
    }
  }, "renderFailed");

  const saveCurrent = () => withBusy(async () => {
    downloadShareCardFile(await renderSlide(currentIndex));
    setFeedback("downloaded");
  }, "renderFailed");

  const saveAll = () => withBusy(async () => {
    const files = await renderAll();
    files.forEach((file, index) => window.setTimeout(() => downloadShareCardFile(file), index * 140));
    setFeedback("savedAll");
  }, "renderFailed");

  const copyCurrent = () => withBusy(async () => {
    await copyShareCardFile(await renderSlide(currentIndex));
    setFeedback("copied");
  });

  const feedbackText = feedback === "copied" ? fileCopy.imageCopied
    : feedback === "downloaded" ? fileCopy.imageDownloaded
      : feedback === "savedAll" ? copy.carouselSaved.replace("{total}", String(total))
        : feedback === "renderFailed" ? total > 1 ? copy.carouselPreparationFailed : fileCopy.imageFailed
          : feedback === "actionFailed" ? fileCopy.actionFailed
            : null;

  return (
    <div className="bts-share-file-actions">
      <div role="group" aria-label={destinationsCopy.destinations} className="bts-share-destinations">
        {total > 1
          ? carouselShareCapability === "supported"
            ? <button type="button" disabled={busy} onClick={() => void shareAll()} className="writing-share-primary">{busy ? copy.preparingCarousel : copy.shareCarousel}</button>
            : carouselShareCapability === "unsupported"
              ? <button type="button" disabled={busy} onClick={() => void saveAll()} className="writing-share-primary">{busy ? copy.preparingCarousel : copy.saveAllImages}</button>
              : <button type="button" disabled={busy || carouselShareCapability === "checking"} onClick={() => void prepareCarouselShare()} className="writing-share-primary">{busy ? copy.preparingCarousel : copy.prepareCarouselShare}</button>
          : canShareCurrent ? <button type="button" disabled={busy} onClick={() => void shareCurrent()} className="writing-share-primary">{busy ? fileCopy.preparing : destinationsCopy.moreApps}</button> : null}
        {webDestinations ? <>
          <a data-share-destination="whatsapp" href={webDestinations.whatsapp} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="writing-share-secondary">{destinationsCopy.whatsappLink}</a>
          <a data-share-destination="linkedin" href={webDestinations.linkedin} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="writing-share-secondary">{destinationsCopy.linkedinLink}</a>
        </> : null}
      </div>
      {webDestinations ? <p className="text-xs leading-5 text-slate-500">{destinationsCopy.linkOnlyHint}</p> : null}
      <div className="writing-share-actions">
        <button type="button" disabled={busy} onClick={() => void saveCurrent()} className="writing-share-secondary">{busy ? fileCopy.preparing : fileCopy.downloadImage}</button>
        {total > 1 && carouselShareCapability !== "unsupported" ? <button type="button" disabled={busy} onClick={() => void saveAll()} className="writing-share-secondary">{busy ? copy.preparingCarousel : copy.saveAllImages}</button> : null}
        {canCopyImage ? <button type="button" disabled={busy} onClick={() => void copyCurrent()} className="writing-share-secondary">{fileCopy.copyImage}</button> : null}
      </div>
      <p className="text-xs leading-5 text-slate-500">{total > 1 && carouselShareCapability === "unsupported" ? copy.carouselShareUnavailable : canShareCurrent || carouselShareCapability === "supported" ? destinationsCopy.nativeHint : fileCopy.fallbackHint}</p>
      {feedbackText ? <p role="status" aria-live="polite" className={`text-sm ${feedback === "renderFailed" || feedback === "actionFailed" ? "text-[#ffcfaa]" : "text-[#9debf4]"}`}>{feedbackText}</p> : null}
    </div>
  );
}
