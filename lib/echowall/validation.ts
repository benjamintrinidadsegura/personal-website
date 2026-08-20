import {
  echoCategories,
  type EchoField,
  type EchoSubmission,
  type RawEchoSubmission,
} from "@/types/echowall";
import type { Locale } from "@/lib/i18n/config";

type ValidationResult =
  | { success: true; data: EchoSubmission; formToken: string }
  | {
      success: false;
      fieldErrors: Partial<Record<EchoField, string>>;
      isHoneypot: boolean;
    };

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;
const HTML_PATTERN = /<\/?[a-z!][^>]*>/iu;
const URL_PATTERN = /(?:https?:\/\/|www\.|mailto:|\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\b)/iu;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const validationCopy = {
  de: { nameLength: "Der Anzeigename muss 2 bis 40 Zeichen lang sein.", nameContent: "Der Anzeigename enthält nicht erlaubte Inhalte.", messageLength: "Die Nachricht muss 10 bis 500 Zeichen lang sein.", messageContent: "Die Nachricht enthält nicht erlaubte Inhalte.", category: "Die gewählte Kategorie ist ungültig.", email: "Die E-Mail-Adresse ist ungültig.", consent: "Die Einwilligung ist erforderlich.", form: "Das Formular ist nicht mehr gültig." },
  en: { nameLength: "Display name must be 2 to 40 characters long.", nameContent: "The display name contains content that is not allowed.", messageLength: "The message must be 10 to 500 characters long.", messageContent: "The message contains content that is not allowed.", category: "The selected category is invalid.", email: "The email address is invalid.", consent: "Consent is required.", form: "The form is no longer valid." },
  es: { nameLength: "El nombre visible debe tener entre 2 y 40 caracteres.", nameContent: "El nombre visible contiene elementos no permitidos.", messageLength: "El mensaje debe tener entre 10 y 500 caracteres.", messageContent: "El mensaje contiene elementos no permitidos.", category: "La categoría elegida no es válida.", email: "La dirección de correo no es válida.", consent: "Se requiere tu consentimiento.", form: "El formulario ya no es válido." },
  tr: { nameLength: "Görünen ad 2–40 karakter uzunluğunda olmalı.", nameContent: "Görünen ad izin verilmeyen içerik barındırıyor.", messageLength: "Mesaj 10–500 karakter uzunluğunda olmalı.", messageContent: "Mesaj izin verilmeyen içerik barındırıyor.", category: "Seçilen kategori geçersiz.", email: "E-posta adresi geçersiz.", consent: "Onay vermen gerekiyor.", form: "Form artık geçerli değil." },
  pl: { nameLength: "Wyświetlana nazwa musi mieć od 2 do 40 znaków.", nameContent: "Wyświetlana nazwa zawiera niedozwoloną treść.", messageLength: "Wiadomość musi mieć od 10 do 500 znaków.", messageContent: "Wiadomość zawiera niedozwoloną treść.", category: "Wybrana kategoria jest nieprawidłowa.", email: "Adres e-mail jest nieprawidłowy.", consent: "Wymagana jest zgoda.", form: "Formularz nie jest już ważny." },
  el: { nameLength: "Το εμφανιζόμενο όνομα πρέπει να έχει 2–40 χαρακτήρες.", nameContent: "Το εμφανιζόμενο όνομα περιέχει μη επιτρεπόμενο περιεχόμενο.", messageLength: "Το μήνυμα πρέπει να έχει 10–500 χαρακτήρες.", messageContent: "Το μήνυμα περιέχει μη επιτρεπόμενο περιεχόμενο.", category: "Η επιλεγμένη κατηγορία δεν είναι έγκυρη.", email: "Η διεύθυνση email δεν είναι έγκυρη.", consent: "Απαιτείται συγκατάθεση.", form: "Η φόρμα δεν είναι πλέον έγκυρη." },
  ru: { nameLength: "Отображаемое имя должно содержать от 2 до 40 символов.", nameContent: "Отображаемое имя содержит недопустимые данные.", messageLength: "Сообщение должно содержать от 10 до 500 символов.", messageContent: "Сообщение содержит недопустимые данные.", category: "Выбранная категория недействительна.", email: "Адрес электронной почты недействителен.", consent: "Требуется согласие.", form: "Форма больше недействительна." },
} as const satisfies Record<Locale, Record<string, string>>;

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeText(value: string): string {
  return value.normalize("NFC").trim();
}

function characterLength(value: string): number {
  return Array.from(value).length;
}

function hasForbiddenContent(value: string): boolean {
  return (
    CONTROL_CHARACTERS.test(value) ||
    HTML_PATTERN.test(value) ||
    URL_PATTERN.test(value)
  );
}

export function validateEchoSubmission(
  raw: RawEchoSubmission,
  locale: Locale = "de",
): ValidationResult {
  const fieldErrors: Partial<Record<EchoField, string>> = {};
  const honeypot = asString(raw.website);

  if (honeypot === null || honeypot.length > 0) {
    return { success: false, fieldErrors, isHoneypot: true };
  }

  const displayNameValue = asString(raw.displayName);
  const messageValue = asString(raw.message);
  const categoryValue = asString(raw.category);
  const emailValue = asString(raw.email);
  const consentValue = asString(raw.consent);
  const formTokenValue = asString(raw.formToken);

  const displayName = displayNameValue
    ? normalizeText(displayNameValue)
    : "";
  const message = messageValue ? normalizeText(messageValue) : "";
  const email = emailValue ? normalizeText(emailValue).toLowerCase() : "";

  if (
    characterLength(displayName) < 2 ||
    characterLength(displayName) > 40
  ) {
    fieldErrors.displayName = validationCopy[locale].nameLength;
  } else if (hasForbiddenContent(displayName)) {
    fieldErrors.displayName = validationCopy[locale].nameContent;
  }

  if (characterLength(message) < 10 || characterLength(message) > 500) {
    fieldErrors.message = validationCopy[locale].messageLength;
  } else if (hasForbiddenContent(message)) {
    fieldErrors.message = validationCopy[locale].messageContent;
  }

  const category = categoryValue === "" || categoryValue === null
    ? null
    : echoCategories.find((candidate) => candidate === categoryValue) ?? null;

  if (categoryValue && category === null) {
    fieldErrors.category = validationCopy[locale].category;
  }

  if (email) {
    if (characterLength(email) > 254 || !EMAIL_PATTERN.test(email)) {
      fieldErrors.email = validationCopy[locale].email;
    } else if (CONTROL_CHARACTERS.test(email)) {
      fieldErrors.email = validationCopy[locale].email;
    }
  }

  if (consentValue !== "true" && consentValue !== "on") {
    fieldErrors.consent = validationCopy[locale].consent;
  }

  if (!formTokenValue) {
    fieldErrors.consent = fieldErrors.consent ?? validationCopy[locale].form;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors, isHoneypot: false };
  }

  return {
    success: true,
    data: {
      displayName,
      message,
      category,
      email: email || null,
    },
    formToken: formTokenValue ?? "",
  };
}
