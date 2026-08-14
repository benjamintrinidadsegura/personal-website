import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { processOwnCommentDelete, processOwnCommentEdit } from "../app/writing/comments/actions";
import { mapPublicWritingComment } from "../lib/comments/domain";

const COMMENT_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";
const VERSION = "2026-08-16T12:00:00.000Z";
const NEXT_VERSION = "2026-08-16T12:01:00.000Z";
const CREATED_AT = "2026-08-15T12:00:00.000Z";
const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

function activeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: COMMENT_ID,
    identity_kind: "account",
    display_name: "Ada",
    body: "Original body",
    created_at: CREATED_AT,
    is_edited: false,
    is_author_deleted: false,
    is_author: false,
    can_edit: false,
    can_delete: false,
    owner_version: null,
    ...overrides,
  };
}

test("viewer capabilities are owner-specific without exposing ownership identifiers", () => {
  const owned = mapPublicWritingComment(activeRow({ can_edit: true, can_delete: true, owner_version: VERSION }));
  assert.deepEqual(owned, {
    deletion: "active",
    id: COMMENT_ID,
    identity: "account",
    displayName: "Ada",
    body: "Original body",
    createdAt: CREATED_AT,
    isEdited: false,
    isAuthor: false,
    canEdit: true,
    canDelete: true,
    ownerVersion: VERSION,
  });
  assert.equal(JSON.stringify(owned).includes("profile"), false);
  assert.equal(JSON.stringify(owned).includes(USER_ID), false);

  const anonymous = mapPublicWritingComment(activeRow());
  assert.equal(anonymous?.canEdit, false);
  assert.equal(anonymous?.canDelete, false);
  assert.equal(anonymous?.ownerVersion, null);

  const sameNameOtherAccount = mapPublicWritingComment(activeRow({ display_name: "Ada" }));
  assert.equal(sameNameOtherAccount?.canEdit, false);
  assert.equal(sameNameOtherAccount?.canDelete, false);
  assert.equal(mapPublicWritingComment(activeRow({ identity_kind: "guest", can_edit: true, owner_version: VERSION })), null);
  assert.equal(mapPublicWritingComment(activeRow({ owner_version: VERSION })), null);
});

test("AUTHOR presentation is independent from ownership capability", () => {
  const authorNotOwner = mapPublicWritingComment(activeRow({ is_author: true }));
  assert.equal(authorNotOwner?.isAuthor, true);
  assert.equal(authorNotOwner?.canEdit, false);
  const ownerAfterAdminRevocation = mapPublicWritingComment(activeRow({ can_edit: true, can_delete: true, owner_version: VERSION }));
  assert.equal(ownerAfterAdminRevocation?.isAuthor, false);
  assert.equal(ownerAfterAdminRevocation?.canEdit, true);
});

test("public tombstones reject deleted-content and identity leakage", () => {
  const tombstone = mapPublicWritingComment({
    id: COMMENT_ID,
    identity_kind: "account",
    display_name: null,
    body: null,
    created_at: CREATED_AT,
    is_edited: false,
    is_author_deleted: true,
    is_author: false,
    can_edit: false,
    can_delete: false,
    owner_version: null,
    account_profile_id: USER_ID,
    deleted_body: "private",
  });
  assert.deepEqual(tombstone, {
    deletion: "author",
    id: COMMENT_ID,
    identity: "account",
    createdAt: CREATED_AT,
    isEdited: false,
    isAuthor: false,
    canEdit: false,
    canDelete: false,
    ownerVersion: null,
  });
  assert.equal(JSON.stringify(tombstone).includes("private"), false);
  assert.equal(mapPublicWritingComment({ ...activeRow(), is_author_deleted: true }), null);
});

