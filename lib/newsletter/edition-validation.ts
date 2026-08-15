import type { NewsletterEditionInput } from "@/types/newsletter";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const UNSAFE_CHARACTERS = /[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;

function clean(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.normalize("NFC").trim() : "";
}

export function validateNewsletterEditionInput(formData: FormData):
  | { success: true; data: NewsletterEditionInput }
  | { success: false; fieldErrors: NonNullable<import("@/types/newsletter").NewsletterEditionActionState>["fieldErrors"] } {
  const writingArticleId = clean(formData.get("writingArticleId"));
  const subject = clean(formData.get("subject"));
  const preheader = clean(formData.get("preheader"));
  const introduction = clean(formData.get("introduction"));
  const fieldErrors: Record<string, string> = {};

  if (!UUID_PATTERN.test(writingArticleId)) fieldErrors.article = "Choose a published Writing article.";
  if (subject.length < 3 || subject.length > 120 || UNSAFE_CHARACTERS.test(subject)) {
    fieldErrors.subject = "Use 3 to 120 safe characters.";
  }
  if (preheader.length > 160 || UNSAFE_CHARACTERS.test(preheader)) {
    fieldErrors.preheader = "Use no more than 160 safe characters.";
  }
  if (introduction.length > 600 || UNSAFE_CHARACTERS.test(introduction)) {
    fieldErrors.introduction = "Use no more than 600 safe characters.";
  }

  return Object.keys(fieldErrors).length > 0
    ? { success: false, fieldErrors }
    : { success: true, data: { writingArticleId, subject, preheader, introduction } };
}

export function validNewsletterVersion(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
