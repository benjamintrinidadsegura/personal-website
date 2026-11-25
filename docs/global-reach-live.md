# Global Reach — real-data activation contract

Local candidate only. Production collection remains OFF until exact approval.
No EchoWall migration, feature or declined operation is part of this candidate.

## Source choice and verified capabilities

Vercel now has a documented Web Analytics aggregate API. It is not an undocumented
endpoint and was not scraped. The existing adapter is prepared/mock-tested, not a
provisioned live integration. No authorized provider dataset/token is currently
wired; SDK collection remains blocked by its separate payload privacy gate.
API entitlement was not proved by calling it with hidden credentials. There is no
claim that the API is categorically paid-only or unavailable on Hobby.

Chosen least-scope path: complete the existing first-party opt-in collector, Vercel
country header, existing Supabase database, existing-plan Vercel daily Cron. Team
metadata confirms Hobby; once-daily Cron is supported. No external analytics
provider, raw-event drain, new server, pg_cron activation or paid service.

## What is measured

Visible eligible public page views after explicit tab opt-in, never unique people.
Exact static allowlist in all seven locales: Home, About, People index, Projects
index, Writing index, Community, Connection Map and EchoWall. Dynamic article,
project, people and tool-detail coverage is deliberately not inferred from URLs.
The existing verified-public catalog can extend this later, with new approval.
Admin/auth/accounts/API/test/assessment/private routes, any query/fragment URL,
GPC/DNT, recognizable bot UAs and explicitly tagged test traffic are excluded.
Missing/unknown geographic attribution is skipped; coverage is always partial.

Each navigation has a fresh random UUID, reused by at most three delivery attempts.
No person/session identity or visitor count is inferred. Credentials are omitted;
referrer is restricted to the origin. The server bounds/validates the payload,
requires same-origin fetch and consent declaration and sends ONLY country, UUID
and issue time to the service-only RPC. Country is from the hosting header, never
an EchoWall choice, curated connection or client country field.

Country attribution means Vercel processes a network address as part of hosting;
BTSHQ does not read or store raw IP, city, referrer, answers or navigation history
in the measurement database. Hosting transport/security logs are separate from
this aggregate contract; no claim of universally anonymous provider processing.
Origin/consent headers are not cryptographic proof of a human visit; bot detection
and abuse resistance are bounded. Arbitrary fresh-ID spam cannot be eliminated
without stronger, potentially intrusive identification. These counts are not a
certified audience census. The per-navigation UUID prevents retries, not deliberate
new fabricated events. Actual hosted header behavior is still to be verified.

## Persistence, privacy and publication

- `reach_daily_country_views`: country/UTC day counters, no visitor or route ID.
- `reach_seen_events`: UUID + issue time only, no country/route/IP linkage. Valid
  24 hours; daily maintenance normally removes it within 25 further hours. Provider
  outages can delay physical cleanup, but an expired request stays invalid.
- `reach_collection_state`: first actual accepted event, publication cutoff and
  real refresh timestamp. No invented pre-activation traffic or fabricated freshness.

An atomic insert-on-conflict ledger and increment serialize concurrent/retried
requests. Only current UTC-day events are admitted: retries crossing UTC midnight
are dropped rather than changing an already published day. No historical backfill.
The daily job (`7 0 * * *`, Hobby may execute up to 59 minutes later) deletes expired
UUIDs and closed cells below five views, then publishes the closed UTC boundary.
Retries never reaggregate counters; repeated maintenance is idempotent for totals.

Both public periods and daily growth derive from the SAME closed cells with >=5
views. Under-threshold cells never contribute to country totals, global totals,
trends or differences between periods. Dates are fixed; unknown/small cells are
not represented as zero participation. Five views need not be five people, so
thresholding is not presented as a mathematical anonymity guarantee. Country-day
cells cannot gain late events after closing. Published aggregate cells are retained
without fixed expiry for lifetime statistics while this purpose remains; review
that necessity when ending measurement. They are not individual histories.
The display shows all-time retained measured totals, last 30 days and at most 365
trend days. Freshness uses actual maintenance time; first-party data older than
48 hours is withheld. It stays empty/suppressed before a publishable closed day.

Tab sessionStorage contains only the yes/no choice. Equal choice controls, no
preselection; withdrawal stops future requests/retries, not already committed
unlinked aggregate totals. Seven locale disclosures explain provider country
processing, consent, pseudonymous transient identifiers, expiry and suppression.
Legal basis proposed: opt-in consent for optional measurement, not an assumption
that aggregation eliminates consent. Controller/provider terms remain relevant.
No SDK analytics, marketing, profiles or EchoWall geography are enabled.

## Security and operations

All three tables RLS-enabled and all direct PUBLIC/anon/authenticated/service_role
access revoked, despite broad hosted defaults. Three fixed-search-path RPCs are
service-role-only, PUBLIC/anon/authenticated execution revoked. The limited existing
server client calls them; no service key enters client code. Daily refresh requires
a constant-time checked independent CRON_SECRET. No content is logged by handlers.
The maintenance RPC can delete only its own expired ledger and low-volume closed
aggregate cells. It never reads/writes EchoWall or other application tables.

The new `20261125112325_global_reach_live_pipeline.sql` is a fresh-install proposal
that replaces the uninstalled old `20261124184400` proposal. Apply ONLY the new
reviewed file, once, after verifying absent target objects. Never bulk-push all
pending migrations. No retention-migration retry or alternate connector path.

## Activation/rollback gates

Exact approval is required for SQL, CRON_SECRET, BTS_REACH_ENABLED and candidate
push/deploy. Preserve all EchoWall flags and BTS_PUBLIC_ANALYTICS_ENABLED OFF.
Preview smoke stays OFF; no Production keys copied to Preview. No temporary share
URL without its own authorization. Do not bypass hosted network restrictions.
After approved installation/deploy, verify role denial, real schedule/auth, opt-in
request boundaries, genuine counts/UTC publication and privacy disclosures.
Use a minimal Founder browser test if automation is blocked; do not seed synthetic
Production traffic to make the map look populated. Rollback first disables BTS_REACH_ENABLED and keeps the authenticated maintenance
route/job available independently of collection. Wait until the replay ledger has
drained through the normal expiry job before reverting to code without that
endpoint. An urgent full-code rollback before draining needs an explicitly approved
final maintenance operation to avoid leaving identifiers behind. No table DROP or
unscoped record deletion is part of rollback.

## Insights later

Reuse this consent, route-eligibility, idempotency and bounded-payload architecture
for explicitly approved future event types. No personal test results or additional
content-level metrics are stored now; historical per-article activity cannot be
reconstructed from country/day totals. No competing analytics platform is added.

Sources: [Web Analytics API](https://vercel.com/docs/analytics/web-analytics-api),
[Hobby Cron limits](https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing),
[request headers](https://vercel.com/docs/headers/request-headers),
[provider privacy](https://vercel.com/legal/privacy-notice),
[§25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html).
