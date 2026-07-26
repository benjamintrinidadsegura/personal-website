import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const FORM_TOKEN_VERSION = 1;
const FORM_TOKEN_LIFETIME_MS = 2 * 60 * 60 * 1000;
const FORM_TOKEN_MINIMUM_AGE_MS = 3_000;
const BASE32_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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

export function createFormToken(
  secret: string,
  now = Date.now(),
): string {
  const payload: FormTokenPayload = {
    version: FORM_TOKEN_VERSION,
    nonce: randomBytes(18).toString("base64url"),
    issuedAt: now,
    expiresAt: now + FORM_TOKEN_LIFETIME_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const signature = hmac(`form-token:${encodedPayload}`, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyFormToken(
  token: string,
  secret: string,
  now = Date.now(),
): FormTokenVerification {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false, reason: "invalid" };

    const [encodedPayload, suppliedSignature] = parts;
    const expectedSignature = hmac(`form-token:${encodedPayload}`, secret);
    if (!constantTimeEqual(suppliedSignature, expectedSignature)) {
      return { valid: false, reason: "invalid" };
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<FormTokenPayload>;

    if (
      payload.version !== FORM_TOKEN_VERSION ||
      typeof payload.nonce !== "string" ||
      payload.nonce.length < 16 ||
      typeof payload.issuedAt !== "number" ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt - payload.issuedAt !== FORM_TOKEN_LIFETIME_MS ||
      now > payload.expiresAt ||
      now < payload.issuedAt
    ) {
      return { valid: false, reason: "invalid" };
    }

    if (now - payload.issuedAt < FORM_TOKEN_MINIMUM_AGE_MS) {
      return { valid: false, reason: "too-young" };
    }

    return {
      valid: true,
      tokenHash: hmac(`used-form-token:${token}`, secret),
    };
  } catch {
    return { valid: false, reason: "invalid" };
  }
}

export function createContextHash(
  context: "network" | "email" | "message",
  value: string,
  secret: string,
): string {
  return hmac(`${context}:${value}`, secret);
}

function encodeBase32(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function createDeletionReference(): string {
  const encoded = encodeBase32(randomBytes(20));
  return `ECHO-${encoded.match(/.{1,4}/gu)?.join("-") ?? encoded}`;
}

export function hashDeletionReference(
  reference: string,
  secret: string,
): string {
  return hmac(`deletion-reference:${reference}`, secret);
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
