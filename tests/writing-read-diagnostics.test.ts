import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import type * as Server from "../lib/supabase/server";
import { withPublicWritingReadDeadline } from "../lib/writing/read-deadline";
import { loadSource } from "./helpers/load-source";
import { writingDiagnosticsHarness } from "./helpers/writing-diagnostics";

const id = "01a17ae3-1b02-7bd6-a76b-7298acdcd551";

test("auth classifications use known provider messages without inferring an unknown failed claim", () => {
  const { diagnostics } = writingDiagnosticsHarness();
  for (const [message, claimReason] of [
    ["JWT expired", "expired"], ["JWT not yet valid", "not_yet_valid"], ["JWT issued at future", "issued_in_future"],
    ["JWT not in audience", "audience"], ["Parsing claims failed", "parsing"],
    ["The JWT 'exp' claim must be a number", "invalid_exp"], ["The JWT 'nbf' claim must be a number", "invalid_nbf"],
    ["The JWT 'iat' claim must be a number", "invalid_iat"], ["The JWT 'aud' claim must be a string", "invalid_aud"],
    ["unknown error containing PRIVATE_TOKEN", "unclassified"],
  ]) {
    assert.deepEqual(diagnostics.classifyWritingReadFailure({ code: "PGRST303", message }, 401), { errorClass: "auth_claims", errorCode: "PGRST303", claimReason });
  }
  assert.equal(diagnostics.classifyWritingReadFailure({}, 401).errorClass, "authentication");
  assert.equal(diagnostics.classifyWritingReadFailure({ code: "42501" }).errorClass, "permission");
  assert.equal(diagnostics.classifyWritingReadFailure({}, 504).errorClass, "upstream_timeout");
  assert.equal(diagnostics.classifyWritingReadFailure({ cause: { code: "ENOTFOUND" } }).errorClass, "network");
  assert.equal(diagnostics.classifyWritingReadFailure({ name: "AbortError" }).errorClass, "aborted");
  assert.equal(diagnostics.classifyWritingReadFailure({ get code() { throw new Error("PRIVATE_TOKEN"); } }).errorClass, "exception");
});

test("logging reconstructs a fixed allowlist and rejects credential-bearing fields and invalid identifiers", () => {
  const { diagnostics, records } = writingDiagnosticsHarness();
  diagnostics.logWritingDiagnostic({
    operation: "collection_origin", state: "unavailable", correlationId: id, durationMs: Number.NaN,
    locale: "PRIVATE_TOKEN", consumer: "PRIVATE_SESSION", originReadId: "SECRET", upstreamRequestId: "SECRET",
    httpStatus: 999, attempts: 2, receivedCount: -1,
    failure: { errorClass: "auth_claims", errorCode: "PGRST303", claimReason: "unclassified", message: "SECRET" },
    body: "PRIVATE_ARTICLE", email: "PRIVATE_PERSON", authorization: "SECRET", session: "SECRET",
  } as unknown as Parameters<typeof diagnostics.logWritingDiagnostic>[0]);
  assert.deepEqual(records, [{
    event: "btshq.writing_read", schema_version: 1, operation: "collection_origin", state: "unavailable",
    correlation_id: id, duration_ms: 0, cache_event: "callback_execution", attempts: 2,
    error_class: "auth_claims", error_code: "PGRST303", claim_reason: "unclassified",
  }]);
  diagnostics.logWritingDiagnostic({ operation: "collection_origin", state: "unavailable", correlationId: "PRIVATE_TOKEN", durationMs: 1 });
  assert.equal(records.length, 1);
  assert.doesNotMatch(JSON.stringify(records), /PRIVATE_|SECRET|authorization|session|email|body|message/iu);
});

