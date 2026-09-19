import type {
  AlignmentAgreementStatus,
  AlignmentInviteStatus,
  AlignmentParticipantStatus,
  AlignmentSessionStatus,
  RelationshipAgreementView,
  RelationshipAnswerSet,
  RelationshipModuleId,
  RelationshipSessionView,
  RelationshipSharedResult,
} from "@/types/life-alignment-relationship";

export type RelationshipActor =
  | { kind: "authenticated"; userId: string }
  | { kind: "participant"; capabilityHash: string }
  | { kind: "public" };

export type PersistedParticipant = {
  id: string;
  role: "initiator" | "invitee";
  userId: string | null;
  capabilityHash: string | null;
  status: AlignmentParticipantStatus;
  answers: RelationshipAnswerSet;
};

export type PersistedAgreement = {
  id: string;
  revision: number;
  status: Exclude<AlignmentAgreementStatus, "none">;
  items: readonly string[];
  acknowledgedParticipantIds: readonly string[];
  updatedAt: string;
};

export type PersistedRelationshipSession = {
  id: string;
  moduleId: RelationshipModuleId;
  roundNumber: number;
  status: AlignmentSessionStatus;
  inviteStatus: AlignmentInviteStatus;
  inviteExpiresAt: string;
  participants: readonly [PersistedParticipant, PersistedParticipant];
  sharedResult: RelationshipSharedResult | null;
  agreement: PersistedAgreement | null;
};

export type RelationshipSessionErrorCode =
  | "INVALID_INVITE"
  | "EXPIRED_INVITE"
  | "REVOKED_INVITE"
  | "UNAUTHORIZED_SESSION"
  | "INVALID_TRANSITION"
  | "PARTICIPANT_ALREADY_JOINED"
  | "ASSESSMENT_INCOMPLETE"
  | "RESULT_NOT_UNLOCKED"
  | "AGREEMENT_CONFLICT";

export function effectiveInviteStatus(status: AlignmentInviteStatus, expiresAt: string, now = Date.now()): AlignmentInviteStatus {
  if (status === "active" && Date.parse(expiresAt) <= now) return "expired";
  return status;
}

export function canTransitionParticipant(from: AlignmentParticipantStatus, to: AlignmentParticipantStatus): boolean {
  const transitions: Record<AlignmentParticipantStatus, readonly AlignmentParticipantStatus[]> = {
    invited: ["joined", "withdrawn"],
    joined: ["in-progress", "completed", "withdrawn"],
    "in-progress": ["completed", "withdrawn"],
    completed: ["withdrawn"],
    withdrawn: [],
  };
  return transitions[from].includes(to);
}

function participantForActor(actor: RelationshipActor, participants: readonly PersistedParticipant[]): PersistedParticipant | null {
  if (actor.kind === "authenticated") return participants.find(({ role, userId }) => role === "initiator" && userId === actor.userId) ?? null;
  if (actor.kind === "participant") return participants.find(({ role, capabilityHash }) => role === "invitee" && capabilityHash === actor.capabilityHash) ?? null;
  return null;
}

function agreementView(agreement: PersistedAgreement | null, viewer: PersistedParticipant, counterpart: PersistedParticipant): RelationshipAgreementView | null {
  if (!agreement) return null;
  return {
    id: agreement.id,
    revision: agreement.revision,
    status: agreement.status,
    items: agreement.items,
    acknowledgedByViewer: agreement.acknowledgedParticipantIds.includes(viewer.id),
    acknowledgedByCounterpart: agreement.acknowledgedParticipantIds.includes(counterpart.id),
    updatedAt: agreement.updatedAt,
  };
}

export function buildRelationshipSessionView(session: PersistedRelationshipSession, actor: RelationshipActor, now = Date.now()): RelationshipSessionView | null {
  const viewer = participantForActor(actor, session.participants);
  if (!viewer || viewer.status === "withdrawn") return null;
  const counterpart = session.participants.find(({ id }) => id !== viewer.id);
  if (!counterpart) return null;
  const bothComplete = session.participants.every(({ status }) => status === "completed");
  const unlocked = bothComplete && Boolean(session.sharedResult);
  return {
    sessionId: session.id,
    moduleId: session.moduleId,
    roundNumber: session.roundNumber,
    viewerRole: viewer.role,
    sessionStatus: session.status,
    inviteStatus: effectiveInviteStatus(session.inviteStatus, session.inviteExpiresAt, now),
    inviteExpiresAt: session.inviteExpiresAt,
    ownStatus: viewer.status,
    counterpartStatus: counterpart.status,
    sharedResultAvailable: unlocked,
    ownAnswers: viewer.answers,
    sharedResult: unlocked ? session.sharedResult : null,
    agreement: unlocked ? agreementView(session.agreement, viewer, counterpart) : null,
  };
}

export function editAgreement(current: PersistedAgreement | null, id: string, items: readonly string[], authorParticipantId: string, now = new Date()): PersistedAgreement {
  void authorParticipantId;
  return {
    id,
    revision: (current?.revision ?? 0) + 1,
    status: "draft",
    items: [...items],
    acknowledgedParticipantIds: [],
    updatedAt: now.toISOString(),
  };
}

export function acknowledgeAgreement(current: PersistedAgreement, participantId: string, requiredParticipantIds: readonly [string, string], expectedRevision: number, now = new Date()): PersistedAgreement {
  if (current.revision !== expectedRevision || !requiredParticipantIds.includes(participantId)) throw new Error("AGREEMENT_CONFLICT");
  const acknowledgedParticipantIds = [...new Set([...current.acknowledgedParticipantIds, participantId])];
  const finalized = requiredParticipantIds.every((id) => acknowledgedParticipantIds.includes(id));
  return { ...current, status: finalized ? "finalized" : "awaiting-acknowledgement", acknowledgedParticipantIds, updatedAt: now.toISOString() };
}

export function withdrawParticipation(session: PersistedRelationshipSession, participantId: string): PersistedRelationshipSession {
  if (session.sharedResult && session.participants.every(({ status }) => status === "completed")) throw new Error("FINALIZED_DELETION_POLICY_REQUIRED");
  const participants = session.participants.map((participant) => participant.id === participantId ? { ...participant, status: "withdrawn" as const, answers: {} } : participant) as unknown as readonly [PersistedParticipant, PersistedParticipant];
  return { ...session, status: "withdrawn", participants, sharedResult: null, agreement: null };
}
