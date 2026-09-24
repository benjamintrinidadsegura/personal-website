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

export const resultFeedbackProducts = ["personal-advantage", "money-profile"] as const;
export type ResultFeedbackProduct = (typeof resultFeedbackProducts)[number];

export const resultFeedbackFits = ["mostly", "partly", "not_really"] as const;
export type ResultFeedbackFit = (typeof resultFeedbackFits)[number];

export const resultFeedbackUsefulnessCategories = [
  "pattern",
  "tradeoffs",
  "next_steps",
  "stress_context",
  "other",
] as const;
export type ResultFeedbackUsefulnessCategory = (typeof resultFeedbackUsefulnessCategories)[number];

export const feedbackContactMethods = [
  "email",
  "linkedin",
  "instagram",
  "whatsapp",
  "phone",
  "other",
] as const;

export type FeedbackContactMethod = (typeof feedbackContactMethods)[number];

export const feedbackStatuses = ["new", "read", "archived"] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];

export const feedbackAdminFilters = ["active", ...feedbackStatuses] as const;
export type FeedbackAdminFilter = (typeof feedbackAdminFilters)[number];

export const feedbackMessageMaximum = 4_000;
export const feedbackNameMaximum = 80;
export const feedbackContactValueMaximum = 240;
export const resultFeedbackMessageMaximum = 1_200;

export type FeedbackField =
  | "message"
  | "name"
  | "contactMethod"
  | "contactValue"
  | "sourceContext"
  | "resultProduct"
  | "resultFit"
  | "usefulnessCategory";

export type RawFeedbackSubmission = {
  message: unknown;
  name: unknown;
  contactMethod: unknown;
  contactValue: unknown;
  sourceContext: unknown;
  website: unknown;
  formToken: unknown;
  resultProduct?: unknown;
  resultFit?: unknown;
  usefulnessCategory?: unknown;
};

export type FeedbackSubmission = {
  message: string;
  name: string | null;
  contactMethod: FeedbackContactMethod | null;
  contactValue: string | null;
  sourceContext: FeedbackSourceContext;
  resultProduct: ResultFeedbackProduct | null;
  resultFit: ResultFeedbackFit | null;
  usefulnessCategory: ResultFeedbackUsefulnessCategory | null;
  locale: string;
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
  contact_method: FeedbackContactMethod | null;
  contact_value: string | null;
  message_preview: string | null;
  source_context: FeedbackSourceContext;
  result_product: ResultFeedbackProduct | null;
  result_fit: ResultFeedbackFit | null;
  usefulness_category: ResultFeedbackUsefulnessCategory | null;
  locale: string | null;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
};

export type AdminFeedback = {
  id: string;
  name: string | null;
  contact_method: FeedbackContactMethod | null;
  contact_value: string | null;
  message: string | null;
  source_context: FeedbackSourceContext;
  result_product: ResultFeedbackProduct | null;
  result_fit: ResultFeedbackFit | null;
  usefulness_category: ResultFeedbackUsefulnessCategory | null;
  locale: string | null;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
};

export type FeedbackAdminAction = "mark_read" | "archive" | "delete";

export type FeedbackAdminActionResult =
  | { ok: true; message: string; newStatus?: FeedbackStatus }
  | { ok: false; message: string };
