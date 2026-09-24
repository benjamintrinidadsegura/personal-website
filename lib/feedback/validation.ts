import type { Locale } from "@/lib/i18n/config";
import {
  feedbackContactMethods,
  feedbackContactValueMaximum,
  feedbackMessageMaximum,
  feedbackNameMaximum,
  feedbackSourceContexts,
  resultFeedbackFits,
  resultFeedbackMessageMaximum,
  resultFeedbackProducts,
  resultFeedbackUsefulnessCategories,
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
  de: { message: `Die Nachricht muss zwischen 1 und ${feedbackMessageMaximum} Zeichen lang sein.`, name: `Der Name darf höchstens ${feedbackNameMaximum} Zeichen lang sein.`, contact: `Bitte wähle eine Kontaktart und gib einen Wert mit höchstens ${feedbackContactValueMaximum} Zeichen ein – oder lasse beides leer.`, content: "Die Eingabe enthält nicht erlaubte Steuerzeichen.", source: "Der Ursprung ist ungültig.", form: "Das Formular ist nicht mehr gültig." },
  en: { message: `The message must be between 1 and ${feedbackMessageMaximum} characters long.`, name: `The name must be no longer than ${feedbackNameMaximum} characters.`, contact: `Select a contact method and enter a value of no more than ${feedbackContactValueMaximum} characters, or leave both empty.`, content: "The input contains unsupported control characters.", source: "The source context is invalid.", form: "This form is no longer valid." },
  es: { message: `El mensaje debe tener entre 1 y ${feedbackMessageMaximum} caracteres.`, name: `El nombre no puede superar los ${feedbackNameMaximum} caracteres.`, contact: `Selecciona un método de contacto e introduce un valor de hasta ${feedbackContactValueMaximum} caracteres, o deja ambos vacíos.`, content: "La entrada contiene caracteres de control no permitidos.", source: "El contexto de origen no es válido.", form: "Este formulario ya no es válido." },
  tr: { message: `Mesaj 1 ile ${feedbackMessageMaximum} karakter arasında olmalı.`, name: `Ad en fazla ${feedbackNameMaximum} karakter olabilir.`, contact: `Bir iletişim yöntemi seçip en fazla ${feedbackContactValueMaximum} karakterlik bir değer gir veya ikisini de boş bırak.`, content: "Girdi desteklenmeyen kontrol karakterleri içeriyor.", source: "Kaynak bağlamı geçersiz.", form: "Bu form artık geçerli değil." },
  pl: { message: `Wiadomość musi mieć od 1 do ${feedbackMessageMaximum} znaków.`, name: `Nazwa może mieć najwyżej ${feedbackNameMaximum} znaków.`, contact: `Wybierz metodę kontaktu i podaj wartość do ${feedbackContactValueMaximum} znaków albo pozostaw oba pola puste.`, content: "Wpis zawiera niedozwolone znaki sterujące.", source: "Kontekst źródłowy jest nieprawidłowy.", form: "Ten formularz nie jest już ważny." },
  el: { message: `Το μήνυμα πρέπει να έχει από 1 έως ${feedbackMessageMaximum} χαρακτήρες.`, name: `Το όνομα δεν μπορεί να ξεπερνά τους ${feedbackNameMaximum} χαρακτήρες.`, contact: `Επίλεξε τρόπο επικοινωνίας και συμπλήρωσε τιμή έως ${feedbackContactValueMaximum} χαρακτήρες ή άφησε και τα δύο κενά.`, content: "Η καταχώριση περιέχει μη υποστηριζόμενους χαρακτήρες ελέγχου.", source: "Το πλαίσιο προέλευσης δεν είναι έγκυρο.", form: "Αυτή η φόρμα δεν είναι πλέον έγκυρη." },
  ru: { message: `Сообщение должно содержать от 1 до ${feedbackMessageMaximum} символов.`, name: `Имя должно содержать не более ${feedbackNameMaximum} символов.`, contact: `Выберите способ связи и укажите значение не длиннее ${feedbackContactValueMaximum} символов либо оставьте оба поля пустыми.`, content: "Ввод содержит недопустимые управляющие символы.", source: "Недопустимый контекст источника.", form: "Эта форма больше недействительна." },
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
  const resultProduct = typeof raw.resultProduct === "string"
    ? resultFeedbackProducts.find((candidate) => candidate === raw.resultProduct) ?? null
    : null;
  const resultFit = typeof raw.resultFit === "string"
    ? resultFeedbackFits.find((candidate) => candidate === raw.resultFit) ?? null
    : null;
  const usefulnessCategory = typeof raw.usefulnessCategory === "string" && raw.usefulnessCategory
    ? resultFeedbackUsefulnessCategories.find((candidate) => candidate === raw.usefulnessCategory) ?? null
    : null;
  const isResultFeedback = resultProduct !== null;
  const normalizedName = typeof raw.name === "string" ? normalizeText(raw.name) : "";
  const normalizedContactValue = typeof raw.contactValue === "string"
    ? normalizeText(raw.contactValue)
    : "";
  const contactMethod = typeof raw.contactMethod === "string"
    ? feedbackContactMethods.find((candidate) => candidate === raw.contactMethod) ?? null
    : null;
  const sourceContext = typeof raw.sourceContext === "string"
    ? feedbackSourceContexts.find((candidate) => candidate === raw.sourceContext)
    : undefined;
  const formToken = typeof raw.formToken === "string" ? raw.formToken : "";

  if (
    (!isResultFeedback && characterLength(message) < 1)
    || characterLength(message) > (isResultFeedback ? resultFeedbackMessageMaximum : feedbackMessageMaximum)
  ) {
    fieldErrors.message = validationCopy[locale].message;
  } else if (CONTROL_OR_BIDI_CHARACTERS.test(message)) {
    fieldErrors.message = validationCopy[locale].content;
  }

  if (characterLength(normalizedName) > feedbackNameMaximum) {
    fieldErrors.name = validationCopy[locale].name;
  } else if (normalizedName && CONTROL_OR_BIDI_CHARACTERS.test(normalizedName)) {
    fieldErrors.name = validationCopy[locale].content;
  }

  const hasRawContactMethod = typeof raw.contactMethod === "string" && raw.contactMethod.length > 0;
  if (
    hasRawContactMethod !== Boolean(normalizedContactValue)
    || (hasRawContactMethod && !contactMethod)
  ) {
    fieldErrors.contactMethod = validationCopy[locale].contact;
    fieldErrors.contactValue = validationCopy[locale].contact;
  } else if (characterLength(normalizedContactValue) > feedbackContactValueMaximum) {
    fieldErrors.contactValue = validationCopy[locale].contact;
  } else if (
    normalizedContactValue
    && CONTROL_OR_BIDI_CHARACTERS.test(normalizedContactValue)
  ) {
    fieldErrors.contactValue = validationCopy[locale].content;
  }

  if (!sourceContext) fieldErrors.sourceContext = validationCopy[locale].source;
  if (isResultFeedback && !resultFit) fieldErrors.resultFit = validationCopy[locale].form;
  if (raw.resultProduct !== undefined && !resultProduct) fieldErrors.resultProduct = validationCopy[locale].form;
  if (raw.resultFit !== undefined && !resultFit) fieldErrors.resultFit = validationCopy[locale].form;
  if (typeof raw.usefulnessCategory === "string" && raw.usefulnessCategory && !usefulnessCategory) fieldErrors.usefulnessCategory = validationCopy[locale].form;
  if (isResultFeedback && (normalizedName || contactMethod || normalizedContactValue || sourceContext !== "other")) fieldErrors.resultProduct = validationCopy[locale].form;
  if (!formToken) fieldErrors.message ??= validationCopy[locale].form;

  return Object.keys(fieldErrors).length > 0
    ? { success: false, fieldErrors, isHoneypot: false }
    : {
        success: true,
        data: {
          message,
          name: normalizedName || null,
          contactMethod,
          contactValue: normalizedContactValue || null,
          sourceContext: sourceContext!,
          resultProduct,
          resultFit,
          usefulnessCategory,
          locale,
        },
        formToken,
      };
}
