# Experience Lab 5.2 — Centered magic correction

Direct parent: Lab 5.0, `ea132fee0f20848ca713887a1f972ae64db1d93a`. Lab 5.1 (`e13ec9ad9327198a9683bc462ee5c20b59594bc7`) is reference only; its commit was not cherry-picked. Worktree: `.bts-engineering/lab-52/checkout`, branch `codex/btshq-experience-lab-52`.

The owner explicitly clarified that the lens must be geometrically centered, rather than retaining 5.0's 78% desktop anchor. The lens is centered horizontally in the content viewport and vertically in the initial visible stage. It has the same document/scene anchor through queries, Focus, Back and Reset; it does not follow scrolling like a fixed toolbar. Only an offscreen field is revealed when necessary on Focus entry. At narrow sizes content reserves space below the measured control zone. This necessary clearance changes some object positions; it is not a claim of pixel-identical 5.0 layout.

Retained from 5.0: Cinematic Atlas imagery, typography, composition language, native caption structure, existing Focus reading layout, catalog, ranking, contextual relationships, destinations and all seven locale copies. The existing alternative studies are preserved, not expanded. No public homepage, real search, Writing, sitemap, tools, assessment, provider configuration or dependency changes occur.

Selectively adapted from 5.1: inline title focus (a visible 2px underline, not an oversized outline), a finite 340ms critically damped response, and the principle of preserving an image anchor through interruption. Here the original 5.0 image elements stay in place; their world anchor interpolates from the actual previous frame, with parent caption scaling cancelled for the large artwork. Focus depth is limited to 1.8%. No 5.1 shared-stage rewrite, top search arrangement, mobile grid, hidden visual H2, or new variant is imported.

Verification on the optimized local Webpack server:
- 55 focused tests pass; full suite has 1,153 tests: 1,142 pass and eleven fail. Their normalized failing identities exactly match unchanged 5.0 (no new failures); no test was suppressed or weakened. The extra regression checks continuity of the sampled world anchor across interrupted queries.
- `npm run typecheck` passes; `npm run lint` has zero errors and the same three unrelated warnings. `npm run build` and `npm run build -- --webpack` pass.
- Seven locales × 320/390/768/1440px × initial, AI, Community, no-match, Focus, return and reset pass geometric assertions: field midpoint is within 1px of the horizontal content center and 2px of the vertical viewport center in the tested visible states.
- Normal/reduced-motion keyboard return, native touch swipe/mouse drag, rapid interruption, category/refinement/full-list contracts and real/demo destinations pass. Axe finds zero WCAG A/AA/2.1 AA violations in the scoped Lab Explore/Focus/empty cases at 320/1440px.
- Home seven-locale Discover/Explore, real global search, Writing, tools, World Map, EchoWall, privacy and canonical smoke pass. No unexpected external requests or POSTs occur in instrumented journeys. Sharing allowlist regressions pass. No homepage, search-engine, sitemap, security, catalog, data or dependency source changes are included.
- Fresh local navigation observes zero pre-input layout shift at all four widths; LCP observations are 468/164/212/212ms. This uses a warm local server and is not field INP/CLS, real-device or universal 60fps evidence.
- Equivalent screenshots cover 5.0/5.1/5.2 initial, AI, Focus and return at 1440×1050 and 390×900. Timestamp-preserving H.264 clips of 5.2 were fully decoded successfully. All visual judgments remain for the founder.
- Diff/whitespace and source secret-signature checks pass. The full test suite remains FAIL on known baseline debt, not a blanket quality PASS.

Exact source delta:
- components/experience-lab/experience-lab.tsx
- components/experience-lab/experience-lab.module.css
- lib/experience-lab/motion.ts
- lib/experience-lab/space.ts
- tests/experience-lab-motion.test.ts
- docs/experience-lab.md

Evidence is local and ignored at `.bts-engineering/lab-52/evidence`, including equivalent 5.0/5.1/5.2 captures at 1440×1050 and 390×900, real browser recordings, and preservation hashes. Founder approval of feel remains open. Real iOS, physical-device GPU and actual screenreader use remain unverified. Technical checks do not prove subjective enjoyment.

