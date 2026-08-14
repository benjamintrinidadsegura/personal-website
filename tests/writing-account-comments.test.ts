import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { processAccountCommentSubmission } from "../app/writing/comments/actions";
import { processDisplayNameSetup, validateAccountDisplayName } from "../lib/account/profile";
import { mapPublicWritingComment } from "../lib/comments/domain";
import {
  createAccountCommentFormToken,
  verifyAccountCommentFormToken,
} from "../lib/comments/security";

const NOW = Date.UTC(2026, 7, 15, 12, 0, 0);
const ARTICLE_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ARTICLE_ID = "22222222-2222-4222-8222-222222222222";
const USER_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_USER_ID = "44444444-4444-4444-8444-444444444444";
const FORM_SECRET = "account-comment-form-secret-for-tests";
const NETWORK_SECRET = "account-comment-network-secret-for-tests";
const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const request = { origin: "http://localhost:3000", host: "localhost:3000", networkIdentifier: "192.0.2.123" };
const secrets = { networkHashSecret: NETWORK_SECRET, formTokenSecret: FORM_SECRET, siteUrl: "http://localhost:3000" };

function validRaw(overrides: Partial<{ body: unknown; website: unknown; formToken: unknown }> = {}) {
  return {
    body: "An account response.",
    website: "",
    formToken: createAccountCommentFormToken(ARTICLE_ID, USER_ID, FORM_SECRET, NOW - 4_000),
    ...overrides,
  };
}

test("display names normalize Unicode and whitespace while preserving human text", () => {
  assert.deepEqual(validateAccountDisplayName("  Cafe\u0301   Person  "), { success: true, displayName: "Café Person" });
  assert.deepEqual(validateAccountDisplayName("Ada 🚀"), { success: true, displayName: "Ada 🚀" });
  assert.deepEqual(validateAccountDisplayName("React < Vue"), { success: true, displayName: "React < Vue" });
  assert.equal(validateAccountDisplayName("A").success, false);
  assert.equal(validateAccountDisplayName("A".repeat(41)).success, false);
  assert.equal(validateAccountDisplayName("Ada\nLovelace").success, false);
  for (const value of ["Ada\u0007", "Ada\u202e", "Ada\u2066"]) {
    assert.equal(validateAccountDisplayName(value).success, false);
  }
});

test("official structural display names are reserved but ordinary duplicates are allowed", () => {
  for (const value of ["guest", "AUTHOR", "Admin", "administrator", "moderator", "staff", "support", "bts.online", "BTS Studio"]) {
    assert.equal(validateAccountDisplayName(value).success, false, value);
  }
  assert.equal(validateAccountDisplayName("Ada").success, true);
  assert.equal(validateAccountDisplayName("Ada").success, true);
  const migration = source("../supabase/migrations/20260815000000_writing_account_identity.sql").toLowerCase();
  assert.equal(migration.includes("display_name text not null unique"), false);
});

test("profile setup saves only the verified caller and cannot target another account", async () => {
  let saved: { userId: string; displayName: string } | null = null;
  const success = await processDisplayNameSetup("  Ada   Lovelace ", USER_ID, true, async (userId, displayName) => {
    saved = { userId, displayName };
    return true;
  });
  assert.deepEqual(success, { ok: true });
  assert.deepEqual(saved, { userId: USER_ID, displayName: "Ada Lovelace" });

  let calls = 0;
  const denied = await processDisplayNameSetup("Ada", null, true, async () => { calls += 1; return true; });
  assert.deepEqual(denied, { ok: false, message: "Display name could not be saved." });
  assert.equal(calls, 0);
  const action = source("../app/account/actions.ts");
  assert.equal(action.includes('formData.get("userId")'), false);
  assert.equal(action.includes("auth.auth.getUser()"), true);
});

test("account submission requires verified identity and accepts no browser identity fields", async () => {
  let captured: Record<string, unknown> | null = null;
  const success = await processAccountCommentSubmission(ARTICLE_ID, validRaw(), request, USER_ID, secrets, async (submission) => {
    captured = submission;
    return { commentId: "55555555-5555-4555-8555-555555555555" };
  }, NOW);
  assert.deepEqual(success, { ok: true });
  const submitted = captured as Record<string, unknown> | null;
  assert.equal(submitted?.actorUserId, USER_ID);
  assert.equal(submitted?.articleId, ARTICLE_ID);
  assert.equal(submitted?.body, "An account response.");
  for (const field of ["displayName", "profileId", "identityKind", "role", "isAuthor", "parentCommentId"]) {
    assert.equal(Object.hasOwn(submitted ?? {}, field), false, field);
  }

  let calls = 0;
  const denied = await processAccountCommentSubmission(ARTICLE_ID, validRaw(), request, null, secrets, async () => { calls += 1; return { commentId: "unexpected" }; }, NOW);
  assert.equal(denied.ok, false);
  assert.equal(calls, 0);
  const component = source("../components/writing/comments/account-comment-form.tsx");
  for (const name of ["userId", "profileId", "displayName", "identityKind", "role", "isAuthor"]) {
    assert.equal(component.includes(`name="${name}"`), false, name);
  }
});

