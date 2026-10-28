import "server-only";

import { randomUUID } from "node:crypto";

export type WritingReadState = "success" | "unavailable" | "timeout";
export type WritingReadConsumer = "writing_index" | "home" | "discovery_index" | "sitemap" | "unspecified";
export type WritingReadContext = { consumer: WritingReadConsumer; correlationId?: string };
type Operation = "collection_origin" | "collection_result" | "sitemap_generation";
type ErrorClass = "configuration_missing" | "initialization_error" | "auth_claims" | "authentication" | "permission" | "upstream_timeout" | "upstream_error" | "invalid_response" | "mapping_error" | "network" | "aborted" | "exception" | "deadline" | "empty_sitemap";
type ClaimReason = "expired" | "not_yet_valid" | "issued_in_future" | "audience" | "invalid_exp" | "invalid_nbf" | "invalid_iat" | "invalid_aud" | "parsing" | "unclassified";
type ErrorCode = "PGRST000" | "PGRST001" | "PGRST002" | "PGRST003" | "PGRST301" | "PGRST302" | "PGRST303" | "42501";
export type WritingReadFailure = { errorClass: ErrorClass; errorCode?: ErrorCode; claimReason?: ClaimReason };
type Diagnostic = {
  operation: Operation;
  state: WritingReadState;
  correlationId: string;
  durationMs: number;
  consumer?: WritingReadConsumer;
  locale?: string;
  originReadId?: string;
  originState?: WritingReadState;
  failure?: WritingReadFailure;
  httpStatus?: number;
  upstreamRequestId?: string;
  attempts?: number;
  receivedCount?: number;
  acceptedCount?: number;
  emittedUrlCount?: number;
};

const states = new Set(["success", "unavailable", "timeout"]);
const consumers = new Set(["writing_index", "home", "discovery_index", "sitemap", "unspecified"]);
const languages = new Set(["de", "en", "es", "tr", "pl", "el", "ru"]);
const classes = new Set(["configuration_missing", "initialization_error", "auth_claims", "authentication", "permission", "upstream_timeout", "upstream_error", "invalid_response", "mapping_error", "network", "aborted", "exception", "deadline", "empty_sitemap"]);
const codes = new Set(["PGRST000", "PGRST001", "PGRST002", "PGRST003", "PGRST301", "PGRST302", "PGRST303", "42501"]);
const reasons = new Set(["expired", "not_yet_valid", "issued_in_future", "audience", "invalid_exp", "invalid_nbf", "invalid_iat", "invalid_aud", "parsing", "unclassified"]);
const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value);
const number = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const field = (error: unknown, name: string): unknown => {
  try { return error && typeof error === "object" ? (error as Record<string, unknown>)[name] : undefined; }
  catch { return undefined; }
};

/** Only fixed classifications leave this function; provider messages/details never do. */
export function classifyWritingReadFailure(error: unknown, httpStatus?: number): WritingReadFailure {
  const rawCode = field(error, "code");
  const errorCode = typeof rawCode === "string" && codes.has(rawCode) ? rawCode as ErrorCode : undefined;
  if (errorCode === "PGRST303") {
    const message = field(error, "message");
    const known: Record<string, ClaimReason> = { "JWT expired": "expired", "JWT not yet valid": "not_yet_valid", "JWT issued at future": "issued_in_future", "JWT not in audience": "audience", "Parsing claims failed": "parsing" };
    const text = typeof message === "string" ? message.slice(0, 160) : "";
    const claim = /^The JWT '(exp|nbf|iat|aud)' claim must be /u.exec(text)?.[1];
    const claimReason = Object.hasOwn(known, text) ? known[text] : claim ? `invalid_${claim}` as ClaimReason : "unclassified";
    return { errorClass: "auth_claims", errorCode, claimReason };
  }
  if (errorCode === "42501" || httpStatus === 403) return { errorClass: "permission", errorCode };
  if (errorCode === "PGRST301" || errorCode === "PGRST302" || httpStatus === 401) return { errorClass: "authentication", errorCode };
  if (errorCode === "PGRST003" || httpStatus === 504) return { errorClass: "upstream_timeout", errorCode };
  if (errorCode || (httpStatus !== undefined && httpStatus >= 400)) return { errorClass: "upstream_error", errorCode };
  if (field(error, "name") === "AbortError") return { errorClass: "aborted" };
  const networkCode = field(field(error, "cause"), "code") ?? rawCode;
  if (typeof networkCode === "string" && ["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT"].includes(networkCode)) return { errorClass: "network" };
  return { errorClass: "exception" };
}

