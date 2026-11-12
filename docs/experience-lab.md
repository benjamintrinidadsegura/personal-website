# BTSHQ Experience Lab 4.0 · Adaptive Liquid Universe

## Isolation and provenance

Branch: codex/btshq-experience-lab-4. A new isolated worktree based on the exact approved Premium Spatial Glass commit a903d8ebc23e7b36120e9d6388d0e1896cb50d02, whose parent is Lab 3.0 b602fed5e030fbbc077f31e8e575ea8810362aea.

Variant B a3c5f197aed9b983b66b1d721c6f79450e9a532a is a visual reference only. No merge, cherry-pick, remote push, deployment, provider change or database access is involved. The original checkout and all previous Lab worktrees are preserved. Public app routes, global navigation, publication readers, sharing validation, auth, search ranking and catalog records are unchanged.

The protected /experience-lab route remains noindex and fails closed with HTTP 404/private/no-store in Production, including Flight requests. It is not in public navigation, global search or the sitemap. Input remains ephemeral tab memory.

## Art direction and materials

A's central spatial organization is retained. B informs the deeper cobalt atmosphere, larger typography and image-led supporting objects; its left-anchored search layout is not merged into A.

Actual shared brand tokens are --primary #35d0e5, --primary-hover #73e3f1 and --background #061521 from app/globals.css. The local material system extends them with navy, ocean/cobalt and ice highlights. No global color or CSS is changed.

The lens has a layered inner surface, reflected edge, lower optical rim and localized focus response. Only the lens uses 10px backdrop filtering, behind an opaque gradient fallback. The environment uses static gradients and fine orbital surfaces rather than full-screen filters, particles or looping highlights. Different content materials remain deliberate: cobalt project prism, geographic orb, portrait arch, reflection instrument, editorial leaf and community droplet.

An initial local 390px measurement showed p95 frame intervals around 33ms during interaction. Browser-only ablations of lens blur, image blending and atmosphere did not consistently help. Removing diffuse card box-shadows did: in a counterbalanced probe, all three no-shadow cases had approximately 16.8ms p95; two of three unmodified cases had approximately 33.3ms. Small-screen card shadows are therefore removed through one scoped CSS rule. Gradients, edge reflections, borders, focus outlines and desktop materials remain. This establishes a local rendering-cost reduction, not a universal GPU diagnosis or guaranteed device frame rate.

Small duplicate metadata and action captions that were clipped by curved public silhouettes are visually retired; each button retains its complete localized accessible action/name/type. Demo labels remain visibly present. The title and primary image remain the objects' visual content.

There are no scroll listeners, scroll reveals, automatic entrance sequences or endless animations. The initial scene is at its final position on first render. The old delayed returning-heading fade is removed. Hover/focus responses are finite CSS transitions; scene changes use the existing finite 460ms controller and deterministic choreography.

## Adaptive search and contextual evidence

The authoritative search implementation, synonyms, weights, AND matching, ordering and result set are byte-for-byte unchanged. Query and category changes still operate on real matches. They change the visible composition, category counts, local light, object identity positions and relevance-derived scale (bounded .88–1). No unrelated item fills a missing result.

All eleven catalog identity slots remain mounted. At most six ranked matches are shown in Explore; the native complete list and previous/next/Home/End controls preserve access to every result. The empty state and immediate clear/reset remain available.

The lens selectively displays at most two actual matched topics using labContext. No explanation is inferred from popularity, assumed collaboration or a generated endorsement.

## One full-width Focus world

Focus places the original selected visual in the center of one full-width stage, with a large accurate title above and reading/action content below. There is no modal, extra duplicate image or side-panel rectangle. Search remains centered and understandable; its native content-type disclosure is collapsed in Focus and open in Explore. A category change or refinement immediately returns to exploration without clearing the query.

At most two related matching objects remain visible, smaller and quieter, on the sides (below the hero on compact layouts). They come only from relatedLabItems/sharedLabTopics within the current real match set. Their visible topic captions and the reading area's explanation identify the actual connection. Other identity slots remain mounted and inert. Back/Escape restores the original ranked constellation, selection, query and category.

Satellite connectors migrate from the lens to the selected object's coordinate system. An initial implementation demonstrably jumped the source on the first Focus frame. The regression failed before the correction and passes after it. Remembered source center and extent now interpolate with the same finite motion; document-origin rebasing excludes extents. Interruptions and direct manipulation use the actual intermediate geometry. The selected lens-to-object string is visually suppressed in Focus so it cannot cut through the title. Satellite strings retain their meaningful association.

Geometry reads remain batched on scene changes/resizes, plus the pre-existing bounded keyboard-visibility reads. There are no new per-frame React renders or geometry reads, input timers or click delays. Observers, media listeners and animation frames are cleaned up. Reduced motion moves immediately to stable endpoints.

## Content and assets

The catalog is unchanged: eight real public destinations and three explicitly labelled demo concepts, which cannot open an article. This is not live Writing publication retrieval. No article, person, collaboration, contribution or relationship was invented.

The existing public Evgeny Vinokurov cover is used unchanged. Its approximately 254px portrait area limits large Focus sharpness even when the original JPEG is served. Existing career and self-reflection illustrations are local decorative context, not portraits of named users or testimonials. The map remains schematic. No external assets, image-generation service or new dependency is introduced.

## Verification

Commands:
- npm run typecheck
- npm run lint
- tsx --test tests/experience-lab.test.tsx tests/experience-lab-motion.test.ts tests/experience-lab-focus.test.tsx tests/cloudflare-web-analytics.test.ts tests/share-url-security.test.ts tests/home-view.test.ts
- tsx --test 'tests/*.test.ts' 'tests/*.test.tsx'
- npm run build
- npm run build -- --webpack

