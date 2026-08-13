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

export type PublicWritingComment = {
  id: string;
  identity: "guest" | "account";
  displayName: string;
  isAuthor: boolean;
  body: string;
  createdAt: string;
};

export type PublicDiscussionResult =
  | { status: "data"; state: "open" | "closed"; comments: PublicWritingComment[] }
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
  | "PROFILE_REQUIRED"
  | "SERVICE_UNAVAILABLE";

export type SubmitGuestCommentResult =
  | { ok: true }
  | {
      ok: false;
      code: SubmitGuestCommentErrorCode;
      fieldErrors?: Partial<Record<GuestCommentField, string>>;
    };

export type GuestCommentActionState = SubmitGuestCommentResult | null;

export type DiscussionParticipation =
  | { kind: "guest"; formToken: string | null }
  | { kind: "profile-setup" }
  | { kind: "account"; displayName: string; formToken: string | null }
  | { kind: "unavailable" };

export type WritingDiscussionPageData = {
  discussion: PublicDiscussionResult;
  participation: DiscussionParticipation;
};

export type AccountCommentActionState = SubmitGuestCommentResult | null;

export type DisplayNameActionState =
  | { ok: true }
  | { ok: false; message: string }
  | null;
