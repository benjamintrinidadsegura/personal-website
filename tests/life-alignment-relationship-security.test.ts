import assert from "node:assert/strict";
import test from "node:test";

import {
  ALIGNMENT_INVITE_LIFETIME_MS,
  alignmentInviteExpiresAt,
  constantTimeTokenHashEqual,
  createAlignmentSafeEvent,
  generateAlignmentToken,
  hashAlignmentToken,
  isValidAlignmentToken,
  sanitizeAgreementItems,
  sanitizeParticipantDisplayName,
} from "../lib/life-alignment-relationship-security";
import {
  acknowledgeAgreement,
  buildRelationshipSessionView,
  canTransitionParticipant,
  editAgreement,
  effectiveInviteStatus,
  withdrawParticipation,
  type PersistedRelationshipSession,
} from "../lib/life-alignment-relationship-session";
import { buildRelationshipSharedResult } from "../lib/life-alignment-relationship";
import { getRelationshipModule } from "../data/life-alignment-relationship";

const secret = "a".repeat(32);

function completedAnswers(moduleId: "partner" | "friendship" | "founder") {
  return Object.fromEntries(getRelationshipModule(moduleId).questions.map(({ id }) => [id, { value: 3 as const, importance: "medium" as const }]));
}

function session(): PersistedRelationshipSession {
  const left = completedAnswers("partner");
  const right = completedAnswers("partner");
  return {
    id: "00000000-0000-4000-8000-000000000001",
    moduleId: "partner",
    roundNumber: 1,
    status: "active",
    inviteStatus: "accepted",
    inviteExpiresAt: "2099-01-08T00:00:00.000Z",
    participants: [
      { id: "a", role: "initiator", userId: "user-a", capabilityHash: null, status: "completed", answers: left },
      { id: "b", role: "invitee", userId: null, capabilityHash: "cap-b", status: "completed", answers: right },
    ],
    sharedResult: buildRelationshipSharedResult("partner", left, right, "en"),
    agreement: null,
  };
}

test("invite and participant secrets are 256-bit random capabilities and persist only as purpose-bound hashes", () => {
  const token = generateAlignmentToken();
  assert.equal(isValidAlignmentToken(token), true);
  assert.equal(Buffer.from(token, "base64url").length, 32);
  const inviteHash = hashAlignmentToken(token, secret, "invite");
  const participantHash = hashAlignmentToken(token, secret, "participant");
  assert.equal(inviteHash.length, 64);
  assert.notEqual(inviteHash, token);
  assert.notEqual(inviteHash, participantHash);
  assert.equal(constantTimeTokenHashEqual(inviteHash, inviteHash), true);
  assert.equal(constantTimeTokenHashEqual(inviteHash, participantHash), false);
});

test("invite expiry is exactly seven days and computed expiry fails closed", () => {
  const now = Date.parse("2026-09-19T00:00:00.000Z");
  assert.equal(alignmentInviteExpiresAt(now).getTime() - now, ALIGNMENT_INVITE_LIFETIME_MS);
  assert.equal(effectiveInviteStatus("active", new Date(now - 1).toISOString(), now), "expired");
  assert.equal(effectiveInviteStatus("revoked", new Date(now + 1000).toISOString(), now), "revoked");
});

test("server view authority exposes only the viewer's own answers before unlock", () => {
  const record = session();
  record.participants[1].status = "in-progress";
  record.sharedResult = null;
  record.participants[1].answers = completedAnswers("partner"); for (const answer of Object.values(record.participants[1].answers)) if (answer) answer.value = 5;
  const view = buildRelationshipSessionView(record, { kind: "authenticated", userId: "user-a" });
  assert.ok(view);
  assert.deepEqual(view.ownAnswers, record.participants[0].answers);
  assert.equal(view.sharedResult, null);
  assert.equal(view.sharedResultAvailable, false);
  assert.equal(JSON.stringify(view).includes("cap-b"), false);
  assert.equal(JSON.stringify(view).includes(JSON.stringify(record.participants[1].answers)), false);
  assert.equal(buildRelationshipSessionView(record, { kind: "public" }), null);
  assert.equal(buildRelationshipSessionView(record, { kind: "participant", capabilityHash: "guessed" }), null);
});

