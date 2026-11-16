# Public measurement and Global Reach readiness

16 November 2026. **Collection OFF. Activation BLOCKED. No public measurements supplied.**

## Verified infrastructure and capability

BTSHQ is Vercel project `prj_unkyAkItBZl4z15yQDutrM1j9RLw`, team `team_Fmo1I7pf25j6YvmjcPndRbdJ`. The authorized country aggregate request returned HTTP400 `web_analytics_not_enabled`. Nothing was enabled. The connector's reduced team/project responses do not expose billing.plan; the billing-status endpoint reports `plan_not_supported` and suggests Pro/Enterprise. Current Hobby is consistent with the owner's infrastructure context, but an independent plan field was **not available**. No paid feature was requested.

Official [Web Analytics pricing](https://vercel.com/docs/analytics/limits-and-pricing) lists Hobby at 50,000 events per month shared across the team, a one-month reporting window and no extra-event purchase. Collection pauses at quota rather than charging Hobby overage. The [Hobby plan page](https://vercel.com/docs/plans/hobby) also lists 50,000, but its pause/resume wording differs from the analytics page; confirm actual reset behavior before activation. A reporting window is not proof of physical data erasure. No retention period beyond documented reporting/session behavior is asserted.

The [official analytics API](https://vercel.com/docs/analytics/web-analytics-api) supports country aggregation using a project, team and authorized Vercel token. [Dashboard documentation](https://vercel.com/docs/analytics/using-web-analytics) also describes country panels and bounded CSV exports. It is **not dashboard-only**, but no active dataset or approved application credential/source exists here. The disabled-project response cannot prove this team's entitlement to every query after activation. No dashboard scraping, browser cookies or provider token was added to BTSHQ. The application currently reads no remote analytics API.

## Official SDK and the privacy stop

The pinned MIT SDK `@vercel/analytics@2.0.1` is the only new package. [Current SDK documentation](https://vercel.com/docs/analytics/package) supports returning null from beforeSend and changing event.url. Production mode is not a deployment-environment guard: Preview builds also use NODE_ENV=production. Therefore no SDK component is mounted in the application. The prepared adapter checks the independent server environment/readiness contract before importing the SDK; even a true Production flag cannot override blocked readiness.

The public provider script at `https://va.vercel-scripts.com/v1/script.js` was retrieved without executing against a provider endpoint. Its exact SHA256 is `050e35bf7e6e96590f2a9de114c14ff792806ed28457b3248762944350c0ba4c`; its internal version is0.1.3. This is not proof of the exact script a future Vercel deployment's dynamic resilient-intake configuration will serve.

The unchanged SDK and collector run in controlled VM and intercepted browser fixtures. The **actual serialized JSON** confirms: URL query/fragment removal; unknown/private routes and custom events rejected; same-path mode/welcome changes do not count as navigation. It also confirms that URL-only beforeSend can still leave an external document referrer and existing provider attribution in fields generated after that hook. The typed hook exposes type/url, not a complete payload replacement. DOM flag gathering is another source-level concern, not a newly verified live data leak. HTTP Referer headers and future resilient-intake/session behavior also need review. No real visitor or assessment data was used or sent. The blocked state and absence of an application mount prevent this candidate from collecting anything.

This is a verified limitation of the proposed **URL-only** integration, not a claim that every possible Vercel configuration is inherently unsafe. Do not remove the blocker or widen the route allowlist to make a test pass. A future correction must use supported controls and verify the entire actual payload and request headers; no global fetch interception is proposed for production.

## Route contract

Canonical base routes, localized in all seven supported locales: `/`, `/about`, `/people`, `/world`, `/writing`, `/echowall`. Additional exact canonical destinations can only come from existing project records, published Spotlight records and already validated published Writing summaries via public-catalog. Writing withdrawal removes its allowlist entry on rebuilding the catalog; no wildcard slug pattern grants eligibility. The preparation is not mounted or persistently cached.

Everything else fails closed: assessments and their landing/result flows, FYNS, Life Alignment, Personal Advantage, Money Profile, account/auth/admin, invitations, private sessions, newsletter token flows, labs, APIs, unknown/encoded/noncanonical paths. No search value, custom event, welcome dismissal, mode choice or answer is added to a page-view event. Discovery and scoring engines are unchanged. The older Cloudflare-named proxy boundary remains a legacy route-navigation protection, not a collector and not this new allowlist; it is not weakened or repurposed.

## Aggregate contract and restrained UI

The World Map reach section is separate from relationship pins and voluntary EchoWall country contributions. Page views count events, including repeat views, not people or unique visitors. Existing genuine connections remain unchanged; no page-view map pins are created. The EchoWall country flag remains OFF and its pending migration remains unapplied.

The version1 contract accepts only Vercel pageview aggregates for this exact project with an explicitly approved public aggregate provenance and exact route scope. Extra fields, unsupported ISO countries, duplicates, negative/fractional/unsafe counts and inconsistent/future UTC dates are rejected. Missing/invalid/stale/suppressed data renders an honest unavailable message in seven locales. No zero is presented as a measured total. Unknown country and Others rows must be omitted by a separately reviewed import workflow and declared as partial geography; never convert them into an invented country.

Proposed public-display safeguards: snapshots expire from presentation after24hours; country rows below5views are omitted including their names; the UI states that only reported views are represented. These are local presentation proposals, **not provider retention, a consent substitute or a legal anonymity guarantee**. No total, visitor estimate, time trend or popularity ranking is fabricated. No raw visits, IPs or browsing histories are stored. Provenance markers validate a contract, not authorization: a future importer must authenticate the owner, verify the provider query/period/eligible route scope and obtain public-display approval. No import endpoint or sample production snapshot exists.

## Separate activation approvals and sequence

1. Resolve owner/legal review of provider roles, lawful basis/consent choice, geography/transfers, actual retention and the Hobby contractual question. The [current DPA](https://vercel.com/legal/dpa) expressly describes Pro/Enterprise scope; its publication alone does not establish a Hobby agreement. The [provider privacy page](https://vercel.com/docs/analytics/privacy-policy) describes request-derived visitor hashing and a24hour session lifetime, not a guarantee that this implementation is legally compliant. Hosting region alone does not establish analytics residency.
2. Close the payload blocker with a separately reviewed minimal implementation and real SDK/script/request-header negative tests. Pin/review changes to provider behavior. Keep OFF in local/tests/protected Previews. Preserve one collector only.
3. Obtain explicit approval to deploy the reviewed candidate, enable project Web Analytics and set `BTS_PUBLIC_ANALYTICS_ENABLED=true` **Production-only**. Current code still cannot be activated by this variable alone; client mounting and readiness correction require source approval first. No remote actions are authorized by this document.
4. After authorized deployment, correlate a bounded eligible public page-view sample with official dashboard/API; verify private routes, search and assessment journeys send nothing, including from sensitive referrers. Check repeat/navigation semantics, no duplicate collectors and no user-visible delays. Do not generate fake traffic as production evidence.
5. Verify real country data and supported API entitlement. Prefer owner dashboard for administrative insights. If a public snapshot is separately approved, import only aggregate rows with query/provenance/period evidence, suppression, freshness and missing-geography handling. Never put administrative tokens in a client bundle. Until then keep the honest unavailable section.
6. Monitor event quota, reporting availability, retention commitments and source freshness. Disable by removing the Production flag/client mount in a separately authorized release and disabling the provider dashboard collection; verify intake stops. This does not erase previously stored provider data. Follow the provider's authorized deletion process separately.

## Local verification commands

Run `npm run typecheck`, `npm run lint`, the focused analytics/country/World Map/EchoWall/privacy/sharing suites and both `npm run build` / `npx --no-install next build --webpack`. Run the full existing suite and compare the11known baseline failures without skips.

For provider payload verification, download the above public collector into ignored local staging (never public assets), verify its hash, then run `node scripts/test-public-analytics.mjs <local-script-path>`. The test has no network and fails on a changed collector. Browser tests must intercept every provider endpoint and external request; synthetic results are not measured website reach. OFF must be verified in the final built app as zero provider scripts/intake requests and no provider JS chunk, not merely a unit-test boolean.

Rollback: keep collection OFF; do not change remote settings. Before any later release, preserve the current Production deployment identity and use the already approved rollback procedure only with release authorization. Local review rollback is to select the untouched cedf1f0 source worktree; do not reset other worktrees or delete evidence.
