import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const FORM_TOKEN_VERSION = 1;
const FORM_TOKEN_LIFETIME_MS = 2 * 60 * 60 * 1000;
const FORM_TOKEN_MINIMUM_AGE_MS = 3_000;

type FormTokenPayload = {
  version: number;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
};

export type FormTokenVerification =
  | { valid: true; tokenHash: string }
  | { valid: false; reason: "invalid" | "too-young" };

function hmac(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    const padded = Buffer.alloc(leftBuffer.length);
    rightBuffer.copy(padded, 0, 0, Math.min(rightBuffer.length, padded.length));
    timingSafeEqual(leftBuffer, padded);
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function tokenSignatureInput(encodedPayload: string, purpose: string): string {
  return purpose
    ? `form-token:${purpose}:${encodedPayload}`
    : `form-token:${encodedPayload}`;
}

export function createFormToken(
  secret: string,
  now = Date.now(),
  purpose = "",
): string {
  const payload: FormTokenPayload = {
    version: FORM_TOKEN_VERSION,
    nonce: randomBytes(18).toString("base64url"),
    issuedAt: now,
    expiresAt: now + FORM_TOKEN_LIFETIME_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = hmac(tokenSignatureInput(encodedPayload, purpose), secret);
  return `${encodedPayload}.${signature}`;
}

export function verifyFormToken(
  token: string,
  secret: string,
  now = Date.now(),
  purpose = "",
): FormTokenVerification {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false, reason: "invalid" };

    const [encodedPayload, suppliedSignature] = parts;
    const expectedSignature = hmac(tokenSignatureInput(encodedPayload, purpose), secret);
    if (!constantTimeEqual(suppliedSignature, expectedSignature)) {
      return { valid: false, reason: "invalid" };
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<FormTokenPayload>;
    if (
      payload.version !== FORM_TOKEN_VERSION
      || typeof payload.nonce !== "string"
      || payload.nonce.length < 16
      || typeof payload.issuedAt !== "number"
      || typeof payload.expiresAt !== "number"
      || payload.expiresAt - payload.issuedAt !== FORM_TOKEN_LIFETIME_MS
      || now > payload.expiresAt
      || now < payload.issuedAt
    ) return { valid: false, reason: "invalid" };

    if (now - payload.issuedAt < FORM_TOKEN_MINIMUM_AGE_MS) {
      return { valid: false, reason: "too-young" };
    }

    return {
      valid: true,
      tokenHash: hmac(
        purpose ? `used-form-token:${purpose}:${token}` : `used-form-token:${token}`,
        secret,
      ),
    };
  } catch {
    return { valid: false, reason: "invalid" };
  }
}

export function createContextHash(context: string, value: string, secret: string): string {
  return hmac(`${context}:${value}`, secret);
}

export function isAllowedRequestOrigin(
  origin: string | null,
  host: string | null,
  siteUrl: string,
): boolean {
  if (!origin || !host) return false;
  try {
    const expected = new URL(siteUrl);
    const supplied = new URL(origin);
    return supplied.origin === expected.origin && host === expected.host;
  } catch {
    return false;
  }
}
