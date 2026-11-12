# Experience Lab 3.0 · Magic Interaction

Local isolated development starts at the approved Lab 2.5 commit 33d9e5a1cf2130a7c0f51c07fedbab112fd90f39. Lab 2.5 and the preserved 2.0 reference 3319e2711be27922a08685d1553679effbb6ee80 remain unchanged. No remote push, deployment, provider configuration, database change or analytics activation belongs to this iteration.

## Content worlds

The same eleven-record adapter and search engine are unchanged. Eight records lead to existing public BTSHQ destinations; three demo concepts remain explicitly labelled and have no article URL. No live published article is inferred.

The visual layer interprets these references differently: GOATRECRUTAINER uses its actual name and GR monogram rather than a fabricated product screenshot. The published Spotlight cover supplies the portrait through a CSS crop. The globe is a schematic diagram, not a claim about new geographic connections. Tool diagrams distinguish reflection and relationship concepts; Career reuses the existing repository context image. Editorial fragments use light material and serif type. EchoWall uses a typographic speech motif without invented contributions or quotes.

There are no new external images, assets from third-party sites, or fixture records in a database.

## Spatial system

Deterministic compositions cover zero, one, two, three/four and five-plus matches. Six objects are visible at most. Category counts reflect the current query before category refinement. Selection, resetting and every canonical destination retain the previous contracts. Activating an already selected object focuses its full detail section.

Single matches grow through uniform transform scaling rather than a sudden CSS width/height change. The search lens stays anchored while room height adapts to the result count. The compact scene uses its own coordinates and content dimensions, not a scaled desktop canvas. The full layout requires a viewport of at least 1200px.

The native disclosure at the top offers every actual match as a ranked text list. Its buttons select the matching detail directly and focus the detail section. Spatial DOM identity and Tab order remain stable; arrow controls follow result rank and expose every window. Keyboard destinations settle before focus. A bounded render-frame check waits for actual browser visibility after inert changes, then focuses the active control. Pointer/touch dragging works on the room and its objects; dragging suppresses the follow-up click. Vertical touch scrolling remains native.

## Material and atmosphere

The palette remains navy, ocean blue, cyan and ice. The main backdrop-filter belongs to the search lens. Other objects use opaque fallback materials, translucent gradients, edge reflections, and depth-aware shadows without a blur layer on every node. Stronger query relevance influences the subtle edge and connection treatment. Selection highlights the material and its relation to search; the local light follows the selected object. Search focus produces a finite light response.

There is no pointer-tracking background, autoplay, heavy rendering engine or infinite animation.

## Focus and Explore

Explore preserves the existing authoritative search, normalization, synonyms, ranking and category behavior. An island, the complete result list or the explicit Focus action opens an inline detail surface, not a modal. It keeps the query and filter, promotes the selected island and places the remaining window in a quiet satellite row. The search lens and its connection origins move in the same finite coordinate system. Compact screens use their own composition; focusing the detail uses native intentional focus scrolling. Refine search returns directly to the retained input. Back and Escape restore the island without skipping the return choreography. Arrow navigation settles keyboard destinations immediately for reliable focus.

Context explanations use only matchedTopics returned by the unchanged index. If the match has no topic evidence, the surface makes a neutral current-search association rather than claiming a precise topic match. With an empty query it identifies the curated demo catalog. Related choices are limited to actual current results with normalized shared topics; choosing one preserves the query. No endorsement, collaboration or semantic inference is added.

The focus surface uses solid layered materials and highlights, not an additional backdrop-filter. Decorative motifs remain the approved images and existing diagrams. Focus has no trap, and no animation must finish before a detail action is usable. All focus controls and explanation labels exist in seven locales.

## Continuous motion

All eleven object wrappers and their paths retain stable keys through query changes. Unmatched objects become inert and aria-hidden immediately while fading out. Newly matched objects enter without delaying search results.

A small finite requestAnimationFrame controller writes both object transforms and SVG edge endpoints from one coordinate map. Object/lens dimensions are read together on intent changes and resize, never in the drawing loop. Connections meet the rotated/scaled ellipse boundary model. New input cancels the previous frame request and starts from the last actual position. There are no React state updates per animation frame. Resize observers and media listeners are cleaned up.

