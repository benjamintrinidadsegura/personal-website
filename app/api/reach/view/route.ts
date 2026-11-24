import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isReachCountry } from "@/lib/analytics/country-reach";
import { firstPartyReachEnabled } from "@/lib/analytics/first-party-config";
import { createPublicPageViewAllowlist } from "@/lib/analytics/public-page-view";

const paths = createPublicPageViewAllowlist();
const maxBytes = 96;

function response(status: number) {
  return new Response(null, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!firstPartyReachEnabled()) return response(404);
  const { headers } = request;
  const url = new URL(request.url);
  const referrer = headers.get("referer");
  if (url.hostname !== "btshq.online" || url.search
    || headers.get("origin") !== "https://btshq.online"
    || headers.get("sec-fetch-site") !== "same-origin"
    || headers.get("sec-gpc") === "1" || headers.get("dnt") === "1"
    || headers.has("cookie") || headers.has("authorization")
    || (referrer && referrer !== "https://btshq.online/")) return response(403);
  if (headers.get("content-type")?.toLowerCase().replace(/\s/gu, "") !== "text/plain;charset=utf-8") return response(415);
  const country = headers.get("x-vercel-ip-country");
  if (!isReachCountry(country) || /bot|crawler|spider|preview/i.test(headers.get("user-agent") ?? "")) return response(204);

  const body = request.body?.getReader();
  if (!body) return response(400);
  let pathname = "";
  let bytes = 0;
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    for (let chunk = await body.read(); !chunk.done; chunk = await body.read()) {
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) {
        await body.cancel();
        return response(413);
      }
      pathname += decoder.decode(chunk.value, { stream: true });
    }
    pathname += decoder.decode();
  } catch {
    return response(400);
  } finally {
    body.releaseLock();
  }
  if (!paths.has(pathname)) return response(400);

  try {
    const client = getSupabaseServerClient({ fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(2000) }) });
    const { error } = await client.rpc("record_reach_pageview", { p_country: country });
    return response(error ? 503 : 204);
  } catch {
    return response(503);
  }
}
