import { unstable_cache } from "next/cache";
import { cache } from "react";

import { isPublicWritingReady } from "@/lib/public-content-hygiene";
import { mapPublicWritingArticle, mapPublicWritingSummary } from "@/lib/writing/domain";
import { withPublicWritingReadDeadline } from "@/lib/writing/read-deadline";
import type { WritingReadContext, WritingReadFailure, WritingReadState } from "@/lib/writing/read-diagnostics";
import type { PublicWritingArticle, PublicWritingSummary, WritingLanguage } from "@/types/writing";

const CACHE_SECONDS = 300;
const PUBLIC_LIST_LIMIT = 100;

type UnknownRow = Record<string, unknown>;

export type PublishedWritingReadResult =
  | { status: "data"; data: PublicWritingSummary[] }
  | { status: "unavailable"; data: [] };

const unavailablePublishedWriting = (): PublishedWritingReadResult => ({ status: "unavailable", data: [] });
type CachedPublishedWritingRead = {
  result: PublishedWritingReadResult;
  diagnostic: { readId: string; state: WritingReadState };
};

// Preserve the deployed projection during this diagnostic release.
const PUBLIC_WRITING_SELECT = "id, slug, title, deck, excerpt, body, body_json, content_type, topics, status, published_at, source_locale, source_revision, translations:writing_article_translations(locale, title, deck, excerpt, body, body_json, status, source_revision, generated_at)";

async function readPublishedWriting(locale: WritingLanguage, fresh = false): Promise<CachedPublishedWritingRead> {
  const { classifyWritingReadFailure, observeWritingRead } = await import("@/lib/writing/read-diagnostics");
  const observation = observeWritingRead();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    observation.finish("unavailable", locale, { errorClass: "configuration_missing" });
    return { result: unavailablePublishedWriting(), diagnostic: { readId: observation.readId, state: "unavailable" } };
  }
  let failure: WritingReadFailure | undefined;
  let phase: "initialization" | "upstream" | "mapping" = "initialization";
  let httpStatus: number | undefined;
  let receivedCount: number | undefined;
  let acceptedCount: number | undefined;
  const result = await withPublicWritingReadDeadline(async (signal) => {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const client = getSupabaseServerClient({ fetch: fresh
      ? (input, init) => observation.fetch(input, { ...init, cache: "no-store" })
      : observation.fetch });
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
  return { result, diagnostic: { readId: observation.readId, state } };
}

// Layout and page still share the same persistent policy and pending render read.
const queryPublishedWriting = cache(unstable_cache(
  (locale: WritingLanguage) => readPublishedWriting(locale),
  ["published-writing"], { revalidate: CACHE_SECONDS, tags: ["published-writing"] },
));

const queryPublishedWritingBySlug = cache(unstable_cache(async (slug: string, locale: WritingLanguage): Promise<PublicWritingArticle | null> => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return null;
  return withPublicWritingReadDeadline(async (signal) => {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const { data, error } = await getSupabaseServerClient()
      .from("writing_articles")
      .select(PUBLIC_WRITING_SELECT)
      .eq("status", "published")
      .eq("slug", slug)
      .not("published_at", "is", null)
      .abortSignal(signal)
      .maybeSingle();
    if (error || !data) return null;
    const article = mapPublicWritingArticle(data as UnknownRow, locale);
    return article && isPublicWritingReady(article) ? article : null;
  }, null);
}, ["published-writing-by-slug"], { revalidate: CACHE_SECONDS, tags: ["published-writing"] }));

export async function getPublishedWriting(locale: WritingLanguage = "de", context?: WritingReadContext): Promise<PublicWritingSummary[]> {
  return (await getPublishedWritingResult(locale, context)).data;
}

export async function getPublishedWritingResult(locale: WritingLanguage = "de", context: WritingReadContext = { consumer: "unspecified" }): Promise<PublishedWritingReadResult> {
  return deliverPublishedWritingResult(() => queryPublishedWriting(locale), locale, context);
}

/** Sitemap alone bypasses persistent and render caches, including the fetch Data Cache. */
export async function getPublishedWritingForSitemap(correlationId: string): Promise<PublishedWritingReadResult> {
  return deliverPublishedWritingResult(() => readPublishedWriting("de", true), "de", { consumer: "sitemap", correlationId });
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
    throw error;
  }
}

export async function getPublishedWritingBySlug(slug: string, locale: WritingLanguage = "de"): Promise<PublicWritingArticle | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug) || slug.length > 96) return null;
  return queryPublishedWritingBySlug(slug, locale);
}
