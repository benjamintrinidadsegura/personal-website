import { timingSafeEqual } from "node:crypto";
import { firstPartyReachRuntime } from "@/lib/analytics/first-party-config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { insightsMaintenanceEnabled } from "@/lib/insights/config";

export async function GET(request: Request) {
  if (!firstPartyReachRuntime()) return new Response(null, { status: 404 });
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  const expected = secret && secret.length >= 32 ? `Bearer ${secret}` : null;
  if (!expected || !header || Buffer.byteLength(header) !== Buffer.byteLength(expected)
    || !timingSafeEqual(Buffer.from(header), Buffer.from(expected))) return new Response(null, { status: 401 });
  try {
    const client = getSupabaseServerClient({ fetch: (input, init) => fetch(input, {
      ...init, cache: "no-store", signal: AbortSignal.timeout(4000),
    }) });
    // Independent maintenance: one failed source must not prevent the other's expiry.
    const results = await Promise.allSettled([
      client.rpc("maintain_reach_aggregates"),
      ...(insightsMaintenanceEnabled() ? [client.rpc("maintain_insights_aggregates")] : []),
    ]);
    const failed = results.some((result) => result.status === "rejected" || result.value.error);
    return new Response(null, { status: failed ? 503 : 204, headers: { "Cache-Control": "no-store" } });
  } catch { return new Response(null, { status: 503 }); }
}
