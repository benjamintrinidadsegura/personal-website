import type {
  GuestCommentField,
  GuestCommentSubmission,
  RawGuestCommentSubmission,
} from "@/types/comments";

const CONTROL_OR_BIDI_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;
const MAX_PARAGRAPHS = 20;
const MAX_LINES = 60;

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

export function validateGuestCommentSubmission(raw: RawGuestCommentSubmission): ValidationResult {
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
  ) fieldErrors.displayName = "Display name must contain 2 to 40 valid characters.";

  if (body === null) fieldErrors.body = "Comment must contain 2 to 3,000 valid characters in at most 20 paragraphs.";

  if (!formToken) fieldErrors.body ??= "The comment form is no longer valid.";
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors, isHoneypot: false };
  }

  return {
    success: true,
    data: { displayName, body: body ?? "" },
    formToken: formToken ?? "",
  };
}
