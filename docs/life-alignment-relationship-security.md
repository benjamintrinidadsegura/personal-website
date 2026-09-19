# Life Alignment Relationship Engine V1.1 — security and operations

Status: implementation companion to [ADR 0001](decisions/0001-life-alignment-relationship-engine-v1-1.md). The migration remains unapplied until the normal reviewed deployment workflow runs it.

## Trust boundaries

- The initiator must be an authenticated BTS Account user. The account owns the session but never gains access to the invitee's raw answers.
- The invite URL carries a 256-bit random, seven-day, single-acceptance capability. Only its purpose-bound HMAC-SHA-256 hash is stored.
- On explicit consent, the invitee receives a separate 256-bit participant capability in an HTTP-only, Secure-in-production, SameSite=Strict cookie. The invite token is not reused as session authority.
- Browser clients do not access relationship tables. Forced RLS and revoked table privileges make server-only, security-definer RPCs the persistence boundary.
- Before both participants complete, a participant can read only their own saved answers and coarse counterpart status. The shared result contains derived evidence and conversation prompts, not a copy of either answer set.

## Threat model

| Threat | Primary controls | Residual / operational treatment |
| --- | --- | --- |
| Invite guessing or database token disclosure | 256-bit randomness, strict token grammar, purpose-bound HMAC hashes, seven-day expiry, atomic database limits keyed by a privacy-safe network hash | Never log tokens, URLs or raw network identifiers. Platform request throttling remains useful defense in depth. |
| Invite replay or concurrent acceptance | Row lock, active-state check, expiry check, one participant per role, unique capability hash | A revoked, expired, or accepted invite fails closed. New invitations require a new session in V1.1. |
| Cross-site mutation | Trusted-origin checks, SameSite=Strict participant cookie, server actions, no direct table grants | Reverse-proxy origin/host forwarding is part of deployment verification. |
| Initiator reads invitee answers | Actor-bound DTO, own-answer filter, coarse dashboard RPC, shared-result gate | Service-role access stays server-only and is covered by source assertions. |
| Guest reads another session | Purpose-bound participant capability plus session id, both checked inside locked RPC paths | Clearing the cookie removes browser access; guessing remains computationally infeasible. |
| Premature result unlock | Both participants must be completed; result storage verifies immutable version tuple and locks the round | A failed derivation remains retryable, but no partial result is returned. |
| Agreement race or stale acknowledgement | Expected revision, row lock, acknowledgement deletion on every edit, two current-revision acknowledgements | Conflicts return a safe retry state rather than overwriting newer content. |
| Sensitive data in telemetry or search/cache | Allowlisted coarse events, no private payload logging, noindex metadata, robots exclusions, no-store/no-referrer headers | Logs and hosting configuration must be checked during deployment verification. |
| Oversized or malformed input | 192 KB server-action limit, runtime allowlists, stable question IDs, value ranges, database constraints | Unknown question IDs and incomplete final submissions fail closed. |
| Deletion ambiguity after shared finalization | Invitee can withdraw and erase their unfinished participation; finalized shared history rejects one-sided deletion | Joint/finalized deletion policy remains a documented post-V1.1 product decision. |

## Retention and cleanup

V1.1 stores the minimum data needed for resumable invite sessions: module/version identifiers, participant display names and consent evidence, answer values with importance, derived shared results, and optional Agreements. It does not store raw capabilities, free-text assessment answers, analytics identifiers, marketing attributes, or AI prompts.

Expired unaccepted invites, abandoned incomplete sessions and expired rate-limit events require a scheduled operational cleanup job before production rollout. The job should delete expired data after the approved retention window, emit only aggregate/coarse operational counts, and preserve no token material. Finalized-session retention and joint deletion require an explicit policy decision; the API deliberately refuses to guess at that boundary.

## Release verification

Before enabling persistence in production:

1. Review and apply the forward-only migration through the normal Supabase workflow; do not edit it after its checksum is registered.
2. Configure a distinct `ALIGNMENT_TOKEN_HASH_SECRET` of at least 32 characters in each environment and keep it out of browser bundles.
3. Verify service-role isolation, trusted proxy headers, platform rate limiting, no-store/no-referrer responses, and robots headers in the deployed environment.
4. Exercise two separate browser contexts for create, join, resume, complete, result unlock, Agreement edit/acknowledge/reset, revoke, expiry, and pre-finalization withdrawal.
5. Install and observe the cleanup job before opening Invite Sessions to public traffic.
