import type {
  GuestCommentField,
  GuestCommentSubmission,
  RawGuestCommentSubmission,
} from "@/types/comments";
import type { Locale } from "@/lib/i18n/config";

const CONTROL_OR_BIDI_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;
const MAX_PARAGRAPHS = 20;
const MAX_LINES = 60;
const validationCopy = {
  de: { name: "Der Anzeigename muss 2 bis 40 gültige Zeichen enthalten.", body: "Der Kommentar muss 2 bis 3.000 gültige Zeichen in höchstens 20 Absätzen enthalten.", form: "Das Kommentarformular ist nicht mehr gültig." },
  en: { name: "Display name must contain 2 to 40 valid characters.", body: "Comment must contain 2 to 3,000 valid characters in at most 20 paragraphs.", form: "The comment form is no longer valid." },
  es: { name: "El nombre visible debe contener entre 2 y 40 caracteres válidos.", body: "El comentario debe contener entre 2 y 3000 caracteres válidos y un máximo de 20 párrafos.", form: "El formulario de comentarios ya no es válido." },
  tr: { name: "Görünen ad 2–40 geçerli karakter içermeli.", body: "Yorum en fazla 20 paragrafta 2–3.000 geçerli karakter içermeli.", form: "Yorum formu artık geçerli değil." },
  pl: { name: "Wyświetlana nazwa musi zawierać od 2 do 40 prawidłowych znaków.", body: "Komentarz musi zawierać od 2 do 3000 prawidłowych znaków w maksymalnie 20 akapitach.", form: "Formularz komentarza nie jest już ważny." },
  el: { name: "Το εμφανιζόμενο όνομα πρέπει να περιέχει 2–40 έγκυρους χαρακτήρες.", body: "Το σχόλιο πρέπει να περιέχει 2–3.000 έγκυρους χαρακτήρες σε έως 20 παραγράφους.", form: "Η φόρμα σχολίου δεν είναι πλέον έγκυρη." },
  ru: { name: "Отображаемое имя должно содержать от 2 до 40 допустимых символов.", body: "Комментарий должен содержать от 2 до 3000 допустимых символов и не более 20 абзацев.", form: "Форма комментария больше недействительна." },
} as const satisfies Record<Locale, { name: string; body: string; form: string }>;

export function getCommentBodyValidationMessage(locale: Locale): string {
  return validationCopy[locale].body;
}

type ValidationResult =
  | { success: true; data: GuestCommentSubmission; formToken: string }
  | {
      success: false;
      fieldErrors: Partial<Record<GuestCommentField, string>>;
      isHoneypot: boolean;
    };

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function characterLength(value: string): number {
  return Array.from(value).length;
}

function normalizeName(value: string): string {
  return value.normalize("NFC").trim();
}

function normalizeBody(value: string): string {
  return value
    .replace(/\r\n?/gu, "\n")
    .normalize("NFC")
    .trim();
}

export function validateCommentBody(value: unknown): string | null {
  const bodyValue = asString(value);
  const body = bodyValue ? normalizeBody(bodyValue) : "";
  const lines = body ? body.split("\n") : [];
  const paragraphs = body ? body.split(/\n{2,}/u).filter((part) => part.trim().length > 0) : [];
  if (
    characterLength(body) < 2
    || characterLength(body) > 3_000
    || lines.length > MAX_LINES
    || paragraphs.length > MAX_PARAGRAPHS
    || CONTROL_OR_BIDI_CHARACTERS.test(body)
  ) return null;
  return body;
}

export function validateGuestCommentSubmission(raw: RawGuestCommentSubmission, locale: Locale = "en"): ValidationResult {
  const fieldErrors: Partial<Record<GuestCommentField, string>> = {};
  const honeypot = asString(raw.website);
  if (honeypot === null || honeypot.length > 0) {
    return { success: false, fieldErrors, isHoneypot: true };
  }

  const displayNameValue = asString(raw.displayName);
  const formToken = asString(raw.formToken);
  const displayName = displayNameValue ? normalizeName(displayNameValue) : "";
  const body = validateCommentBody(raw.body);

  if (
    characterLength(displayName) < 2
    || characterLength(displayName) > 40
    || /[\r\n]/u.test(displayName)
    || CONTROL_OR_BIDI_CHARACTERS.test(displayName)
  ) fieldErrors.displayName = validationCopy[locale].name;

  if (body === null) fieldErrors.body = validationCopy[locale].body;

  if (!formToken) fieldErrors.body ??= validationCopy[locale].form;
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors, isHoneypot: false };
  }

  return {
    success: true,
    data: { displayName, body: body ?? "" },
    formToken: formToken ?? "",
  };
}
