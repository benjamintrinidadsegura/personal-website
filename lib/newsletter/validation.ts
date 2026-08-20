import { NEWSLETTER_CONSENT_VERSION } from "@/lib/newsletter/domain";
import type {
  NewsletterField,
  NewsletterSubscription,
  RawNewsletterSubscription,
} from "@/types/newsletter";
import type { Locale } from "@/lib/i18n/config";

const CONTROL_OR_BIDI_CHARACTERS = /[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const validationCopy = {
  de: { email: "Gib eine gültige E-Mail-Adresse ein.", consent: "Für das Abonnement ist deine Einwilligung erforderlich.", form: "Dieses Anmeldeformular ist nicht mehr gültig." },
  en: { email: "Enter a valid email address.", consent: "Consent is required to subscribe.", form: "This subscription form is no longer valid." },
  es: { email: "Introduce una dirección de correo válida.", consent: "Necesitas dar tu consentimiento para suscribirte.", form: "Este formulario de suscripción ya no es válido." },
  tr: { email: "Geçerli bir e-posta adresi gir.", consent: "Abone olmak için onay vermen gerekiyor.", form: "Bu abonelik formu artık geçerli değil." },
  pl: { email: "Wpisz prawidłowy adres e-mail.", consent: "Do subskrypcji wymagana jest zgoda.", form: "Ten formularz subskrypcji nie jest już ważny." },
  el: { email: "Συμπλήρωσε μια έγκυρη διεύθυνση email.", consent: "Απαιτείται συγκατάθεση για τη συνδρομή.", form: "Αυτή η φόρμα συνδρομής δεν είναι πλέον έγκυρη." },
  ru: { email: "Введите действительный адрес электронной почты.", consent: "Для подписки требуется согласие.", form: "Эта форма подписки больше недействительна." },
} as const satisfies Record<Locale, { email: string; consent: string; form: string }>;

type NewsletterValidationResult =
  | { success: true; data: NewsletterSubscription; formToken: string }
  | {
      success: false;
      fieldErrors: Partial<Record<NewsletterField, string>>;
      isHoneypot: boolean;
    };

export function normalizeNewsletterEmail(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("en-US");
}

export function validateNewsletterSubscription(
  raw: RawNewsletterSubscription,
  locale: Locale = "en",
): NewsletterValidationResult {
  const fieldErrors: Partial<Record<NewsletterField, string>> = {};
  if (typeof raw.website !== "string" || raw.website.length > 0) {
    return { success: false, fieldErrors, isHoneypot: true };
  }

  const email = typeof raw.email === "string" ? normalizeNewsletterEmail(raw.email) : "";
  const consent = raw.consent === "true" || raw.consent === "on";
  const formToken = typeof raw.formToken === "string" ? raw.formToken : "";

  if (
    Array.from(email).length < 3
    || Array.from(email).length > 254
    || CONTROL_OR_BIDI_CHARACTERS.test(email)
    || /[\r\n]/u.test(email)
    || !EMAIL_PATTERN.test(email)
  ) fieldErrors.email = validationCopy[locale].email;

  if (!consent) fieldErrors.consent = validationCopy[locale].consent;
  if (!formToken) fieldErrors.consent ??= validationCopy[locale].form;

  return Object.keys(fieldErrors).length > 0
    ? { success: false, fieldErrors, isHoneypot: false }
    : {
        success: true,
        data: { email, consentVersion: NEWSLETTER_CONSENT_VERSION },
        formToken,
      };
}
