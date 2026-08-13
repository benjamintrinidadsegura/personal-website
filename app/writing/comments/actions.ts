"use server";

import { headers } from "next/headers";

import {
  createAccountCommentMessageHash,
  createCommentFormToken,
  createCommentMessageHash,
  createCommentNetworkHash,
  isAllowedRequestOrigin,
  verifyAccountCommentFormToken,
  verifyCommentFormToken,
} from "@/lib/comments/security";
import { validateCommentBody, validateGuestCommentSubmission } from "@/lib/comments/validation";
import type {
  AccountCommentActionState,
  GuestCommentActionState,
  RawGuestCommentSubmission,
  SubmitGuestCommentErrorCode,
  SubmitGuestCommentResult,
} from "@/types/comments";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

type RequestContext = {
  origin: string | null;
  host: string | null;
  networkIdentifier: string | null;
};

type CommentSecrets = {
  networkHashSecret: string;
  formTokenSecret: string;
  siteUrl: string;
};

type DatabaseSubmission = {
  articleId: string;
  parentCommentId: null;
  displayName: string;
  body: string;
  networkHash: string;
  messageHash: string;
  formTokenHash: string;
};

type SubmitToDatabase = (
  submission: DatabaseSubmission,
) => Promise<{ commentId: string | null; errorCode?: string }>;

type AccountDatabaseSubmission = Omit<DatabaseSubmission, "parentCommentId" | "displayName"> & {
  actorUserId: string;
};

type SubmitAccountToDatabase = (
  submission: AccountDatabaseSubmission,
) => Promise<{ commentId: string | null; errorCode?: string }>;

function configuration(): CommentSecrets | null {
  const networkHashSecret = process.env.WRITING_COMMENTS_IP_HASH_SECRET;
  const formTokenSecret = process.env.WRITING_COMMENTS_FORM_TOKEN_SECRET;
  const siteUrl = process.env.SITE_URL;
  return networkHashSecret && formTokenSecret && siteUrl
    ? { networkHashSecret, formTokenSecret, siteUrl }
    : null;
}

function mapDatabaseError(errorCode?: string): SubmitGuestCommentErrorCode {
  switch (errorCode) {
    case "WRITING_COMMENT_TOKEN_REPLAY": return "INVALID_FORM_TOKEN";
    case "WRITING_COMMENT_RATE_15":
    case "WRITING_COMMENT_RATE_24": return "RATE_LIMITED";
    case "WRITING_ACCOUNT_COMMENT_RATE_15":
    case "WRITING_ACCOUNT_COMMENT_RATE_24":
    case "WRITING_ACCOUNT_COMMENT_NETWORK_RATE_15":
    case "WRITING_ACCOUNT_COMMENT_NETWORK_RATE_24": return "RATE_LIMITED";
    case "WRITING_COMMENT_DUPLICATE": return "DUPLICATE";
    case "WRITING_COMMENT_ARTICLE_UNAVAILABLE": return "ARTICLE_UNAVAILABLE";
    case "WRITING_COMMENT_DISCUSSION_CLOSED": return "DISCUSSION_CLOSED";
    case "WRITING_COMMENT_DISCUSSION_DISABLED": return "DISCUSSION_DISABLED";
    case "WRITING_ACCOUNT_COMMENT_PROFILE_REQUIRED": return "PROFILE_REQUIRED";
    default: return "SERVICE_UNAVAILABLE";
  }
}

export async function processAccountCommentSubmission(
  articleId: string,
  raw: { body: unknown; website: unknown; formToken: unknown },
  request: RequestContext,
  actorUserId: string | null,
  secrets: CommentSecrets | null,
  submitToDatabase: SubmitAccountToDatabase,
  now = Date.now(),
): Promise<SubmitGuestCommentResult> {
  if (
    !UUID_PATTERN.test(articleId)
    || !actorUserId
    || !UUID_PATTERN.test(actorUserId)
    || !secrets
    || !request.networkIdentifier
    || !isAllowedRequestOrigin(request.origin, request.host, secrets.siteUrl)
  ) return { ok: false, code: secrets ? "INVALID_REQUEST" : "SERVICE_UNAVAILABLE" };

  if (typeof raw.website !== "string" || raw.website.length > 0) {
    return { ok: false, code: "INVALID_REQUEST" };
  }
  const body = validateCommentBody(raw.body);
  const formToken = typeof raw.formToken === "string" ? raw.formToken : "";
  if (!body || !formToken) {
    return { ok: false, code: "INVALID_INPUT", fieldErrors: { body: "Comment must contain 2 to 3,000 valid characters in at most 20 paragraphs." } };
  }

  const networkHash = createCommentNetworkHash(request.networkIdentifier, secrets.networkHashSecret);
  if (!networkHash) return { ok: false, code: "INVALID_REQUEST" };
  const token = verifyAccountCommentFormToken(
    articleId,
    actorUserId,
    formToken,
    secrets.formTokenSecret,
    now,
  );
  if (!token.valid) {
    return { ok: false, code: token.reason === "too-young" ? "SUBMISSION_TOO_FAST" : "INVALID_FORM_TOKEN" };
  }

  try {
    const result = await submitToDatabase({
      actorUserId,
      articleId,
      body,
      networkHash,
      messageHash: createAccountCommentMessageHash(articleId, actorUserId, body, secrets.networkHashSecret),
      formTokenHash: token.tokenHash,
    });
    return result.commentId && !result.errorCode
      ? { ok: true }
      : { ok: false, code: mapDatabaseError(result.errorCode) };
  } catch {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }
}

