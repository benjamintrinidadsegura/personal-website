import { discussionStates, type DiscussionState } from "@/types/comments";
import {
  commentModerationReasonCodes,
  commentModerationStates,
  type CommentModerationReasonCode,
  type CommentModerationState,
  type ModerationCounts,
  type WritingCommentForModeration,
  type WritingDiscussionModerationContext,
  type WritingDiscussionModerationSummary,
} from "@/types/comment-moderation";

type UnknownRow = Record<string, unknown>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const TIMESTAMPTZ_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/u;

export function isModerationUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function isDiscussionState(value: unknown): value is DiscussionState {
  return discussionStates.some((state) => state === value);
}

export function isCommentModerationState(value: unknown): value is CommentModerationState {
  return commentModerationStates.some((state) => state === value);
}

export function isCommentModerationReasonCode(value: unknown): value is CommentModerationReasonCode {
  return commentModerationReasonCodes.some((reason) => reason === value);
}

export function parseModerationVersion(value: unknown): string | null {
  return typeof value === "string"
    && value.length <= 64
    && TIMESTAMPTZ_PATTERN.test(value)
    && !Number.isNaN(Date.parse(value))
    ? value
    : null;
}

export function isWritingSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 80 && SLUG_PATTERN.test(value);
}

function optionalDate(value: unknown): value is string | null {
  return value === null || parseModerationVersion(value) !== null;
}

function count(value: unknown): number | null {
  const parsed = typeof value === "string" && /^\d+$/u.test(value) ? Number(value) : value;
  return typeof parsed === "number" && Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function counts(row: UnknownRow): ModerationCounts | null {
  const visible = count(row.visible_count);
  const held = count(row.held_count);
  const spam = count(row.spam_count);
  const removed = count(row.removed_count);
  return visible === null || held === null || spam === null || removed === null
    ? null
    : { visible, held, spam, removed };
}

export function mapWritingDiscussionModerationSummary(row: UnknownRow): WritingDiscussionModerationSummary | null {
  const mappedCounts = counts(row);
  if (
    !isModerationUuid(row.article_id)
    || !isDiscussionState(row.discussion_state)
    || !optionalDate(row.discussion_updated_at)
    || !optionalDate(row.latest_comment_at)
    || !mappedCounts
  ) return null;

  return {
    articleId: row.article_id,
    state: row.discussion_state,
    explicitVersion: row.discussion_updated_at,
    counts: mappedCounts,
    latestCommentAt: row.latest_comment_at,
  };
}

export function mapWritingDiscussionModerationContext(row: UnknownRow): WritingDiscussionModerationContext | null {
  const mappedCounts = counts(row);
  if (
    !isModerationUuid(row.article_id)
    || !isDiscussionState(row.discussion_state)
    || !optionalDate(row.discussion_updated_at)
    || !mappedCounts
  ) return null;

  return {
    articleId: row.article_id,
    state: row.discussion_state,
    explicitVersion: row.discussion_updated_at,
    counts: mappedCounts,
  };
}

export function mapWritingCommentForModeration(row: UnknownRow): WritingCommentForModeration | null {
  if (
    !isModerationUuid(row.id)
    || (row.identity_kind !== "guest" && row.identity_kind !== "account")
    || !isCommentModerationState(row.moderation_state)
    || parseModerationVersion(row.created_at) === null
    || !optionalDate(row.edited_at)
    || parseModerationVersion(row.updated_at) === null
    || typeof row.is_author_deleted !== "boolean"
    || typeof row.is_author !== "boolean"
    || (row.identity_kind === "guest" && row.is_author)
    || (row.latest_reason_code !== null && !isCommentModerationReasonCode(row.latest_reason_code))
  ) return null;

  if (row.is_author_deleted) {
    if (row.identity_kind !== "account" || row.display_name !== null || row.body !== null || row.is_author) return null;
  } else if (typeof row.display_name !== "string" || typeof row.body !== "string") {
    return null;
  }

  return {
    id: row.id,
    identity: row.identity_kind,
    displayName: row.display_name,
    body: row.body,
    moderationState: row.moderation_state,
    createdAt: row.created_at as string,
    editedAt: row.edited_at,
    version: row.updated_at as string,
    isAuthorDeleted: row.is_author_deleted,
    isAuthor: row.is_author,
    latestReasonCode: row.latest_reason_code,
  };
}
