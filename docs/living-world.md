# The Living World

Sprint 1 is the common base. The homepage uses the warm editorial treatment from Atmospheric Elegance and moves the discovery paths forward with the focus trail and the conditional World Map shortcut from Playful Immersion. The map and EchoWall use the same palette and motion tokens. Neither design branch is a dependency of the integration branch.

## Data boundaries

| Surface | Input | Public output |
| --- | --- | --- |
| Public connections | Existing, published Spotlights and supported editorial sources with verified public context | The map, text fallback and linked stories. Origin is distinct from current context. |
| EchoWall country | Explicit country choice during submission | An optional country label beside an approved echo. |
| EchoWall country totals | Separate unchecked opt-in and existing approved public read | Counts of contributions in up to 50 recent public echoes. Groups below three are suppressed. It is not a count of individuals. |
| Country reach | No provider configured | A distinct inactive state. No location guesses or fixture numbers. |

Country options are ISO 3166-1 alpha-2 identifiers with localized names. The field is never inferred from IP, locale or browser settings. The country flag is read server-side and defaults to off. With the flag on but the schema unavailable, the old approved read and legacy submit path remain available. In a previously rendered form, failure to persist a country is an explicit error. The submission never retries without the chosen country or reports success after losing it.

## EchoWall migration

The additive migration in `supabase/pending-migrations/` is intentionally outside the pinned 26-file chain of the production runner. The pending SQL introduces a nullable country code, a default-false aggregate choice, two constraints and a service-only wrapper. The wrapper calls the existing submission function inside the same transaction and updates only the pending row it created. The old RPC, RLS, moderation states, private contact storage, and limits remain in place. Country information is not shown in the moderation queue. It is a bounded field and can become public only when the contributor selected it and the echo itself was approved.

In an approved non-production environment, apply the migration while the flag is off. Verify service and public-role grants, old and new RPCs, moderation transitions and cache revalidation. After review of the public wording, set `ECHOWALL_COUNTRY_CONTEXT_ENABLED=true` only in that environment. Before considering production, also verify consent language and retention handling for the new fields and review a separate update to the pinned production migration registry.

Operational rollback is to turn the flag off and return to the prior application version if needed. The original RPC still works with the columns in place. Do not remove columns or delete declarations as part of an application rollback. A later schema removal requires a separate reviewed migration, an approved retention decision and a backup.

`tests/echowall-country.sql` exercises the migration on an isolated PostgreSQL database with synthetic inputs. It checks pending status, omission, rollback of rejected submissions, replay handling, RLS, and grants. The fixture transaction rolls back.

## Analytics

[Vercel Web Analytics pricing](https://vercel.com/docs/analytics/limits-and-pricing) lists 50,000 events per month, a one-month reporting window and no custom events on Hobby. [The dashboard documentation](https://vercel.com/docs/analytics/using-web-analytics) describes country filters and CSV exports. [The privacy documentation](https://vercel.com/docs/analytics/privacy-policy) lists possible collection of referrers, browser/device details and location more granular than country. Those defaults require review even if the public result only displays country totals.

The local contract accepts only exact localized paths for public editorial indexes. It returns a page-view type and a pathname. There is no installed analytics SDK, collector, browser script, runtime switch, provider call, or dashboard change. A future provider adapter must enforce the allowlist before sending, exclude private workflows and avoid query, fragment, referrer and custom fields. Validate actual requests in a protected environment before approval. Use a dated aggregate export for any eventual map publication and suppress sparse groups. A plan or policy constraint should leave measurement inactive until resolved rather than introduce an alternate tracker.

The separate contractual and backup/restore questions remain for owner review.