test("account submission preserves inert plain text and enforces honeypot and origin", async () => {
  const body = "<script>alert('inert')</script>\n\n3 < 5 and <3";
  let stored = "";
  const success = await processAccountCommentSubmission(ARTICLE_ID, validRaw({ body }), request, USER_ID, secrets, async (submission) => {
    stored = submission.body;
    return { commentId: "55555555-5555-4555-8555-555555555555" };
  }, NOW);
  assert.deepEqual(success, { ok: true });
  assert.equal(stored, body);
  assert.equal((await processAccountCommentSubmission(ARTICLE_ID, validRaw({ website: "bot" }), request, USER_ID, secrets, async () => ({ commentId: "unexpected" }), NOW)).ok, false);
  assert.equal((await processAccountCommentSubmission(ARTICLE_ID, validRaw(), { ...request, origin: "https://evil.example" }, USER_ID, secrets, async () => ({ commentId: "unexpected" }), NOW)).ok, false);
  const renderer = source("../components/writing/comments/comment-list.tsx") + source("../components/writing/comments/comment-body.tsx");
  assert.equal(renderer.includes("dangerouslySetInnerHTML"), false);
  assert.equal(renderer.includes("{paragraph}"), true);
});

test("account tokens are scoped to article and verified user with age and expiry", () => {
  const valid = createAccountCommentFormToken(ARTICLE_ID, USER_ID, FORM_SECRET, NOW - 4_000);
  assert.equal(verifyAccountCommentFormToken(ARTICLE_ID, USER_ID, valid, FORM_SECRET, NOW).valid, true);
  assert.equal(verifyAccountCommentFormToken(OTHER_ARTICLE_ID, USER_ID, valid, FORM_SECRET, NOW).valid, false);
  assert.equal(verifyAccountCommentFormToken(ARTICLE_ID, OTHER_USER_ID, valid, FORM_SECRET, NOW).valid, false);
  assert.deepEqual(
    verifyAccountCommentFormToken(ARTICLE_ID, USER_ID, createAccountCommentFormToken(ARTICLE_ID, USER_ID, FORM_SECRET, NOW - 1_000), FORM_SECRET, NOW),
    { valid: false, reason: "too-young" },
  );
  assert.equal(verifyAccountCommentFormToken(ARTICLE_ID, USER_ID, createAccountCommentFormToken(ARTICLE_ID, USER_ID, FORM_SECRET, NOW - 7_200_001), FORM_SECRET, NOW).valid, false);
});

test("account database failures remain controlled", async () => {
  for (const [databaseCode, publicCode] of [
    ["WRITING_COMMENT_TOKEN_REPLAY", "INVALID_FORM_TOKEN"],
    ["WRITING_COMMENT_DUPLICATE", "DUPLICATE"],
    ["WRITING_ACCOUNT_COMMENT_RATE_15", "RATE_LIMITED"],
    ["WRITING_ACCOUNT_COMMENT_RATE_24", "RATE_LIMITED"],
    ["WRITING_ACCOUNT_COMMENT_NETWORK_RATE_15", "RATE_LIMITED"],
    ["WRITING_ACCOUNT_COMMENT_NETWORK_RATE_24", "RATE_LIMITED"],
    ["WRITING_COMMENT_ARTICLE_UNAVAILABLE", "ARTICLE_UNAVAILABLE"],
    ["WRITING_COMMENT_DISCUSSION_CLOSED", "DISCUSSION_CLOSED"],
    ["WRITING_COMMENT_DISCUSSION_DISABLED", "DISCUSSION_DISABLED"],
    ["WRITING_ACCOUNT_COMMENT_PROFILE_REQUIRED", "PROFILE_REQUIRED"],
  ] as const) {
    const result = await processAccountCommentSubmission(ARTICLE_ID, validRaw(), request, USER_ID, secrets, async () => ({ commentId: null, errorCode: databaseCode }), NOW);
    assert.deepEqual(result, { ok: false, code: publicCode });
  }
});

test("public projection discriminates guest, account, and AUTHOR without private identity", () => {
  const createdAt = new Date(NOW).toISOString();
  assert.deepEqual(mapPublicWritingComment({ id: ARTICLE_ID, identity_kind: "guest", display_name: "Visitor", body: "Hello", created_at: createdAt, is_author: false, is_edited: false, is_author_deleted: false, can_edit: false, can_delete: false, owner_version: null }), {
    deletion: "active", id: ARTICLE_ID, identity: "guest", displayName: "Visitor", isAuthor: false, isEdited: false, body: "Hello", createdAt, canEdit: false, canDelete: false, ownerVersion: null,
  });
  assert.deepEqual(mapPublicWritingComment({ id: ARTICLE_ID, identity_kind: "account", display_name: "Ada", body: "Hello", created_at: createdAt, is_author: true, is_edited: false, is_author_deleted: false, can_edit: false, can_delete: false, owner_version: null, user_id: USER_ID, email: "private@example.test" }), {
    deletion: "active", id: ARTICLE_ID, identity: "account", displayName: "Ada", isAuthor: true, isEdited: false, body: "Hello", createdAt, canEdit: false, canDelete: false, ownerVersion: null,
  });
  assert.equal(mapPublicWritingComment({ id: ARTICLE_ID, identity_kind: "guest", display_name: "Fake", body: "Hello", created_at: createdAt, is_author: true, is_edited: false, is_author_deleted: false, can_edit: false, can_delete: false, owner_version: null }), null);
  const query = source("../lib/comments/queries.ts");
  for (const privateField of ["email", "account_profile_id", "network_hash", "message_hash", "form_token_hash"]) {
    assert.equal(query.includes(privateField), false, privateField);
  }
});

