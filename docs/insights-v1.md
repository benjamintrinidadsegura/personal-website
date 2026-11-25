# Insights V1 — first-party, separate consent, private aggregates

Default OFF. No Production tracking, SQL, configuration or deployment is authorized
by the local implementation task. Use the consolidated reviewed release manifest.

## Measured contract

| Event | Stable target | Meaning |
| --- | --- | --- |
| article_view | `article:<published UUID>` | A successfully rendered public article; fresh publication validation on ingest |
| tool_view | `tool:<content hash>` | An existing public tool route, including hubs where catalogued |
| tool_start | Same tool ID | Existing Personal Advantage / Money Profile fresh-start workflow signal |
| tool_complete | Same tool ID | Existing workflow reaches its result after questions, probes/calibration and reveal; permitted skips follow the tool's own contract |
| interview_view | `interview:<content hash>` | Published interview detail opened; not video watch time |
| project_view | `project:<content hash>` | Existing project detail opened; not external project use |
| community_view | `community:overview` | Community page opened |
| public_content_open | Fixed Community IDs | Connection Map / EchoWall route or explicit Global Reach anchor opened |

Hashes are deterministic SHA256 prefixes of existing **content** IDs, never visitor
identifiers. Public display titles and locale/order changes do not redefine them.
The server validates static IDs and event compatibility; Writing uses a fresh,
published-only per-ID query with existing content validation and no listing cap.
No answers, results, scores, personal names/contacts, user IDs, IPs, query strings,
referrers, session IDs or individual navigation histories enter these tables.

Other tools have view sources only. Their starts/completions are **unavailable**,
not approximated from buttons, backend answer rows or generic result displays.
Resuming/revisiting a result is not a new start/completion. Start and completion
totals are independent period counts, not a linked funnel or unique-user metric.

## Consent, configuration and failures

`BTS_INSIGHTS_MODE` is server-only plain configuration:

- `off` / missing / unknown: collection and new maintenance OFF; dashboard disabled.
- `collect`: collection eligible only in the exact canonical Production runtime;
  the visitor must independently opt in through the new seven-locale privacy control.
- `maintain`: no new collection; private historical reporting and expiry continue.

The existing Reach consent and flag never grant this new scope. DNT/GPC win.
Consent is a tab session preference, not a visitor identifier. Opt-out stops future
dispatch/retry and never blocks product use. The browser sends one event UUID,
timestamp, explicit event name and approved content ID. Three attempts share the
same identity; visibility/rerenders do not create another count. API errors have
empty generic responses and cannot break a tool. Fixed sampled server diagnostics
contain no content IDs, payloads, URLs, tokens or visitor attributes.

## Data, permissions and retention

`insights_seen_events` contains only random event UUID + issued_at, with no link
to content or event type. The accepted 24-hour replay window requires retaining
deduplication evidence through that window. The existing daily Cron normally
deletes expired IDs within 49 hours total (including Hobby timing tolerance).
An outage can delay deletion; maintenance timestamp must be observed after release.
Private daily content/event totals remain without fixed expiry, with no individual
history. Global Reach's public country suppression/retention stays unchanged.

All three tables have RLS and no direct PUBLIC/anon/authenticated/service_role
access. Only service_role executes record/maintenance RPCs. Founder reads use the
existing authenticated AAL2 session, current active admin_users membership and a
separate authenticated-only read RPC. No service-key dashboard bypass exists.
UTC periods include today's partial UTC day. The all-time ranking is cumulative;
the trend shows at most 90 days. Metadata failures preserve counts with an honest
unavailable label instead of exposing stale/private titles.

The existing `/api/reach/refresh` schedule stays `7 0 * * *`. It runs Reach and
Insights maintenance independently; one source failure cannot prevent the other's
expiry. The endpoint keeps its existing constant-time CRON_SECRET authorization.
No new Cron, secret, provider, auth system or service is introduced.

## Verification

`tests/insights-v1.test.tsx` covers contract, gates, API minimization/publication,
private page authorization, empty states and retry/maintenance independence.
`node --import tsx scripts/test-insights-e2e.mjs <evidence-directory>` uses cached
PostgreSQL17.12/PostgREST14.18 images and Playwright, real browser consent and tool
workflows, actual API/publication query/Supabase client and real database writes.
Canonical origin and JWT/MFA claims are isolated platform fixtures. This proves
local integration, not hosted traffic or live MFA. It removes its own fixtures,
containers and temporary credentials. Never run synthetic traffic in Production.
