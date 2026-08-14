"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import {
  isCommentModerationReasonCode,
  isCommentModerationState,
  isDiscussionState,
  isModerationUuid,
  isWritingSlug,
  parseModerationVersion,
} from "@/lib/comments/moderation-domain";
import { isAllowedRequestOrigin } from "@/lib/echowall/security";
import type { DiscussionState } from "@/types/comments";
import type {
  CommentModerationReasonCode,
  CommentModerationState,
  ModerateWritingCommentActionState,
  ModerationMutationErrorCode,
  SetWritingDiscussionStateActionState,
} from "@/types/comment-moderation";

type DatabaseResult = { data: unknown; errorCode?: string };
type ModerateDatabase = (input: {
  actorUserId: string;
  commentId: string;
  expectedVersion: string;
  targetState: CommentModerationState;
  reasonCode: CommentModerationReasonCode;
}) => Promise<DatabaseResult>;
type SetDiscussionDatabase = (input: {
  actorUserId: string;
  articleId: string;
  expectedVersion: string | null;
  targetState: DiscussionState;
}) => Promise<DatabaseResult>;

type ModerateSuccess = Exclude<ModerateWritingCommentActionState, null | { ok: false }>;
type DiscussionSuccess = Exclude<SetWritingDiscussionStateActionState, null | { ok: false }>;

function mapMutationError(errorCode?: string): ModerationMutationErrorCode {
  if (errorCode?.includes("WRITING_COMMENT_MODERATION_STALE")) return "STALE";
  if (errorCode?.includes("WRITING_COMMENT_MODERATION_NO_CHANGE")) return "NO_CHANGE";
  if (errorCode?.includes("WRITING_COMMENT_MODERATION_UNAUTHORIZED")) return "UNAUTHORIZED";
  if (
    errorCode?.includes("WRITING_COMMENT_MODERATION_UNAVAILABLE")
    || errorCode?.includes("WRITING_COMMENT_MODERATION_ARTICLE_UNAVAILABLE")
    || errorCode?.includes("WRITING_COMMENT_MODERATION_TOMBSTONE")
  ) return "UNAVAILABLE";
  if (errorCode?.includes("WRITING_COMMENT_MODERATION_INVALID_INPUT")) return "INVALID_REQUEST";
  return "SERVICE_UNAVAILABLE";
}

function parseModerateResult(data: unknown): ModerateSuccess | null {
  const row = Array.isArray(data) && data.length === 1
    ? data[0] as Record<string, unknown>
    : null;
  const version = row ? parseModerationVersion(row.updated_at) : null;
  if (
    !row
    || !isModerationUuid(row.article_id)
    || !isWritingSlug(row.article_slug)
    || !isCommentModerationState(row.new_state)
    || !version
    || typeof row.public_changed !== "boolean"
  ) return null;
  return {
    ok: true,
    articleId: row.article_id,
    articleSlug: row.article_slug,
    newState: row.new_state,
    version,
    publicChanged: row.public_changed,
  };
}

function parseDiscussionResult(data: unknown): DiscussionSuccess | null {
  const row = Array.isArray(data) && data.length === 1
    ? data[0] as Record<string, unknown>
    : null;
  const version = row ? parseModerationVersion(row.updated_at) : null;
  if (
    !row
    || !isModerationUuid(row.article_id)
    || !isWritingSlug(row.article_slug)
    || !isDiscussionState(row.new_state)
    || !version
  ) return null;
  return {
    ok: true,
    articleId: row.article_id,
    articleSlug: row.article_slug,
    newState: row.new_state,
    version,
  };
}

function optionalExpectedVersion(value: unknown): { valid: true; value: string | null } | { valid: false } {
  if (value === null || value === "") return { valid: true, value: null };
  const version = parseModerationVersion(value);
  return version ? { valid: true, value: version } : { valid: false };
}

export async function processModerateWritingComment(
  raw: { commentId: unknown; expectedVersion: unknown; targetState: unknown; reasonCode: unknown },
  originAllowed: boolean,
  actorUserId: string | null,
  moderateInDatabase: ModerateDatabase,
): Promise<Exclude<ModerateWritingCommentActionState, null>> {
  if (!originAllowed) return { ok: false, code: "INVALID_REQUEST" };
  if (!actorUserId || !isModerationUuid(actorUserId)) return { ok: false, code: "UNAUTHORIZED" };
  const expectedVersion = parseModerationVersion(raw.expectedVersion);
  if (
    !isModerationUuid(raw.commentId)
    || !expectedVersion
    || !isCommentModerationState(raw.targetState)
    || !isCommentModerationReasonCode(raw.reasonCode)
  ) return { ok: false, code: "INVALID_REQUEST" };

  try {
    const result = await moderateInDatabase({
      actorUserId,
      commentId: raw.commentId,
      expectedVersion,
      targetState: raw.targetState,
      reasonCode: raw.reasonCode,
    });
    if (result.errorCode) return { ok: false, code: mapMutationError(result.errorCode) };
    return parseModerateResult(result.data) ?? { ok: false, code: "SERVICE_UNAVAILABLE" };
  } catch {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }
}

