import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isEchoCountry } from "./countries";
import { getApprovedEchoes } from "./queries";
import { echoPageSize, parseEchoFeed } from "./feed";
import { echoReactionIdentity, reactionSecret } from "./reaction-identity";
import { isKnownPublicSyntheticValue, isPublicEchoReady } from "@/lib/public-content-hygiene";
import { echoCategories, type PublicEcho } from "@/types/echowall";

export type EchoFeed = {
  status: "ready"; echoes: PublicEcho[]; published: number; matched: number; reactions: boolean; publicCountryAvailable?: boolean;
} | { status: "limited"; echoes: PublicEcho[] } | { status: "unavailable"; echoes: [] };

type FeedRow = {
  id: string; display_name: string; message: string; category: PublicEcho["category"];
  approved_at: string; reply: string | null; likes: number | null; liked: boolean; public_country_code?: unknown;
};

function mapRow(row: FeedRow, allowPublicCountry: boolean): PublicEcho | null {
  if (typeof row?.id !== "string" || typeof row.display_name !== "string" || typeof row.message !== "string"
    || typeof row.approved_at !== "string" || !Number.isFinite(Date.parse(row.approved_at))
    || (row.category !== null && !echoCategories.includes(row.category))) return null;
  const echo: PublicEcho = {
    id: row.id, displayName: row.display_name, message: row.message, category: row.category, publishedAt: row.approved_at,
    reply: typeof row.reply === "string" && !isKnownPublicSyntheticValue(row.reply) ? row.reply : undefined,
    likes: typeof row.likes === "number" && Number.isSafeInteger(row.likes) && row.likes >= 0 ? row.likes : undefined,
    liked: row.liked === true,
    ...(allowPublicCountry && isEchoCountry(row.public_country_code) ? { publicCountryCode: row.public_country_code } : {}),
  };
  return isPublicEchoReady(echo) ? echo : null;
}

export async function readPublicEchoFeed(query: ReturnType<typeof parseEchoFeed>, size = echoPageSize, interactive = true): Promise<EchoFeed> {
  try {
    const secret = reactionSecret();
    const identity = interactive && secret ? await echoReactionIdentity(secret) : null;
    const client = getSupabaseServerClient({ fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) });
    const args = {
      p_query: query.keyword, p_page: query.page, p_size: size, p_popular: query.popular,
      p_counts: !!secret, p_actor: identity?.key ?? null,
    };
    let publicCountryAvailable = process.env.ECHOWALL_PUBLIC_COUNTRY_ENABLED === "true";
    let { data, error } = await client.rpc(publicCountryAvailable ? "get_public_echo_feed_with_countries" : "get_public_echo_feed", args);
    if (publicCountryAvailable && error?.code === "PGRST202") {
      publicCountryAvailable = false;
      ({ data, error } = await client.rpc("get_public_echo_feed", args));
    }
    // Preserve the established published-only feed until the additive schema is available.
    if (error?.code === "PGRST202" && !query.keyword && query.page === 1 && !query.popular) {
      const old = await getApprovedEchoes(size);
      return old.status === "unavailable" ? { status: "unavailable", echoes: [] } : { status: "limited", echoes: old.echoes };
    }
    if (error || !Array.isArray(data?.echoes) || !Number.isSafeInteger(data.published) || !Number.isSafeInteger(data.matched)
      || data.published < 0 || data.matched < 0 || data.matched > data.published) return { status: "unavailable", echoes: [] };
    const echoes: PublicEcho[] = (data.echoes as FeedRow[]).map((row) => mapRow(row, publicCountryAvailable)).filter((echo): echo is PublicEcho => echo !== null);
    if (echoes.length !== data.echoes.length) return { status: "unavailable", echoes: [] };
    return { status: "ready", echoes, published: data.published, matched: data.matched, reactions: !!secret, ...(publicCountryAvailable ? { publicCountryAvailable } : {}) };
  } catch {
    return { status: "unavailable", echoes: [] };
  }
}
