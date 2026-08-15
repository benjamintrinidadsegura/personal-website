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

The public form remains disabled unless `NEWSLETTER_PUBLIC_ENABLED=true`, `NEWSLETTER_LEGAL_READY=true`, a controller address, all security secrets, the exact approved sender identities, Brevo configuration and `BREVO_TRACKING_DISABLED=true` are present.

## Configuration

Server-only values:

- `NEWSLETTER_FORM_TOKEN_SECRET`: independent high-entropy secret.
- `NEWSLETTER_HASH_SECRET`: independent high-entropy HMAC secret. Rotating it requires a subscriber/suppression migration plan.
- `BREVO_API_KEY`: least-privilege Brevo credential; never expose it with a `NEXT_PUBLIC_` prefix.
- `NEWSLETTER_CONTROLLER_ADDRESS`: authoritative controller address, not a placeholder.

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

`cleanup_expired_newsletter_data()` is service-role-only. Newsletter 1A does not schedule it; a reviewed schedule is required before Production collection.

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
