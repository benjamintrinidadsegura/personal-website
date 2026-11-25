/** Fixed categories only; no URL, path, identifier, IP, body or provider error text.
 * At most one diagnostic per outcome/minute/instance. This is sampled operational
 * logging, not a counter or a durable per-visitor history.
 */
export type ReachOutcome = "consent_absent" | "privacy_signal" | "route_excluded" | "not_visible"
  | "disabled" | "invalid_request" | "country_unavailable" | "bot_excluded" | "rpc_failed" | "rpc_succeeded" | "request_failed";
const last = new Map<ReachOutcome, number>();
export function reachDiagnostic(outcome: ReachOutcome) {
  const now = Date.now();
  const previous = last.get(outcome);
  if (previous !== undefined && now - previous < 60000) return;
  last.set(outcome, now);
  console.info(JSON.stringify({ event: "btshq_reach", outcome }));
}
