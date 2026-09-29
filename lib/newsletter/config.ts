import { NEWSLETTER_CONSENT_VERSION } from "@/lib/newsletter/domain";
import { parseSiteUrl } from "@/lib/site-url-validation";

export type NewsletterRuntimeConfiguration = {
  siteUrl: string;
  formTokenSecret: string;
  hashSecret: string;
  provider: "brevo";
  providerApiKey: string;
  fromEmail: string;
  replyToEmail: string;
  controllerAddress: string;
  consentVersion: typeof NEWSLETTER_CONSENT_VERSION;
};

export type NewsletterLifecycleConfiguration = {
  siteUrl: string;
  hashSecret: string;
};

export type NewsletterWebhookConfiguration = {
  secret: string;
};

export type NewsletterDeliveryConfiguration = NewsletterRuntimeConfiguration & NewsletterWebhookConfiguration;

function canonicalSiteUrl(value: string): string | null {
  return parseSiteUrl(value)?.origin ?? null;
}

function configuredEmail(value: string | undefined): string | null {
  const email = value?.trim().toLowerCase();
  return email
    && email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)
    && !/[\p{Cc}\p{Cf}]/u.test(email)
    ? email
    : null;
}

export function newsletterRuntimeConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): NewsletterRuntimeConfiguration | null {
  const siteUrl = environment.SITE_URL ? canonicalSiteUrl(environment.SITE_URL) : null;
  const controllerAddress = environment.NEWSLETTER_CONTROLLER_ADDRESS?.trim();
  const fromEmail = configuredEmail(environment.NEWSLETTER_FROM_EMAIL);
  const replyToEmail = configuredEmail(environment.NEWSLETTER_REPLY_TO_EMAIL);
  if (
    environment.NEWSLETTER_PUBLIC_ENABLED !== "true"
    || environment.NEWSLETTER_LEGAL_READY !== "true"
    || environment.NEWSLETTER_PROVIDER !== "brevo"
    || environment.BREVO_TRACKING_DISABLED !== "true"
    || !fromEmail
    || !replyToEmail
    || !siteUrl
    || !environment.NEWSLETTER_FORM_TOKEN_SECRET
    || !environment.NEWSLETTER_HASH_SECRET
    || !environment.BREVO_API_KEY
    || !controllerAddress
    || controllerAddress.length > 500
  ) return null;

  return {
    siteUrl,
    formTokenSecret: environment.NEWSLETTER_FORM_TOKEN_SECRET,
    hashSecret: environment.NEWSLETTER_HASH_SECRET,
    provider: "brevo",
    providerApiKey: environment.BREVO_API_KEY,
    fromEmail,
    replyToEmail,
    controllerAddress,
    consentVersion: NEWSLETTER_CONSENT_VERSION,
  };
}

export function newsletterLifecycleConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): NewsletterLifecycleConfiguration | null {
  const siteUrl = environment.SITE_URL ? canonicalSiteUrl(environment.SITE_URL) : null;
  return siteUrl && environment.NEWSLETTER_HASH_SECRET
    ? { siteUrl, hashSecret: environment.NEWSLETTER_HASH_SECRET }
    : null;
}

export function newsletterControllerAddress(
  environment: NodeJS.ProcessEnv = process.env,
): string | null {
  const value = environment.NEWSLETTER_CONTROLLER_ADDRESS?.trim();
  return value && value.length <= 500 ? value : null;
}

export function newsletterWebhookConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): NewsletterWebhookConfiguration | null {
  const secret = environment.NEWSLETTER_WEBHOOK_SECRET;
  return secret && secret.length >= 32 && secret.length <= 512 ? { secret } : null;
}

export function newsletterDeliveryConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): NewsletterDeliveryConfiguration | null {
  const runtime = newsletterRuntimeConfiguration(environment);
  const webhook = newsletterWebhookConfiguration(environment);
  return runtime && webhook ? { ...runtime, ...webhook } : null;
}
