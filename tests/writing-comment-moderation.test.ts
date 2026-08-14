import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  processModerateWritingComment,
  processSetWritingDiscussionState,
} from "../app/admin/writing/comments/actions";
import {
  mapWritingCommentForModeration,
  mapWritingDiscussionModerationContext,
  mapWritingDiscussionModerationSummary,
} from "../lib/comments/moderation-domain";
import { withCommentsReadDeadline } from "../lib/comments/read-deadline";

const ARTICLE_ID = "11111111-1111-4111-8111-111111111111";
const COMMENT_ID = "22222222-2222-4222-8222-222222222222";
const ADMIN_ID = "33333333-3333-4333-8333-333333333333";
const VERSION = "2026-08-17T12:00:00.000Z";
const NEXT_VERSION = "2026-08-17T12:01:00.000Z";
const SLUG = "moderated-writing";
const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

function moderateData(newState: "visible" | "held" | "spam" | "removed", publicChanged = true) {
  return [{
    article_id: ARTICLE_ID,
    article_slug: SLUG,
    new_state: newState,
    updated_at: NEXT_VERSION,
    public_changed: publicChanged,
  }];
}

function discussionData(newState: "open" | "closed" | "disabled") {
  return [{
    article_id: ARTICLE_ID,
    article_slug: SLUG,
    new_state: newState,
    updated_at: NEXT_VERSION,
  }];
}

test("AAL2 moderation accepts only server-supplied actor identity and exact inputs", async () => {
  let captured: Record<string, unknown> | null = null;
  const result = await processModerateWritingComment(
    {
      commentId: COMMENT_ID,
      expectedVersion: VERSION,
      targetState: "held",
      reasonCode: "harassment",
      actorUserId: "44444444-4444-4444-8444-444444444444",
      role: "admin",
      aal: "aal2",
    } as never,
    true,
    ADMIN_ID,
    async (input) => {
      captured = input;
      return { data: moderateData("held") };
    },
  );
  assert.equal(result.ok, true);
  assert.deepEqual(captured, {
    actorUserId: ADMIN_ID,
    commentId: COMMENT_ID,
    expectedVersion: VERSION,
    targetState: "held",
    reasonCode: "harassment",
  });
  for (const forbidden of ["role", "aal", "isAuthor", "profileId", "articleId"]) {
    assert.equal(Object.hasOwn(captured ?? {}, forbidden), false, forbidden);
  }
});

test("anonymous, cross-origin, malformed, and invalid moderation requests fail before SQL", async () => {
  const invalid = [
    [{ commentId: COMMENT_ID, expectedVersion: VERSION, targetState: "held", reasonCode: "spam" }, false, ADMIN_ID],
    [{ commentId: COMMENT_ID, expectedVersion: VERSION, targetState: "held", reasonCode: "spam" }, true, null],
    [{ commentId: "bad", expectedVersion: VERSION, targetState: "held", reasonCode: "spam" }, true, ADMIN_ID],
    [{ commentId: COMMENT_ID, expectedVersion: "bad", targetState: "held", reasonCode: "spam" }, true, ADMIN_ID],
    [{ commentId: COMMENT_ID, expectedVersion: VERSION, targetState: "pending", reasonCode: "spam" }, true, ADMIN_ID],
    [{ commentId: COMMENT_ID, expectedVersion: VERSION, targetState: "held", reasonCode: "" }, true, ADMIN_ID],
    [{ commentId: COMMENT_ID, expectedVersion: VERSION, targetState: "held", reasonCode: "private-note" }, true, ADMIN_ID],
  ] as const;
  for (const [raw, origin, actor] of invalid) {
    let calls = 0;
    const result = await processModerateWritingComment(raw, origin, actor, async () => {
      calls += 1;
      return { data: moderateData("held") };
    });
    assert.equal(result.ok, false);
    assert.equal(calls, 0);
  }
});

test("all distinct moderation-state transitions are accepted by the trusted boundary", async () => {
  const states = ["visible", "held", "spam", "removed"] as const;
  for (const current of states) {
    for (const target of states) {
      if (current === target) continue;
      const result = await processModerateWritingComment(
        { commentId: COMMENT_ID, expectedVersion: VERSION, targetState: target, reasonCode: target === "visible" ? "correction" : "other" },
        true,
        ADMIN_ID,
        async () => ({ data: moderateData(target, current === "visible" || target === "visible") }),
      );
      assert.equal(result.ok, true, `${current} -> ${target}`);
    }
  }
});

