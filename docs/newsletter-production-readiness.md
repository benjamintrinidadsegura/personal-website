# Newsletter V1 Production readiness

Newsletter 1A keeps Supabase as the consent and subscriber source of truth. Brevo is an adapter for email delivery, not the consent authority.

## Human gates before public collection

- Approve and accept the Brevo contract and data-processing terms.
- Create the Brevo account and verify `newsletter@bts.online`.
- Configure and verify SPF, DKIM and DMARC for `bts.online`.
- Disable Brevo open, click and link tracking for transactional and future campaign email. Confirm with a delivered-message inspection that no tracking pixel or rewritten tracking URL is present.
- Supply the authoritative controller postal/contact details through `NEWSLETTER_CONTROLLER_ADDRESS` and review the public privacy copy.
- Decide and document legally/operationally appropriate retention periods for consent evidence and keyed suppression records. Newsletter 1A deliberately does not invent them.
- Establish who owns provider alerts, complaints, hard bounces and reconciliation before Newsletter 1B delivery begins.
- Confirm the Brevo webhook/gateway can produce the exact authenticated event envelope documented below. Do not expose the ingestion route until signature delivery has been independently verified.

The public form remains disabled unless `NEWSLETTER_PUBLIC_ENABLED=true`, `NEWSLETTER_LEGAL_READY=true`, a controller address, its subscription security secrets, the exact approved sender identities, Brevo configuration and `BREVO_TRACKING_DISABLED=true` are present. Edition delivery additionally fails closed unless `NEWSLETTER_WEBHOOK_SECRET` is configured, so sending cannot begin without authenticated event ingestion readiness.

## Configuration

Server-only values:

- `NEWSLETTER_FORM_TOKEN_SECRET`: independent high-entropy secret.
- `NEWSLETTER_HASH_SECRET`: independent high-entropy HMAC secret. Rotating it requires a subscriber/suppression migration plan.
- `BREVO_API_KEY`: least-privilege Brevo credential; never expose it with a `NEXT_PUBLIC_` prefix.
- `NEWSLETTER_CONTROLLER_ADDRESS`: authoritative controller address, not a placeholder.
- `NEWSLETTER_WEBHOOK_SECRET`: independent 32+ character HMAC secret for delivery-event ingestion; never reuse the API key or newsletter hash secret.

Operational flags and fixed identities:

- `NEWSLETTER_PUBLIC_ENABLED=true`
- `NEWSLETTER_LEGAL_READY=true`
- `NEWSLETTER_PROVIDER=brevo`
- `NEWSLETTER_FROM_EMAIL=newsletter@bts.online`
- `NEWSLETTER_REPLY_TO_EMAIL=hello@bts.online`
- `BREVO_TRACKING_DISABLED=true` only after the provider account setting has actually been verified.

## Data lifecycle

- Pending confirmation tokens expire after 24 hours.
- Unconfirmed pending rows are eligible for cleanup after seven days.
- Abuse-control hashes expire after 48 hours.
- Used confirmation-token hashes are cleared after expiry by the cleanup RPC.
- Unsubscribe immediately scrubs the raw email and retains only the keyed email hash, consent event, timestamps and unsubscribe nonce required by the lifecycle model.
- Exact retention for consent evidence and suppression records remains a mandatory Production decision.
- Newsletter editions retain the immutable Writing/title/excerpt/link snapshot and actor attribution needed to explain a send. Deleted admin identities are detached with `created_by = null`; editions are not linked to BTS Account subscriber identities.
- Minimal provider-event metadata retains only provider event/message identifiers, event type, keyed relationships, timestamps and a payload hash. Raw webhook payloads and provider email fields are never stored or logged by the application.
- Provider-event rows receive a 30-day technical maximum and are removable by `cleanup_newsletter_provider_events()`. This is an operational safety ceiling, not a declaration of the final legal retention policy; Production owners must approve a shorter period if required and schedule cleanup.

