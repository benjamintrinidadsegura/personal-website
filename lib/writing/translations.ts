import { validateWritingDocument } from "@/lib/writing/document";
import { writingLanguages, writingTranslationStatuses } from "@/types/writing";
import type {
  WritingLanguage,
  WritingTranslationPayload,
  WritingTranslationStatus,
  WritingTranslationSummary,
} from "@/types/writing";

const MAX_IMPORT_BYTES = 160_000;
const UNSAFE_TEXT_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;

type UnknownRow = Record<string, unknown>;

function validDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function validLanguage(value: unknown): value is WritingLanguage {
  return writingLanguages.some((candidate) => candidate === value);
}

function validStatus(value: unknown): value is WritingTranslationStatus {
  return writingTranslationStatuses.some((candidate) => candidate === value);
}

function normalizedText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFC").trim();
  return UNSAFE_TEXT_CHARACTERS.test(normalized) ? null : normalized;
}

export function mapWritingTranslationSummary(row: UnknownRow): WritingTranslationSummary | null {
  if (
    !validLanguage(row.locale)
    || !validStatus(row.status)
    || typeof row.source_revision !== "number"
    || !Number.isSafeInteger(row.source_revision)
    || row.source_revision < 1
    || (row.generated_at !== null && !validDate(row.generated_at))
    || typeof row.manually_edited !== "boolean"
    || !validDate(row.updated_at)
  ) return null;
  return {
    locale: row.locale,
    status: row.status,
    sourceRevision: row.source_revision,
    generatedAt: row.generated_at,
    manuallyEdited: row.manually_edited,
    updatedAt: row.updated_at,
  };
}

export type WritingTranslationImportResult =
  | { success: true; data: WritingTranslationPayload & { body: string } }
  | { success: false; message: string };

export function parseWritingTranslationImport(value: string): WritingTranslationImportResult {
  if (new TextEncoder().encode(value).byteLength > MAX_IMPORT_BYTES) return { success: false, message: "Translation import is too large." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return { success: false, message: "Translation import is not valid JSON." };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { success: false, message: "Translation import must be an object." };
  const record = parsed as UnknownRow;
  if (Object.keys(record).some((key) => !["title", "deck", "excerpt", "bodyJson"].includes(key))) {
    return { success: false, message: "Translation import contains unsupported fields." };
  }
  const title = normalizedText(record.title);
  const deck = normalizedText(record.deck);
  const excerpt = normalizedText(record.excerpt);
  const document = validateWritingDocument(record.bodyJson);
  if (!title || Array.from(title).length < 3 || Array.from(title).length > 160) return { success: false, message: "Translated title must contain 3 to 160 valid characters." };
  if (deck === null || Array.from(deck).length > 240) return { success: false, message: "Translated deck must contain at most 240 valid characters." };
  if (!excerpt || Array.from(excerpt).length < 10 || Array.from(excerpt).length > 320) return { success: false, message: "Translated teaser must contain 10 to 320 valid characters." };
  if (!document.success || Array.from(document.plainText).length < 20 || Array.from(document.plainText).length > 24_000) {
    return { success: false, message: document.success ? "Translated document must contain 20 to 24,000 characters." : document.message };
  }
  return { success: true, data: { title, deck, excerpt, body: document.plainText, bodyJson: document.data } };
}
