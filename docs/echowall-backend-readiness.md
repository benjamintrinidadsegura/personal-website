# EchoWall backend readiness and local verification

This is an application correction and repeatable synthetic backend test, based on
606acc269a9b55a1a002e3db24051e912b369e69. It does not deploy or activate country
collection, run a hosted migration, enable analytics, or establish legal compliance.

## Data flow and authorization inventory

| Path | Existing contract | Verification boundary |
|---|---|---|
| Public wall/home teaser | Server-only client selects approved echoes with non-null approved_at; maps an explicit public column projection; excludes synthetic content | Actual SDK/PostgREST/PostgreSQL and regression tests |
| Submission | Same-origin signed form token, minimum age, honeypot, length/content/email checks, required consent; HMAC network/message/email hashes; service-only submit_echo RPC inserts pending | Real local application-to-database tests; browser journey recorded separately |
| Signed-in visitors | Submission remains the same server-mediated flow; no account identity or editable metadata grants publishing rights | No new account-specific submission feature; direct authenticated RPC/table access denied |
| Moderation | Auth user resolved server-side; active admin_users record; aal2; DB repeats checks on each call; row lock and expected status prevent stale decisions | Local signed test JWTs and database registry; real GoTrue login/MFA UI is not simulated |
| Private contact/history | Explicit admin RPC only, MFA required; never selected into public projection | Local permission tests; no contact logging |
| Deletion | Existing delete is soft deletion of echo text, plus removal of private contact; restore_deleted goes to hidden with no approval timestamp; deliberate restore required to republish | Actual isolated state transitions; no Production deletion |
| Reporting | No dedicated visitor report state or RPC exists | Incomplete product/operational workflow; do not invent a reported status |
| Country | Optional user selection, canonical supported ISO identifier; no inference; separate opt-in for aggregate counts; fewer than three eligible contributions suppressed | Pending migration and actual local RPC tested; flag stays OFF outside disposable tests |
| Analytics | Existing disabled readiness interface; no collection added | Page views, voluntary declarations, and published World Map relationships remain distinct |

## Corrections

1. The approved echo reader uses React request memoization and explicit fetch
   no-store instead of a 300-second persistent cache. Unavailable reads cannot be
   retained as a cached empty wall, and the next request checks current publication
   state after hiding/deletion, including changes performed outside this process.
   A single in-flight request can still finish using its own read snapshot. Already
   delivered content cannot be remotely erased from a visitor's browser.
2. A rejected Server Action transport returns only the localized unavailable state
   inside the still-mounted controlled form. No automatic retry, success claim,
   logging of content, or draft persistence service is added. A synchronous ref
   blocks rapid double-submit before React has rendered pending state.
3. An expired/replayed form token is renewed without sending the contribution
   again. Copy in all seven locales requests a short pause and explicit retry,
   retaining the draft. The three-second minimum token age remains unchanged.
   If the prior submission committed before a response was lost, replay/duplicate
   protection still applies: renewal is not proof of a new submission or success.

Public reads now incur a database request per render/request (deduplicated for
identical arguments within the render). This trades the previous five-minute
persistent cache for current moderation state and immediate retry after failure.
The wall still reads at most 50 recent eligible contributions; country summaries
are explicitly a window of these recent contributions, not all-time people or
visitor counts. This small-count rule is a disclosure control, not anonymity proof.

Existing updateTag/revalidatePath calls remain for backward compatibility with
previous cache entries and existing routes. No new polling or per-frame work.

## Local test environment

Prerequisites: existing Docker images postgres:17-alpine, postgrest/postgrest:v14.18,
node:24-alpine; Python3; Node and the repository's existing dependencies. No pulls
or installs are performed by the harness.

```powershell
python scripts/test-echowall-backend.py --evidence .bts-engineering/echo-local
# Optional bounded manual browser session after a local build:
python scripts/test-echowall-backend.py --evidence .bts-engineering/echo-local --serve
```

Each run creates uniquely named/labeled disposable resources. PostgreSQL data is
tmpfs, all Docker containers use an internal network without published ports.
A loopback-only host proxy forwards through a Docker-exec bridge to real
PostgREST. Synthetic JWTs/passwords are generated in memory, not saved as an env
file, logged, committed, or sent remotely. No Auth/email/webhook worker is started.
The bridge and Next application use synthetic local configuration only. This is
not a performance model of Vercel/Supabase.