test("own edit accepts the established text boundaries and inert HTML-looking text", async () => {
  for (const body of ["OK", "x".repeat(3_000), "<script>alert('inert')</script>\n\n3 < 5 and <3"]) {
    let captured: Record<string, unknown> | null = null;
    const result = await processOwnCommentEdit(
      { commentId: COMMENT_ID, expectedVersion: VERSION, body },
      true,
      USER_ID,
      async (input) => { captured = input; return { version: NEXT_VERSION }; },
    );
    assert.deepEqual(result, { ok: true, version: NEXT_VERSION });
    const submitted = captured as Record<string, unknown> | null;
    assert.equal(submitted?.actorUserId, USER_ID);
    assert.equal(submitted?.commentId, COMMENT_ID);
    assert.equal(submitted?.expectedVersion, VERSION);
    assert.equal(submitted?.body, body);
    for (const forbidden of ["profileId", "ownerId", "identityKind", "displayName", "role", "isAuthor", "moderationStatus", "articleId"]) {
      assert.equal(Object.hasOwn(submitted ?? {}, forbidden), false, forbidden);
    }
  }
});

test("own edit rejects invalid body, unauthenticated, cross-origin, and malformed targets before SQL", async () => {
  for (const body of ["x", "x".repeat(3_001), "safe\u202Eunsafe"]) {
    let calls = 0;
    const result = await processOwnCommentEdit(
      { commentId: COMMENT_ID, expectedVersion: VERSION, body },
      true,
      USER_ID,
      async () => { calls += 1; return { version: NEXT_VERSION }; },
    );
    assert.equal(result.ok, false);
    assert.equal(calls, 0);
  }
  for (const [requestIsValid, actor, commentId, version] of [
    [false, USER_ID, COMMENT_ID, VERSION],
    [true, null, COMMENT_ID, VERSION],
    [true, USER_ID, "not-a-uuid", VERSION],
    [true, USER_ID, COMMENT_ID, "not-a-version"],
  ] as const) {
    let calls = 0;
    const result = await processOwnCommentEdit(
      { commentId, expectedVersion: version, body: "Valid edit" },
      requestIsValid,
      actor,
      async () => { calls += 1; return { version: NEXT_VERSION }; },
    );
    assert.equal(result.ok, false);
    assert.equal(calls, 0);
  }
});

test("edit maps stale, identical, cooldown, ownership, and state failures generically", async () => {
  for (const [databaseCode, publicCode] of [
    ["WRITING_COMMENT_OWNER_STALE", "STALE"],
    ["WRITING_COMMENT_OWNER_NO_CHANGE", "NO_CHANGE"],
    ["WRITING_COMMENT_OWNER_EDIT_COOLDOWN", "COOLDOWN"],
    ["WRITING_COMMENT_OWNER_UNAUTHORIZED", "UNAUTHORIZED"],
    ["WRITING_COMMENT_OWNER_UNAVAILABLE", "UNAVAILABLE"],
    ["WRITING_COMMENT_ARTICLE_UNAVAILABLE", "UNAVAILABLE"],
    ["WRITING_COMMENT_DISCUSSION_DISABLED", "UNAVAILABLE"],
  ] as const) {
    const result = await processOwnCommentEdit(
      { commentId: COMMENT_ID, expectedVersion: VERSION, body: "Changed body" },
      true,
      USER_ID,
      async () => ({ version: null, errorCode: databaseCode }),
    );
    assert.deepEqual(result, { ok: false, code: publicCode });
  }
});

test("own delete supports leaf, tombstone, and repeated-absent outcomes without browser ownership input", async () => {
  for (const outcome of ["deleted", "tombstoned", "absent"] as const) {
    let captured: Record<string, unknown> | null = null;
    const result = await processOwnCommentDelete(
      { commentId: COMMENT_ID, expectedVersion: VERSION },
      true,
      USER_ID,
      async (input) => { captured = input; return { outcome }; },
    );
    assert.deepEqual(result, { ok: true, outcome });
    assert.deepEqual(captured, { actorUserId: USER_ID, commentId: COMMENT_ID, expectedVersion: VERSION });
  }
});