export async function processSetWritingDiscussionState(
  raw: { articleId: unknown; expectedVersion: unknown; targetState: unknown },
  originAllowed: boolean,
  actorUserId: string | null,
  setInDatabase: SetDiscussionDatabase,
): Promise<Exclude<SetWritingDiscussionStateActionState, null>> {
  if (!originAllowed) return { ok: false, code: "INVALID_REQUEST" };
  if (!actorUserId || !isModerationUuid(actorUserId)) return { ok: false, code: "UNAUTHORIZED" };
  const expectedVersion = optionalExpectedVersion(raw.expectedVersion);
  if (
    !isModerationUuid(raw.articleId)
    || !expectedVersion.valid
    || !isDiscussionState(raw.targetState)
  ) return { ok: false, code: "INVALID_REQUEST" };

  try {
    const result = await setInDatabase({
      actorUserId,
      articleId: raw.articleId,
      expectedVersion: expectedVersion.value,
      targetState: raw.targetState,
    });
    if (result.errorCode) return { ok: false, code: mapMutationError(result.errorCode) };
    return parseDiscussionResult(result.data) ?? { ok: false, code: "SERVICE_UNAVAILABLE" };
  } catch {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }
}

async function authorizeModerationAction(): Promise<{ originAllowed: boolean; actorUserId: string | null }> {
  const requestHeaders = await headers();
  const siteUrl = process.env.SITE_URL;
  const originAllowed = Boolean(siteUrl && isAllowedRequestOrigin(
    requestHeaders.get("origin"),
    requestHeaders.get("host"),
    siteUrl,
  ));
  if (!originAllowed) return { originAllowed: false, actorUserId: null };
  const { verifyAdminAuthorization } = await import("@/lib/admin/authorization");
  const authorization = await verifyAdminAuthorization(true);
  return {
    originAllowed: true,
    actorUserId: authorization?.user.id ?? null,
  };
}

function invalidateModerationResult(
  articleId: string,
  articleSlug: string,
  publicChanged: boolean,
) {
  revalidatePath("/admin/writing");
  revalidatePath(`/admin/writing/${articleId}`);
  if (publicChanged) revalidatePath(`/writing/${articleSlug}`);
}

export async function moderateWritingCommentAction(
  _previousState: ModerateWritingCommentActionState,
  formData: FormData,
): Promise<Exclude<ModerateWritingCommentActionState, null>> {
  const authorization = await authorizeModerationAction();
  const result = await processModerateWritingComment(
    {
      commentId: formData.get("commentId"),
      expectedVersion: formData.get("expectedVersion"),
      targetState: formData.get("targetState"),
      reasonCode: formData.get("reasonCode"),
    },
    authorization.originAllowed,
    authorization.actorUserId,
    async (input) => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const { data, error } = await getSupabaseServerClient().rpc("moderate_writing_comment", {
        p_actor_user_id: input.actorUserId,
        p_comment_id: input.commentId,
        p_expected_updated_at: input.expectedVersion,
        p_target_state: input.targetState,
        p_reason_code: input.reasonCode,
      });
      return { data, errorCode: error?.message };
    },
  );
  if (result.ok) invalidateModerationResult(result.articleId, result.articleSlug, result.publicChanged);
  return result;
}

export async function setWritingDiscussionStateAction(
  _previousState: SetWritingDiscussionStateActionState,
  formData: FormData,
): Promise<Exclude<SetWritingDiscussionStateActionState, null>> {
  const authorization = await authorizeModerationAction();
  const result = await processSetWritingDiscussionState(
    {
      articleId: formData.get("articleId"),
      expectedVersion: formData.get("expectedVersion"),
      targetState: formData.get("targetState"),
    },
    authorization.originAllowed,
    authorization.actorUserId,
    async (input) => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const { data, error } = await getSupabaseServerClient().rpc("set_writing_discussion_state", {
        p_actor_user_id: input.actorUserId,
        p_article_id: input.articleId,
        p_expected_updated_at: input.expectedVersion,
        p_target_state: input.targetState,
      });
      return { data, errorCode: error?.message };
    },
  );
  if (result.ok) invalidateModerationResult(result.articleId, result.articleSlug, true);
  return result;
}
