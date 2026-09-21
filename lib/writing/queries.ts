import { unstable_cache } from "next/cache";

import { isPublicWritingReady } from "@/lib/public-content-hygiene";
import { mapPublicWritingArticle, mapPublicWritingSummary } from "@/lib/writing/domain";
import { withPublicWritingReadDeadline } from "@/lib/writing/read-deadline";
import type { PublicWritingArticle, PublicWritingSummary } from "@/types/writing";

const CACHE_SECONDS = 300;
const PUBLIC_LIST_LIMIT = 100;

type UnknownRow = Record<string, unknown>;

export type PublishedWritingReadResult =
  | { status: "data"; data: PublicWritingSummary[] }
  | { status: "unavailable"; data: [] };

const unavailablePublishedWriting = (): PublishedWritingReadResult => ({ status: "unavailable", data: [] });

const queryPublishedWriting = unstable_cache(async (): Promise<PublishedWritingReadResult> => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return unavailablePublishedWriting();
  return withPublicWritingReadDeadline(async (signal) => {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const { data, error } = await getSupabaseServerClient()
      .from("writing_articles")
      .select("id, slug, title, deck, excerpt, body, body_json, content_type, topics, status, published_at")
      .eq("status", "published")
      .not("slug", "is", null)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(PUBLIC_LIST_LIMIT)
      .abortSignal(signal);
    if (error || !Array.isArray(data)) return unavailablePublishedWriting();
    return { status: "data", data: (data as UnknownRow[])
      .map(mapPublicWritingSummary)
      .filter((article): article is PublicWritingSummary => article !== null)
      .filter(isPublicWritingReady) };
  }, unavailablePublishedWriting());
}, ["published-writing"], { revalidate: CACHE_SECONDS, tags: ["published-writing"] });

const queryPublishedWritingBySlug = unstable_cache(async (slug: string): Promise<PublicWritingArticle | null> => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return null;
  return withPublicWritingReadDeadline(async (signal) => {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const { data, error } = await getSupabaseServerClient()
      .from("writing_articles")
      .select("id, slug, title, deck, excerpt, body, body_json, content_type, topics, status, published_at")
      .eq("status", "published")
      .eq("slug", slug)
      .not("published_at", "is", null)
      .abortSignal(signal)
      .maybeSingle();
    if (error || !data) return null;
    const article = mapPublicWritingArticle(data as UnknownRow);
    return article && isPublicWritingReady(article) ? article : null;
  }, null);
}, ["published-writing-by-slug"], { revalidate: CACHE_SECONDS, tags: ["published-writing"] });

export async function getPublishedWriting(): Promise<PublicWritingSummary[]> {
  return (await queryPublishedWriting()).data;
}

export async function getPublishedWritingResult(): Promise<PublishedWritingReadResult> {
  return queryPublishedWriting();
}

export async function getPublishedWritingBySlug(slug: string): Promise<PublicWritingArticle | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug) || slug.length > 96) return null;
  return queryPublishedWritingBySlug(slug);
}