test("delete rejects stale, unauthorized, disabled, malformed, and unauthenticated requests", async () => {
  for (const [databaseCode, publicCode] of [
    ["WRITING_COMMENT_OWNER_STALE", "STALE"],
    ["WRITING_COMMENT_OWNER_UNAUTHORIZED", "UNAUTHORIZED"],
    ["WRITING_COMMENT_OWNER_UNAVAILABLE", "UNAVAILABLE"],
    ["WRITING_COMMENT_DISCUSSION_DISABLED", "UNAVAILABLE"],
  ] as const) {
    const result = await processOwnCommentDelete(
      { commentId: COMMENT_ID, expectedVersion: VERSION },
      true,
      USER_ID,
      async () => ({ outcome: null, errorCode: databaseCode }),
    );
    assert.deepEqual(result, { ok: false, code: publicCode });
  }
  let calls = 0;
  const denied = await processOwnCommentDelete(
    { commentId: COMMENT_ID, expectedVersion: VERSION },
    true,
    null,
    async () => { calls += 1; return { outcome: "deleted" }; },
  );
  assert.equal(denied.ok, false);
  assert.equal(calls, 0);
});

test("migration validates old rows before replacing active-only constraints", () => {
  const sql = source("../supabase/migrations/20260816000000_writing_comment_ownership_lifecycle.sql").toLowerCase();
  for (const constraint of [
    "writing_comments_lifecycle_body_check",
    "writing_comments_lifecycle_display_name_check",
    "writing_comments_lifecycle_identity_check",
    "writing_comments_lifecycle_timestamp_check",
  ]) {
    assert.ok(sql.indexOf(`validate constraint ${constraint}`) > sql.indexOf(`add constraint ${constraint}`));
  }
  assert.ok(sql.indexOf("validate constraint writing_comments_lifecycle_identity_check") < sql.indexOf("drop constraint writing_comments_identity_consistency_check"));
  assert.match(sql, /author_deleted_at is null\s+and char_length\(body\) between 2 and 3000/u);
  assert.match(sql, /author_deleted_at is not null\s+and identity_kind = 'account'\s+and body = ''/u);
  assert.match(sql, /identity_kind = 'guest'\s+and account_profile_id is null\s+and author_deleted_at is null/u);
  assert.match(sql, /identity_kind = 'account'\s+and account_profile_id is null\s+and author_deleted_at is not null/u);
});

test("profile unlink lifecycle is atomic, anonymized, irreversible, and browser-private", () => {
  const sql = source("../supabase/migrations/20260816000000_writing_comment_ownership_lifecycle.sql").toLowerCase();
  assert.equal(sql.includes("alter column user_id drop not null"), true);
  assert.equal(sql.includes("on delete set null"), true);
  assert.equal(sql.includes("before update of user_id"), true);
  assert.equal(sql.includes("old.user_id is not null and new.user_id is null"), true);
  assert.equal(sql.includes("new.deleted_at := coalesce"), true);
  assert.equal(sql.includes("new.display_name := 'deleted account'"), true);
  assert.equal(sql.includes("old.user_id is null and new.user_id is not null"), true);
  assert.equal(sql.includes("bts_profile_reattach_forbidden"), true);
  assert.match(sql, /\(user_id is not null and deleted_at is null\)\s+or \(user_id is null and deleted_at is not null\)/u);
  assert.equal(sql.includes("grant update on table public.bts_account_profiles"), false);
  assert.ok(sql.indexOf("create trigger prepare_bts_account_profile_unlink_before_update") < sql.indexOf("on delete set null"));
});

