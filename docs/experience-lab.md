# BTSHQ Experience / Identity — Convergence Polish

One local refinement of Human Liquid Universe, based directly on `84a9e03ad40fd96a6af5d7b7329c8a03ead51cd9`. Branch: `codex/btshq-convergence-polish`. Worktree: `.bts-engineering/convergence-polish/checkout`. The Human Liquid, 6.1 B/C and 5.2 worktrees remain unchanged. There is no new design-family selector.

## Deliberate changes

- Retain the centered primary scene and its existing finite, interruptible search/Focus controller. Refine the existing blue/navy room rather than replacing its interaction architecture.
- Replace the large 160px decorative material corner with a restrained architectural edge, layered light and a consistent cool-blue palette. Refine the single search lens with bounded 6px blur, an optical edge and blue focus feedback; keep the opaque fallback.
- Make the existing localized invitation the visible H1. Increase small functional labels and metadata to 11–12px, establish a clearer title hierarchy, and give category controls a quiet, usable surface without changing their native disclosure behavior. The category group uses three columns so longer seven-locale labels remain legible at 320px; the previous four-column layout clipped the Spanish Tools label after the readable font-size increase.
- Remove the invented split GOAT / RECRUTAINER wordmark. The project visual now contains its existing public description and genuine topics as a plain editorial note. Its actual name, record, destination and source language remain intact. No project screenshot, logo or endorsement is invented.
- Keep the familiar portrait silhouette and natural approved assets. Match portrait aspect ratios more closely across roles; add restrained image depth. Pointer-only artwork response is 1.2%, finite and absent under reduced motion or coarse touch. No ambient loop, parallax or scroll reveal.
- Remove the redundant mobile lead-item 'closer' footer. It repeated the native selection/Focus action and collided with the search label for long three-line titles. Keep the artwork/title selection, full list and Focus action. Move the two compact supporting anchors by only 3 normalized units relative to the Human Liquid base to give longer, more legible captions room above the scene boundary.

## Scope and contracts

The search engine, catalog, synonyms, ranking, category rules, locale dictionaries, public URLs, topic relationships, motion/choreography engine, publication rules and all public product pages are unchanged. Search terms remain in page memory. No new request logging, persistence, analytics, external script, provider configuration, dependency, database or migration.

The exact source scope is six paths:

- `components/experience-lab/experience-lab.tsx`
- `components/experience-lab/experience-lab.module.css`
- `components/experience-lab/island-visual.tsx`
- `lib/experience-lab/space.ts`
- `tests/experience-lab.test.tsx`
- `docs/experience-lab.md`

The test delta strengthens the seven-locale visible-heading contract and adds a project-context regression that checks genuine source data instead of an invented wordmark. Existing search, Focus, privacy and security assertions are not weakened.

## Verification

Local scripts and real browser evidence are kept outside the source candidate at `.bts-engineering/convergence-polish/evidence`.

TypeScript passes; ESLint has zero errors and three unchanged unrelated warnings. Both final optimized builds (`npm run build` and `npm run build -- --webpack`) pass. Diff/whitespace and source secret-signature checks pass.

The focused suite has 68 passing tests. Full local regression: 1,166 tests, 1,155 pass and eleven fail, with no skips or todos. The exact normalized failing identities match the already verified unchanged Human Liquid baseline (1,165 tests, 1,154 pass, eleven fail). Full-suite status remains FAIL on that existing debt, not a blanket PASS. The comparison is recorded in `suite-comparison.json`; no unrelated baseline investigation or test weakening is part of this polish sprint.

The responsive matrix covers seven locales, four widths (320/390/768/1440), zero through six visible results, complete-list access, Focus, return and reset. In addition to native button boxes it checks actual visible caption/metadata bounds against the search controls and lower scene edge. That extra check protects the real mobile reading problem found during visual review.

Keyboard, native CDP touch, mouse drag, rapid interrupted search, native categories/results disclosures, public/demo destination boundaries, finite idle behavior and image/search clearance are exercised. Accessibility results are scoped automated checks and supplemental visual/contrast observations, not assistive-technology certification.

The Lab remains noindex and guarded by the existing Production 404/private/no-store boundary. Public homepage, Discover/Explore, Writing, sitemap, tools and private-route behavior remain outside this source delta. Local Writing is intentionally unavailable without provider configuration; no Production credentials are copied.

The final optimized-browser runs pass seven locales at all four widths, including native category-label overflow checks, keyboard activation, zero-result filtering, real caption bounds and fixed search midpoint. Explore/Focus/empty Axe checks report no scoped violations at 320/1440px; keyboard/reduced-motion, native touch/mouse, interruption, image hit areas, connector geometry and idle behavior pass. Instrumented journeys observe no unexpected external requests, POSTs or uncaught page errors. Public-app smoke and local Production-mode Lab/sitemap boundaries pass.

Four fresh-context local starts against the warm optimized server observe zero pre-input layout shift, with LCP samples 532/192/148/276ms at 320/390/768/1440px. One paired interaction trace per implementation/width observes p95 frame intervals of 18.1/18.0ms on Human Liquid and 18.3/18.1ms on the polish (desktop/compact); no main-thread long tasks are recorded. The candidate's worst sampled desktop frame is 36.1ms. These are small local observations, not statistical guarantees, field INP/CLS or actual-device evidence. No constant animation loop is introduced.

Relevant proof: `comparison-1440.png` and `comparison-390.png` contain matching actual German initial and Evgeny Focus captures against Human Liquid; individual search/return/reduced-motion captures remain alongside them. `convergence-1440.mp4` and `convergence-390.mp4` are actual timestamp-preserving browser recordings, completely decoded successfully, not concept renders. Media and diagnostics remain outside the six-path source candidate.

## Founder review and limits

Review the single local version at http://127.0.0.1:3490/experience-lab. The matching evidence compares the actual Human Liquid base against this polish, not against a fabricated concept rendering. Relevant proof is the initial composition, an Evgeny Focus view and a short actual search/selection/return recording at desktop and compact sizes.

The gain is a cleaner reading hierarchy, calmer project representation and more coherent controls/materials. The room still relies on CSS lighting, image framing and scale relationships for depth. Whether it now feels sufficiently distinctive and enjoyable is a Founder judgment, not an automated PASS. The original portrait resolution, absence of an approved local project visual, real iOS/Safari and actual screenreader/device-GPU behavior remain limitations. The existing JavaScript-disabled streamed-shell limitation is not redesigned.

All pre-existing worktrees, branch refs and dirty source bytes are verified against the pre-task preservation snapshot. No Production, main, Supabase or analytics operation occurs. No commit, push or deployment is part of this local review stand. Returning to the unchanged Human Liquid worktree is the local rollback; do not reset an existing checkout.
