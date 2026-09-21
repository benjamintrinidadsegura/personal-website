import type { Locale } from "@/lib/i18n/config";

export type ShareDestinationsDictionary = {
  destinations: string;
  moreApps: string;
  whatsappLink: string;
  linkedinLink: string;
  linkOnlyHint: string;
  nativeHint: string;
};

export const shareDestinationsDictionaries: Record<Locale, ShareDestinationsDictionary> = {
  de: {
    destinations: "Teilen über",
    moreApps: "In Apps teilen",
    whatsappLink: "WhatsApp · Link",
    linkedinLink: "LinkedIn · Link",
    linkOnlyHint: "WhatsApp und LinkedIn öffnen den Quelllink, nicht die Bilddatei.",
    nativeHint: "Öffnet die Bildfreigabe deines Geräts. Instagram oder TikTok erscheinen nur, wenn dein Gerät sie anbietet.",
  },
  en: {
    destinations: "Share to",
    moreApps: "Share to apps",
    whatsappLink: "WhatsApp · link",
    linkedinLink: "LinkedIn · link",
    linkOnlyHint: "WhatsApp and LinkedIn open the source link, not the image file.",
    nativeHint: "Opens your device's image-sharing options. Instagram or TikTok appear only if your device offers them.",
  },
  es: {
    destinations: "Compartir en",
    moreApps: "Compartir en apps",
    whatsappLink: "WhatsApp · enlace",
    linkedinLink: "LinkedIn · enlace",
    linkOnlyHint: "WhatsApp y LinkedIn abren el enlace de origen, no el archivo de imagen.",
    nativeHint: "Abre las opciones del dispositivo para compartir la imagen. Instagram o TikTok solo aparecen si están disponibles.",
  },
  tr: {
    destinations: "Paylaş",
    moreApps: "Uygulamalarda paylaş",
    whatsappLink: "WhatsApp · bağlantı",
    linkedinLink: "LinkedIn · bağlantı",
    linkOnlyHint: "WhatsApp ve LinkedIn görseli değil, kaynak bağlantısını açar.",
    nativeHint: "Cihazının görsel paylaşım seçeneklerini açar. Instagram veya TikTok yalnızca cihazın sunuyorsa görünür.",
  },
  pl: {
    destinations: "Udostępnij w",
    moreApps: "Udostępnij w aplikacjach",
    whatsappLink: "WhatsApp · link",
    linkedinLink: "LinkedIn · link",
    linkOnlyHint: "WhatsApp i LinkedIn otwierają link do źródła, a nie plik obrazu.",
    nativeHint: "Otwiera opcje udostępniania obrazu na urządzeniu. Instagram lub TikTok pojawią się tylko, jeśli urządzenie je udostępnia.",
  },
  el: {
    destinations: "Κοινοποίηση σε",
    moreApps: "Κοινοποίηση σε εφαρμογές",
    whatsappLink: "WhatsApp · σύνδεσμος",
    linkedinLink: "LinkedIn · σύνδεσμος",
    linkOnlyHint: "Τα WhatsApp και LinkedIn ανοίγουν τον σύνδεσμο προέλευσης, όχι το αρχείο εικόνας.",
    nativeHint: "Ανοίγει τις επιλογές κοινοποίησης εικόνας της συσκευής. Instagram ή TikTok εμφανίζονται μόνο αν η συσκευή τα προσφέρει.",
  },
  ru: {
    destinations: "Поделиться через",
    moreApps: "Поделиться в приложениях",
    whatsappLink: "WhatsApp · ссылка",
    linkedinLink: "LinkedIn · ссылка",
    linkOnlyHint: "WhatsApp и LinkedIn открывают ссылку на источник, а не файл изображения.",
    nativeHint: "Открывает варианты отправки изображения на устройстве. Instagram или TikTok появятся, только если устройство их поддерживает.",
  },
};

export function getShareDestinationsDictionary(locale: Locale): ShareDestinationsDictionary {
  return shareDestinationsDictionaries[locale];
}
