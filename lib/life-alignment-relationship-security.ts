import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ALIGNMENT_INVITE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
export const ALIGNMENT_TOKEN_BYTES = 32;
export const ALIGNMENT_CONSENT_VERSION = "relationship-participation-v1.1";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

export function generateAlignmentToken(): string {
  return randomBytes(ALIGNMENT_TOKEN_BYTES).toString("base64url");
}

export function isValidAlignmentToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

export function hashAlignmentToken(token: string, secret: string, purpose: "invite" | "participant"): string {
  if (!isValidAlignmentToken(token) || secret.length < 32) throw new Error("ALIGNMENT_TOKEN_CONFIGURATION_INVALID");
  return createHmac("sha256", secret).update(`life-alignment:${purpose}:v1:${token}`, "utf8").digest("hex");
}

export function constantTimeTokenHashEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function alignmentInviteExpiresAt(now = Date.now()): Date {
  return new Date(now + ALIGNMENT_INVITE_LIFETIME_MS);
}

export function sanitizeParticipantDisplayName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (/[\r\n<>]/u.test(value)) return null;
  const normalized = value.normalize("NFKC").trim().replace(/\s+/gu, " ");
  if (normalized.length < 2 || normalized.length > 40 || /[\r\n<>]/u.test(normalized)) return null;
  return normalized;
}

export function sanitizeAgreementItems(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 5) return null;
  const items = value.map((item) => typeof item === "string" ? item.normalize("NFKC").trim().replace(/\s+/gu, " ") : "");
  if (items.some((item) => item.length < 3 || item.length > 240 || /[\r\n]/u.test(item))) return null;
  if (new Set(items.map((item) => item.toLocaleLowerCase("en"))).size !== items.length) return null;
  return items;
}

export type AlignmentSafeEvent =
  | "alignment_session_create_failed"
  | "alignment_invite_validation_failed"
  | "alignment_submission_failed"
  | "alignment_result_generation_failed"
  | "alignment_agreement_mutation_failed";

export function createAlignmentSafeEvent(event: AlignmentSafeEvent, reason: "invalid" | "unauthorized" | "expired" | "revoked" | "conflict" | "unavailable", occurredAt = new Date()): Readonly<Record<string, string | number>> {
  return { schemaVersion: 1, event, reason, occurredAt: occurredAt.toISOString(), product: "life-alignment-relationship" };
}
