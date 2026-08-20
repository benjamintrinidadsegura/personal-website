"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";

type Feedback = { kind: "success" | "error"; message: string } | null;

function fallbackCopy(text: string): boolean {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const field = document.createElement("textarea");
  field.value = text;
  field.readOnly = true;
  field.tabIndex = -1;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  try { field.focus(); field.select(); return document.execCommand("copy"); }
  catch { return false; }
  finally { field.remove(); previous?.focus(); }
}

export interface HumanContextResultActionsProps {
  copyText: string;
  printTitle: string;
  accent: string;
  eyebrow: string;
  title: string;
  description: string;
  copyLabel: string;
  copiedMessage: string;
  manualCopyLabel: string;
  printMarker?: string;
}

const actionCopy: Record<Locale, { copyError: string; print: string; copying: string }> = {
  de: { copyError: "Automatisches Kopieren hat nicht geklappt. Nutze bitte das Textfeld.", print: "Drucken / als PDF speichern", copying: "Wird kopiert …" },
  en: { copyError: "Automatic copying did not work. Please use the text field.", print: "Print / save as PDF", copying: "Copying …" },
  es: { copyError: "La copia automática no ha funcionado. Utiliza el campo de texto.", print: "Imprimir / guardar como PDF", copying: "Copiando…" },
  tr: { copyError: "Otomatik kopyalama çalışmadı. Lütfen metin alanını kullanın.", print: "Yazdır / PDF olarak kaydet", copying: "Kopyalanıyor…" },
  pl: { copyError: "Automatyczne kopiowanie nie zadziałało. Użyj pola tekstowego.", print: "Drukuj / zapisz jako PDF", copying: "Kopiowanie…" },
  el: { copyError: "Η αυτόματη αντιγραφή δεν λειτούργησε. Χρησιμοποίησε το πεδίο κειμένου.", print: "Εκτύπωση / αποθήκευση ως PDF", copying: "Αντιγραφή…" },
  ru: { copyError: "Автоматическое копирование не сработало. Используйте текстовое поле.", print: "Печать / сохранить как PDF", copying: "Копирование…" },
};

export function HumanContextResultActions({ copyText, printTitle, accent, eyebrow, title, description, copyLabel, copiedMessage, manualCopyLabel, printMarker = "" }: HumanContextResultActionsProps) {
  const locale = useLocale();
  const labels = actionCopy[locale];
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [manualCopy, setManualCopy] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const previousMarker = root.getAttribute("data-fyns-result-print");
    root.setAttribute("data-fyns-result-print", printMarker);
    return () => { if (previousMarker === null) root.removeAttribute("data-fyns-result-print"); else root.setAttribute("data-fyns-result-print", previousMarker); };
  }, [printMarker]);

  const handleCopy = async () => {
    setCopying(true); setFeedback(null); setManualCopy(false);
    let copied = false;
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(copyText); copied = true; } catch { copied = false; }
    }
    if (!copied) copied = fallbackCopy(copyText);
    setFeedback(copied ? { kind: "success", message: copiedMessage } : { kind: "error", message: labels.copyError });
    setManualCopy(!copied); setCopying(false);
  };

  const handlePrint = () => {
    const previousTitle = document.title;
    try { document.title = printTitle; window.print(); } finally { document.title = previousTitle; }
  };

  return (
    <section aria-labelledby="human-context-actions-title" data-fyns-result-actions className="mt-16 border-t border-white/15 pt-12">
      <p className="font-mono text-xs font-black uppercase tracking-[0.22em]" style={{ color: accent }}>{eyebrow}</p>
      <h2 id="human-context-actions-title" className="mt-4 text-3xl font-black text-white">{title}</h2>
      <p className="mt-4 max-w-3xl leading-7 text-slate-300">{description}</p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={handlePrint} className="min-h-12 rounded-full px-6 py-3 font-black text-[#07131d] focus-visible:outline-2 focus-visible:outline-offset-4" style={{ backgroundColor: accent, outlineColor: accent }}>{labels.print}</button>
        <button type="button" disabled={copying} onClick={handleCopy} className="min-h-12 rounded-full border border-white/20 px-6 py-3 font-bold text-white transition hover:border-white/45 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4" style={{ outlineColor: accent }}>{copying ? labels.copying : copyLabel}</button>
      </div>
      <p role="status" aria-live="polite" className={`mt-5 min-h-6 text-sm font-bold ${feedback?.kind === "error" ? "text-[#ffb36d]" : ""}`} style={feedback?.kind !== "error" ? { color: accent } : undefined}>{feedback?.message ?? ""}</p>
      {manualCopy ? <div className="mt-5"><label htmlFor="human-context-manual-copy" className="block text-sm font-black text-white">{manualCopyLabel}</label><textarea id="human-context-manual-copy" readOnly value={copyText} rows={9} onFocus={(event) => event.currentTarget.select()} className="mt-3 w-full rounded-2xl border border-white/15 bg-[#04111b] p-4 text-sm leading-6 text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: accent }} /></div> : null}
    </section>
  );
}