Review: http://127.0.0.1:3420/en/experience-lab. No push, merge, deployment, analytics activation, database or external configuration changes occur. Rollback is returning to the unchanged 5.0 worktree; a later revert of the single local 5.2 commit removes this delta without a data/configuration rollback. Never reset another worktree.

---

## Archived 5.0 report

# Experience Lab 5.0 â€” Cinematic Discovery

This is a local, isolated visual experiment based on Lab 4.0 (`daf9d17c1ddaf63789949b8f58a8acb98ce41d3b`). It changes no public homepage, real search, content records, assessment, authentication, analytics, Supabase, or provider configuration. No push or deployment is part of this task.

## Visual-first process and the three studies

The initial split-hero Atlas and three-card Gallery drafts were rejected before motion integration: they retained too much of an ordinary website/carousel. The second static pass separates a non-interactive environmental artwork from native caption targets. Three identical 1440Ã—1050 and 390Ã—900 captures and an explicit critique were completed with the scene controller disabled. That temporary study flag was then removed.

- **Cinematic Atlas:** a full-bleed, type-specific content world, large actual selected title, quiet introduction, off-center search, and two evidence-based margin pathways. Image and title lead on mobile; search is still in the first viewport.
- **Living Editorial:** a large serif content headline, offset image field, real portrait/dance-source diptych and image-led margin stories. Mobile deliberately puts search before the editorial work.
- **Liquid Spatial Gallery:** one angled exhibition work, an optical rim, a backing surface and a low-perspective floor. It is not an orbit of three rectangular cards. Mobile keeps one layered work beneath search.

Atlas is the provisional implementation foundation because it makes the strongest compositional break while keeping content and search understandable. Editorial favors slower reading; Gallery risks letting its exhibit frame dominate the content. None is a subjective winner established by automated tests. Founder creative approval remains open.

The other two studies remain functional through the native concept selector. They share catalog, state and search but use distinct compositions; their endpoints snap rather than adopting Atlas's full flight choreography. Concept names are design names; all functional controls retain the existing seven-locale copy. Selection remains in page memory and is not stored or sent anywhere.

## Authentic visual sources

Existing local tool illustrations are identified here as illustrations, not portraits or testimonials. The actual Spotlight cover supplies two crops of its approved portrait/dance photography. Its limited source resolution constrains large portrait quality. No suitable verified project screenshot was available, so original CSS ribbon geometry accompanies the actual project wordmark; it does not pretend to be a product screenshot.

Writing uses original paper/quotation geometry with actual catalog topics. Demonstration concepts keep their existing labels and have no published destination. EchoWall uses original type and echo geometry rather than fabricated contributions.

`public/images/experience-lab/world-atlas.svg` is a static, 81,660-byte cartographic artwork derived from the already installed `world-atlas/land-110m.json`, generated locally with existing tools. Its embedded ISC attribution to Michael Bostock is retained. It contains no markers, claimed content locations, scripts or external references. No cartographic library or new dependency is added to the client. All named content, people, destinations and relationships still come from the existing catalog.

## Search, composition and Focus contracts

The Lab search engine, catalog, synonyms, ranking, AND matching, publication checks and real Production search are unchanged. The scene is composed from the actual matches, selected item, content type and genuine shared topics, not from hardcoded query responses. Writing, people and map selections change the environment and headline placement. Only actually related matches receive contextual captions; unrelated matches retain ordinary selection labels.

All eleven identity wrappers remain mounted. At most six ranked matches occupy the current scene window. Native complete-list disclosure and previous/next/Home/End navigation preserve access to every result. Spatial role priority does not mutate result ranking or the complete-list order. Categories have real counts, retain empty states and use native disclosure semantics.

The selected caption and its artwork remain the same identities through Focus. Focus occupies the existing world rather than a modal or adjacent generic panel. Existing source, explanation, valid public action and genuine related-content controls remain intact. Demonstration concepts never acquire a public link.

