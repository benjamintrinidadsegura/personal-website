import {
  writingContentTypes,
  writingLanguages,
  writingStatuses,
  type AdminWritingArticle,
  type PublicWritingArticle,
  type PublicWritingSummary,
  type WritingContentType,
  type WritingLanguage,
  type WritingStatus,
} from "@/types/writing";
import { validateWritingDocument } from "@/lib/writing/document";
import { getWritingLocalization } from "@/data/writing-localization";

type UnknownRow = Record<string, unknown>;

function validDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function validContentType(value: unknown): value is WritingContentType {
  return writingContentTypes.some((candidate) => candidate === value);
}

function validStatus(value: unknown): value is WritingStatus {
  return writingStatuses.some((candidate) => candidate === value);
}

function validLanguage(value: unknown): value is WritingLanguage {
  return writingLanguages.some((candidate) => candidate === value);
}

function validTopics(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((topic) => typeof topic === "string");
}

export function calculateReadingMinutes(body: string): number {
  const words = body.trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function translationRows(row: UnknownRow): UnknownRow[] {
  const value = row.translations ?? row.writing_article_translations;
  return Array.isArray(value) ? value.filter((item): item is UnknownRow => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function validTranslatedRow(row: UnknownRow, sourceRevision: number): boolean {
  if (
    row.status !== "translated"
    || row.source_revision !== sourceRevision
    || !validLanguage(row.locale)
    || typeof row.title !== "string" || row.title.length < 3
    || typeof row.deck !== "string"
    || typeof row.excerpt !== "string" || row.excerpt.length < 10
    || typeof row.body !== "string" || row.body.length < 20
  ) return false;
  return row.body_json !== null && row.body_json !== undefined && validateWritingDocument(row.body_json).success;
}

export function mapPublicWritingSummary(row: UnknownRow, requestedLanguage?: WritingLanguage): PublicWritingSummary | null {
  if (
    typeof row.id !== "string" || typeof row.slug !== "string" || !row.slug ||
    typeof row.title !== "string" || row.title.length < 3 || typeof row.deck !== "string" ||
    typeof row.excerpt !== "string" || row.excerpt.length < 10 || typeof row.body !== "string" || row.body.length < 20 ||
    !validContentType(row.content_type) || !validTopics(row.topics) ||
    row.status !== "published" || !validDate(row.published_at)
  ) return null;
  if (row.body_json !== null && row.body_json !== undefined && !validateWritingDocument(row.body_json).success) return null;
  const sourceLanguage = validLanguage(row.source_locale) ? row.source_locale : getWritingLocalization(row.slug).language;
  const sourceRevision = typeof row.source_revision === "number" && Number.isSafeInteger(row.source_revision) && row.source_revision >= 1 ? row.source_revision : 1;
  const translations = translationRows(row).filter((translation) => validTranslatedRow(translation, sourceRevision));
  const translated = requestedLanguage && requestedLanguage !== sourceLanguage
    ? translations.find((translation) => translation.locale === requestedLanguage)
    : undefined;
  const language = translated ? translated.locale as WritingLanguage : sourceLanguage;
  const availableLanguages = writingLanguages.filter((locale) => locale === sourceLanguage || translations.some((translation) => translation.locale === locale));
  const title = translated ? translated.title as string : row.title;
  const deck = translated ? translated.deck as string : row.deck;
  const excerpt = translated ? translated.excerpt as string : row.excerpt;
  const body = translated ? translated.body as string : row.body;
  return {
    id: row.id,
    slug: row.slug,
    title,
    deck,
    excerpt,
    contentType: row.content_type,
    topics: row.topics,
    publishedAt: row.published_at,
    readingMinutes: calculateReadingMinutes(body),
    language,
    sourceLanguage,
    availableLanguages,
    translationStatus: translated ? "translated" : requestedLanguage && requestedLanguage !== sourceLanguage ? "fallback" : "source",
  };
}

export function mapPublicWritingArticle(row: UnknownRow, requestedLanguage?: WritingLanguage): PublicWritingArticle | null {
  const summary = mapPublicWritingSummary(row, requestedLanguage);
  if (!summary || typeof row.body !== "string") return null;
  const sourceRevision = typeof row.source_revision === "number" && Number.isSafeInteger(row.source_revision) && row.source_revision >= 1 ? row.source_revision : 1;
  const translated = summary.translationStatus === "translated"
    ? translationRows(row).find((translation) => translation.locale === summary.language && validTranslatedRow(translation, sourceRevision))
    : undefined;
  const body = translated ? translated.body as string : row.body;
  const bodyJson = translated ? translated.body_json : row.body_json;
  if (bodyJson === null || bodyJson === undefined) return { ...summary, body, bodyJson: null };
  const document = validateWritingDocument(bodyJson);
  return document.success ? { ...summary, body, bodyJson: document.data } : null;
}

export function mapAdminWritingArticle(row: UnknownRow): AdminWritingArticle | null {
  if (
    typeof row.id !== "string" || (row.slug !== null && typeof row.slug !== "string") ||
    typeof row.title !== "string" || typeof row.deck !== "string" || typeof row.excerpt !== "string" || typeof row.body !== "string" ||
    !validContentType(row.content_type) || !validTopics(row.topics) || !validStatus(row.status) ||
    !validDate(row.created_at) || !validDate(row.updated_at) || (row.published_at !== null && !validDate(row.published_at))
  ) return null;
  const bodyJson = row.body_json === null || row.body_json === undefined ? null : validateWritingDocument(row.body_json);
  if (bodyJson && !bodyJson.success) return null;
  const sourceLocale = validLanguage(row.source_locale) ? row.source_locale : "de";
  const sourceRevision = typeof row.source_revision === "number" && Number.isSafeInteger(row.source_revision) && row.source_revision >= 1 ? row.source_revision : 1;
  return { id: row.id, slug: row.slug, title: row.title, deck: row.deck, excerpt: row.excerpt, body: row.body, bodyJson: bodyJson ? bodyJson.data : null, contentType: row.content_type, sourceLocale, sourceRevision, topics: row.topics, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, publishedAt: row.published_at };
}
