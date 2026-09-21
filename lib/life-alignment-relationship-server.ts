import "server-only";

import { cookies, headers } from "next/headers";

import { isRelationshipModuleId } from "@/data/life-alignment-relationship";
import { hashAlignmentToken, isValidAlignmentToken } from "@/lib/life-alignment-relationship-security";
import { createContextHash } from "@/lib/security/submission";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { RelationshipInviteLandingView, RelationshipSessionView } from "@/types/life-alignment-relationship";

export const ALIGNMENT_PARTICIPANT_COOKIE = "bts_alignment_participant";

function tokenHashSecret(): string | null {
  const secret = process.env.ALIGNMENT_TOKEN_HASH_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function relationshipPersistenceConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY && process.env.SUPABASE_PUBLISHABLE_KEY && tokenHashSecret());
}
export type AlignmentRateLimitAction =
  | "invite-validate"
  | "create-session"
  | "join"
  | "save-answers"
  | "revoke"
  | "agreement"
  | "delete-participation";

export async function consumeAlignmentRateLimit(
  action: AlignmentRateLimitAction,
  shortLimit: number,
  dailyLimit: number,
): Promise<"allowed" | "limited" | "unavailable"> {
  const secret = tokenHashSecret();
  if (!secret || !relationshipPersistenceConfigured()) return "unavailable";
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const networkIdentifier = requestHeaders.get("x-real-ip")?.trim() || forwardedFor || null;
  if (!networkIdentifier || networkIdentifier.length > 200 || /[\r\n]/u.test(networkIdentifier)) return "unavailable";
  const authorityHash = createContextHash("alignment-network", networkIdentifier, secret);
  try {
    const { error } = await getSupabaseServerClient().rpc("consume_alignment_rate_limit", {
      p_action: action,
      p_authority_hash: authorityHash,
      p_short_limit: shortLimit,
      p_daily_limit: dailyLimit,
    });
    if (!error) return "allowed";
    return error.message.includes("ALIGNMENT_RATE_LIMITED") ? "limited" : "unavailable";
  } catch {
    return "unavailable";
  }
}


export async function currentAlignmentActor(): Promise<{ userId: string | null; capabilityHash: string | null }> {
  let userId: string | null = null;
  try {
    const auth = await createSupabaseAuthServerClient();
    const { data, error } = await auth.auth.getUser();
    if (!error && data.user) userId = data.user.id;
  } catch {
    userId = null;
  }
  const rawCapability = (await cookies()).get(ALIGNMENT_PARTICIPANT_COOKIE)?.value;
  const secret = tokenHashSecret();
  const capabilityHash = rawCapability && secret && isValidAlignmentToken(rawCapability)
    ? hashAlignmentToken(rawCapability, secret, "participant")
    : null;
  return { userId, capabilityHash };
}

export async function hashInviteCapability(token: string): Promise<string | null> {
  const secret = tokenHashSecret();
  return secret && isValidAlignmentToken(token) ? hashAlignmentToken(token, secret, "invite") : null;
}

export async function getRelationshipInviteLanding(token: string): Promise<RelationshipInviteLandingView | null> {
  const tokenHash = await hashInviteCapability(token);
  const rateLimit = await consumeAlignmentRateLimit("invite-validate", 30, 200);
  if (rateLimit !== "allowed") return null;
  if (!tokenHash || !relationshipPersistenceConfigured()) return null;
  try {
    const { data, error } = await getSupabaseServerClient().rpc("get_alignment_invite_landing", { p_token_hash: tokenHash });
    if (error || !Array.isArray(data) || data.length !== 1) return null;
    const row = data[0] as Record<string, unknown>;
    const status = row.invite_status;
    if (status !== "valid" && status !== "invalid" && status !== "expired" && status !== "revoked" && status !== "accepted") return null;
    if (status !== "valid") return { moduleId: "partner", inviterDisplayName: "", expiresAt: "", status };
    if (!isRelationshipModuleId(row.module_id) || typeof row.inviter_display_name !== "string" || typeof row.expires_at !== "string") return null;
    return { moduleId: row.module_id, inviterDisplayName: row.inviter_display_name, expiresAt: row.expires_at, status };
  } catch {
    return null;
  }
}

function validSessionView(value: unknown): value is RelationshipSessionView {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Partial<RelationshipSessionView>;
  return typeof row.sessionId === "string" && isRelationshipModuleId(row.moduleId)
    && (row.viewerRole === "initiator" || row.viewerRole === "invitee")
    && typeof row.roundNumber === "number" && typeof row.sharedResultAvailable === "boolean"
    && Boolean(row.ownAnswers && typeof row.ownAnswers === "object");
}

export async function getRelationshipSessionView(sessionId: string): Promise<RelationshipSessionView | null> {
  if (!relationshipPersistenceConfigured()) return null;
  const actor = await currentAlignmentActor();
  if (!actor.userId && !actor.capabilityHash) return null;
  try {
    const { data, error } = await getSupabaseServerClient().rpc("get_alignment_session_view", {
      p_actor_user_id: actor.userId,
      p_capability_hash: actor.capabilityHash,
      p_session_id: sessionId,
    });
    return !error && validSessionView(data) ? data : null;
  } catch {
    return null;
  }
}

export async function getAuthenticatedAlignmentUserId(): Promise<string | null> {
  try {
    const auth = await createSupabaseAuthServerClient();
    const { data, error } = await auth.auth.getUser();
    return !error && data.user ? data.user.id : null;
  } catch {
    return null;
  }
}

export function getAlignmentTokenHashSecret(): string | null {
  return tokenHashSecret();
}
