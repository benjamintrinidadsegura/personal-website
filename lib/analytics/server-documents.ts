import "server-only";
import { randomUUID } from "node:crypto";
import { stripLocalePrefix } from "@/lib/i18n/routing";
import { staticInsightsCatalog } from "@/lib/insights/catalog";
import { getPublishedWritingDocumentTarget } from "@/lib/writing/queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isReachCountry } from "./country-reach";
import { serverDocumentsEnabled } from "./public-view-source";

const lastDiagnostic = new Map<string, number>();
function diagnostic(outcome: string) {
  const now = Date.now(); if (now - (lastDiagnostic.get(outcome) ?? 0) < 60000) return;
  lastDiagnostic.set(outcome, now);
  console.info(JSON.stringify({ event: "btshq_server_document", outcome }));
}
const overview = new Set(["/", "/about", "/people", "/writing", "/projects"]);
/** Only normal public document requests. No RSC/prefetch/private/query collection. */
export function eligibleServerDocument(request: Request, responseStatus: number) {
  if (!serverDocumentsEnabled() || request.method !== "GET" || responseStatus !== 200) return null;
  const url = new URL(request.url), h = request.headers;
  if (url.origin !== "https://btshq.online" || url.search || url.hash
    || h.get("sec-fetch-mode") !== "navigate" || h.get("sec-fetch-dest") !== "document"
    || !h.get("accept")?.includes("text/html") || h.has("rsc") || h.has("next-router-prefetch")
    || h.has("x-bts-internal-rewrite-locale")
    || /prefetch|prerender/iu.test((h.get("purpose") ?? "") + " " + (h.get("sec-purpose") ?? ""))
    || h.get("dnt") === "1" || h.get("sec-gpc") === "1"
    || /bot|crawler|spider|preview/iu.test(h.get("user-agent") ?? "") || h.has("x-btshq-test")) return null;
  const path = stripLocalePrefix(url.pathname);
  const target = staticInsightsCatalog().find((item) => item.href === path);
  if (!target && !overview.has(path) && !/^\/writing\/[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(path)) return null;
  // Capture only these fields; no Request, headers, IP, referrer or cookie enters the task.
  const value = h.get("x-vercel-ip-country");
  return { path, country: isReachCountry(value) ? value : null, target: target ? { name: target.event, id: target.id } : null,
    id: randomUUID(), at: new Date().toISOString() };
}
export async function recordServerDocument(event: NonNullable<ReturnType<typeof eligibleServerDocument>>) {
  try {
    let name: string | null = event.target?.name ?? null;
    let contentId = event.target?.id ?? "public:" + (event.path === "/" ? "home" : event.path.slice(1));
    if (event.path.startsWith("/writing/")) {
      const result = await getPublishedWritingDocumentTarget(event.path.slice(9));
      if (result.status !== "data") return; // No stale withdrawn article or fabricated target.
      name = "article_view"; contentId = "article:" + result.article.id;
    }
    const client = getSupabaseServerClient({ fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(2000) }) });
    const params = { p_name: name, p_content_id: contentId, p_country: event.country, p_event_id: event.id, p_issued_at: event.at };
    // Stable per-request identity across bounded retries. No browser/user identifier.
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await client.rpc("record_server_public_document", params);
      if (!result.error && ["recorded", "duplicate", "inactive"].includes(result.data)) {
        diagnostic(result.data === "recorded" ? event.country ? "recorded_geo" : "recorded_no_geo" : result.data); return;
      }
    }
    diagnostic("write_unavailable");
  } catch { diagnostic("write_unavailable"); /* Measurement must never fail the requested product page. */ }
}