test("response observation forwards authentication and signals unchanged and never consumes response bodies", async () => {
  const controller = new AbortController();
  const init = { headers: { Authorization: "Bearer PRIVATE_TOKEN", Cookie: "PRIVATE_SESSION" }, signal: controller.signal };
  const response = new Response("PRIVATE_BODY", { status: 401, headers: { "sb-request-id": id, "set-cookie": "PRIVATE_SESSION" } });
  let forwarded: unknown[] = [];
  const { diagnostics, records } = writingDiagnosticsHarness({ fetch: async (...args) => { forwarded = args; return response; } });
  const observation = diagnostics.observeWritingRead();
  assert.equal(await observation.fetch("https://fixture.invalid/private?secret=PRIVATE_TOKEN", init), response);
  assert.equal(forwarded[1], init);
  assert.equal(response.bodyUsed, false);
  observation.finish("unavailable", "de", { errorClass: "auth_claims", errorCode: "PGRST303", claimReason: "unclassified" });
  assert.equal(records[0].http_status, 401);
  assert.equal(records[0].upstream_request_id, id);
  assert.equal(records[0].attempts, 1);
  assert.doesNotMatch(JSON.stringify(records), /PRIVATE_|fixture|cookie|https|Bearer/iu);
});

test("deadline diagnostics are emitted once and late responses cannot change their state", async () => {
  let resolve!: (response: Response) => void;
  const { diagnostics, records } = writingDiagnosticsHarness({ fetch: () => new Promise((done) => { resolve = done; }) });
  const observation = diagnostics.observeWritingRead();
  let aborted = false;
  const result = await withPublicWritingReadDeadline(async (signal) => {
    signal.addEventListener("abort", () => { aborted = true; });
    return observation.fetch("https://fixture.invalid", { signal });
  }, "fallback", 3, ({ kind }) => {
    assert.equal(kind, "timeout");
    observation.finish("timeout", "en", { errorClass: "deadline" });
  });
  assert.equal(result, "fallback");
  assert.equal(aborted, true);
  resolve(new Response("PRIVATE_BODY", { headers: { "sb-request-id": id } }));
  await new Promise((done) => setImmediate(done));
  observation.finish("success", "en");
  assert.equal(records.length, 1);
  assert.equal(records[0].state, "timeout");
  assert.equal(records[0].upstream_request_id, undefined);
  assert.equal(await withPublicWritingReadDeadline(async () => { throw new Error("SECRET"); }, "fallback", 3, () => { throw new Error("sink failed"); }), "fallback");
});

test("failed logging sinks cannot change read outcomes", () => {
  const { diagnostics } = writingDiagnosticsHarness({ sink: () => { throw new Error("sink failed"); } });
  for (const state of ["success", "unavailable"] as const) assert.doesNotThrow(() => diagnostics.observeWritingRead().finish(state, "de"));
});

test("fresh server clients use only configured authentication and do not inherit request sessions", async () => {
  const key = "sb_secret_fixture-only";
  const seen: Headers[] = [];
  const options: unknown[] = [];
  const server = loadSource<typeof Server>("lib/supabase/server.ts", {
    "server-only": {},
    "@supabase/supabase-js": { createClient: (url: string, secret: string, config: Parameters<typeof createClient>[2]) => {
      options.push(config);
      return createClient(url, secret, config);
    } },
  }, { process: { env: { SUPABASE_URL: "https://fixture.invalid", SUPABASE_SECRET_KEY: key, HTTP_AUTHORIZATION: "Bearer PRIVATE_SESSION", HTTP_COOKIE: "PRIVATE_SESSION" } } });
  const fetch: typeof globalThis.fetch = async (_url, init) => {
    seen.push(new Headers(init?.headers));
    return new Response("[]", { headers: { "content-type": "application/json" } });
  };
  const first = server.getSupabaseServerClient({ fetch });
  const second = server.getSupabaseServerClient({ fetch });
  assert.notEqual(first, second);
  await first.from("writing_articles").select("id").eq("status", "published");
  await second.from("writing_articles").select("id").eq("status", "published");
  assert.equal(seen.length, 2);
  for (const headers of seen) {
    assert.equal(headers.get("apikey"), key);
    assert.equal(headers.get("authorization"), `Bearer ${key}`);
    assert.equal(headers.has("cookie"), false);
  }
  assert.deepEqual(options, [1, 2].map(() => ({ global: { fetch }, auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } })));
});
