import { cache } from "react";

import { isPublicWritingReady } from "@/lib/public-content-hygiene";
import { mapPublicWritingArticle, mapPublicWritingSummary } from "@/lib/writing/domain";
import { withPublicWritingReadDeadline } from "@/lib/writing/read-deadline";
import type { WritingReadContext, WritingReadFailure, WritingReadState } from "@/lib/writing/read-diagnostics";
import type { PublicWritingArticle, PublicWritingSummary, WritingLanguage } from "@/types/writing";

const PUBLIC_LIST_LIMIT = 100;

type UnknownRow = Record<string, unknown>;

export type PublishedWritingReadResult =
  | { status: "data"; data: PublicWritingSummary[] }
  | { status: "unavailable"; data: [] };

const unavailablePublishedWriting = (): PublishedWritingReadResult => ({ status: "unavailable", data: [] });
type CachedPublishedWritingRead = {
  result: PublishedWritingReadResult;
  diagnostic: { readId: string; state: WritingReadState };
  retryable: boolean;
};

// Full documents remain necessary for source/translation validation and reading time.
const PUBLIC_WRITING_SELECT = "id, slug, title, deck, excerpt, body, body_json, content_type, topics, status, published_at, source_locale, source_revision, translations:writing_article_translations(locale, title, deck, excerpt, body, body_json, status, source_revision, generated_at)";

async function readPublishedWriting(locale: WritingLanguage): Promise<CachedPublishedWritingRead> {
  const { classifyWritingReadFailure, observeWritingRead } = await import("@/lib/writing/read-diagnostics");
  const observation = observeWritingRead();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    observation.finish("unavailable", locale, { errorClass: "configuration_missing" });
    return { result: unavailablePublishedWriting(), diagnostic: { readId: observation.readId, state: "unavailable" }, retryable: false };
  }
  let failure: WritingReadFailure | undefined;
  let phase: "initialization" | "upstream" | "mapping" = "initialization";
  let httpStatus: number | undefined;
  let receivedCount: number | undefined;
  let acceptedCount: number | undefined;
  const result = await withPublicWritingReadDeadline(async (signal) => {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const client = getSupabaseServerClient({ fetch: (input, init) => observation.fetch(input, { ...init, cache: "no-store" }) });
    phase = "upstream";
    const { data, error, status } = await client
      .from("writing_articles")
      .select(PUBLIC_WRITING_SELECT)
      .eq("status", "published")
      .not("slug", "is", null)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(PUBLIC_LIST_LIMIT)
      .abortSignal(signal);
    httpStatus = status;
    if (error || !Array.isArray(data)) {
      failure = error ? classifyWritingReadFailure(error, status) : { errorClass: "invalid_response" };
      return unavailablePublishedWriting();
    }
    phase = "mapping";
    receivedCount = data.length;
    const articles = (data as UnknownRow[])
      .map((row) => mapPublicWritingSummary(row, locale))
      .filter((article): article is PublicWritingSummary => article !== null)
      .filter(isPublicWritingReady);
    acceptedCount = articles.length;
    return { status: "data" as const, data: articles };
  }, unavailablePublishedWriting(), undefined, ({ kind, error }) => {
    const classified = classifyWritingReadFailure(error);
    failure = kind === "timeout" ? { errorClass: "deadline" } : classified.errorClass === "exception"
      ? { errorClass: phase === "mapping" ? "mapping_error" : phase === "initialization" ? "initialization_error" : "exception" }
      : classified;
  });
  const state = failure?.errorClass === "deadline" ? "timeout" : result.status === "data" ? "success" : "unavailable";
  observation.finish(state, locale, failure, { receivedCount, acceptedCount }, httpStatus);
  const retryable = state === "timeout" || failure?.errorClass === "network" || failure?.errorClass === "upstream_timeout"
    || (failure?.errorClass === "upstream_error" && (httpStatus === 503 || httpStatus === 520));
  return { result, diagnostic: { readId: observation.readId, state }, retryable };
}

// Share only this render's pending read. Never persist an outage or publication snapshot.
const queryPublishedWriting = cache((locale: WritingLanguage) => readPublishedWriting(locale));

/** Fixed retry eligibility only; diagnostics, credentials and provider errors stay server-side. */
export async function isPublishedWritingRetryable(locale: WritingLanguage): Promise<boolean> {
  try { return (await queryPublishedWriting(locale)).retryable; } catch { return false; }
}

export type PublishedWritingArticleResult =
  | { status: "data"; article: PublicWritingArticle }
  | { status: "missing" | "unavailable"; article: null };