`cleanup_expired_newsletter_data()` is service-role-only. Newsletter 1A does not schedule it; a reviewed schedule is required before Production collection.
`cleanup_newsletter_provider_events()` is also service-role-only and unscheduled. Production must schedule and monitor both cleanup boundaries.

## Delivery and reconciliation

- Edition content is snapshotted only from authoritative published Writing. Once delivery begins, a database trigger prevents snapshot mutation.
- A send creates one unique delivery claim per edition/subscriber. Each claim rechecks confirmed status immediately before the provider request. Pending, unsubscribed and suppressed subscribers are excluded or skipped.
- Server actions process at most 25 recipients per invocation. A continuation claims only untouched `pending` rows; accepted, failed, skipped and uncertain rows are never claimed again.
- Network timeouts, 5xx/429/408 responses and malformed provider success responses are classified as `reconciliation_required`. V1 has no blind retry or state-reset operation. Reconcile against the provider before creating any replacement edition.
- Provider 4xx rejections other than 408/429 are recorded as known failures. Any failed or uncertain recipient makes the edition terminally `failed`; a successful provider acceptance records its message reference.
- Open and click tracking remain prohibited. `BREVO_TRACKING_DISABLED=true` is a fail-closed application gate, but Production must still inspect delivered source and provider settings for pixels or rewritten URLs.

## Provider webhook contract

The application accepts a bounded JSON envelope containing only `eventId`, `event`, `messageId` and `occurredAt`. Supported event names are `delivered`, `hardBounce`, `complaint`, `unsubscribed` and `error`. Unknown or malformed envelopes fail closed.

The exact raw UTF-8 body must be signed as lowercase hexadecimal HMAC-SHA256 over `<unix-seconds>.<raw-body>`. Send the timestamp in `X-BTS-Newsletter-Timestamp` and signature in `X-BTS-Newsletter-Signature`. Requests outside five minutes are rejected. Provider event IDs are unique for replay protection. If Brevo cannot natively emit this envelope and signature, use a narrowly scoped reviewed gateway; do not weaken or bypass authentication.

Hard bounce, complaint and provider-unsubscribe events suppress a still-confirmed subscriber and immediately scrub the raw email. Late delivered/error events are recorded for safety but never restore eligibility, so out-of-order events cannot undo suppression. No webhook analytics are exposed.

## Operations and privacy checks

- Verify the trusted proxy headers used for network reduction in the Production hosting path.
- Confirm public responses do not distinguish unknown, pending, confirmed or suppressed addresses.
- Confirm application, hosting, Supabase and provider logs redact email addresses and all confirmation/unsubscribe tokens.
- Confirmation and unsubscribe routes must remain `no-store`, `no-referrer`, and free of third-party resources.
- Test delivery only with disposable, explicitly controlled addresses.
- Never import BTS Account emails or infer newsletter consent from authentication.
- Provider failure intentionally does not change the generic public success response. Monitor provider failures operationally and allow a later rate-limited request to rotate a pending token.

## Migration procedure

1. Confirm the linked project is DEV, never Production.
2. Compare local and remote migration history.
3. Dry-run and verify only `20260818000000_newsletter_subscription_foundation.sql` is proposed.
4. Apply only after the explicit human gate.
5. Recheck migration history and restart the DEV server with DEV-only secrets.
6. Use rollback-only fixtures first, then one disposable inbox for the minimal delivery smoke test after Brevo is separately approved and configured.

For Newsletter 1B, repeat the same process and verify that only `20260819000000_newsletter_delivery.sql` is proposed. Rollback-only fixtures must cover concurrent start/claim, stale versions, eligibility changes, ambiguous delivery, webhook replay/out-of-order suppression and zero residue. Do not send real email during migration verification.

DEV verification identified invalid schema qualification of PostgreSQL's special `COALESCE` expression in two delivery functions after `20260819000000` was applied. The original applied migration remains immutable. Additive migration `20260819010000_newsletter_delivery_runtime_fix.sql` replaces only those two functions, preserves AAL2 and grants, and must pass the same explicit DEV gate and rollback-only verification before Newsletter V1 is considered technically complete.
