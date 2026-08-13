import { unstable_cache } from "next/cache";

import { mapPublicWritingArticle, mapPublicWritingSummary } from "@/lib/writing/domain";
import type { PublicWritingArticle, PublicWritingSummary } from "@/types/writing";

const CACHE_SECONDS = 300;
const PUBLIC_LIST_LIMIT = 100;

type UnknownRow = Record<string, unknown>;

const queryPublishedWriting = unstable_cache(async (): Promise<PublicWritingSummary[]> => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return [];
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const { data, error } = await getSupabaseServerClient()
      .from("writing_articles")
      .select("id, slug, title, deck, excerpt, body, body_json, content_type, topics, status, published_at")
      .eq("status", "published")
      .not("slug", "is", null)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(PUBLIC_LIST_LIMIT);
    if (error || !Array.isArray(data)) return [];
    return (data as UnknownRow[]).map(mapPublicWritingSummary).filter((article): article is PublicWritingSummary => article !== null);
  } catch {
    return [];
  }
}, ["published-writing"], { revalidate: CACHE_SECONDS, tags: ["published-writing"] });

const queryPublishedWritingBySlug = unstable_cache(async (slug: string): Promise<PublicWritingArticle | null> => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return null;
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const { data, error } = await getSupabaseServerClient()
      .from("writing_articles")
      .select("id, slug, title, deck, excerpt, body, body_json, content_type, topics, status, published_at")
      .eq("status", "published")
      .eq("slug", slug)
      .not("published_at", "is", null)
      .maybeSingle();
    return error || !data ? null : mapPublicWritingArticle(data as UnknownRow);
  } catch {
    return null;
  }
}, ["published-writing-by-slug"], { revalidate: CACHE_SECONDS, tags: ["published-writing"] });

export async function getPublishedWriting(): Promise<PublicWritingSummary[]> {
  return queryPublishedWriting();
}

export async function getPublishedWritingBySlug(slug: string): Promise<PublicWritingArticle | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug) || slug.length > 96) return null;
  return queryPublishedWritingBySlug(slug);
}