const queryPublishedWritingBySlug = cache(async (slug: string, locale: WritingLanguage): Promise<PublishedWritingArticleResult> => {
  const unavailable: PublishedWritingArticleResult = { status: "unavailable", article: null };
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return unavailable;
  return withPublicWritingReadDeadline(async (signal) => {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const { data, error } = await getSupabaseServerClient({ fetch: (input, init) => globalThis.fetch(input, { ...init, cache: "no-store" }) })
      .from("writing_articles")
      .select(PUBLIC_WRITING_SELECT)
      .eq("status", "published")
      .eq("slug", slug)
      .not("published_at", "is", null)
      .abortSignal(signal)
      .maybeSingle();
    if (error) return unavailable;
    if (!data) return { status: "missing" as const, article: null };
    const article = mapPublicWritingArticle(data as UnknownRow, locale);
    return article && isPublicWritingReady(article) ? { status: "data" as const, article } : { status: "missing" as const, article: null };
  }, unavailable);
});

export async function getPublishedWriting(locale: WritingLanguage = "de", context?: WritingReadContext): Promise<PublicWritingSummary[]> {
  return (await getPublishedWritingResult(locale, context)).data;
}

/** Optional analytics validation by stable public record ID; no listing limit or stale publication snapshot. */
export async function getPublishedWritingInsightTarget(id: string): Promise<
  { status: "data"; article: PublicWritingSummary } | { status: "missing" | "unavailable"; article: null }
> {
  const unavailable = { status: "unavailable" as const, article: null };
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/u.test(id)) return { status: "missing", article: null };
  return withPublicWritingReadDeadline(async (signal) => {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const { data, error } = await getSupabaseServerClient({ fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) })
      .from("writing_articles").select(PUBLIC_WRITING_SELECT).eq("id", id).eq("status", "published")
      .not("published_at", "is", null).not("slug", "is", null).abortSignal(signal).maybeSingle();
    if (error) return unavailable;
    const article = data ? mapPublicWritingSummary(data as UnknownRow, "de") : null;
    return article && isPublicWritingReady(article) ? { status: "data" as const, article } : { status: "missing" as const, article: null };
  }, unavailable);
}

export async function getPublishedWritingResult(locale: WritingLanguage = "de", context: WritingReadContext = { consumer: "unspecified" }): Promise<PublishedWritingReadResult> {
  return deliverPublishedWritingResult(() => queryPublishedWriting(locale), locale, context);
}

/** Sitemap also bypasses render memoization; every public reader uses fetch no-store. */
export async function getPublishedWritingForSitemap(correlationId: string): Promise<PublishedWritingReadResult> {
  return deliverPublishedWritingResult(() => readPublishedWriting("de"), "de", { consumer: "sitemap", correlationId });
}

async function deliverPublishedWritingResult(read: () => Promise<CachedPublishedWritingRead>, locale: WritingLanguage, context: WritingReadContext): Promise<PublishedWritingReadResult> {
  const { classifyWritingReadFailure, logWritingDiagnostic, newWritingCorrelationId } = await import("@/lib/writing/read-diagnostics");
  const started = performance.now();
  const correlationId = context.correlationId ?? newWritingCorrelationId();
  try {
    const { result, diagnostic } = await read();
    // Failures expose cached origin IDs; sitemap additionally traces each actual generation.
    // No headers()/cookies() inside the shared reader; each caller controls route caching.
    if (result.status === "unavailable" || context.consumer === "sitemap") {
      logWritingDiagnostic({ operation: "collection_result", state: result.status === "data" ? "success" : "unavailable",
        correlationId, consumer: context.consumer, locale, durationMs: performance.now() - started,
        originReadId: diagnostic.readId, originState: diagnostic.state });
    }
    // Internal cache diagnostics never enter public component props or content records.
    return result;
  } catch (error) {
    logWritingDiagnostic({ operation: "collection_result", state: "unavailable", correlationId,
      consumer: context.consumer, locale, durationMs: performance.now() - started, failure: classifyWritingReadFailure(error) });
    return unavailablePublishedWriting();
  }
}

export async function getPublishedWritingBySlug(slug: string, locale: WritingLanguage = "de"): Promise<PublicWritingArticle | null> {
  return (await getPublishedWritingArticleResult(slug, locale)).article;
}

export async function getPublishedWritingArticleResult(slug: string, locale: WritingLanguage = "de"): Promise<PublishedWritingArticleResult> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug) || slug.length > 96) return { status: "missing", article: null };
  return queryPublishedWritingBySlug(slug, locale);
}

/** Article pages must not turn a transient upstream failure into a missing-content 404. */
export async function getPublishedWritingPageArticle(slug: string, locale: WritingLanguage): Promise<PublicWritingArticle | null> {
  const result = await getPublishedWritingArticleResult(slug, locale);
  if (result.status === "unavailable") throw new Error("PUBLIC_WRITING_UNAVAILABLE");
  return result.article;
}