test("both completed participants receive the same derived result, never counterpart raw answers", () => {
  const record = session();
  const a = buildRelationshipSessionView(record, { kind: "authenticated", userId: "user-a" });
  const b = buildRelationshipSessionView(record, { kind: "participant", capabilityHash: "cap-b" });
  assert.ok(a?.sharedResult && b?.sharedResult);
  assert.deepEqual(a.sharedResult, b.sharedResult);
  assert.deepEqual(a.ownAnswers, record.participants[0].answers);
  assert.deepEqual(b.ownAnswers, record.participants[1].answers);
});

test("participant lifecycle rejects arbitrary state selection", () => {
  assert.equal(canTransitionParticipant("invited", "joined"), true);
  assert.equal(canTransitionParticipant("joined", "completed"), true);
  assert.equal(canTransitionParticipant("completed", "in-progress"), false);
  assert.equal(canTransitionParticipant("withdrawn", "joined"), false);
});

test("agreement edits reset acknowledgements and two current-revision acknowledgements finalize", () => {
  const draft = editAgreement(null, "agreement", ["We revisit this after the pilot."], "a", new Date("2026-09-19T00:00:00Z"));
  const one = acknowledgeAgreement(draft, "a", ["a", "b"], 1);
  assert.equal(one.status, "awaiting-acknowledgement");
  const edited = editAgreement(one, "agreement", ["We revisit this one week after the pilot."], "b");
  assert.equal(edited.revision, 2);
  assert.deepEqual(edited.acknowledgedParticipantIds, []);
  assert.throws(() => acknowledgeAgreement(edited, "a", ["a", "b"], 1), /AGREEMENT_CONFLICT/);
  const a = acknowledgeAgreement(edited, "a", ["a", "b"], 2);
  const finalized = acknowledgeAgreement(a, "b", ["a", "b"], 2);
  assert.equal(finalized.status, "finalized");
});

test("validation enforces minimal identity and agreement collection", () => {
  assert.equal(sanitizeParticipantDisplayName("  Synthetic Guest  "), "Synthetic Guest");
  assert.equal(sanitizeParticipantDisplayName("x"), null);
  assert.equal(sanitizeParticipantDisplayName("Name\nInjected"), null);
  assert.deepEqual(sanitizeAgreementItems(["  We review this next week.  "]), ["We review this next week."]);
  assert.equal(sanitizeAgreementItems([]), null);
  assert.equal(sanitizeAgreementItems(Array.from({ length: 6 }, (_, index) => `Agreement ${index}`)), null);
});

test("withdrawal clears only that participation before shared finalization and refuses ambiguous finalized deletion", () => {
  const record = session();
  assert.throws(() => withdrawParticipation(record, "b"), /FINALIZED_DELETION_POLICY_REQUIRED/);
  record.sharedResult = null;
  record.participants[1].status = "in-progress";
  const withdrawn = withdrawParticipation(record, "b");
  assert.equal(withdrawn.participants[1].status, "withdrawn");
  assert.deepEqual(withdrawn.participants[1].answers, {});
  assert.notDeepEqual(withdrawn.participants[0].answers, {});
});

test("observability events contain only an allowlisted reason and no private payload", () => {
  const event = createAlignmentSafeEvent("alignment_submission_failed", "unauthorized", new Date("2026-09-19T00:00:00Z"));
  assert.deepEqual(Object.keys(event).sort(), ["event", "occurredAt", "product", "reason", "schemaVersion"]);
  assert.equal(JSON.stringify(event).includes("token"), false);
  assert.equal(JSON.stringify(event).includes("answer"), false);
});