test("AUTHOR is a live active-admin projection and cannot be submitted or snapshotted", () => {
  const sql = source("../supabase/migrations/20260815000000_writing_account_identity.sql").toLowerCase();
  assert.equal(sql.includes("join public.admin_users as admin on admin.user_id = profile.user_id"), true);
  assert.equal(sql.includes("admin.role = 'admin'"), true);
  assert.equal(sql.includes("admin.is_active = true"), true);
  assert.equal(sql.includes("add column is_author"), false);
  assert.equal(sql.includes("insert into public.writing_comments") && sql.includes("is_author,"), false);
  const action = source("../app/writing/comments/actions.ts");
  assert.equal(action.includes('formData.get("isAuthor")'), false);
  assert.equal(action.includes('formData.get("role")'), false);
});

test("migration is additive, least privilege, account-limited, and leaves 1A unchanged", () => {
  const sql = source("../supabase/migrations/20260815000000_writing_account_identity.sql").toLowerCase();
  for (const required of [
    "create table public.bts_account_profiles",
    "user_id uuid not null unique references auth.users",
    "add column identity_kind",
    "add column account_profile_id",
    "create table public.writing_account_comment_events",
    "writing_account_comment_rate_15",
    "writing_account_comment_rate_24",
    "writing_account_comment_network_rate_15",
    "writing_account_comment_network_rate_24",
    "pg_advisory_xact_lock",
    "writing_comment_token_replay",
    "writing_comment_duplicate",
    "enable row level security",
    "set search_path = pg_catalog, pg_temp",
    "notify pgrst, 'reload schema'",
  ]) assert.equal(sql.includes(required), true, required);
  assert.equal((sql.match(/set search_path = pg_catalog, pg_temp/gu) ?? []).length, 3);
  assert.equal(sql.includes("set search_path = pg_catalog, public"), false);
  assert.equal(sql.includes("grant execute on function public.submit_account_writing_comment") && sql.includes("to service_role"), true);
  assert.equal(sql.includes("to anon"), false);
  assert.equal(sql.includes("to authenticated"), false);
  assert.equal(sql.includes("edited_at"), false);
  assert.equal(sql.includes("author_deleted_at"), false);
  assert.equal(sql.includes("tombstone"), false);
  assert.equal(source("../supabase/migrations/20260814000000_writing_comments_foundation.sql").includes("identity_kind"), false);
});

test("viewer and profile resolution stay uncached inside the Comments deadline", () => {
  const query = source("../lib/comments/queries.ts");
  assert.equal(query.includes("withCommentsReadDeadline"), true);
  assert.ok(query.indexOf("withCommentsReadDeadline") < query.indexOf("auth.auth.getUser()"));
  assert.ok(query.indexOf("withCommentsReadDeadline") < query.indexOf('.from("bts_account_profiles")'));
  assert.equal((query.match(/\.abortSignal\(signal\)/gu) ?? []).length, 4);
  assert.equal(query.includes("unstable_cache"), false);
  assert.equal(query.includes("participation: { kind: \"unavailable\" }"), true);
  const page = source("../app/writing/[slug]/page.tsx");
  const component = page.slice(page.indexOf("export default async function WritingArticlePage"));
  assert.ok(component.indexOf("getPublishedWritingBySlug") < component.indexOf("getWritingDiscussionPageData"));
});

test("inline account identity and submission remain accessible on narrow layouts", () => {
  const setup = source("../components/writing/comments/display-name-setup.tsx");
  const form = source("../components/writing/comments/account-comment-form.tsx");
  const list = source("../components/writing/comments/comment-list.tsx");
  for (const required of [
    'htmlFor="account-display-name"',
    'role="status"',
    'aria-live="polite"',
    "min-h-12",
    "w-full",
  ]) assert.equal(setup.includes(required), true, required);
  for (const required of [
    'htmlFor="account-comment-body"',
    'aria-live="polite"',
    "feedback.current?.focus()",
    "min-h-12",
    "w-full",
  ]) assert.equal(form.includes(required), true, required);
  assert.equal(list.includes("break-words"), true);
  assert.equal(list.includes(">Author<"), true);
  assert.equal(list.includes(">Guest<"), true);
});
