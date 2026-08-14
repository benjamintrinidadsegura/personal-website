import type { DiscussionState } from "@/types/comments";

export const commentModerationStates = ["visible", "held", "spam", "removed"] as const;
export type CommentModerationState = (typeof commentModerationStates)[number];

export const commentModerationReasonCodes = [
  "spam",
  "harassment",
  "personal_data",
  "off_topic",
  "other",
  "correction",
] as const;
export type CommentModerationReasonCode = (typeof commentModerationReasonCodes)[number];

export type ModerationCounts = {
  visible: number;
  held: number;
  spam: number;
  removed: number;
};

export type WritingDiscussionModerationSummary = {
  articleId: string;
  state: DiscussionState;
  explicitVersion: string | null;
  counts: ModerationCounts;
  latestCommentAt: string | null;
};

export type WritingDiscussionModerationContext = Omit<WritingDiscussionModerationSummary, "latestCommentAt">;

export type WritingCommentForModeration = {
  id: string;
  identity: "guest" | "account";
  displayName: string | null;
  body: string | null;
  moderationState: CommentModerationState;
  createdAt: string;
  editedAt: string | null;
  version: string;
  isAuthorDeleted: boolean;
  isAuthor: boolean;
  latestReasonCode: CommentModerationReasonCode | null;
};

export type ModerationReadResult<T> =
  | { status: "data"; data: T }
  | { status: "unavailable"; data: null };

export type ModerationMutationErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "UNAVAILABLE"
  | "STALE"
  | "NO_CHANGE"
  | "SERVICE_UNAVAILABLE";

export type ModerateWritingCommentActionState =
  | {
      ok: true;
      articleId: string;
      articleSlug: string;
      newState: CommentModerationState;
      version: string;
      publicChanged: boolean;
    }
  | { ok: false; code: ModerationMutationErrorCode }
  | null;

export type SetWritingDiscussionStateActionState =
  | {
      ok: true;
      articleId: string;
      articleSlug: string;
      newState: DiscussionState;
      version: string;
    }
  | { ok: false; code: ModerationMutationErrorCode }
  | null;
