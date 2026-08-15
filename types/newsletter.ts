export type NewsletterField = "email" | "consent";

export type RawNewsletterSubscription = {
  email: unknown;
  consent: unknown;
  website: unknown;
  formToken: unknown;
};

export type NewsletterSubscription = {
  email: string;
  consentVersion: string;
};

export type NewsletterRequestErrorCode =
  | "INVALID_INPUT"
  | "INVALID_REQUEST"
  | "INVALID_FORM_TOKEN"
  | "SUBMISSION_TOO_FAST"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE";

export type NewsletterRequestResult =
  | { ok: true }
  | {
      ok: false;
      code: NewsletterRequestErrorCode;
      fieldErrors?: Partial<Record<NewsletterField, string>>;
    };

export type NewsletterRequestActionState = NewsletterRequestResult | null;

export type NewsletterLifecycleResult =
  | { ok: true; status: "confirmed" | "already_confirmed" | "unsubscribed" | "already_unsubscribed" }
  | { ok: false; code: "INVALID_REQUEST" | "INVALID_OR_EXPIRED" | "SERVICE_UNAVAILABLE" };

export type NewsletterLifecycleActionState = NewsletterLifecycleResult | null;

export const newsletterEditionStates = ["draft", "sending", "sent", "failed"] as const;
export type NewsletterEditionState = (typeof newsletterEditionStates)[number];

export type NewsletterEdition = {
  id: string;
  writingArticleId: string;
  articleTitle: string;
  articleExcerpt: string;
  canonicalUrl: string;
  subject: string;
  preheader: string;
  introduction: string;
  state: NewsletterEditionState;
  version: number;
  createdAt: string;
  sendStartedAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  reconciliationCount: number;
};

export type NewsletterEditionInput = {
  writingArticleId: string;
  subject: string;
  preheader: string;
  introduction: string;
};

export type NewsletterEditionActionState = {
  ok: boolean;
  message: string;
  code?: "validation" | "conflict" | "configuration" | "error";
  fieldErrors?: Partial<Record<"article" | "subject" | "preheader" | "introduction", string>>;
} | null;
