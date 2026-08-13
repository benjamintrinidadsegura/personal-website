import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { processGuestCommentSubmission } from "../app/writing/comments/actions";
import { mapDiscussionState, mapPublicWritingComment, resolvePublicDiscussionRead } from "../lib/comments/domain";
import { COMMENTS_READ_TIMEOUT_MS, withCommentsReadDeadline } from "../lib/comments/read-deadline";
import {
  createCommentFormToken,
  reduceNetworkIdentifier,
  verifyCommentFormToken,
} from "../lib/comments/security";
import { validateGuestCommentSubmission } from "../lib/comments/validation";
import type { RawGuestCommentSubmission } from "../types/comments";

const NOW = Date.UTC(2026, 7, 14, 12, 0, 0);
const ARTICLE_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ARTICLE_ID = "22222222-2222-4222-8222-222222222222";
const FORM_SECRET = "writing-comment-form-secret-for-tests";
const NETWORK_SECRET = "writing-comment-network-secret-for-tests";
const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

function validRaw(overrides: Partial<RawGuestCommentSubmission> = {}): RawGuestCommentSubmission {
  return {
    displayName: "Ada",
    body: "A thoughtful response.",
    website: "",
    formToken: createCommentFormToken(ARTICLE_ID, FORM_SECRET, NOW - 4_000),
    ...overrides,
  };
}

const request = { origin: "http://localhost:3000", host: "localhost:3000", networkIdentifier: "192.0.2.123" };
const secrets = { networkHashSecret: NETWORK_SECRET, formTokenSecret: FORM_SECRET, siteUrl: "http://localhost:3000" };

test("discussion states accept only open, closed, and disabled", () => {
  assert.equal(mapDiscussionState("open"), "open");
  assert.equal(mapDiscussionState("closed"), "closed");
  assert.equal(mapDiscussionState("disabled"), "disabled");
  assert.equal(mapDiscussionState("pending"), null);
  assert.equal(mapDiscussionState(null), null);
});

test("guest names are normalized, bounded, single-line, and reject controls or bidi overrides", () => {
  const normalized = validateGuestCommentSubmission(validRaw({ displayName: "  Cafe\u0301  " }));
  assert.equal(normalized.success, true);
  if (normalized.success) assert.equal(normalized.data.displayName, "Café");
  for (const displayName of ["A", "A".repeat(41), "Ada\nLovelace", "Ada\u0007", "Ada\u202E"]) {
    assert.equal(validateGuestCommentSubmission(validRaw({ displayName })).success, false, JSON.stringify(displayName));
  }
  assert.equal(validateGuestCommentSubmission(validRaw({ displayName: "AB" })).success, true);
  assert.equal(validateGuestCommentSubmission(validRaw({ displayName: "A".repeat(40) })).success, true);
});

test("comment bodies preserve paragraphs and angle brackets while enforcing bounds", () => {
  for (const body of ["3 < 5", "React < Vue", "<3", "<script>alert('inert')</script>"]) {
    const result = validateGuestCommentSubmission(validRaw({ body }));
    assert.equal(result.success, true, body);
    if (result.success) assert.equal(result.data.body, body);
  }
  const normalized = validateGuestCommentSubmission(validRaw({ body: "  First\r\n\r\nSecond  " }));
  assert.equal(normalized.success, true);
  if (normalized.success) assert.equal(normalized.data.body, "First\n\nSecond");
  assert.equal(validateGuestCommentSubmission(validRaw({ body: "a" })).success, false);
  assert.equal(validateGuestCommentSubmission(validRaw({ body: "x".repeat(3_001) })).success, false);
  assert.equal(validateGuestCommentSubmission(validRaw({ body: Array.from({ length: 21 }, (_, index) => `P${index}`).join("\n\n") })).success, false);
  assert.equal(validateGuestCommentSubmission(validRaw({ body: "safe\u2066unsafe" })).success, false);
});

