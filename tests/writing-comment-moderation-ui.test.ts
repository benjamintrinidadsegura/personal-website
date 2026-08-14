import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

const overview = source("../app/admin/writing/page.tsx");
const detail = source("../app/admin/writing/[id]/page.tsx");
const adminPanel = source("../components/admin/writing-discussion-admin.tsx");
const stateControls = source("../components/admin/writing-discussion-state-controls.tsx");
const commentList = source("../components/admin/writing-comment-moderation-list.tsx");
const actions = source("../app/admin/writing/comments/actions.ts");
const moderationQueries = source("../lib/comments/moderation-queries.ts");

test("Writing overview keeps publishing primary while rendering bounded Discussion summaries", () => {
  assert.equal(overview.includes("listWritingDiscussionModerationSummaries(100)"), true);
  assert.equal(overview.includes("DiscussionOverview"), true);
  for (const operationalField of ["Visible", "Held", "Spam", "Removed", "Latest activity"]) {
    assert.equal(overview.includes(operationalField), true, operationalField);
  }
  for (const state of ["open", "closed", "disabled"]) {
    assert.equal(overview.includes(`${state}:`), true, state);
  }
  assert.equal(overview.includes("summary.counts.held > 0"), true);
  assert.equal(overview.includes("summary.counts.spam > 0"), true);
});

test("Writing overview survives moderation-summary failure without blocking article controls", () => {
  assert.equal(overview.includes('.catch(() => ({ status: "unavailable"'), true);
  assert.equal(overview.includes("Moderation information could not be loaded. Article management remains available."), true);
  assert.equal(overview.includes("Edit / open"), true);
  assert.equal(overview.indexOf('supabase.rpc("list_writing_articles"') < overview.indexOf("const summaryResult = await summariesPromise"), true);
});

test("article editor renders independently before the bounded Discussion administration panel", () => {
  assert.ok(detail.indexOf("<WritingForm") < detail.indexOf("<Suspense"));
  assert.equal(detail.includes("WritingDiscussionAdminFallback"), true);
  assert.equal(adminPanel.includes("Promise.allSettled"), true);
  assert.equal(adminPanel.includes("listWritingCommentsForModeration(articleId, 50)"), true);
  assert.equal(adminPanel.includes("The Writing editor remains available"), true);
  assert.equal(moderationQueries.includes("withCommentsReadDeadline"), true);
  assert.equal((moderationQueries.match(/\.abortSignal\(signal\)/gu) ?? []).length, 3);
});

test("Discussion state controls explain all semantics and use accessible inline confirmation", () => {
  for (const copy of [
    "Visible comments stay public. New comments and eligible owner controls are available.",
    "Visible comments stay public. New comments stop, while eligible owners retain controls.",
    "The public Discussion section disappears. Comments are retained and are not bulk-moderated.",
    "Current:",
    "· Default",
  ]) assert.equal(stateControls.includes(copy), true, copy);
  assert.equal(stateControls.includes("<fieldset"), true);
  assert.equal(stateControls.includes("<legend"), true);
  assert.equal(stateControls.includes('role="group"'), true);
  assert.equal(stateControls.includes("Disable Discussion?"), true);
  assert.equal(stateControls.includes("Close Discussion?"), true);
  assert.equal(stateControls.includes('if (target === "open")'), true);
  assert.equal(stateControls.includes("Cancel"), true);
});

test("moderation list presents operational identity, status, text, and tombstones safely", () => {
  for (const marker of ["GUEST", "AUTHOR", "EDITED", "Visible", "Held", "Spam", "Removed"]) {
    assert.equal(commentList.includes(marker), true, marker);
  }
  assert.equal(commentList.includes("whitespace-pre-wrap"), true);
  assert.equal(commentList.includes("{comment.body}"), true);
  assert.equal(commentList.includes("dangerouslySetInnerHTML"), false);
  assert.equal(commentList.includes("Author-deleted"), true);
  assert.equal(commentList.includes("Identity and content were removed by the owner"), true);
  assert.equal(commentList.includes("cannot be moderated or restored"), true);
});

test("moderation reason UX uses the exact allowlist, human labels, and required correction-first restore", () => {
  for (const label of ["Spam", "Harassment", "Personal data", "Off-topic", "Other", "Correction / moderation mistake"]) {
    assert.equal(commentList.includes(label), true, label);
  }
  assert.equal(commentList.includes("commentModerationReasonCodes.map"), true);
  assert.equal(commentList.includes("required"), true);
  assert.equal(commentList.includes('initialTarget === "visible" ? "correction"'), true);
  assert.equal(commentList.includes("free-text"), false);
});

test("moderation interactions prevent duplicate work and handle success, stale, and generic failure", () => {
  assert.equal(commentList.includes("useTransition"), true);
  assert.equal(commentList.includes("disabled={pending}"), true);
  assert.equal(commentList.includes('role="status"'), true);
  assert.equal(commentList.includes('role={feedback.tone === "error" ? "alert" : "status"}'), true);
  assert.equal(commentList.includes('result.code === "STALE"'), true);
  assert.equal(commentList.includes("router.refresh()"), true);
  assert.equal(commentList.includes('key={`${comment.id}:${comment.version}`}'), true);
  assert.equal(commentList.includes("feedbackRef.current?.focus()"), true);
  assert.equal(commentList.includes("Review transition"), true);
  assert.equal(commentList.includes("Confirm moderation change"), true);
});

test("1C.2 introduces no client authority trust or owner/public moderation confusion", () => {
  for (const forbidden of [
    'formData.set("actorUserId"',
    'formData.set("role"',
    'formData.set("aal"',
    "delete_own_writing_comment",
    "edit_own_writing_comment",
    "SUPABASE_SECRET_KEY",
  ]) {
    assert.equal(`${stateControls}\n${commentList}`.includes(forbidden), false, forbidden);
  }
  assert.equal(actions.includes("verifyAdminAuthorization(true)"), true);
  assert.equal(actions.includes("isAllowedRequestOrigin"), true);
  assert.equal(actions.includes('formData.get("actorUserId")'), false);
});

test("Studio moderation remains keyboard-visible and mobile-card based", () => {
  for (const component of [stateControls, commentList]) {
    assert.equal(component.includes("focus-visible:ring-2"), true);
    assert.equal(component.includes("min-h-11"), true);
  }
  assert.equal(commentList.includes("<table"), false);
  assert.equal(commentList.includes("sm:grid-cols-2"), true);
  assert.equal(commentList.includes("[overflow-wrap:anywhere]"), true);
  assert.equal(commentList.includes("restoreFocus") || stateControls.includes("restoreFocus"), true);
});

test("scope remains article-centered with no global queue, migration, or public projection change", () => {
  assert.equal(existsSync(new URL("../app/admin/writing/comments/page.tsx", import.meta.url)), false);
  assert.equal(existsSync(new URL("../supabase/migrations/20260818000000_writing_comment_moderation_ui.sql", import.meta.url)), false);
  for (const forbidden of ["Replies", "Notifications", "Appeals", "Bulk moderation", "moderator assignment", "analytics"]) {
    assert.equal(`${overview}\n${detail}\n${adminPanel}\n${stateControls}\n${commentList}`.includes(forbidden), false, forbidden);
  }
  const publicQueries = source("../lib/comments/queries.ts");
  assert.equal(publicQueries.includes("latest_reason_code"), false);
  assert.equal(publicQueries.includes("moderation_state"), false);
});
