import type { DiscussionState, PublicDiscussionResult, PublicGuestComment } from "@/types/comments";

type UnknownRow = Record<string, unknown>;

export function mapDiscussionState(value: unknown): DiscussionState | null {
  return value === "open" || value === "closed" || value === "disabled" ? value : null;
}

export function mapPublicGuestComment(row: UnknownRow): PublicGuestComment | null {
  if (
    typeof row.id !== "string"
    || typeof row.guest_display_name !== "string"
    || typeof row.body !== "string"
    || typeof row.created_at !== "string"
    || Number.isNaN(Date.parse(row.created_at))
  ) return null;

  return {
    id: row.id,
    displayName: row.guest_display_name,
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
    .map((row) => mapPublicGuestComment(row as UnknownRow))
    .filter((comment): comment is PublicGuestComment => comment !== null);
  return comments.length > 0
    ? { status: "data", state, comments }
    : { status: "empty", state, comments: [] };
}
