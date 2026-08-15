import { createHmac, randomBytes } from "node:crypto";
import { isIP } from "node:net";

import {
  constantTimeEqual,
  createContextHash,
  createFormToken,
  isAllowedRequestOrigin,
  verifyFormToken,
} from "@/lib/security/submission";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const CONFIRMATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

export { isAllowedRequestOrigin };

function hmac(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export function newsletterFormTokenPurpose(): string {
  return "newsletter-subscription-v1";
}

export function createNewsletterFormToken(secret: string, now = Date.now()): string {
  return createFormToken(secret, now, newsletterFormTokenPurpose());
}

export function verifyNewsletterFormToken(token: string, secret: string, now = Date.now()) {
  return verifyFormToken(token, secret, now, newsletterFormTokenPurpose());
}

function ipv6Prefix(value: string): string | null {
  const withoutZone = value.split("%")[0].toLowerCase();
  if (isIP(withoutZone) !== 6) return null;
  const halves = withoutZone.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if (missing < 0) return null;
  const groups = [...left, ...Array.from({ length: missing }, () => "0"), ...right]
    .map((group) => group.padStart(4, "0"));
  return groups.slice(0, 4).join(":");
}

export function reduceNewsletterNetworkIdentifier(value: string): string | null {
  const trimmed = value.trim();
  if (isIP(trimmed) === 4) return trimmed.split(".").slice(0, 3).join(".");
  const mappedIpv4 = trimmed.includes(".") ? trimmed.split(":").at(-1) : null;
  if (mappedIpv4 && isIP(mappedIpv4) === 4) return mappedIpv4.split(".").slice(0, 3).join(".");
  const prefix = ipv6Prefix(trimmed);
  return prefix ? `${prefix}::/64` : null;
}

export function createNewsletterNetworkHash(value: string, secret: string): string | null {
  const reduced = reduceNewsletterNetworkIdentifier(value);
  return reduced ? createContextHash("newsletter-network-v1", reduced, secret) : null;
}

export function createNewsletterEmailHash(email: string, secret: string): string {
  return createContextHash("newsletter-email-v1", email, secret);
}

export function createNewsletterConfirmationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isNewsletterConfirmationToken(value: unknown): value is string {
  return typeof value === "string" && CONFIRMATION_TOKEN_PATTERN.test(value);
}

export function hashNewsletterConfirmationToken(token: string, secret: string): string {
  return hmac(`newsletter-confirmation-v1:${token}`, secret);
}

function unsubscribeSignatureInput(subscriberId: string, nonce: string): string {
  return `newsletter-unsubscribe-v1:${subscriberId}:${nonce}`;
}

export function createNewsletterUnsubscribeToken(
  subscriberId: string,
  nonce: string,
  secret: string,
): string | null {
  if (!UUID_PATTERN.test(subscriberId) || !UUID_PATTERN.test(nonce)) return null;
  const payload = Buffer.from(`${subscriberId}:${nonce}`, "utf8").toString("base64url");
  return `${payload}.${hmac(unsubscribeSignatureInput(subscriberId, nonce), secret)}`;
}

export function verifyNewsletterUnsubscribeToken(
  token: string,
  secret: string,
): { valid: true; subscriberId: string; nonce: string } | { valid: false } {
  try {
    const [payload, suppliedSignature, extra] = token.split(".");
    if (!payload || !suppliedSignature || extra) return { valid: false };
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const [subscriberId, nonce, trailing] = decoded.split(":");
    if (trailing || !UUID_PATTERN.test(subscriberId) || !UUID_PATTERN.test(nonce)) {
      return { valid: false };
    }
    const expected = hmac(unsubscribeSignatureInput(subscriberId, nonce), secret);
    return constantTimeEqual(suppliedSignature, expected)
      ? { valid: true, subscriberId, nonce }
      : { valid: false };
  } catch {
    return { valid: false };
  }
}