The pure choreography planner scores a bounded set of deterministic routes once per intent, considering surface dimensions, room boundaries, the moving search envelope and already planned trajectories. Room-boundary penalties take priority over decorative detours. Corners are rounded. Exiting objects retire early. If crowded or interrupted trajectories cannot clear each other or the search, a surface briefly recedes rather than painting solid objects through one another or over the input. The existing top composition overhang fits within the reserved 28px scene margin. This is a bounded planner for the existing eleven-item catalog, not a general collision-free physics engine. Enlarging the catalog or changing object sizes requires renewed trajectory checks.

The initial hydrated scene keeps the server-rendered positions rather than hiding the objects to replay an entry effect. Reduced motion settles immediately without scheduled animation. Touch dragging updates object and line positions together; release returns them to the bounded composition.

## Boundaries and verification

The existing Production HTTP 404 guard, noindex metadata, sitemap exclusion and lack of public navigation entries remain intact. Homepage, global search, World Map, EchoWall, assessments, auth, publication readers, privacy and external configuration are unchanged. Search terms remain local component state and are neither persisted nor serialized into URLs.

Tests cover scene reachability, relevance, all seven locales, inert exit behavior, interruption continuity, dragging, reduced motion, finite idle behavior and publication/destination boundaries. Browser evidence includes real animated frame sampling and an actual interaction recording; static screenshots alone do not establish motion quality. Local timings and frame intervals include browser/driver overhead and are not device or field-performance guarantees.

Evidence is intentionally outside Git at .bts-engineering/lab-3/evidence. The full-suite baseline's eleven failures remain separately documented. Existing streamed loading/footer layout shifts remain outside this isolated change. Real iOS Safari, actual screenreader use, hosted acceptance and subjective founder approval remain separate verification tasks.

The 2.5 reference has 38 focused passing tests and eleven known full-suite failures. The 3.0 gate adds focused evidence, focus-return and choreography regressions; exact final counts and command outputs are recorded with the local evidence. Browser checks cover seven locales, 320/390/768/1440px, pointer/touch manipulation, keyboard/list navigation, reduced motion and scoped Axe checks.

The previous 2.5 sample included one unexplained 250ms frame interval that did not reproduce in subsequent bounded trials. The 3.0 comparison uses paired local builds, in-page input events, frame intervals, long-task observation and Chrome timeline traces. Layout/style, script and paint evidence are separated from driver action waits. These are local observations, not field/device guarantees or universal 60fps claims. Actual animated frame sampling and recordings supplement screenshots.

Final local gate: 43 focused tests pass; the full suite has 1,141 tests, with 1,130 passing and the same eleven failing identities as 2.5. TypeScript, Turbopack and Webpack pass. ESLint has zero errors and three existing warnings. One initial Webpack attempt failed with a local output-directory EPERM; retry with workspace access passed without a configuration change.

Three paired timing trials at each of 390px and 1440px show 3.0 input-to-two-frame intervals of 17.2–33.5ms, p95 frame intervals around 16.8ms, and a maximum interval of 50.1ms (2.5 maximum: 50ms). No long tasks were observed in those sampling windows. Transferred JavaScript increases by 3,640 bytes and CSS by 1,174 bytes. The trace includes additional Focus/return work only in 3.0, so aggregate script/style/paint totals are not equal-work speed comparisons. GPU/compositor causation and the historical 250ms outlier remain unresolved.

Programmatically dispatched input creates misleading layout-shift entries without recent-user-input flags. A separate browser keyboard/pointer journey measured zero shift value outside recent-input windows at both widths; this is a bounded local observation, not a field CLS guarantee. Animated geometry sampling retains all eleven wrappers, verifies endpoints within 0.01px of the ellipse model, and finds no sampled solid-surface/search overlaps or room escapes. Browser acceptance also covers all eleven Focus compositions and complete seven-locale Focus/return/refine flows.

A later protected Preview needs explicit release authorization and its own verified SITE_URL. Do not reuse another branch alias or copy Production credentials. The scoped commit can be reverted without database or external-state rollback.
