"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getRelationshipModule, isRelationshipModuleId } from "@/data/life-alignment-relationship";
import { buildRelationshipSharedResult, normalizeRelationshipAnswers } from "@/lib/life-alignment-relationship";
import {
  ALIGNMENT_CONSENT_VERSION,
  alignmentInviteExpiresAt,
  generateAlignmentToken,
  hashAlignmentToken,
  isValidAlignmentToken,
  sanitizeAgreementItems,
  sanitizeParticipantDisplayName,
} from "@/lib/life-alignment-relationship-security";
import {
  consumeAlignmentRateLimit,
  type AlignmentRateLimitAction,
  ALIGNMENT_PARTICIPANT_COOKIE,
  currentAlignmentActor,
  getAlignmentTokenHashSecret,
  getAuthenticatedAlignmentUserId,
  relationshipPersistenceConfigured,
} from "@/lib/life-alignment-relationship-server";
import { getLocale } from "@/lib/i18n/server";
import { getLocalizedPathname } from "@/lib/i18n/routing";
import { isAllowedRequestOrigin } from "@/lib/security/submission";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { RelationshipAnswerSet, RelationshipModuleId } from "@/types/life-alignment-relationship";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export type RelationshipActionResult =
  | { ok: true; sessionId?: string; invitePath?: string; revision?: number; status?: string }
  | { ok: false; code: "INVALID_REQUEST" | "AUTH_REQUIRED" | "INVALID_INPUT" | "INVALID_INVITE" | "EXPIRED_INVITE" | "REVOKED_INVITE" | "UNAUTHORIZED" | "CONFLICT" | "RATE_LIMITED" | "SERVICE_UNAVAILABLE" };

async function requestIsTrusted(): Promise<boolean> {
  const requestHeaders = await headers();
  const siteUrl = process.env.SITE_URL;
  return Boolean(siteUrl && isAllowedRequestOrigin(requestHeaders.get("origin"), requestHeaders.get("host"), siteUrl));
}

function mapDatabaseError(message?: string): RelationshipActionResult {
  if (message?.includes("EXPIRED_INVITE")) return { ok: false, code: "EXPIRED_INVITE" };
  if (message?.includes("RATE_LIMITED")) return { ok: false, code: "RATE_LIMITED" };
  if (message?.includes("REVOKED_INVITE")) return { ok: false, code: "REVOKED_INVITE" };
  if (message?.includes("INVALID_INVITE")) return { ok: false, code: "INVALID_INVITE" };
  if (message?.includes("UNAUTHORIZED")) return { ok: false, code: "UNAUTHORIZED" };
  if (message?.includes("CONFLICT") || message?.includes("ALREADY_JOINED")) return { ok: false, code: "CONFLICT" };
  if (message?.includes("INVALID_INPUT") || message?.includes("INCOMPLETE")) return { ok: false, code: "INVALID_INPUT" };
  return { ok: false, code: "SERVICE_UNAVAILABLE" };
}
async function enforceRateLimit(action: AlignmentRateLimitAction, shortLimit: number, dailyLimit: number): Promise<RelationshipActionResult | null> {
  const outcome = await consumeAlignmentRateLimit(action, shortLimit, dailyLimit);
  if (outcome === "allowed") return null;
  return outcome === "limited" ? { ok: false, code: "RATE_LIMITED" } : { ok: false, code: "SERVICE_UNAVAILABLE" };
}


export async function createRelationshipSessionAction(moduleId: RelationshipModuleId): Promise<RelationshipActionResult> {
  if (!await requestIsTrusted()) return { ok: false, code: "INVALID_REQUEST" };
  const rateLimit = await enforceRateLimit("create-session", 5, 20);
  if (rateLimit) return rateLimit;
  if (!isRelationshipModuleId(moduleId)) return { ok: false, code: "INVALID_INPUT" };
  const userId = await getAuthenticatedAlignmentUserId();
  if (!userId) return { ok: false, code: "AUTH_REQUIRED" };
  const secret = getAlignmentTokenHashSecret();
  if (!secret || !relationshipPersistenceConfigured()) return { ok: false, code: "SERVICE_UNAVAILABLE" };
  const token = generateAlignmentToken();
  const definition = getRelationshipModule(moduleId);
  try {
    const { data, error } = await getSupabaseServerClient().rpc("create_alignment_session", {
      p_actor_user_id: userId,
      p_module_id: moduleId,
      p_module_version: definition.version,
      p_question_set_version: definition.questionSetVersion,
      p_interpretation_version: definition.interpretationVersion,
      p_invite_token_hash: hashAlignmentToken(token, secret, "invite"),
      p_expires_at: alignmentInviteExpiresAt().toISOString(),
    });
    return !error && typeof data === "string" && UUID_PATTERN.test(data)
      ? { ok: true, sessionId: data, invitePath: `/life-alignment/invite/${token}` }
      : mapDatabaseError(error?.message);
  } catch {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }
}

