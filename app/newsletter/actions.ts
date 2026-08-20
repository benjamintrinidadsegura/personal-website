"use server";

import { headers } from "next/headers";

import {
  newsletterLifecycleConfiguration,
  newsletterRuntimeConfiguration,
  type NewsletterRuntimeConfiguration,
} from "@/lib/newsletter/config";
import { createBrevoConfirmationSender, type SendConfirmationEmail } from "@/lib/newsletter/provider";
import {
  createNewsletterConfirmationToken,
  createNewsletterEmailHash,
  createNewsletterFormToken,
  createNewsletterNetworkHash,
  hashNewsletterConfirmationToken,
  isAllowedRequestOrigin,
  isNewsletterConfirmationToken,
  verifyNewsletterFormToken,
  verifyNewsletterUnsubscribeToken,
} from "@/lib/newsletter/security";
import { validateNewsletterSubscription } from "@/lib/newsletter/validation";
import { getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import { getLocalizedPathname } from "@/lib/i18n/routing";
import type {
  NewsletterLifecycleActionState,
  NewsletterLifecycleResult,
  NewsletterRequestActionState,
  NewsletterRequestErrorCode,
  NewsletterRequestResult,
  RawNewsletterSubscription,
} from "@/types/newsletter";

type RequestContext = {
  origin: string | null;
  host: string | null;
  networkIdentifier: string | null;
};

type NewsletterSecrets = Pick<
  NewsletterRuntimeConfiguration,
  "siteUrl" | "formTokenSecret" | "hashSecret" | "consentVersion"
>;

type SubscriptionDatabaseInput = {
  email: string;
  emailHash: string;
  networkHash: string;
  formTokenHash: string;
  confirmationTokenHash: string;
  consentVersion: string;
};

type SubscriptionDatabaseResult = {
  subscriberId: string | null;
  shouldSend: boolean;
  confirmationExpiresAt: string | null;
  errorCode?: string;
};

type RequestSubscriptionInDatabase = (
  input: SubscriptionDatabaseInput,
) => Promise<SubscriptionDatabaseResult>;

type ConfirmSubscriptionInDatabase = (
  confirmationTokenHash: string,
) => Promise<{ status: string | null; errorCode?: string }>;

type UnsubscribeInDatabase = (
  subscriberId: string,
  nonce: string,
) => Promise<{ status: string | null; errorCode?: string }>;

function mapRequestDatabaseError(errorCode?: string): NewsletterRequestErrorCode {
  switch (errorCode) {
    case "NEWSLETTER_RATE_15":
    case "NEWSLETTER_RATE_24":
    case "NEWSLETTER_EMAIL_RATE_24":
      return "RATE_LIMITED";
    case "NEWSLETTER_TOKEN_REPLAY":
      return "INVALID_FORM_TOKEN";
    default:
      return "SERVICE_UNAVAILABLE";
  }
}

export async function processNewsletterSubscription(
  raw: RawNewsletterSubscription,
  request: RequestContext,
  secrets: NewsletterSecrets | null,
  requestInDatabase: RequestSubscriptionInDatabase,
  sendConfirmation: SendConfirmationEmail,
  now = Date.now(),
  createConfirmationToken: () => string = createNewsletterConfirmationToken,
  locale: Locale = "en",
): Promise<NewsletterRequestResult> {
  if (
    !secrets
    || !request.networkIdentifier
    || !isAllowedRequestOrigin(request.origin, request.host, secrets.siteUrl)
  ) return { ok: false, code: secrets ? "INVALID_REQUEST" : "SERVICE_UNAVAILABLE" };

  const validation = validateNewsletterSubscription(raw, locale);
  if (!validation.success) {
    return validation.isHoneypot
      ? { ok: false, code: "INVALID_REQUEST" }
      : { ok: false, code: "INVALID_INPUT", fieldErrors: validation.fieldErrors };
  }
  if (validation.data.consentVersion !== secrets.consentVersion) {
    return { ok: false, code: "INVALID_REQUEST" };
  }

  const networkHash = createNewsletterNetworkHash(request.networkIdentifier, secrets.hashSecret);
  if (!networkHash) return { ok: false, code: "INVALID_REQUEST" };
  const formToken = verifyNewsletterFormToken(
    validation.formToken,
    secrets.formTokenSecret,
    now,
  );
  if (!formToken.valid) {
    return {
      ok: false,
      code: formToken.reason === "too-young" ? "SUBMISSION_TOO_FAST" : "INVALID_FORM_TOKEN",
    };
  }

  const confirmationToken = createConfirmationToken();
  if (!isNewsletterConfirmationToken(confirmationToken)) {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }

  try {
    const database = await requestInDatabase({
      email: validation.data.email,
      emailHash: createNewsletterEmailHash(validation.data.email, secrets.hashSecret),
      networkHash,
      formTokenHash: formToken.tokenHash,
      confirmationTokenHash: hashNewsletterConfirmationToken(confirmationToken, secrets.hashSecret),
      consentVersion: validation.data.consentVersion,
    });
    if (!database.subscriberId || database.errorCode) {
      return { ok: false, code: mapRequestDatabaseError(database.errorCode) };
    }

    if (
      database.shouldSend
      && (
        !database.confirmationExpiresAt
        || Number.isNaN(Date.parse(database.confirmationExpiresAt))
      )
    ) return { ok: false, code: "SERVICE_UNAVAILABLE" };

    if (database.shouldSend && database.confirmationExpiresAt) {
      const confirmationUrl = new URL(getLocalizedPathname("/newsletter/confirm", locale), secrets.siteUrl);
      confirmationUrl.searchParams.set("token", confirmationToken);
      // Public output remains deliberately identical if the provider is temporarily
      // unavailable. A later rate-limited request rotates the pending token.
      await sendConfirmation({
        to: validation.data.email,
        confirmationUrl: confirmationUrl.toString(),
        expiresAt: database.confirmationExpiresAt,
        locale,
      });
    }

    return { ok: true };
  } catch {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }
}

export async function processNewsletterConfirmation(
  token: unknown,
  requestIsValid: boolean,
  hashSecret: string | null,
  confirmInDatabase: ConfirmSubscriptionInDatabase,
): Promise<NewsletterLifecycleResult> {
  if (!requestIsValid || !hashSecret || !isNewsletterConfirmationToken(token)) {
    return { ok: false, code: "INVALID_REQUEST" };
  }
  try {
    const result = await confirmInDatabase(hashNewsletterConfirmationToken(token, hashSecret));
    if (result.errorCode) return { ok: false, code: "SERVICE_UNAVAILABLE" };
    if (result.status === "confirmed" || result.status === "already_confirmed") {
      return { ok: true, status: result.status };
    }
    return { ok: false, code: "INVALID_OR_EXPIRED" };
  } catch {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }
}

export async function processNewsletterUnsubscribe(
  token: unknown,
  requestIsValid: boolean,
  hashSecret: string | null,
  unsubscribeInDatabase: UnsubscribeInDatabase,
): Promise<NewsletterLifecycleResult> {
  if (!requestIsValid || !hashSecret || typeof token !== "string") {
    return { ok: false, code: "INVALID_REQUEST" };
  }
  const verification = verifyNewsletterUnsubscribeToken(token, hashSecret);
  if (!verification.valid) return { ok: false, code: "INVALID_OR_EXPIRED" };
  try {
    const result = await unsubscribeInDatabase(verification.subscriberId, verification.nonce);
    if (result.errorCode) return { ok: false, code: "SERVICE_UNAVAILABLE" };
    if (result.status === "unsubscribed" || result.status === "already_unsubscribed") {
      return { ok: true, status: result.status };
    }
    return { ok: false, code: "INVALID_OR_EXPIRED" };
  } catch {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }
}

async function requestContext() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    requestHeaders,
    context: {
      origin: requestHeaders.get("origin"),
      host: requestHeaders.get("host"),
      networkIdentifier: requestHeaders.get("x-real-ip")?.trim() || forwardedFor || null,
    },
  };
}

