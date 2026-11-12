# Experience Lab 2.0 · Mini Universe

This local experiment extends the protected Lab 1.0 commit 46623286966e099561fed8df1ef36cc3618fec14 in an isolated worktree. It does not replace the homepage. No deployment or remote push is authorized in this iteration.

## The experience

Search is the center of a bounded spatial composition. At most six content islands surround it, connected by fine curved paths. The active island has a brighter connection and surface. Query changes recompute the actual ranked set, category counts and positions. Two results flank the search on desktop; larger sets occupy outer positions. Compact screens use two islands above the search and the remaining islands below it. The stage height stays fixed during refinement so the field and document do not jump while typing.

Category capsules show actual counts for the current query before category filtering. Empty categories remain usable and have a calm empty-state recovery. The original catalog and ranking engine are unchanged: eight public destinations, three clearly labelled demo concepts without public article links; German/English synonyms, all-concept matching and weighted relevance. No live Writing article is asserted. Content languages remain explicit.

Every result is reachable. Previous/next and Left/Right/Home/End change selection and bring its group into view. A horizontal drag or swipe on the room or an island also changes selection; vertical touch scrolling remains native. A completed drag suppresses the follow-up click so it cannot replace the new selection. Selecting an island changes its connection and the detail section. The detail anchor and existing contextual connections provide onward navigation.

## Design decisions

Navy, ocean blue, cyan and ice highlights remain the brand palette. The primary glass material is concentrated on the central search lens. Smaller translucent islands use asymmetrical corners, restrained rotation and fine surface highlights. Position transitions and a short arrival/connection reveal follow intentional actions. There are no infinite animation loops, particles that track the visitor, autoplay, WebGL or new dependencies.

Reduced motion removes transitions and reveal animations. Results retain semantic list/button structure, selected state, keyboard navigation and polite status feedback. Decorative paths and atmospheric elements are hidden from assistive technology. Source links disable prefetch. Search input remains in component state and is not stored or serialized into URLs.

## Isolation and safeguards

The route, noindex metadata and pre-render Production HTTP 404 guard from Lab 1.0 are preserved. No shared CSS, homepage, global search, content reader, World Map, EchoWall, assessment, sitemap, auth, analytics or provider configuration is changed.

The server uses the existing static adapter; there are no new API requests, Supabase reads or mutations. Local build checks intentionally have no Supabase configuration. VERCEL_ENV=development permits a local production-build server; Production and unknown deployed environments stay blocked by the existing guard.

## Verification and limits

Local evidence belongs outside Git under .bts-engineering/adaptive-lab-2/evidence. Browser checks cover actual spatial composition, category counts, search reflow, no-result/reset, bounded navigation, related selection, mouse/touch and reduced motion. Seven UI locales are preserved; catalog language fallback remains German/English.

The room is a curated prototype with eleven records, not a live general recommendation system. Search relevance is deterministic, without AI intent interpretation. Six visible items require a group change for remaining matches. Compact layouts deliberately require vertical scrolling. The inherited streaming/footer layout shift remains outside this experiment. Real iOS Safari, actual screenreader use, hosted acceptance and the founder's subjective experience are separate checks.

A later protected Preview needs explicit release approval and a SITE_URL entry for its own verified branch alias. Do not reuse another branch's value or copy Production credentials. Human Experience approval must come from the founder before any integration proposal.