export async function joinRelationshipInviteAction(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const invalidInvitePath = getLocalizedPathname("/life-alignment/invite/invalid", locale);
  const token = formData.get("token");
  const displayName = sanitizeParticipantDisplayName(formData.get("displayName"));
  const consent = formData.get("consent") === "yes";
  const secret = getAlignmentTokenHashSecret();
  if (!await requestIsTrusted() || !isValidAlignmentToken(token) || !displayName || !consent || !secret || !relationshipPersistenceConfigured()) redirect(invalidInvitePath);
  const capability = generateAlignmentToken();
  const rateLimit = await consumeAlignmentRateLimit("join", 10, 50);
  if (rateLimit !== "allowed") redirect(invalidInvitePath);
  const { data, error } = await getSupabaseServerClient().rpc("join_alignment_invite", {
    p_token_hash: hashAlignmentToken(token, secret, "invite"),
    p_capability_hash: hashAlignmentToken(capability, secret, "participant"),
    p_display_name: displayName,
    p_consent_version: ALIGNMENT_CONSENT_VERSION,
  });
  if (error || typeof data !== "string" || !UUID_PATTERN.test(data)) redirect(invalidInvitePath);
  const sessionPath = getLocalizedPathname(`/life-alignment/session/${data}`, locale);
  (await cookies()).set(ALIGNMENT_PARTICIPANT_COOKIE, capability, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: getLocalizedPathname("/life-alignment/session", locale),
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(sessionPath);
}

function parseAnswers(moduleId: unknown, raw: unknown, allowPartial: boolean): { moduleId: RelationshipModuleId; answers: RelationshipAnswerSet } | null {
  if (!isRelationshipModuleId(moduleId) || typeof raw !== "string" || raw.length > 32_000) return null;
  try {
    const answers = normalizeRelationshipAnswers(getRelationshipModule(moduleId), JSON.parse(raw), allowPartial);
    return answers ? { moduleId, answers } : null;
  } catch {
    return null;
  }
}

export async function saveRelationshipAnswersAction(_previous: RelationshipActionResult, formData: FormData): Promise<RelationshipActionResult> {
  if (!await requestIsTrusted()) return { ok: false, code: "INVALID_REQUEST" };
  const sessionId = formData.get("sessionId");
  const complete = formData.get("complete") === "yes";
  const rateLimit = await enforceRateLimit("save-answers", 40, 300);
  if (rateLimit) return rateLimit;
  const parsed = parseAnswers(formData.get("moduleId"), formData.get("answers"), !complete);
  if (typeof sessionId !== "string" || !UUID_PATTERN.test(sessionId) || !parsed) return { ok: false, code: "INVALID_INPUT" };
  const actor = await currentAlignmentActor();
  if (!actor.userId && !actor.capabilityHash) return { ok: false, code: "UNAUTHORIZED" };
  try {
    const client = getSupabaseServerClient();
    const saved = await client.rpc("save_alignment_answers", {
      p_actor_user_id: actor.userId,
      p_capability_hash: actor.capabilityHash,
      p_session_id: sessionId,
      p_answers: parsed.answers,
      p_complete: complete,
    });
    if (saved.error) return mapDatabaseError(saved.error.message);
    if (saved.data === "ready_for_result") {
      const rows = await client.rpc("get_alignment_round_answers_for_result", { p_session_id: sessionId });
      if (rows.error || !Array.isArray(rows.data)) return { ok: false, code: "SERVICE_UNAVAILABLE" };
      const participantA: Record<string, { value: 1 | 2 | 3 | 4 | 5; importance: "low" | "medium" | "high" }> = {};
      const participantB: typeof participantA = {};
      for (const item of rows.data as Array<Record<string, unknown>>) {
        const target = item.role === "initiator" ? participantA : item.role === "invitee" ? participantB : null;
        if (!target || typeof item.question_id !== "string" || !Number.isInteger(item.answer_value) || !["low", "medium", "high"].includes(String(item.importance))) return { ok: false, code: "SERVICE_UNAVAILABLE" };
        target[item.question_id] = { value: item.answer_value as 1 | 2 | 3 | 4 | 5, importance: item.importance as "low" | "medium" | "high" };
      }
      const definition = getRelationshipModule(parsed.moduleId);
      const result = buildRelationshipSharedResult(parsed.moduleId, participantA, participantB, await getLocale());
      const stored = await client.rpc("store_alignment_shared_result", {
        p_session_id: sessionId,
        p_module_version: definition.version,
        p_question_set_version: definition.questionSetVersion,
        p_interpretation_version: definition.interpretationVersion,
        p_result: result,
      });
      if (stored.error && !stored.error.message.includes("RESULT_NOT_UNLOCKED")) return mapDatabaseError(stored.error.message);
    }
    return { ok: true, sessionId, status: String(saved.data) };
  } catch {
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }
}

export async function revokeRelationshipInviteAction(sessionId: string): Promise<RelationshipActionResult> {
  if (!await requestIsTrusted() || !UUID_PATTERN.test(sessionId)) return { ok: false, code: "INVALID_REQUEST" };
  const userId = await getAuthenticatedAlignmentUserId();
  if (!userId) return { ok: false, code: "AUTH_REQUIRED" };
  const rateLimit = await enforceRateLimit("revoke", 10, 50);
  if (rateLimit) return rateLimit;
  const { error } = await getSupabaseServerClient().rpc("revoke_alignment_invite", { p_actor_user_id: userId, p_session_id: sessionId });
  return error ? mapDatabaseError(error.message) : { ok: true, sessionId, status: "revoked" };
}

export async function saveRelationshipAgreementAction(_previous: RelationshipActionResult, formData: FormData): Promise<RelationshipActionResult> {
  if (!await requestIsTrusted()) return { ok: false, code: "INVALID_REQUEST" };
  const sessionId = formData.get("sessionId");
  const revision = Number(formData.get("revision"));
  const rateLimit = await enforceRateLimit("agreement", 30, 200);
  if (rateLimit) return rateLimit;
  const rawItems = formData.getAll("items");
  const items = sanitizeAgreementItems(rawItems);
  if (typeof sessionId !== "string" || !UUID_PATTERN.test(sessionId) || !Number.isInteger(revision) || revision < 0 || !items) return { ok: false, code: "INVALID_INPUT" };
  const actor = await currentAlignmentActor();
  const { data, error } = await getSupabaseServerClient().rpc("save_alignment_agreement", { p_actor_user_id: actor.userId, p_capability_hash: actor.capabilityHash, p_session_id: sessionId, p_expected_revision: revision, p_items: items });
  return !error && typeof data === "number" ? { ok: true, sessionId, revision: data, status: "draft" } : mapDatabaseError(error?.message);
}

export async function acknowledgeRelationshipAgreementAction(sessionId: string, revision: number): Promise<RelationshipActionResult> {
  if (!await requestIsTrusted() || !UUID_PATTERN.test(sessionId) || !Number.isInteger(revision) || revision < 1) return { ok: false, code: "INVALID_REQUEST" };
  const rateLimit = await enforceRateLimit("agreement", 30, 200);
  if (rateLimit) return rateLimit;
  const actor = await currentAlignmentActor();
  const { data, error } = await getSupabaseServerClient().rpc("acknowledge_alignment_agreement", { p_actor_user_id: actor.userId, p_capability_hash: actor.capabilityHash, p_session_id: sessionId, p_expected_revision: revision });
  return !error && typeof data === "string" ? { ok: true, sessionId, status: data } : mapDatabaseError(error?.message);
}

export async function deleteRelationshipParticipationAction(sessionId: string): Promise<RelationshipActionResult> {
  if (!await requestIsTrusted() || !UUID_PATTERN.test(sessionId)) return { ok: false, code: "INVALID_REQUEST" };
  const actor = await currentAlignmentActor();
  if (!actor.capabilityHash) return { ok: false, code: "UNAUTHORIZED" };
  const rateLimit = await enforceRateLimit("delete-participation", 5, 20);
  if (rateLimit) return rateLimit;
  const { error } = await getSupabaseServerClient().rpc("delete_alignment_participation", { p_capability_hash: actor.capabilityHash, p_session_id: sessionId });
  if (error) return mapDatabaseError(error.message);
  const locale = await getLocale();
  (await cookies()).set(ALIGNMENT_PARTICIPANT_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: getLocalizedPathname("/life-alignment/session", locale),
    maxAge: 0,
  });
  return { ok: true, sessionId, status: "withdrawn" };
}
