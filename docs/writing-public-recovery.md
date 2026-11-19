# Public Writing recovery — local candidate

16 November 2026. No push, deployment, key change, migration or Production mutation.

## Current evidence

Integrated base: `9c8fa2bc3ac9de4061ad9c6fd83be7f2d16c8074`. Production remains `7379c749b954f692b84885375ce1e0af9805001f`, deployment `dpl_GrrjeSHYBMtVjuBSayNg2mUNE66C`. Supabase project `mzpwytbbijfbkuhvfihl` is the Production project, ACTIVE_HEALTHY, Frankfurt. A read-only aggregate confirms 19 published articles. No draft bodies, customer records or credential values were retrieved.

Three separate problems are evidenced:

1. **Verified deadline failure.** At `2026-11-16T09:32:05.114Z`, the collection observer timed out after 2,504 ms with HTTP 200, upstream request `01a1e3b3-04e2-7dee-a6eb-206090b0e18e`. Supabase records HTTP 200 for the same ID. Headers do not establish completion of body transfer, decoding or validation. Exact Production phase timings remain unavailable. The 2,500 ms deadline and SDK retries are unchanged.
2. **Verified persistent failure reuse.** Greek index request `v9n5n-1794822066527-d3a4186839f9`, at `09:41:06.616Z`, returned the same timeout origin `632d7150-60ed-437d-ba81-dc6ebd04fb22` in 8 ms. Its background read completed in 1,854 ms with 19 accepted articles. The 300-second stale-while-revalidate policy can keep presenting an outage after upstream recovery. It is not a precise expiry/deletion boundary. [Next.js cache documentation](https://nextjs.org/docs/app/api-reference/functions/unstable_cache).
3. **Verified current JWT rejection; managed-service cause strongly inferred.** At `10:13:46.141Z`, a fresh read returned HTTP 401 / PGRST303 with sanitized reason `issued_in_future`. Supabase independently records 401 for request `01a1e3d9-34ec-7edf-b853-3a74917259e6` at `10:13:45.324Z`. Safe classifications of both credential headers are `secret_key`, not a user-session JWT. No key, token, prefix or claim value was retained. A read-only activity aggregate reports PostgREST 14.5. The [official PostgREST 14.18 release](https://github.com/PostgREST/postgrest/releases/tag/v14.18) fixes a sporadic future-issue-time error, linked to [issue 5196](https://github.com/PostgREST/postgrest/issues/5196). This strongly implicates the managed auth/PostgREST path; its specific internal clock/cache state remains unproven.

The existing server client remains stateless, without incoming request cookies/Authorization, persisted session, URL session detection or token refresh. Its backend secret-key context is unchanged. Both Writing tables have RLS enabled and no application viewer policies; an anonymous replacement is not a verified fix. [Supabase key documentation](https://supabase.com/docs/guides/getting-started/api-keys) distinguishes server keys from user JWTs. No legacy key, fabricated JWT, relaxed validation, privileged fallback or speculative header rewrite is introduced.

## Repository correction

- Collection and detail reads keep React request memoization and explicitly fetch with `no-store`; `unstable_cache` is removed. Failed reads, publication snapshots and missing-detail results cannot persist across requests in this application data cache. Sitemap also bypasses render memoization and preserves its existing deliberate HTTP 500 / no-store on unavailable data.
- Published-only filters, full document projection, source/translation validation, revision checks, synthetic-content exclusion and canonical resolution remain unchanged. Documents remain necessary for current validation and reading-time semantics. The 100-row list limit remains; current publication count is below it.
- Layout renders a stable provider, header and main without awaiting optional Writing. Genuine static discovery entries remain searchable. A narrow Suspense child enriches the provider using validated public records without resetting search, selection or overlay state. Unavailability clears article recommendations rather than reusing an older publication snapshot.
- Homepage Writing slots stream independently. Daily Quote, centered search, introduction, paths and unrelated Explore content remain available. Daily Welcome gets its optional latest article from the same snapshot without remounting. No search ranking, motion or content redesign.
- Eligible deadline/network/upstream failures can trigger one visible-page route refresh after one second per locale/navigation. No polling, assessment POST or storage. Auth/configuration/permissions/validation failures do not automatically retry. Index and operational error boundary provide localized manual retry.
- Article routes distinguish unavailable from genuinely missing/unpublished content. A fixed localized error boundary handles unavailable reads. The compatible nullable detail API remains for optional contextual links. Provider messages and credentials stay server-side.

Previously rendered content in an open/offline browser cannot be remotely erased. Withdrawal checks apply to fresh server reads; Router Cache/prefetch and open clients remain limitations. Admin invalidation hooks remain intact.

## Trade-offs and verification

Fresh reads cost more origin work. Memoization shares one collection per locale/render and one detail per slug/locale/render; distinct requests and prefetches may each query. No dependency, service, worker or database was added. Full payload and unchanged deadline still expose tail latency. This candidate does not cure the managed JWT fault.

HTML streaming may commit HTTP 200 before a notFound/error resolves. Current Production already does this for a nonexistent public Writing URL, with notFound UI and noindex. Local withdrawal shows the same envelope without article content. Dynamic sitemap XML is separate and returns HTTP 500 / no-store on unavailable collections. HTML transport success and CDN age are not publication-success or regeneration proof.

TypeScript, ESLint, focused tests, the full existing TS/TSX selection and both builds ran. The full suite retains 11 known baseline failures; it is not a full PASS. Necessary source-characterization assertions follow the moved helper and streaming slots; content/security assertions remain, with added runtime recovery, publication, memoization and state tests.

Browser QA uses built Next.js, the installed SDK and a loopback synthetic PostgREST-compatible fixture. It covers published, draft/withdrawn, empty, 401, 503, slow/stalled body and recovery; seven locales, cold/warm/concurrent requests, keyboard, reduced motion, responsive layout and metadata. This proves application behavior, not hosted RLS or Production latency. No Production keys or customer data are used. Analytics and Country remain OFF.

## Exact remaining external action

Ask Supabase to investigate project `mzpwytbbijfbkuhvfihl`, request `01a1e3d9-34ec-7edf-b853-3a74917259e6`, UTC `2026-11-16 10:13:45–46`, HTTP 401 / PGRST303 `issued_in_future`, reported PostgREST 14.5, and upstream 14.18 / issue 5196. Request confirmation of deployed service version, fix applicability and a safe supported remediation plan. No ticket was sent. Do not automatically restart, resume, upgrade, rotate keys or change settings. No dev/Stackly access or blind database upgrade is prescribed. Provider changes require separate authorization.

Before declaring reliability, separately authorize a reviewed deployment and correlate fresh-origin results across locales, timeouts and JWT outcomes. Compare current publication aggregates and sitemap without test publication/withdrawal in Production. Observed public sitemap: 401 URLs, 128 Writing URLs, 19 slugs. These are observations, not fixed targets.

## Release and rollback

**Protected Preview preparation: GO**, using isolated fixtures and both flags OFF. A no-credentials Preview must show honest unavailable without a retry loop or copied Production keys. Hosted candidate acceptance remains NOT RUN.

**Production reliability resolution: NO-GO.** Current managed JWT rejection persists and this code has no live acceptance. Sharing/private routes and sitemap protections remain. Contractual, backup and retention questions remain separate open matters.

No external rollback is required now. Keep the preserved base worktree for comparison; do not reset/delete other branches. Before any authorized release, verify the then-current Production identity and supported rollback target. Reverting this local commit restores persistent Writing caches and blocking composition: a known reliability/publication trade-off, not a permanent backend fix.