export async function processGuestCommentSubmission(
  articleId: string,
  raw: RawGuestCommentSubmission,
  request: RequestContext,
  secrets: CommentSecrets | null,
  submitToDatabase: SubmitToDatabase,
  now = Date.now(),
): Promise<SubmitGuestCommentResult> {
  if (
    !UUID_PATTERN.test(articleId)
    || !secrets
    || !request.networkIdentifier
    || !isAllowedRequestOrigin(request.origin, request.host, secrets.siteUrl)
  ) return { ok: false, code: secrets ? "INVALID_REQUEST" : "SERVICE_UNAVAILABLE" };

  const networkHash = createCommentNetworkHash(request.networkIdentifier, secrets.networkHashSecret);
  if (!networkHash) return { ok: false, code: "INVALID_REQUEST" };

  const validation = validateGuestCommentSubmission(raw);
  if (!validation.success) {
    return validation.isHoneypot
      ? { ok: false, code: "INVALID_REQUEST" }
      : { ok: false, code: "INVALID_INPUT", fieldErrors: validation.fieldErrors };
  }

  const token = verifyCommentFormToken(
    articleId,
    validation.formToken,
    secrets.formTokenSecret,
    now,
  );
  if (!token.valid) {
    return {
      ok: false,
      code: token.reason === "too-young" ? "SUBMISSION_TOO_FAST" : "INVALID_FORM_TOKEN",
    };
  }

  try {
    const result = await submitToDatabase({
      articleId,
      parentCommentId: null,
      ...validation.data,
      networkHash,
      messageHash: createCommentMessageHash(
        articleId,
        validation.data.body,
        secrets.networkHashSecret,
      ),
      formTokenHash: token.tokenHash,
    });
    return result.commentId && !result.errorCode
      ? { ok: true }
      : { ok: false, code: mapDatabaseError(result.errorCode) };
  } catch {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }
}

export async function issueGuestCommentFormToken(articleId: string): Promise<string | null> {
  const secrets = configuration();
  return secrets && UUID_PATTERN.test(articleId)
    ? createCommentFormToken(articleId, secrets.formTokenSecret)
    : null;
}

export async function submitGuestCommentAction(
  _previousState: GuestCommentActionState,
  formData: FormData,
): Promise<SubmitGuestCommentResult> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const articleId = formData.get("articleId");
  if (typeof articleId !== "string") return { ok: false, code: "INVALID_REQUEST" };

  const raw: RawGuestCommentSubmission = {
    displayName: formData.get("displayName"),
    body: formData.get("body"),
    website: formData.get("website"),
    formToken: formData.get("formToken"),
  };

  return processGuestCommentSubmission(
    articleId,
    raw,
    {
      origin: requestHeaders.get("origin"),
      host: requestHeaders.get("host"),
      networkIdentifier: requestHeaders.get("x-real-ip")?.trim() || forwardedFor || null,
    },
    configuration(),
    async (submission) => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const { data, error } = await getSupabaseServerClient().rpc("submit_guest_writing_comment", {
        p_article_id: submission.articleId,
        p_parent_comment_id: submission.parentCommentId,
        p_display_name: submission.displayName,
        p_body: submission.body,
        p_network_hash: submission.networkHash,
        p_message_hash: submission.messageHash,
        p_form_token_hash: submission.formTokenHash,
      });
      return { commentId: typeof data === "string" ? data : null, errorCode: error?.message };
    },
  );
}

export async function submitAccountCommentAction(
  _previousState: AccountCommentActionState,
  formData: FormData,
): Promise<SubmitGuestCommentResult> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const articleId = formData.get("articleId");
  if (typeof articleId !== "string") return { ok: false, code: "INVALID_REQUEST" };

  let actorUserId: string | null = null;
  try {
    const { createSupabaseAuthServerClient } = await import("@/lib/supabase/auth-server");
    const auth = await createSupabaseAuthServerClient();
    const { data, error } = await auth.auth.getUser();
    if (!error && data.user) actorUserId = data.user.id;
  } catch {
    actorUserId = null;
  }

  return processAccountCommentSubmission(
    articleId,
    {
      body: formData.get("body"),
      website: formData.get("website"),
      formToken: formData.get("formToken"),
    },
    {
      origin: requestHeaders.get("origin"),
      host: requestHeaders.get("host"),
      networkIdentifier: requestHeaders.get("x-real-ip")?.trim() || forwardedFor || null,
    },
    actorUserId,
    configuration(),
    async (submission) => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const { data, error } = await getSupabaseServerClient().rpc("submit_account_writing_comment", {
        p_actor_user_id: submission.actorUserId,
        p_article_id: submission.articleId,
        p_body: submission.body,
        p_network_hash: submission.networkHash,
        p_message_hash: submission.messageHash,
        p_form_token_hash: submission.formTokenHash,
      });
      return { commentId: typeof data === "string" ? data : null, errorCode: error?.message };
    },
  );
}
