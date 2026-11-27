import { publicViewSource } from "@/lib/analytics/public-view-source";
import { insightsCollectionEnabled } from "@/lib/insights/config";
import { staticInsightsCatalog } from "@/lib/insights/catalog";
import { isInsightEvent } from "@/lib/insights/contract";
import { getPublishedWritingInsightTarget } from "@/lib/writing/queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { insightsDiagnostic } from "@/lib/insights/diagnostics";

const respond = (status: number) => new Response(null, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) {
  if (!insightsCollectionEnabled()) return respond(404);
  const url = new URL(request.url), h = request.headers;
  if (url.hostname !== "btshq.online" || url.search || h.get("origin") !== "https://btshq.online"
    || h.get("sec-fetch-site") !== "same-origin" || h.get("x-btshq-insights-consent") !== "v1"
    || h.has("cookie") || h.has("authorization") || h.has("x-btshq-test")
    || h.get("sec-gpc") === "1" || h.get("dnt") === "1"
    || (h.get("referer") && h.get("referer") !== "https://btshq.online/")) return respond(403);
  if (h.get("content-type")?.toLowerCase().replace(/\s/gu, "") !== "text/plain;charset=utf-8") return respond(415);
  if (/bot|crawler|spider|preview/iu.test(h.get("user-agent") ?? "")) return respond(202);
  const reader = request.body?.getReader();
  if (!reader) return respond(400);
  let text = "", size = 0;
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    for (let part = await reader.read(); !part.done; part = await reader.read()) {
      size += part.value.byteLength;
      if (size > 300) { await reader.cancel(); return respond(413); }
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
  } catch { return respond(400); } finally { reader.releaseLock(); }
  let event: { name?: unknown; contentId?: unknown; eventId?: unknown; at?: unknown };
  try { event = JSON.parse(text); } catch { return respond(400); }
  if (!event || Object.keys(event).sort().join() !== "at,contentId,eventId,name" || !isInsightEvent(event.name)
    || typeof event.contentId !== "string" || event.contentId.length > 80
    || typeof event.eventId !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/u.test(event.eventId)
    || typeof event.at !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(event.at)
    || !Number.isFinite(Date.parse(event.at)) || Date.parse(event.at) > Date.now() + 60000
    || Date.now() - Date.parse(event.at) >= 86400000 || event.at.slice(0, 10) !== new Date().toISOString().slice(0, 10)) return respond(400);
  if (publicViewSource() !== "legacy" && !["tool_start", "tool_complete"].includes(event.name)) return respond(404);
  try {
    if (event.name === "article_view") {
      // Fresh published-only evidence: no stale catalog can expose/count a draft or withdrawal.
      if (!event.contentId.startsWith("article:")) return respond(400);
      const writing = await getPublishedWritingInsightTarget(event.contentId.slice(8));
      if (writing.status === "unavailable") { insightsDiagnostic("publication_unavailable"); return respond(503); }
      if (writing.status !== "data") return respond(400);
    } else {
      const target = staticInsightsCatalog().find(({ id }) => id === event.contentId);
      if (!target || !(target.event === event.name || target.lifecycle && ["tool_start", "tool_complete"].includes(event.name))) return respond(400);
    }
    const { error } = await getSupabaseServerClient({ fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(2000) }) })
      .rpc("record_insight_event", { p_name: event.name, p_content_id: event.contentId, p_event_id: event.eventId, p_issued_at: event.at });
    insightsDiagnostic(error ? "rpc_failed" : "rpc_succeeded");
    return respond(error ? 503 : 204);
  } catch { insightsDiagnostic("request_failed"); return respond(503); }
}
