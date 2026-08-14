import "server-only";

import { verifyAdminAuthorization } from "@/lib/admin/authorization";
import {
  isModerationUuid,
  mapWritingCommentForModeration,
  mapWritingDiscussionModerationContext,
  mapWritingDiscussionModerationSummary,
} from "@/lib/comments/moderation-domain";
import { withCommentsReadDeadline } from "@/lib/comments/read-deadline";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ModerationReadResult,
  WritingCommentForModeration,
  WritingDiscussionModerationContext,
  WritingDiscussionModerationSummary,
} from "@/types/comment-moderation";

const unavailable = <T>(): ModerationReadResult<T> => ({ status: "unavailable", data: null });

async function authorizedModerationRead<T>(
  read: (actorUserId: string, signal: AbortSignal) => Promise<T | null>,
): Promise<ModerationReadResult<T>> {
  return withCommentsReadDeadline(async (signal) => {
    const authorization = await verifyAdminAuthorization(true);
    if (!authorization) return unavailable<T>();
    const data = await read(authorization.user.id, signal);
    return data === null ? unavailable<T>() : { status: "data" as const, data };
  }, unavailable<T>());
}

export async function listWritingDiscussionModerationSummaries(
  limit = 100,
): Promise<ModerationReadResult<WritingDiscussionModerationSummary[]>> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return unavailable();
  return authorizedModerationRead(async (actorUserId, signal) => {
    const { data, error } = await getSupabaseServerClient()
      .rpc("list_writing_discussion_summaries", {
        p_actor_user_id: actorUserId,
        p_limit: limit,
      })
      .abortSignal(signal);
    if (error || !Array.isArray(data)) return null;
    const summaries = data.map((row) => mapWritingDiscussionModerationSummary(row));
    return summaries.every((summary) => summary !== null)
      ? summaries as WritingDiscussionModerationSummary[]
      : null;
  });
}

export async function getWritingDiscussionModerationContext(
  articleId: string,
): Promise<ModerationReadResult<WritingDiscussionModerationContext>> {
  if (!isModerationUuid(articleId)) return unavailable();
  return authorizedModerationRead(async (actorUserId, signal) => {
    const { data, error } = await getSupabaseServerClient()
      .rpc("get_writing_discussion_for_moderation", {
        p_actor_user_id: actorUserId,
        p_article_id: articleId,
      })
      .abortSignal(signal);
    if (error || !Array.isArray(data) || data.length !== 1) return null;
    return mapWritingDiscussionModerationContext(data[0]);
  });
}

export async function listWritingCommentsForModeration(
  articleId: string,
  limit = 50,
): Promise<ModerationReadResult<WritingCommentForModeration[]>> {
  if (!isModerationUuid(articleId) || !Number.isInteger(limit) || limit < 1 || limit > 50) {
    return unavailable();
  }
  return authorizedModerationRead(async (actorUserId, signal) => {
    const { data, error } = await getSupabaseServerClient()
      .rpc("list_writing_comments_for_moderation", {
        p_actor_user_id: actorUserId,
        p_article_id: articleId,
        p_limit: limit,
      })
      .abortSignal(signal);
    if (error || !Array.isArray(data)) return null;
    const comments = data.map((row) => mapWritingCommentForModeration(row));
    return comments.every((comment) => comment !== null)
      ? comments as WritingCommentForModeration[]
      : null;
  });
}