test("moderation maps stale, no-op, tombstone, unpublished, missing, and revoked-admin failures", async () => {
  for (const [databaseCode, publicCode] of [
    ["WRITING_COMMENT_MODERATION_STALE", "STALE"],
    ["WRITING_COMMENT_MODERATION_NO_CHANGE", "NO_CHANGE"],
    ["WRITING_COMMENT_MODERATION_TOMBSTONE", "UNAVAILABLE"],
    ["WRITING_COMMENT_MODERATION_ARTICLE_UNAVAILABLE", "UNAVAILABLE"],
    ["WRITING_COMMENT_MODERATION_UNAVAILABLE", "UNAVAILABLE"],
    ["WRITING_COMMENT_MODERATION_UNAUTHORIZED", "UNAUTHORIZED"],
  ] as const) {
    const result = await processModerateWritingComment(
      { commentId: COMMENT_ID, expectedVersion: VERSION, targetState: "removed", reasonCode: "other" },
      true,
      ADMIN_ID,
      async () => ({ data: null, errorCode: databaseCode }),
    );
    assert.deepEqual(result, { ok: false, code: publicCode });
  }
});

test("discussion mutation preserves the null-version implicit-Open protocol", async () => {
  let captured: Record<string, unknown> | null = null;
  const implicit = await processSetWritingDiscussionState(
    { articleId: ARTICLE_ID, expectedVersion: "", targetState: "closed" },
    true,
    ADMIN_ID,
    async (input) => {
      captured = input;
      return { data: discussionData("closed") };
    },
  );
  assert.equal(implicit.ok, true);
  assert.equal((captured as Record<string, unknown> | null)?.expectedVersion, null);

  const explicit = await processSetWritingDiscussionState(
    { articleId: ARTICLE_ID, expectedVersion: VERSION, targetState: "disabled" },
    true,
    ADMIN_ID,
    async (input) => {
      captured = input;
      return { data: discussionData("disabled") };
    },
  );
  assert.equal(explicit.ok, true);
  assert.equal((captured as Record<string, unknown> | null)?.expectedVersion, VERSION);
});

test("discussion mutation rejects invalid identity, state, version, and stale races", async () => {
  for (const [raw, actor] of [
    [{ articleId: "bad", expectedVersion: null, targetState: "open" }, ADMIN_ID],
    [{ articleId: ARTICLE_ID, expectedVersion: "bad", targetState: "open" }, ADMIN_ID],
    [{ articleId: ARTICLE_ID, expectedVersion: null, targetState: "hidden" }, ADMIN_ID],
    [{ articleId: ARTICLE_ID, expectedVersion: null, targetState: "open" }, null],
  ] as const) {
    let calls = 0;
    const result = await processSetWritingDiscussionState(raw, true, actor, async () => {
      calls += 1;
      return { data: discussionData("open") };
    });
    assert.equal(result.ok, false);
    assert.equal(calls, 0);
  }
  const stale = await processSetWritingDiscussionState(
    { articleId: ARTICLE_ID, expectedVersion: null, targetState: "closed" },
    true,
    ADMIN_ID,
    async () => ({ data: null, errorCode: "WRITING_COMMENT_MODERATION_STALE" }),
  );
  assert.deepEqual(stale, { ok: false, code: "STALE" });
});

