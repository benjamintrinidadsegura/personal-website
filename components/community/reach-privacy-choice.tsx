"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { setReachOptIn } from "./reach-page-view";

const copy: Record<Locale, [string, string, string, string, string, string, string]> = {
  de: ["Global Reach", "Wenn du zustimmst, zählt BTSHQ in diesem Tab Aufrufe ausgewählter öffentlicher Seiten. Vercel ermittelt dafür das Land aus der IP-Adresse. BTSHQ speichert bei dieser Messung nur Tageszähler pro Land. Widerruf stoppt weitere Messungen in diesem Tab.", "In diesem Tab erlauben", "Messung stoppen", "Messung erlaubt.", "Messung gestoppt.", "Die Auswahl konnte in diesem Browser nicht gespeichert werden."],
  en: ["Global Reach", "If you opt in, BTSHQ counts views of selected public pages in this tab. Vercel derives the country from the IP address. BTSHQ stores only daily country totals for this measurement. Turning it off stops future measurement in this tab.", "Allow in this tab", "Stop measurement", "Measurement allowed.", "Measurement stopped.", "This browser could not save your choice."],
  es: ["Global Reach", "Si aceptas, BTSHQ cuenta las visitas a páginas públicas seleccionadas en esta pestaña. Vercel obtiene el país a partir de la dirección IP. BTSHQ solo guarda recuentos diarios por país. Puedes detener futuras mediciones en esta pestaña.", "Permitir en esta pestaña", "Detener la medición", "Medición permitida.", "Medición detenida.", "El navegador no pudo guardar tu elección."],
  tr: ["Global Reach", "İzin verirsen BTSHQ bu sekmede seçili herkese açık sayfaların görüntülenmelerini sayar. Vercel IP adresinden ülkeyi belirler. BTSHQ yalnızca günlük ülke toplamlarını kaydeder. Bu sekmedeki sonraki ölçümleri durdurabilirsin.", "Bu sekmede izin ver", "Ölçümü durdur", "Ölçüme izin verildi.", "Ölçüm durduruldu.", "Tarayıcı seçimini kaydedemedi."],
  pl: ["Global Reach", "Jeśli wyrazisz zgodę, BTSHQ zliczy wyświetlenia wybranych publicznych stron w tej karcie. Vercel ustala kraj na podstawie adresu IP. BTSHQ zapisuje wyłącznie dzienne sumy według kraju. Możesz zatrzymać kolejne pomiary w tej karcie.", "Zezwól w tej karcie", "Zatrzymaj pomiar", "Pomiar dozwolony.", "Pomiar zatrzymany.", "Przeglądarka nie zapisała wyboru."],
  el: ["Global Reach", "Αν συμφωνήσεις, το BTSHQ μετρά προβολές επιλεγμένων δημόσιων σελίδων σε αυτή την καρτέλα. Η Vercel προσδιορίζει τη χώρα από τη διεύθυνση IP. Το BTSHQ κρατά μόνο ημερήσια σύνολα ανά χώρα. Μπορείς να σταματήσεις τις επόμενες μετρήσεις σε αυτή την καρτέλα.", "Να επιτρέπεται στην καρτέλα", "Διακοπή μέτρησης", "Η μέτρηση επιτρέπεται.", "Η μέτρηση σταμάτησε.", "Η επιλογή δεν αποθηκεύτηκε στον περιηγητή."],
  ru: ["Global Reach", "С вашего согласия BTSHQ считает просмотры выбранных публичных страниц в этой вкладке. Vercel определяет страну по IP-адресу. BTSHQ хранит только суточные итоги по странам. Вы можете остановить последующие измерения в этой вкладке.", "Разрешить в этой вкладке", "Остановить измерение", "Измерение разрешено.", "Измерение остановлено.", "Браузер не смог сохранить ваш выбор."],
};

export function ReachPrivacyChoice({ locale }: { locale: Locale }) {
  const [message, setMessage] = useState("");
  const [title, description, enable, stop, enabled, stopped, failed] = copy[locale];

  function choose(allowed: boolean) {
    setMessage(setReachOptIn(allowed) ? (allowed ? enabled : stopped) : failed);
  }

  return <section aria-labelledby="reach-privacy-title" className="scroll-mt-28 border-b border-white/15 py-14">
    <h2 id="reach-privacy-title" className="text-3xl font-black text-white">{title}</h2>
    <p className="mt-5 leading-7 text-slate-300">{description}</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" className="min-h-11 rounded-full border border-white/20 px-4 font-bold text-white" onClick={() => choose(true)}>{enable}</button>
      <button type="button" className="min-h-11 rounded-full border border-white/20 px-4 font-bold text-white" onClick={() => choose(false)}>{stop}</button>
    </div>
    <p role="status" className="mt-3 text-slate-200">{message}</p>
  </section>;
}
