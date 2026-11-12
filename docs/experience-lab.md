# Experience Lab 1.0

The route /experience-lab is a removable, local prototype based on the Living World candidate d2e259e2b5307bd5e549f053e34ca5d7e26d1298. Its components, CSS Module, catalog, copy, search and tests are separate additions. The existing homepage, navigation, search, World Map, EchoWall and publication readers keep their implementations.

## Design decisions

The blue palette comes from the existing background #061521, surface #0a2031, primary #35d0e5 and hover #73e3f1. Typography inherits the existing Inter stack. A bounded horizontal deck uses slight perspective and different materials to make selection visible. The first screen centers Personal Advantage with adjacent projects, the map, a published Spotlight and EchoWall. Mobile preserves one readable card and previews its neighbours. Categories remain explicit and search stays above the deck.

The founder references informed spatial selection, visual browsing and controlled transitions. No code or assets were taken from Osmo, Cosmos, Lusion or Instrument. Cosmos could not be fetched during the reference check. The cover image comes from the existing published Spotlight.

## Catalog and ranking

The replaceable catalog adapter returns 11 records. Eight link to existing BTSHQ destinations. Three are explicitly labelled demo concepts with no public article destination. No live Writing article is asserted. Existing German content and English translations keep an explicit source-language label.

The pure search engine has no service dependencies. It normalizes case, Unicode accents, punctuation and German sharp s. Term equivalence groups cover German and English topics. Every query concept must match an indexed field. Title, topics, keywords, description and kind have separate weights. Exact title and title phrase matches receive extra weight. Prefix matches and single edits, including adjacent transposition in words of at least five characters, have lower weight. Ties retain catalog order. Results never fill missing concepts with unrelated category items.

Typing changes the actual ranked card set and selected detail. Category selection intersects the query. Reset restores the initial catalog order and selection. Related items require shared topic evidence and are limited to two. Their selection deliberately clears the previous refinement and brings the linked concept into the original deck.

Search input is limited to 160 characters. Queries stay in React state. They are not placed in URLs or persisted. Lab destination links disable prefetch to avoid fetching a content page merely because the visitor tries a different term.

## Interaction and accessibility

The deck uses native horizontal scrolling and touch swiping. Desktop mouse dragging adjusts scroll position without a React update per pointer move. The settled position determines the selected card. Previous and next buttons provide a drag alternative. Arrow keys, Home and End work on card buttons, and Enter or Space selects a card. Bounds disable the appropriate explicit control.

Buttons expose the selected state and link their controls to the detail section. Search and selected-card updates have separate polite status messages. Refinement preserves input focus. Related-item buttons never open a modal or trap focus. Reduced motion uses the same controls without smooth scrolling, entry animation or perspective transitions. Decorative visuals are hidden from the accessibility tree.

## Isolation and release boundaries

The route explicitly declares noindex, nofollow, noarchive, nosnippet and noimageindex. The Next.js proxy rejects the lab path and descendants with an uncached HTTP 404 before rendering in Production and unknown deployed environments. Preview and development are allowed; local production-build checks must explicitly set VERCEL_ENV=development. The page retains a defensive notFound check. This avoids the inherited streaming boundary turning a page-level notFound into HTTP 200. No public navigation, discovery index, sitemap or shared style file is changed. The new CSS is imported only by the new component. A protected Preview push is separately authorized; Production deployment remains prohibited.

The root layout still performs its existing account and public-content setup. This prototype adds no Supabase query, mutation, analytics, external script or dependency. The inherited streamed loading boundary and its occasional footer shift still exist. Disabling JavaScript entirely inherits that boundary limitation.

## Local verification

Chromium checks cover all seven locales at 320, 390, 768 and 1440 pixels, bilingual search, empty results, reset, categories, mouse dragging, native touch swiping, keyboard navigation, related-item selection and source links. Axe checks cover initial, filtered and empty states at 320 and 1440 pixels. Search terms are checked against observed requests and URL/storage state. Existing homepage modes and global search, Writing, tools, World Map, EchoWall and SEO receive regression checks.

The full-suite baseline has eleven existing failures. Retain their identities in the release evidence rather than treating the suite as passing. Real iOS Safari, an actual screenreader and hosted Preview acceptance are separate verification tasks. The founder must judge whether the interaction is enjoyable and premium.

## Later approved integration

1. Review the protected prototype with the founder and choose the useful interaction patterns.
2. Replace createLabCatalog with an adapter to the authorized public discovery snapshot. Published and withdrawn content must follow the same availability and publication checks as the live application.
3. Keep the pure search interface while comparing relevance against the current engine on a labelled test set. Do not replace global ranking without that review.
4. Translate or remove demo concepts and verify canonical destinations. No fixture should become a published record by default.
5. Any move into homepage composition requires an independent integration candidate with hydration, mobile performance, privacy and accessibility acceptance.

The prototype can be removed by reverting its single commit. No schema or external state is involved.