test("script-looking input crosses the persistence boundary as unchanged inert text", async () => {
  const body = "<script>globalThis.compromised = true</script>\n\nReact < Vue and 3 < 5";
  let capturedBody: string | null = null;
  const result = await processGuestCommentSubmission(ARTICLE_ID, validRaw({ body }), request, secrets, async (submission) => {
    capturedBody = submission.body;
    return { commentId: "33333333-3333-4333-8333-333333333333" };
  }, NOW);
  assert.deepEqual(result, { ok: true });
  assert.equal(capturedBody, body);
  const renderer = source("../components/writing/comments/comment-list.tsx");
  assert.equal(renderer.includes("{paragraph}"), true);
  assert.equal(renderer.includes("dangerouslySetInnerHTML"), false);
  assert.equal(renderer.includes("sanitize"), false);
  assert.equal(renderer.includes("markdown"), false);
});

test("submission attaches the trusted article UUID and never accepts a parent in 1A", async () => {
  let captured: Record<string, unknown> | null = null;
  const result = await processGuestCommentSubmission(ARTICLE_ID, validRaw(), request, secrets, async (submission) => {
    captured = submission;
    return { commentId: "33333333-3333-4333-8333-333333333333" };
  }, NOW);
  assert.deepEqual(result, { ok: true });
  const submitted = captured as Record<string, unknown> | null;
  assert.equal(submitted?.articleId, ARTICLE_ID);
  assert.equal(submitted?.parentCommentId, null);
  assert.equal(await processGuestCommentSubmission("not-a-uuid", validRaw(), request, secrets, async () => ({ commentId: "unexpected" }), NOW).then((value) => value.ok), false);
});

test("draft or missing articles and closed or disabled discussions are rejected", async () => {
  for (const [databaseCode, publicCode] of [
    ["WRITING_COMMENT_ARTICLE_UNAVAILABLE", "ARTICLE_UNAVAILABLE"],
    ["WRITING_COMMENT_DISCUSSION_CLOSED", "DISCUSSION_CLOSED"],
    ["WRITING_COMMENT_DISCUSSION_DISABLED", "DISCUSSION_DISABLED"],
  ] as const) {
    const result = await processGuestCommentSubmission(ARTICLE_ID, validRaw(), request, secrets, async () => ({ commentId: null, errorCode: databaseCode }), NOW);
    assert.deepEqual(result, { ok: false, code: publicCode });
  }
  const sql = source("../supabase/migrations/20260814000000_writing_comments_foundation.sql").toLowerCase();
  assert.match(sql, /v_article_status\s*<>\s*'published'/u);
  assert.equal(sql.includes("writing_comment_discussion_closed"), true);
  assert.equal(sql.includes("writing_comment_discussion_disabled"), true);
});

test("honeypot and cross-origin requests fail before database access", async () => {
  let calls = 0;
  const database = async () => { calls += 1; return { commentId: "unexpected" }; };
  assert.deepEqual(await processGuestCommentSubmission(ARTICLE_ID, validRaw({ website: "bot" }), request, secrets, database, NOW), { ok: false, code: "INVALID_REQUEST" });
  assert.deepEqual(await processGuestCommentSubmission(ARTICLE_ID, validRaw(), { ...request, origin: "https://evil.example" }, secrets, database, NOW), { ok: false, code: "INVALID_REQUEST" });
  assert.equal(calls, 0);
});

test("article-scoped tokens enforce age, expiry, signature, and scope", () => {
  assert.equal(verifyCommentFormToken(ARTICLE_ID, createCommentFormToken(ARTICLE_ID, FORM_SECRET, NOW - 4_000), FORM_SECRET, NOW).valid, true);
  assert.deepEqual(verifyCommentFormToken(ARTICLE_ID, createCommentFormToken(ARTICLE_ID, FORM_SECRET, NOW - 1_000), FORM_SECRET, NOW), { valid: false, reason: "too-young" });
  assert.equal(verifyCommentFormToken(ARTICLE_ID, createCommentFormToken(ARTICLE_ID, FORM_SECRET, NOW - 7_200_001), FORM_SECRET, NOW).valid, false);
  assert.equal(verifyCommentFormToken(OTHER_ARTICLE_ID, createCommentFormToken(ARTICLE_ID, FORM_SECRET, NOW - 4_000), FORM_SECRET, NOW).valid, false);
  assert.equal(verifyCommentFormToken(ARTICLE_ID, "invalid.token", FORM_SECRET, NOW).valid, false);
});

