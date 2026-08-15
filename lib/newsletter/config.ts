import { NEWSLETTER_CONSENT_VERSION } from "@/lib/newsletter/domain";

export const NEWSLETTER_FROM_EMAIL = "newsletter@bts.online";
export const NEWSLETTER_REPLY_TO_EMAIL = "hello@bts.online";

export type NewsletterRuntimeConfiguration = {
  siteUrl: string;
  formTokenSecret: string;
  hashSecret: string;
  provider: "brevo";
  providerApiKey: string;
  fromEmail: typeof NEWSLETTER_FROM_EMAIL;
  replyToEmail: typeof NEWSLETTER_REPLY_TO_EMAIL;
  controllerAddress: string;
  consentVersion: typeof NEWSLETTER_CONSENT_VERSION;
};

export type NewsletterLifecycleConfiguration = {
  siteUrl: string;
  hashSecret: string;
};

function canonicalSiteUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.username || url.password || url.search || url.hash
      ? null
      : url.origin;
  } catch {
    return null;
  }
}

export function newsletterRuntimeConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): NewsletterRuntimeConfiguration | null {
  const siteUrl = environment.SITE_URL ? canonicalSiteUrl(environment.SITE_URL) : null;
  const controllerAddress = environment.NEWSLETTER_CONTROLLER_ADDRESS?.trim();
  if (
    environment.NEWSLETTER_PUBLIC_ENABLED !== "true"
    || environment.NEWSLETTER_LEGAL_READY !== "true"
    || environment.NEWSLETTER_PROVIDER !== "brevo"
    || environment.BREVO_TRACKING_DISABLED !== "true"
    || environment.NEWSLETTER_FROM_EMAIL !== NEWSLETTER_FROM_EMAIL
    || environment.NEWSLETTER_REPLY_TO_EMAIL !== NEWSLETTER_REPLY_TO_EMAIL
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
    fromEmail: NEWSLETTER_FROM_EMAIL,
    replyToEmail: NEWSLETTER_REPLY_TO_EMAIL,
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
