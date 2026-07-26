export const echoCategories = [
  "thought",
  "feedback",
  "reaction",
  "message",
] as const;

export type EchoCategory = (typeof echoCategories)[number];

export const echoStatuses = [
  "pending",
  "approved",
  "rejected",
  "hidden",
  "deleted",
] as const;

export type EchoStatus = (typeof echoStatuses)[number];

export type EchoField =
  | "displayName"
  | "message"
  | "category"
  | "email"
  | "consent";

export type EchoSubmission = {
  displayName: string;
  message: string;
  category: EchoCategory | null;
  email: string | null;
};

export type PublicEcho = {
  id: string;
  displayName: string;
  message: string;
  category: EchoCategory | null;
  publishedAt: string;
};

export type PublicEchoQueryResult =
  | { status: "data"; echoes: PublicEcho[] }
  | { status: "empty"; echoes: [] }
  | { status: "unavailable"; echoes: [] };

export type SubmitEchoErrorCode =
  | "INVALID_INPUT"
  | "INVALID_REQUEST"
  | "INVALID_FORM_TOKEN"
  | "SUBMISSION_TOO_FAST"
  | "RATE_LIMITED"
  | "DUPLICATE"
  | "SERVICE_UNAVAILABLE";

export type SubmitEchoResult =
  | {
      ok: true;
      deletionReference: string;
    }
  | {
      ok: false;
      code: SubmitEchoErrorCode;
      fieldErrors?: Partial<Record<EchoField, string>>;
      retryAfterSeconds?: number;
    };

export type EchoActionState = SubmitEchoResult | null;

export type RawEchoSubmission = {
  displayName: unknown;
  message: unknown;
  category: unknown;
  email: unknown;
  consent: unknown;
  website: unknown;
  formToken: unknown;
};

export const moderationFilters = [
  "pending",
  "approved",
  "rejected",
  "hidden",
  "deleted",
] as const;

export type ModerationFilter = (typeof moderationFilters)[number];
export type ModerationAction = "approve" | "reject" | "hide" | "restore" | "delete" | "restore_deleted";

export type AdminEcho = {
  id: string;
  display_name: string;
  message: string;
  category: EchoCategory | null;
  status: ModerationFilter;
  created_at: string;
  approved_at: string | null;
  decided_at: string | null;
  deleted_at: string | null;
  deletion_previous_status: EchoStatus | null;
  deletion_reason: string | null;
  deleted_by_current_admin: boolean | null;
  has_private_contact: boolean;
};

export type EchoModerationEvent = {
  action: string;
  previous_status: EchoStatus | null;
  new_status: EchoStatus | null;
  reason: string | null;
  created_at: string;
};

export type AdminActionResult =
  | { ok: true; publicChanged?: boolean; newStatus?: EchoStatus }
  | { ok: false; message: string };
