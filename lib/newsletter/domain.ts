export const NEWSLETTER_CONSENT_VERSION = "newsletter-consent-v1";
export const NEWSLETTER_PRIVACY_VERSION = "newsletter-privacy-v1";

export const newsletterPromise = {
  de: "Neue Texte und gelegentliche Updates aus dem Digital HQ. Kein fester Rhythmus, kein Spam.",
  en: "New Writing and occasional updates from the Digital HQ. No fixed schedule, no spam.",
  es: "Nuevos textos y actualizaciones ocasionales desde el Digital HQ. Sin calendario fijo y sin spam.",
  tr: "Digital HQ’dan yeni yazılar ve ara sıra güncellemeler. Sabit bir takvim yok, spam yok.",
  pl: "Nowe teksty i okazjonalne wiadomości z Digital HQ. Bez sztywnego harmonogramu i bez spamu.",
  el: "Νέα κείμενα και περιστασιακές ενημερώσεις από το Digital HQ. Χωρίς σταθερό πρόγραμμα και χωρίς ανεπιθύμητα μηνύματα.",
  ru: "Новые тексты и редкие новости из Digital HQ. Без жёсткого графика и без спама.",
} as const satisfies Record<Locale, string>;

export const newsletterConsentCopy = {
  de: `Ich willige ein, den bts.online Newsletter per E-Mail zu erhalten: ${newsletterPromise.de} Ich kann mich jederzeit abmelden.`,
  en: `I consent to receive the bts.online newsletter by email: ${newsletterPromise.en} I can unsubscribe at any time.`,
  es: `Doy mi consentimiento para recibir por correo el newsletter de bts.online: ${newsletterPromise.es} Puedo darme de baja en cualquier momento.`,
  tr: `bts.online bültenini e-posta yoluyla almayı kabul ediyorum: ${newsletterPromise.tr} İstediğim zaman abonelikten çıkabilirim.`,
  pl: `Wyrażam zgodę na otrzymywanie newslettera bts.online e-mailem: ${newsletterPromise.pl} W każdej chwili mogę zrezygnować.`,
  el: `Συναινώ να λαμβάνω το newsletter του bts.online μέσω email: ${newsletterPromise.el} Μπορώ να διαγραφώ οποιαδήποτε στιγμή.`,
  ru: `Я соглашаюсь получать рассылку bts.online по электронной почте: ${newsletterPromise.ru} Я могу отписаться в любой момент.`,
} as const satisfies Record<Locale, string>;
import type { Locale } from "@/lib/i18n/config";
