import "server-only";

import { isRelationshipModuleId } from "@/data/life-alignment-relationship";
import { getAuthenticatedAlignmentUserId, relationshipPersistenceConfigured } from "@/lib/life-alignment-relationship-server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AlignmentAgreementStatus,
  AlignmentInviteStatus,
  AlignmentParticipantStatus,
  AlignmentSessionStatus,
  RelationshipModuleId,
} from "@/types/life-alignment-relationship";

export interface RelationshipSessionSummary {
  sessionId: string;
  moduleId: RelationshipModuleId;
  sessionStatus: AlignmentSessionStatus;
  inviteStatus: AlignmentInviteStatus;
  inviteExpiresAt: string;
  ownStatus: AlignmentParticipantStatus;
  counterpartStatus: AlignmentParticipantStatus;
  sharedResultAvailable: boolean;
  agreementStatus: AlignmentAgreementStatus;
  updatedAt: string;
}

const sessionStatuses = new Set<AlignmentSessionStatus>(["active", "completed", "withdrawn"]);
const inviteStatuses = new Set<AlignmentInviteStatus>(["active", "accepted", "completed", "expired", "revoked"]);
const participantStatuses = new Set<AlignmentParticipantStatus>(["invited", "joined", "in-progress", "completed", "withdrawn"]);
const agreementStatuses = new Set<AlignmentAgreementStatus>(["none", "draft", "awaiting-acknowledgement", "finalized"]);

function parseSummary(value: unknown): RelationshipSessionSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.session_id !== "string" || !isRelationshipModuleId(row.module_id)
    || !sessionStatuses.has(row.session_status as AlignmentSessionStatus)
    || !inviteStatuses.has(row.invite_status as AlignmentInviteStatus)
    || !participantStatuses.has(row.own_status as AlignmentParticipantStatus)
    || !participantStatuses.has(row.counterpart_status as AlignmentParticipantStatus)
    || typeof row.invite_expires_at !== "string" || typeof row.shared_result_available !== "boolean"
    || !agreementStatuses.has(row.agreement_status as AlignmentAgreementStatus) || typeof row.updated_at !== "string") return null;
  return {
    sessionId: row.session_id,
    moduleId: row.module_id,
    sessionStatus: row.session_status as AlignmentSessionStatus,
    inviteStatus: row.invite_status as AlignmentInviteStatus,
    inviteExpiresAt: row.invite_expires_at,
    ownStatus: row.own_status as AlignmentParticipantStatus,
    counterpartStatus: row.counterpart_status as AlignmentParticipantStatus,
    sharedResultAvailable: row.shared_result_available,
    agreementStatus: row.agreement_status as AlignmentAgreementStatus,
    updatedAt: row.updated_at,
  };
}

export async function listRelationshipSessions(): Promise<RelationshipSessionSummary[] | null> {
  if (!relationshipPersistenceConfigured()) return null;
  const userId = await getAuthenticatedAlignmentUserId();
  if (!userId) return [];
  try {
    const { data, error } = await getSupabaseServerClient().rpc("list_alignment_sessions", { p_actor_user_id: userId });
    if (error || !Array.isArray(data)) return null;
    const parsed = data.map(parseSummary);
    return parsed.every((item): item is RelationshipSessionSummary => item !== null) ? parsed : null;
  } catch {
    return null;
  }
}
