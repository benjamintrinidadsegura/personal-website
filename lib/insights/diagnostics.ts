/** Sampled operations only. No IDs, URLs, bodies, visitor attributes or provider errors. */
const last = new Map<string, number>();
export function insightsDiagnostic(outcome: "rpc_succeeded" | "rpc_failed" | "publication_unavailable" | "request_failed") {
  const now = Date.now(), previous = last.get(outcome);
  if (previous !== undefined && now - previous < 60000) return;
  last.set(outcome, now);
  console.info(JSON.stringify({ event: "btshq_insights", outcome }));
}
