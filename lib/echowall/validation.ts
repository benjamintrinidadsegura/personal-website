import {
  echoCategories,
  type EchoField,
  type EchoSubmission,
  type RawEchoSubmission,
} from "@/types/echowall";

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
    fieldErrors.displayName = "Der Anzeigename muss 2 bis 40 Zeichen lang sein.";
  } else if (hasForbiddenContent(displayName)) {
    fieldErrors.displayName = "Der Anzeigename enthält nicht erlaubte Inhalte.";
  }

  if (characterLength(message) < 10 || characterLength(message) > 500) {
    fieldErrors.message = "Die Nachricht muss 10 bis 500 Zeichen lang sein.";
  } else if (hasForbiddenContent(message)) {
    fieldErrors.message = "Die Nachricht enthält nicht erlaubte Inhalte.";
  }

  const category = categoryValue === "" || categoryValue === null
    ? null
    : echoCategories.find((candidate) => candidate === categoryValue) ?? null;

  if (categoryValue && category === null) {
    fieldErrors.category = "Die gewählte Kategorie ist ungültig.";
  }

  if (email) {
    if (characterLength(email) > 254 || !EMAIL_PATTERN.test(email)) {
      fieldErrors.email = "Die E-Mail-Adresse ist ungültig.";
    } else if (CONTROL_CHARACTERS.test(email)) {
      fieldErrors.email = "Die E-Mail-Adresse ist ungültig.";
    }
  }

  if (consentValue !== "true" && consentValue !== "on") {
    fieldErrors.consent = "Die Einwilligung ist erforderlich.";
  }

  if (!formTokenValue) {
    fieldErrors.consent = fieldErrors.consent ?? "Das Formular ist nicht mehr gültig.";
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
