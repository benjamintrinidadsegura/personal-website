"use server";

import { headers } from "next/headers";

import {
  createContextHash,
  createDeletionReference,
  createFormToken,
  hashDeletionReference,
  isAllowedRequestOrigin,
  verifyFormToken,
} from "@/lib/echowall/security";
import { validateEchoSubmission } from "@/lib/echowall/validation";
import type {
  EchoActionState,
  RawEchoSubmission,
  SubmitEchoErrorCode,
  SubmitEchoResult,
} from "@/types/echowall";

type RequestContext = {
  origin: string | null;
  host: string | null;
  networkIdentifier: string | null;
};

type SubmissionSecrets = {
  ipHashSecret: string;
  formTokenSecret: string;
  siteUrl: string;
};

type DatabaseSubmission = {
  displayName: string;
  message: string;
  category: "thought" | "feedback" | "reaction" | "message" | null;
  email: string | null;
  networkHash: string;
  emailHash: string | null;
  messageHash: string;
  formTokenHash: string;
  deletionTokenHash: string;
};

type SubmitToDatabase = (
  submission: DatabaseSubmission,
) => Promise<{ echoId: string | null; errorCode?: string }>;

function configuration(): SubmissionSecrets | null {
  const ipHashSecret = process.env.ECHOWALL_IP_HASH_SECRET;
  const formTokenSecret = process.env.ECHOWALL_FORM_TOKEN_SECRET;
  const siteUrl = process.env.SITE_URL;

  if (!ipHashSecret || !formTokenSecret || !siteUrl) return null;
  return { ipHashSecret, formTokenSecret, siteUrl };
}

function mapDatabaseError(errorCode?: string): SubmitEchoErrorCode {
  switch (errorCode) {
    case "ECHOWALL_RATE_15":
    case "ECHOWALL_RATE_24":
      return "RATE_LIMITED";
    case "ECHOWALL_DUPLICATE":
      return "DUPLICATE";
    case "ECHOWALL_TOKEN_REPLAY":
      return "INVALID_FORM_TOKEN";
    default:
      return "SERVICE_UNAVAILABLE";
  }
}

export async function processEchoSubmission(
  raw: RawEchoSubmission,
  request: RequestContext,
  secrets: SubmissionSecrets | null,
  submitToDatabase: SubmitToDatabase,
  now = Date.now(),
): Promise<SubmitEchoResult> {
  if (
    !secrets ||
    !request.networkIdentifier ||
    !isAllowedRequestOrigin(request.origin, request.host, secrets.siteUrl)
  ) {
    return { ok: false, code: secrets ? "INVALID_REQUEST" : "SERVICE_UNAVAILABLE" };
  }

  const validation = validateEchoSubmission(raw);
  if (!validation.success) {
    return validation.isHoneypot
      ? { ok: false, code: "INVALID_REQUEST" }
      : {
          ok: false,
          code: "INVALID_INPUT",
          fieldErrors: validation.fieldErrors,
        };
  }

  const token = verifyFormToken(
    validation.formToken,
    secrets.formTokenSecret,
    now,
  );
  if (!token.valid) {
    return {
      ok: false,
      code:
        token.reason === "too-young"
          ? "SUBMISSION_TOO_FAST"
          : "INVALID_FORM_TOKEN",
    };
  }

  const deletionReference = createDeletionReference();
  const emailHash = validation.data.email
    ? createContextHash("email", validation.data.email, secrets.ipHashSecret)
    : null;

  try {
    const result = await submitToDatabase({
      ...validation.data,
      networkHash: createContextHash(
        "network",
        request.networkIdentifier,
        secrets.ipHashSecret,
      ),
      emailHash,
      messageHash: createContextHash(
        "message",
        validation.data.message,
        secrets.ipHashSecret,
      ),
      formTokenHash: token.tokenHash,
      deletionTokenHash: hashDeletionReference(
        deletionReference,
        secrets.formTokenSecret,
      ),
    });

    if (!result.echoId || result.errorCode) {
      return { ok: false, code: mapDatabaseError(result.errorCode) };
    }

    return { ok: true, deletionReference };
  } catch {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }
}

export async function issueEchoFormToken(): Promise<string | null> {
  const secrets = configuration();
  return secrets ? createFormToken(secrets.formTokenSecret) : null;
}

export async function submitEchoAction(
  _previousState: EchoActionState,
  formData: FormData,
): Promise<SubmitEchoResult> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const networkIdentifier =
    requestHeaders.get("x-real-ip")?.trim() || forwardedFor || null;

  const raw: RawEchoSubmission = {
    displayName: formData.get("displayName"),
    message: formData.get("message"),
    category: formData.get("category"),
    email: formData.get("email"),
    consent: formData.get("consent"),
    website: formData.get("website"),
    formToken: formData.get("formToken"),
  };

  return processEchoSubmission(
    raw,
    {
      origin: requestHeaders.get("origin"),
      host: requestHeaders.get("host"),
      networkIdentifier,
    },
    configuration(),
    async (submission) => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.rpc("submit_echo", {
        p_display_name: submission.displayName,
        p_message: submission.message,
        p_category: submission.category,
        p_email: submission.email,
        p_network_hash: submission.networkHash,
        p_email_hash: submission.emailHash,
        p_message_hash: submission.messageHash,
        p_form_token_hash: submission.formTokenHash,
        p_deletion_token_hash: submission.deletionTokenHash,
      });

      return {
        echoId: typeof data === "string" ? data : null,
        errorCode: error?.message,
      };
    },
  );
}