test("admin projections are strict, live-AUTHOR aware, and private-identifier free", () => {
  const active = mapWritingCommentForModeration({
    id: COMMENT_ID,
    identity_kind: "account",
    display_name: "Ada",
    body: "Hidden body remains admin-only.",
    moderation_state: "held",
    created_at: VERSION,
    edited_at: null,
    updated_at: NEXT_VERSION,
    is_author_deleted: false,
    is_author: true,
    latest_reason_code: "harassment",
    account_profile_id: "private",
    user_id: ADMIN_ID,
    email: "private@example.test",
  });
  assert.deepEqual(active, {
    id: COMMENT_ID,
    identity: "account",
    displayName: "Ada",
    body: "Hidden body remains admin-only.",
    moderationState: "held",
    createdAt: VERSION,
    editedAt: null,
    version: NEXT_VERSION,
    isAuthorDeleted: false,
    isAuthor: true,
    latestReasonCode: "harassment",
  });
  const serialized = JSON.stringify(active);
  for (const privateValue of [ADMIN_ID, "private@example.test", "account_profile_id"]) {
    assert.equal(serialized.includes(privateValue), false);
  }
  assert.equal(mapWritingCommentForModeration({
    id: COMMENT_ID,
    identity_kind: "guest",
    display_name: "Forged",
    body: "Guest cannot be AUTHOR.",
    moderation_state: "visible",
    created_at: VERSION,
    edited_at: null,
    updated_at: NEXT_VERSION,
    is_author_deleted: false,
    is_author: true,
    latest_reason_code: null,
  }), null);

  const tombstone = mapWritingCommentForModeration({
    id: COMMENT_ID,
    identity_kind: "account",
    display_name: null,
    body: null,
    moderation_state: "visible",
    created_at: VERSION,
    edited_at: VERSION,
    updated_at: NEXT_VERSION,
    is_author_deleted: true,
    is_author: false,
    latest_reason_code: null,
  });
  assert.equal(tombstone?.body, null);
  assert.equal(mapWritingCommentForModeration({ ...tombstone, id: COMMENT_ID }), null);
});

test("discussion summary and context mappers reject malformed counts and dates", () => {
  const row = {
    article_id: ARTICLE_ID,
    discussion_state: "open",
    discussion_updated_at: null,
    visible_count: 2,
    held_count: "1",
    spam_count: 0,
    removed_count: 0,
    latest_comment_at: VERSION,
  };
  assert.deepEqual(mapWritingDiscussionModerationSummary(row), {
    articleId: ARTICLE_ID,
    state: "open",
    explicitVersion: null,
    counts: { visible: 2, held: 1, spam: 0, removed: 0 },
    latestCommentAt: VERSION,
  });
  const context = { ...row };
  delete (context as { latest_comment_at?: string }).latest_comment_at;
  assert.equal(mapWritingDiscussionModerationContext(context)?.state, "open");
  assert.equal(mapWritingDiscussionModerationSummary({ ...row, spam_count: -1 }), null);
  assert.equal(mapWritingDiscussionModerationSummary({ ...row, discussion_updated_at: "August 17, 2026" }), null);
});

test("audit tables survive leaf deletion, anonymize actors, and expose no application writes", () => {
  const sql = source("../supabase/migrations/20260817000000_writing_comment_moderation.sql").toLowerCase();
  const commentTable = sql.slice(sql.indexOf("create table public.writing_comment_moderation_events"), sql.indexOf("create index writing_comment_moderation_events_comment_created_idx"));
  for (const required of [
    "comment_id uuid not null",
    "actor_user_id uuid references auth.users (id) on delete set null",
    "previous_state public.writing_comment_moderation_status",
    "new_state public.writing_comment_moderation_status",
    "reason_code text not null",
  ]) assert.equal(commentTable.includes(required), true, required);
  assert.equal(commentTable.includes("comment_id uuid references"), false);
  assert.equal(sql.includes("alter table public.writing_comment_moderation_events enable row level security"), true);
  assert.equal(sql.includes("alter table public.writing_discussion_state_events enable row level security"), true);
  assert.equal(sql.includes("grant insert on"), false);
  assert.equal(sql.includes("grant update on"), false);
  assert.equal(sql.includes("grant delete on"), false);
  assert.equal(sql.includes("update public.writing_comment_moderation_events"), false);
  assert.equal(sql.includes("delete from public.writing_comment_moderation_events"), false);
});