On compact screens, the existing in-flow related controls replace duplicate spatial related captions; this prevents overlap and an artificial reading gap. Desktop retains spatial contextual targets. Entering Focus reveals the start of the scene at every width; Escape/Back restores the actual selected caption and query, while Refine returns to search. The full H1 remains in the accessibility tree during Focus.

Atlas motion is finite, interruptible and driven by input, selection, filters, Focus and native dragging/swiping. Reduced motion snaps to stable endpoints. There are no ambient loops, loading choreography, scroll reveals or delayed content entrances. Scene measurement is batched on scene/resize changes. Caption dimensions are retained across role changes so a newly enlarged headline cannot jump into another caption before its flight. Artwork offsets share the same sampled coordinates; no geometry is measured during animation frames. The selected initial illustration loads eagerly; unselected image loading remains lazy.

## Local verification

Commands use existing dependencies and process-only local configuration with Supabase credentials/URLs absent. No live data or private credentials are used. Browser evidence uses installed desktop Chrome through the existing cached Playwright runtime; it is not real iOS Safari coverage. Synthetic queries are the only input data.

- `npm run typecheck`
- `npm run lint` (the same three unrelated warnings; no errors)
- `tsx --test tests/experience-lab.test.tsx tests/experience-lab-motion.test.ts tests/experience-lab-focus.test.tsx tests/cloudflare-web-analytics.test.ts tests/share-url-security.test.ts tests/home-view.test.ts` â€” 54 pass, zero fail
- `tsx --test 'tests/*.test.ts' 'tests/*.test.tsx'` â€” 1,152 tests: 1,141 pass, eleven fail
- `npm run build`
- `npm run build -- --webpack`
- `git diff --check`

The eleven normalized failing test identities match the unchanged Lab 4.0 baseline exactly. Existing debt concerns runner/tracking fixtures, older context-card link contracts, provider checksum/Self characterization, a missing ignored brand-rename module and four absent Writing-promotion artifacts, plus a Comments timing assertion. No test is skipped, weakened or disabled. This is not a full-suite PASS. Four new tests cover three-direction identity/ranking preservation across locales, adaptation to unfamiliar content IDs, artwork/frame synchronization, and interrupted headline-size continuity.

Browser and performance results are recorded alongside scripts, source-baseline preservation hashes and real screenshots/videos in the ignored local evidence directory `.bts-engineering/lab-5/evidence` in the main checkout. The initial static critique and captures are kept separately from final optimized-build captures. Evidence is intentionally not committed as source.

Final optimized-build browser coverage passes:

- Nine query/cardinality states Ã— seven locales Ã— 320/390/768/1440px; no horizontal overflow or caption/search/empty-state overlap.
- Focus, real related destinations and return Ã— seven locales Ã— four widths Ã— normal/reduced motion. The heading is visible on entry; compact related controls remain in the reading flow.
- Both retained alternatives Ã— seven locales Ã— four widths Ã— three query states and public Focus actions.
- Keyboard and visible return focus at 320/1440px with both motion preferences; native category/list disclosures, filters, refinement, reset and all eleven results.
- Axe WCAG A/AA/2.1 AA: zero violations in the Lab scope for Explore, Focus and empty at 320/1440px. This is not a full assistive-technology certification.
- Native CDP touch swipe at 390px and native mouse drag at 1440px; interruption, identity retention, real/demo destination boundaries and finite idle behavior.
- Animated frame sampling at 390/1440px: no solid-caption or search collisions; model connector-boundary error below 0.014px; all eleven identity wrappers retained and zero idle style/path mutations.
- Public-app smoke: seven home locales, Discover/Explore, global Ctrl+K search, Writing, tools, World Map, EchoWall, privacy and canonical metadata. Network harnesses record/reject unexpected external origins and non-GET/HEAD requests; none occur.
- Local Production-mode simulation: seven Lab routes return 404/private/no-store/noindex; public home remains HTTP 200. With Writing unavailable, the sitemap returns HTTP 500, never a partial HTTP 200. No live Production request or mutation is used as proof.
- Matching Lab 4.0/5.0 before/after captures and final three-concept sheets at 1440Ã—1050 / 390Ã—900. Actual browser screencasts are H.264, 10.00s desktop and 9.67s mobile, validated by complete decoding.

