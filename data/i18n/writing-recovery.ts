import type { Locale } from "@/lib/i18n/config";

export const writingRecoveryCopy: Record<Locale, { loadingTitle: string; loadingBody: string; retry: string; retrying: string }> = {
  de: { loadingTitle: "Die Texte werden geladen.", loadingBody: "Du kannst dich währenddessen weiter umsehen.", retry: "Erneut versuchen", retrying: "Wird erneut versucht …" },
  en: { loadingTitle: "Writing is loading.", loadingBody: "You can keep exploring in the meantime.", retry: "Try again", retrying: "Trying again …" },
  es: { loadingTitle: "Los textos se están cargando.", loadingBody: "Mientras tanto, puedes seguir explorando.", retry: "Volver a intentar", retrying: "Intentando de nuevo …" },
  pl: { loadingTitle: "Teksty się ładują.", loadingBody: "W tym czasie możesz dalej odkrywać stronę.", retry: "Spróbuj ponownie", retrying: "Ponawianie próby …" },
  ru: { loadingTitle: "Тексты загружаются.", loadingBody: "Пока можно продолжить знакомство с сайтом.", retry: "Попробовать снова", retrying: "Повторная попытка …" },
  tr: { loadingTitle: "Yazılar yükleniyor.", loadingBody: "Bu sırada keşfetmeye devam edebilirsin.", retry: "Yeniden dene", retrying: "Yeniden deneniyor …" },
  el: { loadingTitle: "Τα κείμενα φορτώνονται.", loadingBody: "Μπορείς να συνεχίσεις την εξερεύνηση στο μεταξύ.", retry: "Δοκίμασε ξανά", retrying: "Νέα προσπάθεια …" },
};
