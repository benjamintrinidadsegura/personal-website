import { createNewsletterUnsubscribeToken } from "@/lib/newsletter/security";
import type { SendNewsletterEditionEmail } from "@/lib/newsletter/provider";

export const NEWSLETTER_SEND_BATCH_LIMIT = 25;

export type ClaimedNewsletterDelivery = {
  deliveryId: string;
  subscriberId: string;
  email: string;
  unsubscribeNonce: string;
  subject: string;
  preheader: string;
  introduction: string;
  articleTitle: string;
  articleExcerpt: string;
  canonicalUrl: string;
};

type DeliveryOutcome = "sent" | "failed" | "skipped" | "reconciliation_required";

export type NewsletterDeliveryDatabase = {
  claim: () => Promise<ClaimedNewsletterDelivery | null>;
  recheck: (deliveryId: string) => Promise<boolean>;
  complete: (deliveryId: string, outcome: DeliveryOutcome, messageReference: string | null, failureCode: string | null) => Promise<boolean>;
  finish: () => Promise<"sending" | "sent" | "failed" | null>;
};

export async function processNewsletterDeliveryBatch(
  database: NewsletterDeliveryDatabase,
  sender: SendNewsletterEditionEmail,
  configuration: { siteUrl: string; hashSecret: string; controllerAddress: string },
  limit = NEWSLETTER_SEND_BATCH_LIMIT,
) {
  let processed = 0;
  while (processed < limit) {
    const delivery = await database.claim();
    if (!delivery) break;
    processed += 1;
    if (!await database.recheck(delivery.deliveryId)) {
      await database.complete(delivery.deliveryId, "skipped", null, "subscriber_ineligible");
      continue;
    }
    const token = createNewsletterUnsubscribeToken(delivery.subscriberId, delivery.unsubscribeNonce, configuration.hashSecret);
    if (!token) {
      await database.complete(delivery.deliveryId, "failed", null, "invalid_unsubscribe_token");
      continue;
    }
    const result = await sender({
      ...delivery,
      to: delivery.email,
      unsubscribeUrl: `${configuration.siteUrl}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
      privacyUrl: `${configuration.siteUrl}/privacy`,
      controllerAddress: configuration.controllerAddress,
    });
    if (result.status === "accepted") {
      await database.complete(delivery.deliveryId, "sent", result.messageReference, null);
    } else if (result.status === "rejected") {
      await database.complete(delivery.deliveryId, "failed", null, result.code);
    } else {
      await database.complete(delivery.deliveryId, "reconciliation_required", null, result.code);
      break;
    }
  }
  return { processed, state: await database.finish() };
}