test("submission exposes controlled token, replay, duplicate, and rate failures", async () => {
  const tooFast = await processGuestCommentSubmission(ARTICLE_ID, validRaw({ formToken: createCommentFormToken(ARTICLE_ID, FORM_SECRET, NOW - 1_000) }), request, secrets, async () => ({ commentId: "unexpected" }), NOW);
  assert.deepEqual(tooFast, { ok: false, code: "SUBMISSION_TOO_FAST" });
  for (const [databaseCode, publicCode] of [
    ["WRITING_COMMENT_TOKEN_REPLAY", "INVALID_FORM_TOKEN"],
    ["WRITING_COMMENT_DUPLICATE", "DUPLICATE"],
    ["WRITING_COMMENT_RATE_15", "RATE_LIMITED"],
    ["WRITING_COMMENT_RATE_24", "RATE_LIMITED"],
  ] as const) {
    const result = await processGuestCommentSubmission(ARTICLE_ID, validRaw(), request, secrets, async () => ({ commentId: null, errorCode: databaseCode }), NOW);
    assert.deepEqual(result, { ok: false, code: publicCode });
  }
});

test("network identifiers are privacy-reduced before hashing", () => {
  assert.equal(reduceNetworkIdentifier("192.0.2.123"), "192.0.2");
  assert.equal(reduceNetworkIdentifier("2001:db8:abcd:1234:5678::1"), "2001:0db8:abcd:1234::/64");
  assert.equal(reduceNetworkIdentifier("not-an-ip"), null);
});

test("public mapping and query expose only visible top-level public fields", () => {
  const mapped = mapPublicWritingComment({ id: ARTICLE_ID, identity_kind: "guest", display_name: "Ada", is_author: false, body: "Hello", created_at: new Date(NOW).toISOString(), network_hash: "private", moderation_status: "visible" });
  assert.deepEqual(mapped, { id: ARTICLE_ID, identity: "guest", displayName: "Ada", isAuthor: false, body: "Hello", createdAt: new Date(NOW).toISOString() });
  assert.equal(JSON.stringify(mapped).includes("private"), false);
  const queries = source("../lib/comments/queries.ts");
  assert.equal(queries.includes('.rpc("list_public_writing_comments"'), true);
  assert.equal(queries.includes('.eq("status", "published")'), true);
  const migration = source("../supabase/migrations/20260815000000_writing_account_identity.sql");
  assert.equal(migration.includes("comment.moderation_status = 'visible'"), true);
  assert.equal(migration.includes("comment.parent_comment_id is null"), true);
  for (const privateField of ["network_hash", "message_hash", "form_token_hash", "moderation_notes", "auth.uid"]) assert.equal(queries.includes(privateField), false, privateField);
});

test("Comments reads use one bounded abort signal and clear successful deadlines", async () => {
  assert.equal(COMMENTS_READ_TIMEOUT_MS, 2_500);
  let successfulSignal: AbortSignal | null = null;
  const success = await withCommentsReadDeadline(async (signal) => {
    successfulSignal = signal;
    return { status: "empty" as const, state: "open" as const, comments: [] as [] };
  }, { status: "unavailable" as const, state: null, comments: [] as [] }, 20);
  assert.deepEqual(success, { status: "empty", state: "open", comments: [] });
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal((successfulSignal as AbortSignal | null)?.aborted, false);

  const queries = source("../lib/comments/queries.ts");
  assert.equal((queries.match(/\.abortSignal\(signal\)/gu) ?? []).length, 4);
  assert.equal(queries.includes("withCommentsReadDeadline"), true);
});

