import type { Locale } from "@/lib/i18n/config";

export type RelationshipModuleId = "partner" | "friendship" | "founder" | "family" | "team";
export type RelationshipMode = "solo" | "session";
export type RelationshipQuestionKind = "preference" | "expectation" | "tradeoff" | "scenario" | "priority";
export type RelationshipImportance = "low" | "medium" | "high";
export type RelationshipAnswerValue = 1 | 2 | 3 | 4 | 5;
export type RelationshipResultCategory =
  | "strong-alignment"
  | "different-workable"
  | "needs-conversation"
  | "potential-friction"
  | "complementary-strengths"
  | "insufficient-evidence";

export type LocalizedText = Readonly<Record<Locale, string>>;

export interface RelationshipSectionDefinition {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
}

export interface RelationshipDimensionDefinition {
  id: string;
  sectionId: string;
  title: LocalizedText;
  description: LocalizedText;
}

export interface RelationshipQuestionDefinition {
  id: string;
  sectionId: string;
  dimensionId: string;
  kind: RelationshipQuestionKind;
  prompt: LocalizedText;
  leftLabel: LocalizedText;
  rightLabel: LocalizedText;
  optional?: boolean;
  complementary?: boolean;
  safetySensitive?: boolean;
}

export interface RelationshipModuleDefinition {
  id: RelationshipModuleId;
  version: string;
  questionSetVersion: string;
  interpretationVersion: string;
  title: LocalizedText;
  shortDescription: LocalizedText;
  sections: readonly RelationshipSectionDefinition[];
  dimensions: readonly RelationshipDimensionDefinition[];
  questions: readonly RelationshipQuestionDefinition[];
}

export interface RelationshipAnswer {
  value: RelationshipAnswerValue;
  importance: RelationshipImportance;
}

export type RelationshipAnswerSet = Readonly<Record<string, RelationshipAnswer | undefined>>;

export interface RelationshipEvidence {
  questionId: string;
  dimensionId: string;
  importance: RelationshipImportance;
  difference: "none" | "small" | "meaningful" | "large" | "unknown";
}

export interface RelationshipInsight {
  id: string;
  category: RelationshipResultCategory;
  dimensionId: string;
  title: string;
  explanation: string;
  whatThisCouldMean: string;
  talkAboutThis: string;
  tryThis: string;
  agreementStarter: string;
  priority: "high" | "medium" | "low";
  evidence: readonly RelationshipEvidence[];
}

export interface RelationshipSharedResult {
  kind: "shared";
  moduleId: RelationshipModuleId;
  moduleVersion: string;
  questionSetVersion: string;
  interpretationVersion: string;
  insights: readonly RelationshipInsight[];
  categories: Readonly<Record<RelationshipResultCategory, readonly RelationshipInsight[]>>;
}

export interface RelationshipSoloReflection {
  id: string;
  dimensionId: string;
  title: string;
  expectation: string;
  clarify: string;
  tryThis: string;
  priority: RelationshipImportance;
  evidence: readonly RelationshipEvidence[];
}

export interface RelationshipSoloResult {
  kind: "solo";
  moduleId: RelationshipModuleId;
  moduleVersion: string;
  questionSetVersion: string;
  interpretationVersion: string;
  reflections: readonly RelationshipSoloReflection[];
}

export type AlignmentSessionStatus = "active" | "completed" | "withdrawn";
export type AlignmentInviteStatus = "active" | "accepted" | "completed" | "expired" | "revoked";
export type AlignmentParticipantStatus = "invited" | "joined" | "in-progress" | "completed" | "withdrawn";
export type AlignmentAgreementStatus = "none" | "draft" | "awaiting-acknowledgement" | "finalized";

export interface RelationshipSessionView {
  sessionId: string;
  moduleId: RelationshipModuleId;
  roundNumber: number;
  viewerRole: "initiator" | "invitee";
  sessionStatus: AlignmentSessionStatus;
  inviteStatus: AlignmentInviteStatus;
  inviteExpiresAt: string;
  ownStatus: AlignmentParticipantStatus;
  counterpartStatus: AlignmentParticipantStatus;
  sharedResultAvailable: boolean;
  ownAnswers: RelationshipAnswerSet;
  sharedResult: RelationshipSharedResult | null;
  agreement: RelationshipAgreementView | null;
}

export interface AlignmentRoundHistoryItem {
  roundNumber: number;
  completedAt: string;
  sharedResult: RelationshipSharedResult;
  agreementStatus: AlignmentAgreementStatus;
}

export interface RelationshipAgreementView {
  id: string;
  revision: number;
  status: AlignmentAgreementStatus;
  items: readonly string[];
  acknowledgedByViewer: boolean;
  acknowledgedByCounterpart: boolean;
  updatedAt: string;
}

export interface RelationshipInviteLandingView {
  moduleId: RelationshipModuleId;
  inviterDisplayName: string;
  expiresAt: string;
  status: "valid" | "invalid" | "expired" | "revoked" | "accepted";
}
