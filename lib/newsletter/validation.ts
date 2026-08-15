import { NEWSLETTER_CONSENT_VERSION } from "@/lib/newsletter/domain";
import type {
  NewsletterField,
  NewsletterSubscription,
  RawNewsletterSubscription,
} from "@/types/newsletter";

const CONTROL_OR_BIDI_CHARACTERS = /[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

type NewsletterValidationResult =
  | { success: true; data: NewsletterSubscription; formToken: string }
  | {
      success: false;
      fieldErrors: Partial<Record<NewsletterField, string>>;
      isHoneypot: boolean;
    };

export function normalizeNewsletterEmail(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("en-US");
}

export function validateNewsletterSubscription(
  raw: RawNewsletterSubscription,
): NewsletterValidationResult {
  const fieldErrors: Partial<Record<NewsletterField, string>> = {};
  if (typeof raw.website !== "string" || raw.website.length > 0) {
    return { success: false, fieldErrors, isHoneypot: true };
  }

  const email = typeof raw.email === "string" ? normalizeNewsletterEmail(raw.email) : "";
  const consent = raw.consent === "true" || raw.consent === "on";
  const formToken = typeof raw.formToken === "string" ? raw.formToken : "";

  if (
    Array.from(email).length < 3
    || Array.from(email).length > 254
    || CONTROL_OR_BIDI_CHARACTERS.test(email)
    || /[\r\n]/u.test(email)
    || !EMAIL_PATTERN.test(email)
  ) fieldErrors.email = "Enter a valid email address.";

  if (!consent) fieldErrors.consent = "Consent is required to subscribe.";
  if (!formToken) fieldErrors.consent ??= "This subscription form is no longer valid.";

  return Object.keys(fieldErrors).length > 0
    ? { success: false, fieldErrors, isHoneypot: false }
    : {
        success: true,
        data: { email, consentVersion: NEWSLETTER_CONSENT_VERSION },
        formToken,
      };
}