The harness applies only the existing EchoWall chain and hardening migration to
a minimal compatible auth schema. It tests the legacy RPC before applying the
existing country migration locally. No second country migration is created.
Real Supabase Auth internals, all unrelated application schemas and provider
configuration are not reproduced. The main finally block stops/removes only
resources created by that run; --serve is bounded to 30 minutes. A process kill
or host crash can leave labeled disposable resources for explicit inspection.

Evidence contains aggregate outcomes only. Database assertions include anonymous
and authenticated read/write denial, service-only submission, pending status,
duplicate and replay controls, both rate limits, country constraints and atomic
rollback, consent validation in the application, admin MFA/registry/revocation,
stale status, rejection, hide, soft delete, contact removal and non-public recovery.
The application bridge uses real supabase-js against real PostgREST/PostgreSQL;
unit seams only replace Next render boundaries in the Node test process.

## Privacy, retention and operational limits

- Required consent is checked before the service RPC. The existing DB schema does
  not persist a consent-policy version/timestamp as a separate audit record; this
  needs an owner/legal evidence decision, not a fabricated compliance claim.
- Retention fields exist (pending/contact default90days, rate limits48hours,
  moderation audit12months). They are schema intentions, not proof of deletion or
  an approved retention policy. No scheduler/cleanup was activated or verified.
- Soft-deleted echo bodies and moderation events can remain stored. Contact
  deletion does not erase copies in backups. Restore reconciliation and a verified
  independently stored Production backup remain open operational prerequisites
  for irreversible cleanup. No backup was made or restored here.
- No visitor reporting or deletion-request automation was introduced. Existing
  deletion-reference/manual verified contact process must have an actual owner.
- Server credentials remain server-only. Logs and review bundles must exclude
  contact data, network hashes, form/deletion references and bearer tokens.

## Future release ordering — separate approval required

1. Verify current Production project/ref, main SHA, schema/RPC definitions, actual
   grants/RLS, default privileges and active admin/MFA authorization. Identify the
   exact rollback deployment before any release. Local fixtures are not proof of
   the deployed schema or runtime credentials.
2. Approve and deploy only the reviewed application candidate to a protected
   Preview first; use a legitimate isolated backend with Preview-only credentials
   for hosted submission/moderation acceptance. Country flag remains OFF. Do not
   copy Production secrets or post synthetic content to Production.
3. Application recovery/cache corrections work with the legacy schema. The country
   migration is independently reviewed and unapplied; it is not a prerequisite
   for deploying these fixes with country OFF.
4. Before country activation, approve schema change and backup/recovery plan,
   verify no existing column/function collision and migration history, then apply
   the single reviewed pending migration by the documented repository migration
   workflow. Verify constraints, role grants, RPC signature and schema-cache
   discovery. No automatic activation in an unmigrated environment.
5. Re-run authorization/permission checks and legitimate hosted tests. Owner/legal
   approval must cover optional public country display, aggregate opt-in and
   limited-window/small-count wording. Enable only by separate scoped approval.
6. Observe sanitized error classes and aggregate outcomes, avoiding content/token
   logging. Stop on private visibility, unauthorized moderation or false success.

Application rollback is a separately approved return to the verified prior
deployment; it reintroduces the old cache/draft behavior. Disable country first
if necessary under explicit configuration approval. The country schema is
additive and compatible with the legacy RPC; do not drop populated columns as
an automatic rollback. Leave them inaccessible/disabled and use a reviewed forward
fix, or an explicitly approved restore/reconciliation procedure. No promise of
lossless automatic database rollback is made.

## Primary documentation checked

- [Current changelog](https://supabase.com/changelog.md) and
  [CLI v3 change](https://supabase.com/changelog/supabase-cli-v3): installed CLI
  2.109.1 retained, command help inspected; no upgrade or remote command.
- [Data API security](https://supabase.com/docs/guides/api/securing-your-api): grants
  and row policies are independent controls, both tested locally.
- [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) and
  [functions](https://supabase.com/docs/guides/database/functions): private table
  access, explicit function EXECUTE grants and fixed search paths inspected.
- [Local testing](https://supabase.com/docs/guides/local-development/testing/overview).

Existing privileged moderation/submission functions have fixed schema-qualified
search paths and explicit grants. Moderation definer routines are necessary for
controlled transitions on otherwise private tables, with a live DB authorization
check. The additive country wrapper is SECURITY INVOKER. No new public view or
SECURITY DEFINER function is introduced, and no user_metadata authorization is used.
