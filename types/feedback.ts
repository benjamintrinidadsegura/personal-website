export const feedbackSourceContexts = [
  "home",
  "writing",
  "fyns",
  "world-map",
  "life-alignment",
  "projects",
  "people",
  "discovery",
  "other",
] as const;

export type FeedbackSourceContext = (typeof feedbackSourceContexts)[number];

export const feedbackStatuses = ["new", "read", "archived"] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];

export const feedbackAdminFilters = ["active", ...feedbackStatuses] as const;
export type FeedbackAdminFilter = (typeof feedbackAdminFilters)[number];

export const feedbackMessageMaximum = 4_000;
export const feedbackNameMaximum = 80;

export type FeedbackField = "message" | "name" | "sourceContext";

export type RawFeedbackSubmission = {
  message: unknown;
  name: unknown;
  sourceContext: unknown;
  website: unknown;
  formToken: unknown;
};

export type FeedbackSubmission = {
  message: string;
  name: string | null;
  sourceContext: FeedbackSourceContext;
};

export type SubmitFeedbackErrorCode =
  | "INVALID_INPUT"
  | "INVALID_REQUEST"
  | "INVALID_FORM_TOKEN"
  | "SUBMISSION_TOO_FAST"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE";

export type SubmitFeedbackResult =
  | { ok: true }
  | {
      ok: false;
      code: SubmitFeedbackErrorCode;
      fieldErrors?: Partial<Record<FeedbackField, string>>;
    };

export type FeedbackActionState = SubmitFeedbackResult | null;

export type AdminFeedbackSummary = {
  id: string;
  name: string | null;
  message_preview: string;
  source_context: FeedbackSourceContext;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
};

export type AdminFeedback = {
  id: string;
  name: string | null;
  message: string;
  source_context: FeedbackSourceContext;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
};

export type FeedbackAdminAction = "mark_read" | "archive" | "delete";

export type FeedbackAdminActionResult =
  | { ok: true; message: string; newStatus?: FeedbackStatus }
  | { ok: false; message: string };
