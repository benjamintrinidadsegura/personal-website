"use server";

import { headers } from "next/headers";

import {
  createFeedbackFormToken,
  createFeedbackNetworkHash,
  isAllowedRequestOrigin,
  verifyFeedbackFormToken,
} from "@/lib/feedback/security";
import { validateFeedbackSubmission } from "@/lib/feedback/validation";
import type { Locale } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import type {
  FeedbackActionState,
  FeedbackContactMethod,
  FeedbackSourceContext,
  RawFeedbackSubmission,
  SubmitFeedbackErrorCode,
  SubmitFeedbackResult,
} from "@/types/feedback";

type RequestContext = {
  origin: string | null;
  host: string | null;
  networkIdentifier: string | null;
};

type FeedbackSecrets = {
  hashSecret: string;
  formTokenSecret: string;
  siteUrl: string;
};

type FeedbackDatabaseInput = {
  message: string;
  name: string | null;
  contactMethod: FeedbackContactMethod | null;
  contactValue: string | null;
  sourceContext: FeedbackSourceContext;
  networkHash: string;
  formTokenHash: string;
};

type SubmitFeedbackInDatabase = (
  input: FeedbackDatabaseInput,
) => Promise<{ accepted: boolean; errorCode?: string }>;

const feedbackFormFields = new Set([
  "message",
  "name",
  "contactMethod",
  "contactValue",
  "sourceContext",
  "website",
  "formToken",
]);

function configuration(): FeedbackSecrets | null {
  const hashSecret = process.env.ECHOWALL_IP_HASH_SECRET;
  const formTokenSecret = process.env.ECHOWALL_FORM_TOKEN_SECRET;
  const siteUrl = process.env.SITE_URL;
  return hashSecret && formTokenSecret && siteUrl
    ? { hashSecret, formTokenSecret, siteUrl }
    : null;
}

function mapDatabaseError(errorCode?: string): SubmitFeedbackErrorCode {
  switch (errorCode) {
    case "FEEDBACK_RATE_15":
    case "FEEDBACK_RATE_24":
      return "RATE_LIMITED";
    case "FEEDBACK_TOKEN_REPLAY":
      return "INVALID_FORM_TOKEN";
    default:
      return "SERVICE_UNAVAILABLE";
  }
}

export async function feedbackSubmissionFromFormData(formData: FormData): Promise<RawFeedbackSubmission | null> {
  const keys = [...formData.keys()];
  if (
    keys.length !== feedbackFormFields.size
    || new Set(keys).size !== feedbackFormFields.size
    || keys.some((key) => !feedbackFormFields.has(key))
  ) return null;

  return {
    message: formData.get("message"),
    name: formData.get("name"),
    contactMethod: formData.get("contactMethod"),
    contactValue: formData.get("contactValue"),
    sourceContext: formData.get("sourceContext"),
    website: formData.get("website"),
    formToken: formData.get("formToken"),
  };
}

export async function processFeedbackSubmission(
  raw: RawFeedbackSubmission,
  request: RequestContext,
  secrets: FeedbackSecrets | null,
  submitInDatabase: SubmitFeedbackInDatabase,
  now = Date.now(),
  locale: Locale = "de",
): Promise<SubmitFeedbackResult> {
  if (
    !secrets
    || !request.networkIdentifier
    || !isAllowedRequestOrigin(request.origin, request.host, secrets.siteUrl)
  ) return { ok: false, code: secrets ? "INVALID_REQUEST" : "SERVICE_UNAVAILABLE" };

  const validation = validateFeedbackSubmission(raw, locale);
  if (!validation.success) {
    return validation.isHoneypot
      ? { ok: false, code: "INVALID_REQUEST" }
      : { ok: false, code: "INVALID_INPUT", fieldErrors: validation.fieldErrors };
  }

  const networkHash = createFeedbackNetworkHash(request.networkIdentifier, secrets.hashSecret);
  if (!networkHash) return { ok: false, code: "INVALID_REQUEST" };

  const formToken = verifyFeedbackFormToken(
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

  try {
    const result = await submitInDatabase({
      ...validation.data,
      networkHash,
      formTokenHash: formToken.tokenHash,
    });
    return result.accepted && !result.errorCode
      ? { ok: true }
      : { ok: false, code: mapDatabaseError(result.errorCode) };
  } catch {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }
}

export async function issueFeedbackFormToken(): Promise<string | null> {
  const secrets = configuration();
  return secrets ? createFeedbackFormToken(secrets.formTokenSecret) : null;
}

export async function submitFeedbackAction(
  _previousState: FeedbackActionState,
  formData: FormData,
): Promise<SubmitFeedbackResult> {
  const raw = await feedbackSubmissionFromFormData(formData);
  if (!raw) return { ok: false, code: "INVALID_REQUEST" };

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const context: RequestContext = {
    origin: requestHeaders.get("origin"),
    host: requestHeaders.get("host"),
    networkIdentifier: requestHeaders.get("x-real-ip")?.trim() || forwardedFor || null,
  };

  return processFeedbackSubmission(
    raw,
    context,
    configuration(),
    async (input) => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const { data, error } = await getSupabaseServerClient().rpc("submit_private_feedback", {
        p_message: input.message,
        p_name: input.name,
        p_contact_method: input.contactMethod,
        p_contact_value: input.contactValue,
        p_source_context: input.sourceContext,
        p_network_hash: input.networkHash,
        p_form_token_hash: input.formTokenHash,
      });
      return { accepted: data === true, errorCode: error?.message };
    },
    Date.now(),
    await getLocale(),
  );
}
