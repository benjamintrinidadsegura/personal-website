"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { setReachOptIn } from "./reach-page-view";

const copy: Record<Locale, [string, string, string, string, string, string, string]> = {
  de: ["Global Reach", "Wenn du zustimmst, zählt BTSHQ in diesem Tab Aufrufe ausgewählter öffentlicher Seiten. Vercel ermittelt dafür das Land aus der IP-Adresse. BTSHQ speichert Tageszähler pro Land sowie kurzlebige Kennungen gegen Doppelzählung. Widerruf stoppt weitere Messungen in diesem Tab.", "In diesem Tab erlauben", "Messung stoppen", "Messung erlaubt.", "Messung gestoppt.", "Die Auswahl konnte in diesem Browser nicht gespeichert werden."],
  en: ["Global Reach", "If you opt in, BTSHQ counts views of selected public pages in this tab. Vercel derives the country from the IP address. BTSHQ stores daily country totals and short-lived per-view identifiers to prevent duplicate counting. Turning it off stops future measurement in this tab.", "Allow in this tab", "Stop measurement", "Measurement allowed.", "Measurement stopped.", "This browser could not save your choice."],
  es: ["Global Reach", "Si aceptas, BTSHQ cuenta las visitas a páginas públicas seleccionadas en esta pestaña. Vercel obtiene el país a partir de la dirección IP. BTSHQ guarda recuentos diarios por país e identificadores breves por vista para evitar duplicados. Puedes detener futuras mediciones en esta pestaña.", "Permitir en esta pestaña", "Detener la medición", "Medición permitida.", "Medición detenida.", "El navegador no pudo guardar tu elección."],
  tr: ["Global Reach", "İzin verirsen BTSHQ bu sekmede seçili herkese açık sayfaların görüntülenmelerini sayar. Vercel IP adresinden ülkeyi belirler. BTSHQ günlük ülke toplamlarını ve tekrar sayımı önleyen kısa süreli görüntüleme tanımlayıcılarını kaydeder. Bu sekmedeki sonraki ölçümleri durdurabilirsin.", "Bu sekmede izin ver", "Ölçümü durdur", "Ölçüme izin verildi.", "Ölçüm durduruldu.", "Tarayıcı seçimini kaydedemedi."],
  pl: ["Global Reach", "Jeśli wyrazisz zgodę, BTSHQ zliczy wyświetlenia wybranych publicznych stron w tej karcie. Vercel ustala kraj na podstawie adresu IP. BTSHQ zapisuje dzienne sumy według kraju i krótkotrwałe identyfikatory odsłon zapobiegające duplikatom. Możesz zatrzymać kolejne pomiary w tej karcie.", "Zezwól w tej karcie", "Zatrzymaj pomiar", "Pomiar dozwolony.", "Pomiar zatrzymany.", "Przeglądarka nie zapisała wyboru."],
  el: ["Global Reach", "Αν συμφωνήσεις, το BTSHQ μετρά προβολές επιλεγμένων δημόσιων σελίδων σε αυτή την καρτέλα. Η Vercel προσδιορίζει τη χώρα από τη διεύθυνση IP. Το BTSHQ κρατά ημερήσια σύνολα ανά χώρα και βραχύβια αναγνωριστικά προβολής για αποφυγή διπλοτύπων. Μπορείς να σταματήσεις τις επόμενες μετρήσεις σε αυτή την καρτέλα.", "Να επιτρέπεται στην καρτέλα", "Διακοπή μέτρησης", "Η μέτρηση επιτρέπεται.", "Η μέτρηση σταμάτησε.", "Η επιλογή δεν αποθηκεύτηκε στον περιηγητή."],
  ru: ["Global Reach", "С вашего согласия BTSHQ считает просмотры выбранных публичных страниц в этой вкладке. Vercel определяет страну по IP-адресу. BTSHQ хранит суточные итоги по странам и краткосрочные идентификаторы просмотров для защиты от повторов. Вы можете остановить последующие измерения в этой вкладке.", "Разрешить в этой вкладке", "Остановить измерение", "Измерение разрешено.", "Измерение остановлено.", "Браузер не смог сохранить ваш выбор."],
};