test("viewer projection derives capability, AUTHOR, account anonymization, and strict tombstones in SQL", () => {
  const sql = source("../supabase/migrations/20260816000000_writing_comment_ownership_lifecycle.sql").toLowerCase();
  const projection = sql.slice(sql.indexOf("create function public.list_public_writing_comments_for_viewer"), sql.indexOf("create function public.edit_own_writing_comment"));
  for (const required of [
    "comment.account_profile_id = (select viewer_profile.id from viewer_profile)",
    "profile.user_id = p_actor_user_id",
    "profile.deleted_at is null",
    "admin.role = 'admin'",
    "admin.is_active = true",
    "owner_profile.deleted_at is not null then 'deleted account'",
    "when comment.author_deleted_at is not null then null",
    "comment.parent_comment_id is null",
    "child.parent_comment_id = comment.id",
  ]) assert.equal(projection.includes(required), true, required);
  const returnShape = projection.slice(projection.indexOf("returns table"), projection.indexOf("language sql"));
  for (const forbidden of ["user_id", "profile_id", "email", "network_hash", "message_hash", "form_token_hash", "moderation_status"]) {
    assert.equal(returnShape.includes(forbidden), false, forbidden);
  }
});

test("the retained 1B.1 projection is unlink-safe during phased deployment", () => {
  const sql = source("../supabase/migrations/20260816000000_writing_comment_ownership_lifecycle.sql").toLowerCase();
  const legacy = sql.slice(sql.indexOf("create or replace function public.list_public_writing_comments("), sql.indexOf("create function public.list_public_writing_comments_for_viewer"));
  assert.equal(legacy.includes("profile.deleted_at is not null then 'deleted account'"), true);
  assert.equal(legacy.includes("comment.author_deleted_at is null"), true);
  assert.equal(legacy.includes("profile.deleted_at is null then exists"), true);
  assert.equal(legacy.includes("admin.is_active = true"), true);
});

test("edit preserves identity and snapshot while enforcing state, version, cooldown, and lock order", () => {
  const sql = source("../supabase/migrations/20260816000000_writing_comment_ownership_lifecycle.sql").toLowerCase();
  const edit = sql.slice(sql.indexOf("create function public.edit_own_writing_comment"), sql.indexOf("create function public.delete_own_writing_comment"));
  for (const required of [
    "writing-comment-mutation:",
    "writing-discussion:",
    "article.status",
    "article.published_at",
    "discussion.state",
    "v_discussion_state = 'disabled'",
    "comment.moderation_status",
    "v_moderation_status <> 'visible'",
    "v_identity_kind <> 'account'",
    "v_owner_profile_id is distinct from v_profile_id",
    "v_updated_at is distinct from p_expected_updated_at",
    "v_existing_body = p_body",
    "interval '10 seconds'",
    "for update",
    "set body = p_body",
    "edited_at = v_now",
    "updated_at = v_now",
  ]) assert.equal(edit.includes(required), true, required);
  assert.equal(edit.includes("v_discussion_state = 'closed'"), false);
  const update = edit.slice(edit.indexOf("update public.writing_comments"));
  for (const preserved of ["guest_display_name =", "account_profile_id =", "identity_kind =", "article_id =", "created_at =", "moderation_status ="]) {
    assert.equal(update.includes(preserved), false, preserved);
  }
});

test("delete serializes with edit, hard-deletes leaves, tombstones parents, and never cascades children", () => {
  const sql = source("../supabase/migrations/20260816000000_writing_comment_ownership_lifecycle.sql").toLowerCase();
  const edit = sql.slice(sql.indexOf("create function public.edit_own_writing_comment"), sql.indexOf("create function public.delete_own_writing_comment"));
  const deletion = sql.slice(sql.indexOf("create function public.delete_own_writing_comment"), sql.indexOf("revoke all on function public.list_public"));
  assert.equal(edit.includes("writing-comment-mutation:"), true);
  assert.equal(deletion.includes("writing-comment-mutation:"), true);
  for (const required of [
    "v_updated_at is distinct from p_expected_updated_at",
    "v_moderation_status <> 'visible'",
    "v_discussion_state = 'disabled'",
    "child.parent_comment_id = p_comment_id",
    "if not v_has_children then",
    "delete from public.writing_comments",
    "set body = ''",
    "guest_display_name = ''",
    "account_profile_id = null",
    "author_deleted_at = v_now",
    "return 'tombstoned'",
    "return 'absent'",
  ]) assert.equal(deletion.includes(required), true, required);
  assert.equal(/on\s+delete\s+cascade/u.test(deletion), false);
  const oneA = source("../supabase/migrations/20260814000000_writing_comments_foundation.sql").toLowerCase();
  assert.equal(oneA.includes("writing_comments_parent_same_article_fk"), true);
  assert.equal(oneA.includes("on delete restrict"), true);
});

