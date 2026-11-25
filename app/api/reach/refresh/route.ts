import { timingSafeEqual } from "node:crypto";
import { firstPartyReachRuntime } from "@/lib/analytics/first-party-config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!firstPartyReachRuntime()) return new Response(null, { status: 404 });
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  const expected = secret && secret.length >= 32 ? `Bearer ${secret}` : null;
  if (!expected || !header || Buffer.byteLength(header) !== Buffer.byteLength(expected)
    || !timingSafeEqual(Buffer.from(header), Buffer.from(expected))) return new Response(null, { status: 401 });
  try {
    const { error } = await getSupabaseServerClient({ fetch: (input, init) => fetch(input, {
      ...init, cache: "no-store", signal: AbortSignal.timeout(4000),
    }) }).rpc("maintain_reach_aggregates");
    return new Response(null, { status: error ? 503 : 204, headers: { "Cache-Control": "no-store" } });
  } catch { return new Response(null, { status: 503 }); }
}
