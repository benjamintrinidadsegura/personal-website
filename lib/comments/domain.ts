import type { DiscussionState, PublicDiscussionResult, PublicWritingComment } from "@/types/comments";

type UnknownRow = Record<string, unknown>;

export function mapDiscussionState(value: unknown): DiscussionState | null {
  return value === "open" || value === "closed" || value === "disabled" ? value : null;
}

export function mapPublicWritingComment(row: UnknownRow): PublicWritingComment | null {
  if (
    typeof row.id !== "string"
    || (row.identity_kind !== "guest" && row.identity_kind !== "account")
    || typeof row.display_name !== "string"
    || typeof row.is_author !== "boolean"
    || typeof row.body !== "string"
    || typeof row.created_at !== "string"
    || Number.isNaN(Date.parse(row.created_at))
  ) return null;

  return {
    id: row.id,
    identity: row.identity_kind,
    displayName: row.display_name,
    isAuthor: row.identity_kind === "account" && row.is_author,
    body: row.body,
    createdAt: row.created_at,
  };
}

type QueryResult = { data: unknown; error: unknown };

export function resolvePublicDiscussionRead(
  articleResult: QueryResult,
  settingsResult: QueryResult,
  commentsResult: QueryResult,
): PublicDiscussionResult {
  if (
    articleResult.error
    || !articleResult.data
    || settingsResult.error
    || commentsResult.error
    || !Array.isArray(commentsResult.data)
  ) return { status: "unavailable", state: null, comments: [] };

  const state = settingsResult.data === null
    ? "open"
    : mapDiscussionState((settingsResult.data as { state?: unknown }).state);
  if (!state) return { status: "unavailable", state: null, comments: [] };
  if (state === "disabled") return { status: "disabled", state, comments: [] };

  const comments = commentsResult.data
    .map((row) => mapPublicWritingComment(row as UnknownRow))
    .filter((comment): comment is PublicWritingComment => comment !== null);
  return comments.length > 0
    ? { status: "data", state, comments }
    : { status: "empty", state, comments: [] };
}
