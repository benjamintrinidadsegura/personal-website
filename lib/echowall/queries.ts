import "server-only";

import { unstable_cache } from "next/cache";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  echoCategories,
  type EchoCategory,
  type PublicEcho,
  type PublicEchoQueryResult,
} from "@/types/echowall";

const MAX_PUBLIC_ECHOES = 50;
const CACHE_SECONDS = 300;

type PublicEchoRow = {
  id: unknown;
  display_name: unknown;
  message: unknown;
  category: unknown;
  approved_at: unknown;
};

function isCategory(value: unknown): value is EchoCategory {
  return echoCategories.some((category) => category === value);
}

function mapPublicEcho(row: PublicEchoRow): PublicEcho | null {
  if (
    typeof row.id !== "string" ||
    typeof row.display_name !== "string" ||
    typeof row.message !== "string" ||
    typeof row.approved_at !== "string" ||
    Number.isNaN(Date.parse(row.approved_at)) ||
    (row.category !== null && !isCategory(row.category))
  ) {
    return null;
  }

  return {
    id: row.id,
    displayName: row.display_name,
    message: row.message,
    category: row.category,
    publishedAt: row.approved_at,
  };
}

const queryApprovedEchoes = unstable_cache(
  async (requestedLimit: number): Promise<PublicEchoQueryResult> => {
    const limit = Math.min(Math.max(Math.trunc(requestedLimit), 1), MAX_PUBLIC_ECHOES);

    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("echoes")
        .select("id, display_name, message, category, approved_at")
        .eq("status", "approved")
        .not("approved_at", "is", null)
        .order("approved_at", { ascending: false })
        .limit(limit);

      if (error || !Array.isArray(data)) {
        return { status: "unavailable", echoes: [] };
      }

      const echoes = (data as PublicEchoRow[])
        .map(mapPublicEcho)
        .filter((echo): echo is PublicEcho => echo !== null);

      return echoes.length > 0
        ? { status: "data", echoes }
        : { status: "empty", echoes: [] };
    } catch {
      return { status: "unavailable", echoes: [] };
    }
  },
  ["approved-echoes"],
  { revalidate: CACHE_SECONDS, tags: ["approved-echoes"] },
);

export async function getApprovedEchoes(
  limit: number,
): Promise<PublicEchoQueryResult> {
  return queryApprovedEchoes(limit);
}
