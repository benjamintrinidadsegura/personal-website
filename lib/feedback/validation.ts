import type { Locale } from "@/lib/i18n/config";
import {
  feedbackMessageMaximum,
  feedbackNameMaximum,
  feedbackSourceContexts,
  type FeedbackField,
  type FeedbackSubmission,
  type RawFeedbackSubmission,
} from "@/types/feedback";

type FeedbackValidationResult =
  | { success: true; data: FeedbackSubmission; formToken: string }
  | {
      success: false;
      fieldErrors: Partial<Record<FeedbackField, string>>;
      isHoneypot: boolean;
    };

const CONTROL_OR_BIDI_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;

const validationCopy = {
  de: { message: `Die Nachricht muss zwischen 1 und ${feedbackMessageMaximum} Zeichen lang sein.`, name: `Der Name darf höchstens ${feedbackNameMaximum} Zeichen lang sein.`, content: "Die Eingabe enthält nicht erlaubte Steuerzeichen.", source: "Der Ursprung ist ungültig.", form: "Das Formular ist nicht mehr gültig." },
  en: { message: `The message must be between 1 and ${feedbackMessageMaximum} characters long.`, name: `The name must be no longer than ${feedbackNameMaximum} characters.`, content: "The input contains unsupported control characters.", source: "The source context is invalid.", form: "This form is no longer valid." },
  es: { message: `El mensaje debe tener entre 1 y ${feedbackMessageMaximum} caracteres.`, name: `El nombre no puede superar los ${feedbackNameMaximum} caracteres.`, content: "La entrada contiene caracteres de control no permitidos.", source: "El contexto de origen no es válido.", form: "Este formulario ya no es válido." },
  tr: { message: `Mesaj 1 ile ${feedbackMessageMaximum} karakter arasında olmalı.`, name: `Ad en fazla ${feedbackNameMaximum} karakter olabilir.`, content: "Girdi desteklenmeyen kontrol karakterleri içeriyor.", source: "Kaynak bağlamı geçersiz.", form: "Bu form artık geçerli değil." },
  pl: { message: `Wiadomość musi mieć od 1 do ${feedbackMessageMaximum} znaków.`, name: `Nazwa może mieć najwyżej ${feedbackNameMaximum} znaków.`, content: "Wpis zawiera niedozwolone znaki sterujące.", source: "Kontekst źródłowy jest nieprawidłowy.", form: "Ten formularz nie jest już ważny." },
  el: { message: `Το μήνυμα πρέπει να έχει από 1 έως ${feedbackMessageMaximum} χαρακτήρες.`, name: `Το όνομα δεν μπορεί να ξεπερνά τους ${feedbackNameMaximum} χαρακτήρες.`, content: "Η καταχώριση περιέχει μη υποστηριζόμενους χαρακτήρες ελέγχου.", source: "Το πλαίσιο προέλευσης δεν είναι έγκυρο.", form: "Αυτή η φόρμα δεν είναι πλέον έγκυρη." },
  ru: { message: `Сообщение должно содержать от 1 до ${feedbackMessageMaximum} символов.`, name: `Имя должно содержать не более ${feedbackNameMaximum} символов.`, content: "Ввод содержит недопустимые управляющие символы.", source: "Недопустимый контекст источника.", form: "Эта форма больше недействительна." },
} as const satisfies Record<Locale, Record<string, string>>;

function normalizeText(value: string): string {
  return value.normalize("NFC").trim();
}

function characterLength(value: string): number {
  return Array.from(value).length;
}

export function validateFeedbackSubmission(
  raw: RawFeedbackSubmission,
  locale: Locale = "de",
): FeedbackValidationResult {
  const fieldErrors: Partial<Record<FeedbackField, string>> = {};
  if (typeof raw.website !== "string" || raw.website.length > 0) {
    return { success: false, fieldErrors, isHoneypot: true };
  }

  const message = typeof raw.message === "string" ? normalizeText(raw.message) : "";
  const normalizedName = typeof raw.name === "string" ? normalizeText(raw.name) : "";
  const sourceContext = typeof raw.sourceContext === "string"
    ? feedbackSourceContexts.find((candidate) => candidate === raw.sourceContext)
    : undefined;
  const formToken = typeof raw.formToken === "string" ? raw.formToken : "";

  if (characterLength(message) < 1 || characterLength(message) > feedbackMessageMaximum) {
    fieldErrors.message = validationCopy[locale].message;
  } else if (CONTROL_OR_BIDI_CHARACTERS.test(message)) {
    fieldErrors.message = validationCopy[locale].content;
  }

  if (characterLength(normalizedName) > feedbackNameMaximum) {
    fieldErrors.name = validationCopy[locale].name;
  } else if (normalizedName && CONTROL_OR_BIDI_CHARACTERS.test(normalizedName)) {
    fieldErrors.name = validationCopy[locale].content;
  }

  if (!sourceContext) fieldErrors.sourceContext = validationCopy[locale].source;
  if (!formToken) fieldErrors.message ??= validationCopy[locale].form;

  return Object.keys(fieldErrors).length > 0
    ? { success: false, fieldErrors, isHoneypot: false }
    : {
        success: true,
        data: { message, name: normalizedName || null, sourceContext: sourceContext! },
        formToken,
      };
}