The focused suite has 50 passing tests. The full suite has 1,148 tests: 1,137 pass and eleven fail. Their normalized failing identities match the unchanged 3.5 A baseline exactly (no additions/removals). Existing debt concerns runner/tracking fixtures, older context-card contracts, provider checksum/Self characterization, absent ignored Writing-promotion artifacts, and a Comments timing assertion. Tests are not disabled, weakened or suppressed. ESLint has no errors and the same three unrelated warnings.

Browser verification uses installed desktop Chrome through the existing cached Playwright runtime, not a real iOS device. The evidence scripts and logs live outside Git in .bts-engineering/lab-4/evidence. Network harnesses reject/record unexpected external origins and non-GET/HEAD requests; synthetic queries contain no assessment data.

Coverage includes seven locales, 320/390/768/1440px, nine query/cardinality states, normal and reduced motion, Focus/related-object/return, complete list, filters/refinement/reset, keyboard and touch/mouse gestures. Axe covers Explore/Focus/empty states at 320/1440px. Animated frame sampling checks stable object identity, solid-surface/search collisions, ellipse-model connector boundaries and finite idle behavior; it does not prove exact outline geometry for every silhouette.

A single 320px reduced-motion keyboard-return failure occurred on the development server. Instrumentation showed a later resize/scroll sequence; it was not reproduced in the optimized build. No speculative product fix was made for that observation. Final optimized-build keyboard tests pass with both motion preferences. It remains a disclosed development-only uncertainty.

The public-app smoke keeps Discover/Explore, global search, seven homepage locales, Writing, tools, World Map, EchoWall and canonical behavior intact. With local development/Preview boundaries the sitemap is deliberately empty and does not advertise Lab URLs; this is not live Production publication or withdrawal evidence.

## Streaming and final local measurements

Cold-start observation found a 0.106149 layout-shift sample caused by the footer being visible at y=630 while the inherited global fallback reserved only 60svh, then leaving the viewport when the real Lab streamed. The same footer behavior was reproduced on unchanged A (0.097326). No global fallback or public page is changed: app/experience-lab/loading.tsx reserves one viewport only for this Lab, using the existing seven-locale loading dictionary and a native status, without a pulse, artificial delay or reveal. Subsequent local cold probes at 320/390/768/1440px each recorded zero load layout shift; this is limited local evidence, not a site-wide field CLS claim.

Final paired optimized Webpack samples (three each at 390px and 1440px, same interactions):

| Measurement | Unchanged A | Lab 4.0 |
|---|---:|---:|
| Input to two render frames | 17.8–33.3ms | 17.1–39.7ms |
| p95 frame interval, all six samples | about 16.8ms | about 16.8ms |
| Maximum sampled frame interval | 66.6ms | 33.4ms |
| Observed long tasks | 0 | 0 |
| JavaScript resource bodies | 419,044 bytes | 419,885 bytes |
| CSS resource bodies | 44,006 bytes | 44,357 bytes |
| Image resource bodies | 100,772 bytes | 110,926–121,480 bytes |

Thus the additional JavaScript is 841 bytes, CSS 351 bytes and images 10,154–20,708 bytes versus A in this local interaction sequence. The illustration accounts for the extra image payload. Initial four-way samples and all ablation traces remain alongside the final paired traces; unfavorable observations have not been discarded. A first Webpack attempt encountered a Windows EPERM on a generated .next directory; unchanged build configuration subsequently passes both compilers. No source/configuration workaround was introduced for that filesystem error.

## Review evidence and limitations

Matching static captures compare Lab 3.0, 3.5 A, 3.5 B and 4.0 at desktop/mobile sizes in initial, search, Focus and reduced-motion states. Actual browser recordings show search transformation, category changes, object selection, Focus, return and interrupted-input recovery. No mockup footage substitutes for a working interface.

Founder acceptance remains authoritative for both static visual quality and interaction enjoyment. Automated checks cannot establish either subjective gate. The stronger full-width Focus trades the old immediately adjacent details for an image-led stage: its description and destination action require more vertical reading, particularly on mobile. Large portrait quality remains source-limited. These are explicit founder-review topics, not hidden behind passing tests.

Real mobile GPU behavior, real iOS Safari, actual screenreader use and hosted Preview acceptance remain NOT VERIFIED. Local timing is not INP/field data or a universal 60fps claim. Script-dispatched input in performance traces does not supply trustworthy recent-input flags; its layout-shift entries are not reported as field CLS.

## Exact changed-file inventory

- app/experience-lab/loading.tsx
- components/experience-lab/experience-lab.module.css
- components/experience-lab/experience-lab.tsx
- components/experience-lab/focus-surface.tsx
- components/experience-lab/island-visual.tsx
- lib/experience-lab/space.ts
- lib/experience-lab/motion.ts
- tests/experience-lab.test.tsx
- tests/experience-lab-focus.test.tsx
- tests/experience-lab-motion.test.ts
- docs/experience-lab.md

## Local review and rollback

Local review: http://127.0.0.1:3390/en/experience-lab (all existing locale prefixes work).

Return to the preserved A worktree/server to compare or abandon this isolated branch without affecting any other worktree. If selected later, the single Lab 4.0 commit can be reverted; no data/provider rollback is needed.

Protected Preview publication requires separate push approval and fresh project/branch/configuration verification. No Preview or Production deployment has occurred in this task. Production release is outside this experiment's authorization.