test("comment moderation is transactional, non-destructive, tombstone-safe, and AUTHOR-neutral", () => {
  const sql = source("../supabase/migrations/20260817000000_writing_comment_moderation.sql").toLowerCase();
  const fn = sql.slice(sql.indexOf("create function public.moderate_writing_comment"), sql.indexOf("revoke all on function public.assert_writing_comment_moderator"));
  assert.ok(fn.indexOf("update public.writing_comments") < fn.indexOf("insert into public.writing_comment_moderation_events"));
  for (const required of [
    "v_author_deleted_at is not null",
    "writing_comment_moderation_tombstone",
    "v_current_updated_at is distinct from p_expected_updated_at",
    "v_current_state = p_target_state",
    "set moderation_status = p_target_state",
    "updated_at = v_now",
  ]) assert.equal(fn.includes(required), true, required);
  const commentUpdate = fn.slice(fn.indexOf("update public.writing_comments"), fn.indexOf("insert into public.writing_comment_moderation_events"));
  for (const forbidden of [
    "delete from public.writing_comments",
    "body =",
    "guest_display_name =",
    "account_profile_id =",
    "article_id =",
    "parent_comment_id =",
    "author_deleted_at =",
    "is_author =",
  ]) assert.equal(commentUpdate.includes(forbidden), false, forbidden);
});

test("discussion mutations audit atomically without touching comments", () => {
  const sql = source("../supabase/migrations/20260817000000_writing_comment_moderation.sql").toLowerCase();
  const fn = sql.slice(sql.indexOf("create function public.set_writing_discussion_state"), sql.indexOf("create function public.moderate_writing_comment"));
  assert.equal(fn.includes("writing-discussion:"), true);
  assert.equal(fn.includes("for update"), true);
  assert.equal(fn.includes("v_previous_was_implicit := not found"), true);
  assert.equal(fn.includes("p_expected_updated_at is not null"), true);
  assert.equal(fn.includes("p_expected_updated_at is null"), true);
  assert.ok(fn.indexOf("insert into public.writing_discussions") < fn.indexOf("insert into public.writing_discussion_state_events"));
  assert.ok(fn.indexOf("update public.writing_discussions") < fn.indexOf("insert into public.writing_discussion_state_events"));
  assert.equal(fn.includes("update public.writing_comments"), false);
  assert.equal(fn.includes("delete from public.writing_comments"), false);
});

test("moderation preserves the established owner and future-reply lock order", () => {
  const sql = source("../supabase/migrations/20260817000000_writing_comment_moderation.sql").toLowerCase();
  const fn = sql.slice(sql.indexOf("create function public.moderate_writing_comment"), sql.indexOf("revoke all on function public.assert_writing_comment_moderator"));
  const positions = [
    fn.indexOf("writing-comment-mutation:"),
    fn.indexOf("writing-discussion:"),
    fn.indexOf("from public.writing_articles"),
    fn.indexOf("from public.writing_discussions"),
    fn.indexOf("from public.admin_users"),
    fn.lastIndexOf("from public.writing_comments"),
  ];
  assert.equal(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1])), true);
  assert.equal(fn.includes("parent for key share lock"), true);

  const owner = source("../supabase/migrations/20260816000000_writing_comment_ownership_lifecycle.sql").toLowerCase();
  assert.equal(owner.includes("writing-comment-mutation:"), true);
  assert.equal(owner.includes("writing-discussion:"), true);
});

test("all six definer functions use the audited path and only entry points reach service_role", () => {
  const sql = source("../supabase/migrations/20260817000000_writing_comment_moderation.sql").toLowerCase();
  assert.equal((sql.match(/security definer/gu) ?? []).length, 6);
  assert.equal((sql.match(/set search_path = pg_catalog, pg_temp/gu) ?? []).length, 6);
  assert.equal(sql.includes("set search_path = pg_catalog, public"), false);
  assert.equal(sql.includes("to authenticated"), false);
  assert.equal(sql.includes("to anon"), false);
  assert.equal(sql.includes("grant execute on function public.assert_writing_comment_moderator"), false);
  for (const signature of [
    "list_writing_discussion_summaries(uuid, integer)",
    "get_writing_discussion_for_moderation(uuid, uuid)",
    "list_writing_comments_for_moderation(uuid, uuid, integer)",
    "set_writing_discussion_state(uuid, uuid, timestamptz, public.writing_discussion_state)",
    "moderate_writing_comment(uuid, uuid, timestamptz, public.writing_comment_moderation_status, text)",
  ]) assert.equal(sql.includes(`grant execute on function public.${signature}`), true, signature);
});

