import "server-only";

import { unstable_cache } from "next/cache";
import { isEchoCountryContextEnabled } from "@/lib/echowall/country-configuration";
import { isEchoCountry } from "@/lib/echowall/countries";

import { isPublicEchoReady } from "@/lib/public-content-hygiene";
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
  country_code?: unknown;
  include_in_community_map?: unknown;
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
    ...(isEchoCountry(row.country_code) ? {
      countryCode: row.country_code,
      includeInCommunityMap: row.include_in_community_map === true,
    } : {}),
  };
}

const queryApprovedEchoes = unstable_cache(
  async (requestedLimit: number, includeCountryContext: boolean): Promise<PublicEchoQueryResult> => {
    const limit = Math.min(Math.max(Math.trunc(requestedLimit), 1), MAX_PUBLIC_ECHOES);

    try {
      const supabase = getSupabaseServerClient();
      const read = (columns: string) => supabase
        .from("echoes")
        .select(columns)
        .eq("status", "approved")
        .not("approved_at", "is", null)
        .order("approved_at", { ascending: false })
        .limit(limit)
        .overrideTypes<PublicEchoRow[], { merge: false }>();

      const columns = "id, display_name, message, category, approved_at";
      let { data, error } = await read(includeCountryContext ? columns + ", country_code, include_in_community_map" : columns);
      const countryContextAvailable = includeCountryContext && !error && Array.isArray(data);
      if (includeCountryContext && !countryContextAvailable) ({ data, error } = await read(columns));

      if (error || !Array.isArray(data)) {
        return { status: "unavailable", echoes: [] };
      }

      const echoes = data
        .map(mapPublicEcho)
        .filter((echo): echo is PublicEcho => echo !== null)
        .filter(isPublicEchoReady);

      return echoes.length > 0
        ? { status: "data", echoes, countryContextAvailable }
        : { status: "empty", echoes: [], countryContextAvailable };
    } catch {
      return { status: "unavailable", echoes: [] };
    }
  },
  ["approved-echoes"],
  { revalidate: CACHE_SECONDS, tags: ["approved-echoes"] },
);

export async function getApprovedEchoes(
  limit: number,
  includeCountryContext = false,
): Promise<PublicEchoQueryResult> {
  return queryApprovedEchoes(limit, includeCountryContext && isEchoCountryContextEnabled());
}
