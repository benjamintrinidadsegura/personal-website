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