test("all new definer functions use the audited path and service-role-only grants", () => {
  const sql = source("../supabase/migrations/20260816000000_writing_comment_ownership_lifecycle.sql").toLowerCase();
  assert.equal((sql.match(/security definer/gu) ?? []).length, 5);
  assert.equal((sql.match(/set search_path = pg_catalog, pg_temp/gu) ?? []).length, 5);
  assert.equal(sql.includes("set search_path = pg_catalog, public"), false);
  assert.equal(sql.includes("to anon"), false);
  assert.equal(sql.includes("to authenticated"), false);
  for (const signature of [
    "list_public_writing_comments_for_viewer(uuid, uuid)",
    "edit_own_writing_comment(uuid, uuid, timestamptz, text)",
    "delete_own_writing_comment(uuid, uuid, timestamptz)",
  ]) {
    assert.equal(sql.includes(`grant execute on function public.${signature}`), true, signature);
  }
});

test("viewer-specific reads remain uncached and inside the 2.5-second failure boundary", () => {
  const query = source("../lib/comments/queries.ts");
  assert.equal(query.includes("withCommentsReadDeadline"), true);
  assert.equal(query.includes('rpc("list_public_writing_comments_for_viewer"'), true);
  assert.equal(query.includes("p_actor_user_id: actorUserId"), true);
  assert.equal((query.match(/\.abortSignal\(signal\)/gu) ?? []).length, 4);
  assert.equal(query.includes("unstable_cache"), false);
  assert.equal(source("../lib/comments/read-deadline.ts").includes("COMMENTS_READ_TIMEOUT_MS = 2_500"), true);
  const page = source("../app/writing/[slug]/page.tsx");
  assert.ok(page.indexOf("getPublishedWritingBySlug") < page.indexOf("getWritingDiscussionPageData(article.id)"));
});

test("inline owner UX is accessible, mobile-safe, confirmed, and does not add reply or moderation UI", () => {
  const controls = source("../components/writing/comments/owned-comment-controls.tsx");
  const list = source("../components/writing/comments/comment-list.tsx");
  const discussion = source("../components/writing/comments/discussion.tsx");
  for (const required of [
    "Edit your comment",
    "Delete your comment?",
    'aria-live="polite"',
    "aria-invalid",
    'event.key === "Escape"',
    "min-h-11",
    "flex-wrap",
    "textarea.current?.focus()",
    "editButton.current?.focus()",
    "deleteButton.current?.focus()",
  ]) assert.equal(controls.includes(required), true, required);
  assert.equal(list.includes("Comment deleted by author."), true);
  assert.equal(list.includes(">edited<"), true);
  assert.equal(discussion.includes('id="discussion-title" tabIndex={-1}'), true);
  for (const forbidden of ["Reply", "Moderate", "Ban user", "dangerouslySetInnerHTML"]) {
    assert.equal(`${controls}${list}`.includes(forbidden), false, forbidden);
  }
});

test("the previous applied migrations remain untouched by 1B.2 lifecycle fields", () => {
  const oneA = source("../supabase/migrations/20260814000000_writing_comments_foundation.sql");
  const oneB = source("../supabase/migrations/20260815000000_writing_account_identity.sql");
  for (const field of ["edited_at", "author_deleted_at", "delete_own_writing_comment", "edit_own_writing_comment"]) {
    assert.equal(oneA.includes(field), false, `1A ${field}`);
    assert.equal(oneB.includes(field), false, `1B.1 ${field}`);
  }
});
