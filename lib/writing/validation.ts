import { parseWritingDocumentJson } from "@/lib/writing/document";
import {
  writingContentTypes,
  type WritingField,
  type WritingInput,
} from "@/types/writing";

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;
const MAX_TOPICS = 8;

export type WritingValidationResult =
  | { success: true; data: WritingInput }
  | { success: false; fieldErrors: Partial<Record<WritingField, string>> };

function normalized(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.normalize("NFC").trim() : "";
}

function characterLength(value: string): number {
  return Array.from(value).length;
}

export function parseWritingInput(formData: FormData, mode: "draft" | "publish" = "publish"): WritingValidationResult {
  const title = normalized(formData.get("title"));
  const deck = normalized(formData.get("deck"));
  const excerpt = normalized(formData.get("excerpt"));
  const bodyJsonValue = formData.get("bodyJson");
  const contentTypeValue = normalized(formData.get("contentType"));
  const topics = [...new Set(formData.getAll("topics").map((value) => normalized(value)).filter(Boolean))];
  const fieldErrors: Partial<Record<WritingField, string>> = {};

  if ((mode === "publish" && characterLength(title) < 3) || characterLength(title) > 160 || CONTROL_CHARACTERS.test(title)) {
    fieldErrors.title = mode === "publish" ? "Title must contain 3 to 160 valid characters." : "Title must contain at most 160 valid characters.";
  }
  if (characterLength(deck) > 240 || CONTROL_CHARACTERS.test(deck)) {
    fieldErrors.deck = "Deck must contain at most 240 valid characters.";
  }
  if ((mode === "publish" && characterLength(excerpt) < 10) || characterLength(excerpt) > 320 || CONTROL_CHARACTERS.test(excerpt)) {
    fieldErrors.excerpt = mode === "publish" ? "Teaser must contain 10 to 320 valid characters." : "Teaser must contain at most 320 valid characters.";
  }
  const document = typeof bodyJsonValue === "string" ? parseWritingDocumentJson(bodyJsonValue) : { success: false as const, message: "The document is invalid." };
  if (!document.success || (mode === "publish" && characterLength(document.plainText) < 20)) {
    fieldErrors.bodyJson = document.success ? "Article text must contain at least 20 characters." : document.message;
  }
  const contentType = writingContentTypes.find((candidate) => candidate === contentTypeValue);
  if (!contentType) fieldErrors.contentType = "Choose a valid content type.";
  if (topics.length < 1 || topics.length > MAX_TOPICS || topics.some((topic) => characterLength(topic) > 40 || CONTROL_CHARACTERS.test(topic))) {
    fieldErrors.topics = "Choose 1 to 8 valid topics of at most 40 characters each.";
  }

  if (Object.keys(fieldErrors).length > 0 || !contentType || !document.success) return { success: false, fieldErrors };
  return { success: true, data: { title, deck, excerpt, body: document.plainText, bodyJson: document.data, contentType, topics } };
}
