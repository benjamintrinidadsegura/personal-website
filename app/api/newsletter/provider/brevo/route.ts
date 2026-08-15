import { newsletterWebhookConfiguration } from "@/lib/newsletter/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  NEWSLETTER_WEBHOOK_MAX_BYTES,
  parseNewsletterProviderEvent,
  verifyNewsletterWebhook,
} from "@/lib/newsletter/webhook";

export const dynamic = "force-dynamic";

const responseHeaders = { "cache-control": "private, no-store, max-age=0" };

export async function POST(request: Request) {
  const configuration = newsletterWebhookConfiguration();
  if (!configuration) return new Response(null, { status: 503, headers: responseHeaders });
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > NEWSLETTER_WEBHOOK_MAX_BYTES) {
    return new Response(null, { status: 413, headers: responseHeaders });
  }
  const body = await request.text();
  if (!verifyNewsletterWebhook(
    body,
    request.headers.get("x-bts-newsletter-timestamp"),
    request.headers.get("x-bts-newsletter-signature"),
    configuration.secret,
  )) return new Response(null, { status: 401, headers: responseHeaders });
  const event = parseNewsletterProviderEvent(body);
  if (!event) return new Response(null, { status: 400, headers: responseHeaders });
  try {
    const { error } = await getSupabaseServerClient().rpc("ingest_newsletter_provider_event", {
      p_provider_event_id: event.eventId,
      p_event_type: event.type,
      p_provider_message_reference: event.messageReference,
      p_payload_hash: event.payloadHash,
      p_occurred_at: event.occurredAt,
    });
    return new Response(null, { status: error ? 503 : 204, headers: responseHeaders });
  } catch {
    return new Response(null, { status: 503, headers: responseHeaders });
  }
}
