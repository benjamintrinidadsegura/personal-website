import { createHash, createHmac } from "node:crypto";

import { constantTimeEqual } from "@/lib/security/submission";

export const NEWSLETTER_WEBHOOK_MAX_BYTES = 32_768;
export const NEWSLETTER_WEBHOOK_TOLERANCE_SECONDS = 300;

export type NewsletterProviderEvent = {
  eventId: string;
  type: "delivered" | "hard_bounce" | "complaint" | "unsubscribe" | "delivery_failure";
  messageReference: string;
  occurredAt: string;
  payloadHash: string;
};

export function signNewsletterWebhook(body: string, timestamp: string, secret: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`, "utf8").digest("hex");
}

export function verifyNewsletterWebhook(
  body: string,
  timestamp: string | null,
  signature: string | null,
  secret: string,
  now = Date.now(),
): boolean {
  if (!timestamp || !signature || !/^\d{10}$/u.test(timestamp) || !/^[0-9a-f]{64}$/iu.test(signature)) return false;
  const occurred = Number(timestamp) * 1_000;
  if (!Number.isSafeInteger(occurred) || Math.abs(now - occurred) > NEWSLETTER_WEBHOOK_TOLERANCE_SECONDS * 1_000) return false;
  return constantTimeEqual(signature.toLowerCase(), signNewsletterWebhook(body, timestamp, secret));
}

export function parseNewsletterProviderEvent(body: string): NewsletterProviderEvent | null {
  if (Buffer.byteLength(body, "utf8") > NEWSLETTER_WEBHOOK_MAX_BYTES) return null;
  try {
    const payload = JSON.parse(body) as Record<string, unknown>;
    const eventId = payload.eventId;
    const messageReference = payload.messageId;
    const occurredAt = payload.occurredAt;
    const rawType = payload.event;
    const typeMap: Record<string, NewsletterProviderEvent["type"]> = {
      delivered: "delivered",
      hardBounce: "hard_bounce",
      complaint: "complaint",
      unsubscribed: "unsubscribe",
      error: "delivery_failure",
    };
    const type = typeof rawType === "string" ? typeMap[rawType] : undefined;
    if (
      typeof eventId !== "string" || eventId.length < 1 || eventId.length > 300
      || typeof messageReference !== "string" || messageReference.length < 1 || messageReference.length > 300
      || typeof occurredAt !== "string" || Number.isNaN(Date.parse(occurredAt))
      || !type
    ) return null;
    return {
      eventId,
      messageReference,
      occurredAt: new Date(occurredAt).toISOString(),
      type,
      payloadHash: createHash("sha256").update(body, "utf8").digest("hex"),
    };
  } catch {
    return null;
  }
}
