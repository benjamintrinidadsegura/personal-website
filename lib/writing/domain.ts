import {
  writingContentTypes,
  writingStatuses,
  type AdminWritingArticle,
  type PublicWritingArticle,
  type PublicWritingSummary,
  type WritingContentType,
  type WritingStatus,
} from "@/types/writing";
import { validateWritingDocument } from "@/lib/writing/document";

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

function validTopics(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((topic) => typeof topic === "string");
}

export function calculateReadingMinutes(body: string): number {
  const words = body.trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function mapPublicWritingSummary(row: UnknownRow): PublicWritingSummary | null {
  if (
    typeof row.id !== "string" || typeof row.slug !== "string" || !row.slug ||
    typeof row.title !== "string" || row.title.length < 3 || typeof row.deck !== "string" ||
    typeof row.excerpt !== "string" || row.excerpt.length < 10 || typeof row.body !== "string" || row.body.length < 20 ||
    !validContentType(row.content_type) || !validTopics(row.topics) ||
    row.status !== "published" || !validDate(row.published_at)
  ) return null;
  if (row.body_json !== null && row.body_json !== undefined && !validateWritingDocument(row.body_json).success) return null;
  return { id: row.id, slug: row.slug, title: row.title, deck: row.deck, excerpt: row.excerpt, contentType: row.content_type, topics: row.topics, publishedAt: row.published_at, readingMinutes: calculateReadingMinutes(row.body) };
}

export function mapPublicWritingArticle(row: UnknownRow): PublicWritingArticle | null {
  const summary = mapPublicWritingSummary(row);
  if (!summary || typeof row.body !== "string") return null;
  if (row.body_json === null || row.body_json === undefined) return { ...summary, body: row.body, bodyJson: null };
  const document = validateWritingDocument(row.body_json);
  return document.success ? { ...summary, body: row.body, bodyJson: document.data } : null;
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
  return { id: row.id, slug: row.slug, title: row.title, deck: row.deck, excerpt: row.excerpt, body: row.body, bodyJson: bodyJson ? bodyJson.data : null, contentType: row.content_type, topics: row.topics, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, publishedAt: row.published_at };
}
