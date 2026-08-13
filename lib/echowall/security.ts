import {
  createHmac,
  randomBytes,
} from "node:crypto";
import {
  constantTimeEqual,
  createContextHash as createSharedContextHash,
  createFormToken,
  isAllowedRequestOrigin,
  verifyFormToken,
} from "@/lib/security/submission";

export { constantTimeEqual, createFormToken, isAllowedRequestOrigin, verifyFormToken };
export type { FormTokenVerification } from "@/lib/security/submission";
const BASE32_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function hmac(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}

export function createContextHash(
  context: "network" | "email" | "message",
  value: string,
  secret: string,
): string {
  return createSharedContextHash(context, value, secret);
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