Quiet paired Webpack measurements use three fresh browser contexts per version at 1440px and 390px, identical synthetic input/Focus sequences, and explicit assertions that search really updates the result set. They are local observations without CPU/network throttling, not a performance ranking of the designs:

| Observation | Lab 4.0 | Lab 5.0 |
| --- | --- | --- |
| Synthetic input to two frames, desktop | 19.9–43.7ms | 22.0–33.8ms |
| Synthetic input to two frames, mobile viewport | 19.9–52.7ms | 17.9–34.8ms |
| Worst trial frame p95, desktop / mobile | 33.2 / 33.4ms | 16.8 / 16.8ms |
| Worst frame, desktop / mobile | 66.7 / 66.6ms | 50.1 / 33.4ms |
| Observed long tasks | 0 | 0 |
| Loaded JS / CSS bodies | 419,885 / 44,357 bytes | 420,050 / 43,843 bytes |
| Loaded image bodies, desktop / mobile | 121,480 / 110,926 bytes | 118,820 / 75,152 bytes |
| Median trace style work, desktop / mobile | 0.218 / 0.194s | 0.338 / 0.415s |
| Median trace layout work, desktop / mobile | 0.033 / 0.037s | 0.059 / 0.075s |

These traces expose a real trade-off: synchronized environmental/caption styles increase style and layout work over the roughly three-second sequence even though sampled responsiveness and resource transfer remain bounded. One desktop frame reached 50.1ms. No claim of universal 60fps or field INP follows from this sample. Input-driven layout-shift entries are preserved in the traces; script-dispatched input does not carry reliable recent-input flags, so those entries are not presented as field CLS.

Separate fresh-navigation checks at 320/390/768/1440px observe zero pre-input layout shift and local LCP observations of 476/272/212/476ms. These use a warm local server and are not a cold CDN/mobile-network or real-device benchmark.

The first unprivileged Webpack invocation failed with Windows EPERM while creating a generated `.next` directory. No source/configuration workaround was introduced; the authorized local build was retried with expanded filesystem access.

## Scope and limitations

Founder gates A (static art direction), B (interaction enjoyment) and C (perceived search intelligence) remain open for actual founder review. Automated testing proves behavior within its coverage, not emotional appeal. Existing illustration style, limited portrait resolution and the reading length of Focus remain design-review topics.

Real mobile GPU behavior, real iOS Safari, assistive-technology user testing and protected hosted Preview acceptance are NOT VERIFIED. Local frame timing is not field INP or a universal 60fps claim. Layout-shift entries observed after script-dispatched input are not reported as field CLS. Local empty/unavailable Writing or sitemap behavior is not Production publication/withdrawal evidence.

## Exact source delta from Lab 4.0

- components/experience-lab/experience-lab.module.css
- components/experience-lab/experience-lab.tsx
- components/experience-lab/island-visual.tsx
- lib/experience-lab/motion.ts
- lib/experience-lab/space.ts
- public/images/experience-lab/world-atlas.svg
- tests/experience-lab-focus.test.tsx
- tests/experience-lab-motion.test.ts
- docs/experience-lab.md

## Review and rollback

Local review: http://127.0.0.1:3400/en/experience-lab. All existing locale prefixes work. Choose all three concepts using the top selector. Compare with the preserved Lab 4.0 checkout/server at port 3390 using the same viewport/query and motion setting. Use AI, Karriere, People, Community and World Map, then Focus, Refine, Back, keyboard and the complete list. Evaluate static quality before judging motion.

A later protected Preview requires separate push/deployment approval and fresh branch/project/configuration verification. Production continues to return 404 for the Lab and remains outside this experiment's release scope. To abandon the experiment, use the unchanged Lab 4.0 worktree. A future revert of the single Lab 5.0 commit removes only this local source delta; no data, provider, credential or environment rollback is required. Do not reset or overwrite another worktree.
