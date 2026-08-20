"use client";

import { useLocale } from "@/components/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";

const recoveryCopy: Record<Locale, { title: string; returnLabel: string }> = {
  de: { title: "Die Momentaufnahme ist noch nicht vollständig.", returnLabel: "Zu den offenen Angaben" },
  en: { title: "The snapshot is not complete yet.", returnLabel: "Return to incomplete answers" },
  es: { title: "El panorama aún no está completo.", returnLabel: "Volver a las respuestas pendientes" },
  tr: { title: "Görünüm henüz tamamlanmadı.", returnLabel: "Eksik yanıtlara dön" },
  pl: { title: "Obraz nie jest jeszcze kompletny.", returnLabel: "Wróć do niepełnych odpowiedzi" },
  el: { title: "Η εικόνα δεν έχει ολοκληρωθεί ακόμη.", returnLabel: "Επιστροφή στις ελλιπείς απαντήσεις" },
  ru: { title: "Обзор ещё не завершён.", returnLabel: "Вернуться к незавершённым ответам" },
};

export function HumanContextResultRecovery({ message, onReturn }: { message: string; onReturn: () => void }) {
  const labels = recoveryCopy[useLocale()];
  return (
    <section role="alert" className="rounded-2xl border border-[#ffb36d]/40 bg-[#ffb36d]/10 p-6">
      <h2 className="text-xl font-black text-white">{labels.title}</h2>
      <p className="mt-3 leading-7 text-[#ffd3a8]">{message}</p>
      <button type="button" onClick={onReturn} className="mt-5 min-h-11 rounded-full border border-white/20 px-5 font-bold text-white">{labels.returnLabel}</button>
    </section>
  );
}
