# Search + AI discovery foundation

This is the operational baseline for making BTSHQ.ONLINE understandable to people, search engines and legitimate answer-retrieval systems without turning the product into an SEO content operation.

## Search + AI discovery principles

- Problem first, useful answer second, relevant BTSHQ.ONLINE experience third.
- One canonical destination for one user intent cluster. Do not create a page for every phrasing of a question.
- Important explanatory copy must be present in the initial HTML. Interaction may require JavaScript; understanding the page must not.
- Write for a person deciding whether a reflection or tool is useful. Do not stuff keywords, generate doorway pages or publish synthetic expertise.
- GEO is a discovery layer over real product value, not a separate content product and not a launch blocker.

## Public and private indexing policy

Public and indexable surfaces are the intentional editorial pages, published Writing, public People and project records, and public explanations for tools such as Personal Advantage, Money Profile, FYNS and Life Alignment. The sitemap contains canonical locale URLs only. Legacy Career Spotlight URLs redirect to canonical People URLs and are not listed.

Private or non-indexable surfaces include Admin, Account, internal APIs, newsletter confirmation and unsubscribe flows, Life Alignment invitations, sessions and session lists, and the partner shared-device flow. These routes are absent from the sitemap. Robots exclusions reinforce the boundary; route metadata and response headers protect sensitive interactive flows. Robots is never treated as access control.

The canonical host comes from one clean origin in `SITE_URL`. Production accepts any correctly configured HTTPS origin so a domain change does not require a code rewrite. Vercel Preview, development and malformed configurations fail closed for indexing: robots disallows crawling, page metadata is `noindex`, and the sitemap is empty. Preview builds should set `SITE_URL` to their own HTTPS preview origin so rendered technical URLs never impersonate a future Production domain.

## Canonical intent clusters

The maintainable source is `data/search-discovery.ts`.

| Cluster | Canonical destination | Example questions |
| --- | --- | --- |
| Strengths and personal advantage | `/tools/personal-advantage` | What are my strongest abilities? How do I find my unfair advantage? |
| Money behaviour | `/tools/money-profile` | What kind of money person am I? What changes under financial stress? |
| Life direction and alignment | `/life-alignment` | What do I really want? Does my current life fit my priorities? |
| Career and next step | `/find-your-next-step` | Which career direction fits me? What is a useful next step? |
| Thinking and working patterns | `/about/how-my-brain-works` | How do I think and work? Which environments fit those patterns? |

These clusters are a map, not a page-generation queue. Existing routes remain canonical unless a genuinely different user need cannot be served there.

## First implemented discovery surfaces

Sprint 7 improves only two mature surfaces:

1. Personal Advantage answers how to look for a repeated combination of ability, experience, energy, access and relied-on situations. Its explanatory content now renders in the initial HTML instead of waiting for hydration.
2. Money Profile answers how to examine recurring meanings, decisions and stress shifts without using income, balances or financial scores.

Both surfaces include concise localized answer-first copy, evidence boundaries, human-scale related links, localized canonical and alternate metadata, a truthful `WebPage` + `WebApplication` + `BreadcrumbList` graph, and a minimal local discovery-entry event. No ratings, reviews, credentials or diagnostic schema are emitted.

Life Alignment, FYNS and Brain Manual already expose substantial server-rendered explanations and remain existing canonical destinations. They were audited but not expanded into new routes.

## Crawler policy

Production robots groups have deliberate jobs:

- `Googlebot`, `Bingbot`, `OAI-SearchBot` and `ChatGPT-User` may retrieve public content while receiving the same private-route exclusions.
- `GPTBot` is treated separately as a model-training crawler and is disallowed.
- Other crawlers receive the public/private default policy.
- Every environment that is not the exact canonical production host is fully disallowed.

The names and semantics above reflect the implemented offline baseline and were not externally re-verified during this sprint. Fresh provider-documentation verification is a Release Acceptance item. A crawler rule never grants access to authenticated or private data.

## Structured data policy