export const newWritingCorrelationId = () => randomUUID();

/** Reconstruct a bounded allowlist: never serialize caller objects, errors, URLs or headers. */
export function logWritingDiagnostic(input: Diagnostic): void {
  try {
    if (!["collection_origin", "collection_result", "sitemap_generation"].includes(input.operation) || !states.has(input.state) || !uuid(input.correlationId)) return;
    const record: Record<string, string | number> = {
      event: "btshq.writing_read", schema_version: 1, operation: input.operation, state: input.state,
      correlation_id: input.correlationId, duration_ms: number(input.durationMs) ? Math.round(input.durationMs) : 0,
      cache_event: input.operation === "collection_origin" ? "callback_execution" : input.operation === "collection_result" ? "result_delivery" : "handler_execution",
    };
    if (input.consumer && consumers.has(input.consumer)) record.consumer = input.consumer;
    if (input.locale && languages.has(input.locale)) record.locale = input.locale;
    if (uuid(input.originReadId)) record.origin_read_id = input.originReadId;
    if (input.originState && states.has(input.originState)) record.origin_state = input.originState;
    if (uuid(input.upstreamRequestId)) record.upstream_request_id = input.upstreamRequestId;
    if (Number.isInteger(input.httpStatus) && input.httpStatus! >= 100 && input.httpStatus! <= 599) record.http_status = input.httpStatus!;
    for (const [key, value] of [["attempts", input.attempts], ["received_count", input.receivedCount], ["accepted_count", input.acceptedCount], ["emitted_url_count", input.emittedUrlCount]] as const) {
      if (number(value) && Number.isInteger(value)) record[key] = value;
    }
    if (input.failure && classes.has(input.failure.errorClass)) record.error_class = input.failure.errorClass;
    if (input.failure?.errorCode && codes.has(input.failure.errorCode)) record.error_code = input.failure.errorCode;
    if (input.failure?.claimReason && reasons.has(input.failure.claimReason)) record.claim_reason = input.failure.claimReason;
    const line = JSON.stringify(record);
    if (input.state === "success") console.info(line); else console.warn(line);
  } catch { /* Diagnostics must not change public read/output behavior. */ }
}

/** Observe responses only. Forward request URL, headers, signal and response unchanged. */
export function observeWritingRead() {
  const started = performance.now();
  const readId = newWritingCorrelationId();
  let closed = false;
  let attempts = 0;
  let httpStatus: number | undefined;
  let upstreamRequestId: string | undefined;
  const fetch: typeof globalThis.fetch = async (...args) => {
    attempts++;
    const response = await globalThis.fetch(...args);
    if (!closed) {
      try {
        httpStatus = response.status;
        const id = response.headers.get("sb-request-id");
        upstreamRequestId = uuid(id) ? id : undefined;
      } catch { /* A failed observation must not fail the actual request. */ }
    }
    return response;
  };
  return {
    readId, fetch,
    finish(state: WritingReadState, locale: string, failure?: WritingReadFailure, counts?: { receivedCount?: number; acceptedCount?: number }, status?: number) {
      if (closed) return;
      closed = true;
      logWritingDiagnostic({ operation: "collection_origin", state, correlationId: readId, locale,
        durationMs: performance.now() - started, attempts, httpStatus: httpStatus ?? status, upstreamRequestId, failure,
        receivedCount: counts?.receivedCount, acceptedCount: counts?.acceptedCount });
    },
  };
}