function validOrigin(
  requestHeaders: Awaited<ReturnType<typeof headers>>,
  configuration: { siteUrl: string } | null,
): boolean {
  return Boolean(configuration && isAllowedRequestOrigin(
    requestHeaders.get("origin"),
    requestHeaders.get("host"),
    configuration.siteUrl,
  ));
}

export async function issueNewsletterFormToken(): Promise<string | null> {
  const configuration = newsletterRuntimeConfiguration();
  return configuration ? createNewsletterFormToken(configuration.formTokenSecret) : null;
}

export async function submitNewsletterAction(
  _previousState: NewsletterRequestActionState,
  formData: FormData,
): Promise<NewsletterRequestResult> {
  const configuration = newsletterRuntimeConfiguration();
  const { context } = await requestContext();
  const raw: RawNewsletterSubscription = {
    email: formData.get("email"),
    consent: formData.get("consent"),
    website: formData.get("website"),
    formToken: formData.get("formToken"),
  };

  return processNewsletterSubscription(
    raw,
    context,
    configuration,
    async (input) => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const { data, error } = await getSupabaseServerClient().rpc("request_newsletter_subscription", {
        p_email: input.email,
        p_email_hash: input.emailHash,
        p_network_hash: input.networkHash,
        p_form_token_hash: input.formTokenHash,
        p_confirmation_token_hash: input.confirmationTokenHash,
        p_consent_version: input.consentVersion,
      });
      const row = Array.isArray(data) ? data[0] as Record<string, unknown> | undefined : undefined;
      return {
        subscriberId: typeof row?.subscriber_id === "string" ? row.subscriber_id : null,
        shouldSend: row?.should_send === true,
        confirmationExpiresAt: typeof row?.confirmation_expires_at === "string"
          ? row.confirmation_expires_at
          : null,
        errorCode: error?.message,
      };
    },
    configuration
      ? createBrevoConfirmationSender(configuration)
      : async () => false,
    Date.now(),
    createNewsletterConfirmationToken,
    await getLocale(),
  );
}

export async function confirmNewsletterAction(
  _previousState: NewsletterLifecycleActionState,
  formData: FormData,
): Promise<NewsletterLifecycleResult> {
  const configuration = newsletterLifecycleConfiguration();
  const { requestHeaders } = await requestContext();
  return processNewsletterConfirmation(
    formData.get("token"),
    validOrigin(requestHeaders, configuration),
    configuration?.hashSecret ?? null,
    async (confirmationTokenHash) => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const { data, error } = await getSupabaseServerClient().rpc("confirm_newsletter_subscription", {
        p_confirmation_token_hash: confirmationTokenHash,
      });
      return { status: typeof data === "string" ? data : null, errorCode: error?.message };
    },
  );
}

export async function unsubscribeNewsletterAction(
  _previousState: NewsletterLifecycleActionState,
  formData: FormData,
): Promise<NewsletterLifecycleResult> {
  const configuration = newsletterLifecycleConfiguration();
  const { requestHeaders } = await requestContext();
  return processNewsletterUnsubscribe(
    formData.get("token"),
    validOrigin(requestHeaders, configuration),
    configuration?.hashSecret ?? null,
    async (subscriberId, nonce) => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const { data, error } = await getSupabaseServerClient().rpc("unsubscribe_newsletter_subscription", {
        p_subscriber_id: subscriberId,
        p_unsubscribe_nonce: nonce,
      });
      return { status: typeof data === "string" ? data : null, errorCode: error?.message };
    },
  );
}