- The root `WebSite`, About `ProfilePage` and `Person`, published Writing `Article`, People profiles and breadcrumbs remain the stable entity graph.
- Personal Advantage and Money Profile add only visible-content-aligned `WebPage`, `WebApplication` and `BreadcrumbList` entities.
- Do not add FAQ markup unless a page contains a genuine visible FAQ. Do not add ratings, reviews, medical types, professional credentials or claims of validated assessment without evidence.
- Schema descriptions must use the same boundaries as the visible copy.

## Measurement

No analytics SDK or network sink was added. The two first surfaces dispatch the existing browser-local `bts:product-event` with only:

- event name `discovery_landing_viewed`;
- the allowlisted surface identifier;
- locale;
- one broad referral category: `direct`, `internal`, `organic-search`, `ai-assistant` or `external`.

Raw referrers, search queries, URLs, answers, result labels, financial patterns and profile data are not included. A future analytics consumer must still pass consent, privacy, retention and vendor review before sending events off the device. Search or AI citations cannot be inferred reliably from local product events and require external monitoring.

## Evidence and trust boundaries

- Personal Advantage creates hypotheses for real-life testing. It is not a scientifically validated personality assessment and not a psychological or medical diagnosis.
- Money Profile is structured reflection on financial behaviour. It is not financial, investment, tax, credit or debt advice and is not diagnostic.
- FYNS, Life Alignment and Brain Manual remain orientation and reflection experiences unless a specific visible source states a narrower evidence basis.
- Do not add citations, scientific authority or causal claims without verified sources. Offline work must defer source enrichment instead of inventing it.

## Release Acceptance

No provider, DNS, deployment or production state was changed in this sprint. After Technical Acceptance and an authorized deployment:

1. Re-check current official crawler documentation for Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User and GPTBot. Confirm that the intended distinction between indexing/retrieval and training is still accurate.
2. Set the canonical production `SITE_URL` to the final purchased HTTPS origin. Fetch `/robots.txt` and `/sitemap.xml` from that deployed origin and confirm a 200 response, exact host URLs, private exclusions, locale alternates and no preview URLs.
3. Register or verify the final HTTPS domain property in Google Search Console. Put the real provider-issued token in `GOOGLE_SITE_VERIFICATION`, redeploy, confirm the rendered verification tag, then submit the sitemap URL emitted by the deployed `/robots.txt`.
4. Register or verify the site in Bing Webmaster Tools. Put the real provider-issued token in `BING_SITE_VERIFICATION`, redeploy, confirm the `msvalidate.01` tag, then submit the same sitemap.
5. Do not commit provider tokens. Empty or malformed variables emit no verification metadata.
6. Inspect representative DE, EN, ES, TR, PL, EL and RU URLs for self-canonical, reciprocal hreflang and the German `x-default`. Confirm the `/de` alias redirects to the unprefixed German canonical.
7. Use provider URL inspection tools on Personal Advantage, Money Profile, Life Alignment, FYNS and Brain Manual. Confirm initial HTML includes the visible explanation and supported structured data.
8. Establish a consent-approved baseline for organic and AI referral categories, tool starts and account conversion. Keep raw queries, referrers and private answers out of collection.
9. Track search coverage and externally observable AI citations separately. Record the source, query set, locale, observation date and cited canonical URL; do not represent absence of evidence as zero visibility.

IndexNow is not implemented or submitted. Retain that decision unless Bing operations show a material need and a secure key, URL-change publisher, failure handling and privacy review are explicitly approved. Do not generate a placeholder key or submit URLs manually from application code.

## Deferred opportunities

- Native-speaker editorial review of the new answer-first copy and existing nuanced assessment content in all seven locales.
- Verified source and methodology enrichment where a framework genuinely warrants it.
- Consent-approved analytics consumption, retention and dashboards for the existing minimal event.
- External citation monitoring with a stable multilingual question set.
- IndexNow only after its operational value and key-management design are accepted.
- New discovery routes only when an important intent cannot be answered by an existing mature product surface.