test("stalled and aborted Comments reads settle at unavailable without blocking Writing", async () => {
  let observedAbort = false;
  const startedAt = Date.now();
  const discussion = await withCommentsReadDeadline(
    (signal) => new Promise<never>((_resolve, reject) => {
      signal.addEventListener("abort", () => {
        observedAbort = true;
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    }),
    { status: "unavailable" as const, state: null, comments: [] as [] },
    15,
  );
  assert.equal(observedAbort, true);
  assert.ok(Date.now() - startedAt < 500);
  assert.deepEqual(discussion, { status: "unavailable", state: null, comments: [] });

  const page = source("../app/writing/[slug]/page.tsx");
  const articleAt = page.indexOf("if (!article) notFound()");
  const commentsAt = page.indexOf("getWritingDiscussionPageData(article.id)");
  const renderAt = page.indexOf("return (");
  assert.ok(articleAt >= 0 && articleAt < commentsAt && commentsAt < renderAt);
  assert.equal(source("../lib/comments/queries.ts").includes("catch {\n    return unavailable"), true);
});

test("controlled Comments read failures and successful reads retain existing result shapes", async () => {
  const controlledFailure = resolvePublicDiscussionRead(
    { data: { id: ARTICLE_ID }, error: null },
    { data: null, error: null },
    { data: null, error: { message: "controlled PostgREST failure" } },
  );
  assert.deepEqual(controlledFailure, { status: "unavailable", state: null, comments: [] });

  const createdAt = new Date(NOW).toISOString();
  const successfulRead = resolvePublicDiscussionRead(
    { data: { id: ARTICLE_ID }, error: null },
    { data: null, error: null },
    { data: [{ id: ARTICLE_ID, identity_kind: "guest", display_name: "Ada", is_author: false, body: "Hello", created_at: createdAt }], error: null },
  );
  assert.deepEqual(successfulRead, {
    status: "data",
    state: "open",
    comments: [{ id: ARTICLE_ID, identity: "guest", displayName: "Ada", isAuthor: false, body: "Hello", createdAt }],
  });
});

test("migration is additive, least-privilege, rate-limited, and parent-safe", () => {
  const sql = source("../supabase/migrations/20260814000000_writing_comments_foundation.sql").toLowerCase();
  for (const required of [
    "create table public.writing_discussions", "'open'", "'closed'", "'disabled'",
    "create table public.writing_comments", "parent_comment_id", "writing_comments_parent_same_article_fk",
    "foreign key (article_id, parent_comment_id)", "references public.writing_comments (article_id, id)",
    "create table public.writing_comment_rate_limits", "form_token_hash text not null unique",
    "pg_advisory_xact_lock", "writing_comment_token_replay", "writing_comment_duplicate",
    "writing_comment_rate_15", "writing_comment_rate_24", "enable row level security",
    "grant execute on function public.submit_guest_writing_comment", "to service_role",
  ]) assert.equal(sql.includes(required), true, required);
  assert.equal(sql.includes("writing-discussion:"), true);
  assert.equal(sql.includes("for update"), true);
  assert.equal(sql.includes("set search_path = pg_catalog, pg_temp"), true);
  assert.equal(sql.includes("set search_path = pg_catalog, public"), false);
  assert.equal(sql.includes("set search_path = pg_catalog, extensions"), false);
  assert.equal(sql.includes("set search_path = pg_catalog, public, extensions"), false);
  assert.equal(sql.includes("grant execute on function public.submit_guest_writing_comment(uuid, uuid, text, text, text, text, text)\n  to anon"), false);
  assert.equal(sql.includes("email"), false);
});

test("Writing article rendering isolates Comments failures and supports all public states", () => {
  const page = source("../app/writing/[slug]/page.tsx");
  const queries = source("../lib/comments/queries.ts");
  const domain = source("../lib/comments/domain.ts");
  const discussion = source("../components/writing/comments/discussion.tsx");
  const componentBody = page.slice(page.indexOf("export default async function WritingArticlePage"));
  assert.ok(componentBody.indexOf("getPublishedWritingBySlug") < componentBody.indexOf("getWritingDiscussionPageData"));
  assert.equal(queries.includes('status: "unavailable", state: null, comments: []'), true);
  assert.equal(domain.includes('settingsResult.data === null\n    ? "open"'), true);
  assert.equal(discussion.includes('discussion.status === "disabled"'), true);
  assert.equal(discussion.includes('discussion.state === "closed"'), true);
  assert.equal(discussion.includes('discussion.status === "empty"'), true);
  assert.equal(discussion.includes('discussion.status === "unavailable"'), true);
});
