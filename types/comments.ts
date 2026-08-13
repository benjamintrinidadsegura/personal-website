export const discussionStates = ["open", "closed", "disabled"] as const;
export type DiscussionState = (typeof discussionStates)[number];

export type GuestCommentField = "displayName" | "body";

export type RawGuestCommentSubmission = {
  displayName: unknown;
  body: unknown;
  website: unknown;
  formToken: unknown;
};

export type GuestCommentSubmission = {
  displayName: string;
  body: string;
};

export type PublicGuestComment = {
  id: string;
  displayName: string;
  body: string;
  createdAt: string;
};

export type PublicDiscussionResult =
  | { status: "data"; state: "open" | "closed"; comments: PublicGuestComment[] }
  | { status: "empty"; state: "open" | "closed"; comments: [] }
  | { status: "disabled"; state: "disabled"; comments: [] }
  | { status: "unavailable"; state: null; comments: [] };

export type SubmitGuestCommentErrorCode =
  | "INVALID_INPUT"
  | "INVALID_REQUEST"
  | "INVALID_FORM_TOKEN"
  | "SUBMISSION_TOO_FAST"
  | "RATE_LIMITED"
  | "DUPLICATE"
  | "ARTICLE_UNAVAILABLE"
  | "DISCUSSION_CLOSED"
  | "DISCUSSION_DISABLED"
  | "SERVICE_UNAVAILABLE";

export type SubmitGuestCommentResult =
  | { ok: true }
  | {
      ok: false;
      code: SubmitGuestCommentErrorCode;
      fieldErrors?: Partial<Record<GuestCommentField, string>>;
    };

export type GuestCommentActionState = SubmitGuestCommentResult | null;
