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
  DeleteOwnCommentActionState,
  EditOwnCommentActionState,
  GuestCommentActionState,
  OwnerCommentMutationErrorCode,
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

type EditOwnCommentInDatabase = (input: {
  actorUserId: string;
  commentId: string;
  expectedVersion: string;
  body: string;
}) => Promise<{ version: string | null; errorCode?: string }>;

type DeleteOwnCommentInDatabase = (input: {
  actorUserId: string;
  commentId: string;
  expectedVersion: string;
}) => Promise<{ outcome: "deleted" | "tombstoned" | "absent" | null; errorCode?: string }>;

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

function mapOwnerMutationError(errorCode?: string): OwnerCommentMutationErrorCode {
  switch (errorCode) {
    case "WRITING_COMMENT_OWNER_INVALID_INPUT": return "INVALID_INPUT";
    case "WRITING_COMMENT_OWNER_UNAUTHORIZED": return "UNAUTHORIZED";
    case "WRITING_COMMENT_OWNER_UNAVAILABLE":
    case "WRITING_COMMENT_ARTICLE_UNAVAILABLE":
    case "WRITING_COMMENT_DISCUSSION_DISABLED": return "UNAVAILABLE";
    case "WRITING_COMMENT_OWNER_STALE": return "STALE";
    case "WRITING_COMMENT_OWNER_NO_CHANGE": return "NO_CHANGE";
    case "WRITING_COMMENT_OWNER_EDIT_COOLDOWN": return "COOLDOWN";
    default: return "SERVICE_UNAVAILABLE";
  }
}

function validVersion(value: unknown): value is string {
  return typeof value === "string"
    && value.length > 0
    && value.length <= 64
    && !Number.isNaN(Date.parse(value));
}

export async function processOwnCommentEdit(
  raw: { commentId: unknown; expectedVersion: unknown; body: unknown },
  requestIsValid: boolean,
  actorUserId: string | null,
  editInDatabase: EditOwnCommentInDatabase,
): Promise<Exclude<EditOwnCommentActionState, null>> {
  if (
    !requestIsValid
    || !actorUserId
    || !UUID_PATTERN.test(actorUserId)
    || typeof raw.commentId !== "string"
    || !UUID_PATTERN.test(raw.commentId)
    || !validVersion(raw.expectedVersion)
  ) return { ok: false, code: "INVALID_REQUEST" };

  const body = validateCommentBody(raw.body);
  if (!body) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      fieldError: "Comment must contain 2 to 3,000 valid characters in at most 20 paragraphs.",
    };
  }

  try {
    const result = await editInDatabase({
      actorUserId,
      commentId: raw.commentId,
      expectedVersion: raw.expectedVersion,
      body,
    });
    return result.version && !result.errorCode && validVersion(result.version)
      ? { ok: true, version: result.version }
      : { ok: false, code: mapOwnerMutationError(result.errorCode) };
  } catch {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }
}

export async function processOwnCommentDelete(
  raw: { commentId: unknown; expectedVersion: unknown },
  requestIsValid: boolean,
  actorUserId: string | null,
  deleteInDatabase: DeleteOwnCommentInDatabase,
): Promise<Exclude<DeleteOwnCommentActionState, null>> {
  if (
    !requestIsValid
    || !actorUserId
    || !UUID_PATTERN.test(actorUserId)
    || typeof raw.commentId !== "string"
    || !UUID_PATTERN.test(raw.commentId)
    || !validVersion(raw.expectedVersion)
  ) return { ok: false, code: "INVALID_REQUEST" };

  try {
    const result = await deleteInDatabase({
      actorUserId,
      commentId: raw.commentId,
      expectedVersion: raw.expectedVersion,
    });
    return result.outcome && !result.errorCode
      ? { ok: true, outcome: result.outcome }
      : { ok: false, code: mapOwnerMutationError(result.errorCode) };
  } catch {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }
}

async function verifiedActorUserId(): Promise<string | null> {
  try {
    const { createSupabaseAuthServerClient } = await import("@/lib/supabase/auth-server");
    const auth = await createSupabaseAuthServerClient();
    const { data, error } = await auth.auth.getUser();
    return !error && data.user ? data.user.id : null;
  } catch {
    return null;
  }
}

function validMutationOrigin(requestHeaders: Awaited<ReturnType<typeof headers>>): boolean {
  const siteUrl = process.env.SITE_URL;
  return Boolean(siteUrl && isAllowedRequestOrigin(
    requestHeaders.get("origin"),
    requestHeaders.get("host"),
    siteUrl,
  ));
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

  const actorUserId = await verifiedActorUserId();

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

export async function editOwnCommentAction(
  _previousState: EditOwnCommentActionState,
  formData: FormData,
): Promise<Exclude<EditOwnCommentActionState, null>> {
  const requestHeaders = await headers();
  const actorUserId = await verifiedActorUserId();
  return processOwnCommentEdit(
    {
      commentId: formData.get("commentId"),
      expectedVersion: formData.get("expectedVersion"),
      body: formData.get("body"),
    },
    validMutationOrigin(requestHeaders),
    actorUserId,
    async (input) => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const { data, error } = await getSupabaseServerClient().rpc("edit_own_writing_comment", {
        p_actor_user_id: input.actorUserId,
        p_comment_id: input.commentId,
        p_expected_updated_at: input.expectedVersion,
        p_body: input.body,
      });
      return { version: typeof data === "string" ? data : null, errorCode: error?.message };
    },
  );
}

export async function deleteOwnCommentAction(
  _previousState: DeleteOwnCommentActionState,
  formData: FormData,
): Promise<Exclude<DeleteOwnCommentActionState, null>> {
  const requestHeaders = await headers();
  const actorUserId = await verifiedActorUserId();
  return processOwnCommentDelete(
    {
      commentId: formData.get("commentId"),
      expectedVersion: formData.get("expectedVersion"),
    },
    validMutationOrigin(requestHeaders),
    actorUserId,
    async (input) => {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const { data, error } = await getSupabaseServerClient().rpc("delete_own_writing_comment", {
        p_actor_user_id: input.actorUserId,
        p_comment_id: input.commentId,
        p_expected_updated_at: input.expectedVersion,
      });
      const outcome = data === "deleted" || data === "tombstoned" || data === "absent" ? data : null;
      return { outcome, errorCode: error?.message };
    },
  );
}