test("server authorization is fresh AAL2, same-origin, and SQL rechecks active admin under lock", () => {
  const actions = source("../app/admin/writing/comments/actions.ts");
  const authorization = source("../lib/admin/authorization.ts");
  const account = source("../lib/account/state.ts");
  const sql = source("../supabase/migrations/20260817000000_writing_comment_moderation.sql").toLowerCase();
  assert.equal(actions.includes("isAllowedRequestOrigin"), true);
  assert.equal(actions.includes("verifyAdminAuthorization(true)"), true);
  assert.equal(actions.includes('formData.get("actorUserId")'), false);
  assert.equal(actions.includes('formData.get("role")'), false);
  assert.equal(actions.includes('formData.get("aal")'), false);
  assert.equal(authorization.includes('account.state.aal !== "aal2"'), true);
  assert.equal(account.includes("supabase.auth.getUser()"), true);
  assert.equal(account.includes('row.role !== "admin" || row.is_active !== true'), true);
  assert.equal(sql.includes("admin.is_active = true"), true);
  assert.equal(sql.includes("for share"), true);
});

test("admin reads are server-only, uncached, bounded, and signal-aware", async () => {
  const queries = source("../lib/comments/moderation-queries.ts");
  assert.equal(queries.startsWith('import "server-only"'), true);
  assert.equal(queries.includes("withCommentsReadDeadline"), true);
  assert.equal(queries.includes("verifyAdminAuthorization(true)"), true);
  assert.equal((queries.match(/\.abortSignal\(signal\)/gu) ?? []).length, 3);
  assert.equal(queries.includes("unstable_cache"), false);
  assert.equal(queries.includes("account_profile_id"), false);
  assert.equal(queries.includes("network_hash"), false);

  const started = Date.now();
  const result = await withCommentsReadDeadline(
    () => new Promise<string>(() => undefined),
    "unavailable",
    20,
  );
  assert.equal(result, "unavailable");
  assert.ok(Date.now() - started < 250);
});

test("public projections still exclude hidden content and all moderation reasons", () => {
  const publicQueries = source("../lib/comments/queries.ts");
  const publicSql = source("../supabase/migrations/20260816000000_writing_comment_ownership_lifecycle.sql").toLowerCase();
  assert.equal(publicQueries.includes("latest_reason_code"), false);
  assert.equal(publicQueries.includes("reason_code"), false);
  assert.equal(publicSql.includes("comment.moderation_status = 'visible'"), true);
  const publicReturns = publicSql.slice(
    publicSql.indexOf("create function public.list_public_writing_comments_for_viewer"),
    publicSql.indexOf("create function public.edit_own_writing_comment"),
  );
  assert.equal(publicReturns.slice(publicReturns.indexOf("returns table"), publicReturns.indexOf("language sql")).includes("moderation_status"), false);
});

test("successful actions perform article-scoped invalidation without touching Writing content tags", () => {
  const actions = source("../app/admin/writing/comments/actions.ts");
  for (const required of [
    'revalidatePath("/admin/writing")',
    "revalidatePath(`/admin/writing/${articleId}`)",
    "revalidatePath(`/writing/${articleSlug}`)",
  ]) assert.equal(actions.includes(required), true, required);
  assert.equal(actions.includes("published-writing"), false);
  assert.equal(actions.includes('revalidatePath("/", "layout")'), false);
  assert.equal(actions.includes("updateTag"), false);
});

test("migration remains additive and leaves all applied Comments migrations untouched", () => {
  const sql = source("../supabase/migrations/20260817000000_writing_comment_moderation.sql").toLowerCase();
  assert.equal(sql.includes("drop table"), false);
  assert.equal(sql.includes("drop column"), false);
  assert.equal(sql.includes("alter type"), false);
  assert.equal(sql.includes("notify pgrst, 'reload schema'"), true);
  for (const file of [
    "../supabase/migrations/20260814000000_writing_comments_foundation.sql",
    "../supabase/migrations/20260815000000_writing_account_identity.sql",
    "../supabase/migrations/20260816000000_writing_comment_ownership_lifecycle.sql",
  ]) assert.equal(source(file).includes("writing_comment_moderation_events"), false, file);
});