export const reachRetentionCopy: Record<Locale, string> = {
  "de": "Gezählt werden Seitenaufrufe, keine eindeutigen Besucher. Eine zufällige Kennung je Aufruf verhindert Wiederholungszählungen und läuft nach 24 Stunden ab; ein täglicher Job entfernt sie normalerweise binnen weiterer 25 Stunden. Veröffentlichbare Tages-/Länderzähler bleiben ohne feste Ablaufzeit für die Gesamtstatistik gespeichert; kleinere abgeschlossene Zellen werden täglich entfernt. Nur abgeschlossene UTC-Tage und Zellen ab fünf Aufrufen werden veröffentlicht; das sind nicht notwendigerweise fünf Personen. Ausfälle können die Löschung verzögern. Die Tab-Zustimmung liegt im Session-Speicher; GPC und Do Not Track haben Vorrang.",
  "en": "We count page views, not unique visitors. A random identifier per view prevents replay and expires after 24 hours; a daily job normally deletes it within another 25 hours. Publishable daily country totals have no fixed expiry for lifetime statistics; smaller closed cells are deleted daily. Only closed UTC days and cells with at least five views are published; these are not necessarily five people. Outages may delay deletion. Tab consent is stored in session storage; GPC and Do Not Track take priority.",
  "es": "Contamos vistas de página, no visitantes únicos. Un identificador aleatorio por vista evita duplicados y caduca tras 24 horas; una tarea diaria lo elimina normalmente en otras 25 horas. Los totales diarios publicables no caducan para las estadísticas acumuladas; las celdas cerradas menores se borran a diario. Solo se publican días UTC cerrados y celdas de al menos cinco vistas, no necesariamente cinco personas. Las incidencias pueden retrasar el borrado. El consentimiento se guarda en sessionStorage; GPC y Do Not Track tienen prioridad.",
  "pl": "Liczymy odsłony, nie unikalnych odwiedzających. Losowy identyfikator odsłony zapobiega powtórzeniom i wygasa po 24 godzinach; zadanie dzienne zwykle usuwa go w kolejnych 25 godzinach. Publikowalne sumy dzienne nie wygasają dla statystyk łącznych; mniejsze zakończone komórki są usuwane codziennie. Publikujemy tylko zakończone dni UTC i komórki od pięciu odsłon, niekoniecznie pięciu osób. Awarie mogą opóźnić usuwanie. Zgoda karty jest w sessionStorage; GPC i Do Not Track mają pierwszeństwo.",
  "ru": "Считаются просмотры, не уникальные посетители. Случайный идентификатор просмотра защищает от повторов и истекает через 24 часа; ежедневное задание обычно удаляет его за следующие 25 часов. Публикуемые суточные итоги сохраняются без фиксированного срока для общей статистики; меньшие закрытые ячейки удаляются ежедневно. Публикуются только закрытые дни UTC и ячейки от пяти просмотров, не обязательно пяти человек. Сбои могут задержать удаление. Согласие вкладки хранится в sessionStorage; GPC и Do Not Track имеют приоритет.",
  "el": "Μετράμε προβολές, όχι μοναδικούς επισκέπτες. Τυχαίο αναγνωριστικό ανά προβολή εμποδίζει επαναλήψεις και λήγει σε 24 ώρες· ημερήσια εργασία το διαγράφει κανονικά μέσα σε άλλες 25 ώρες. Τα δημοσιεύσιμα ημερήσια σύνολα δεν έχουν σταθερή λήξη για τη συνολική στατιστική· μικρότερα κλειστά κελιά διαγράφονται καθημερινά. Δημοσιεύονται μόνο κλειστές ημέρες UTC και κελιά από πέντε προβολές, όχι απαραίτητα πέντε άτομα. Βλάβες μπορεί να καθυστερήσουν τη διαγραφή. Η συγκατάθεση καρτέλας αποθηκεύεται στο sessionStorage· GPC και Do Not Track υπερισχύουν.",
  "tr": "Tekil ziyaretçileri değil sayfa görüntülemelerini sayarız. Görüntüleme başına rastgele tanımlayıcı tekrarları önler, 24 saatte sona erer; günlük görev normalde sonraki 25 saatte siler. Yayımlanabilir günlük toplamlar genel istatistik için sabit sona erme olmadan saklanır; daha küçük kapalı hücreler günlük silinir. Yalnızca kapalı UTC günleri ve en az beş görüntüleme içeren hücreler yayımlanır; bu beş kişi demek değildir. Kesintiler silmeyi geciktirebilir. Sekme izni sessionStorage içinde saklanır; GPC ve Do Not Track önceliklidir."
};

export function ReachPrivacyChoice({ locale }: { locale: Locale }) {
  const [message, setMessage] = useState("");
  const [title, description, enable, stop, enabled, stopped, failed] = copy[locale];

  function choose(allowed: boolean) {
    setMessage(setReachOptIn(allowed) ? (allowed ? enabled : stopped) : failed);
  }

  return <section aria-labelledby="reach-privacy-title" className="scroll-mt-28 border-b border-white/15 py-14">
    <h2 id="reach-privacy-title" className="text-3xl font-black text-white">{title}</h2>
    <p className="mt-5 leading-7 text-slate-300">{description} {reachRetentionCopy[locale]}</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" className="min-h-11 rounded-full border border-white/20 px-4 font-bold text-white" onClick={() => choose(true)}>{enable}</button>
      <button type="button" className="min-h-11 rounded-full border border-white/20 px-4 font-bold text-white" onClick={() => choose(false)}>{stop}</button>
    </div>
    <p role="status" className="mt-3 text-slate-200">{message}</p>
  </section>;
}
