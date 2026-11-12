# Experience Lab 3.5 A · Premium Spatial Glass

Isolated design experiment based on approved Lab 3.0 b602fed5e030fbbc077f31e8e575ea8810362aea. Branch: codex/btshq-lab-35-spatial-glass. The other experiment and Lab 3.0 remain independent; there is no remote push or deployment.

## Art direction

A uses a centered, spacious headline and a constellation of larger, materially distinct objects: a curved project prism, geographic orb, portrait arch, circular reflection instrument, folded editorial leaf and community droplet. The selected object expands on the left; its explanation is free typography on the right.

The old generic detail rectangle and duplicate decorative emblem are removed. Other identity slots remain mounted but retire from interaction during Focus. The full results list, previous/next controls and related matching choices remain available. Back, Escape, refinement, query and category retention use the existing state contracts.

## Assets and evidence

The existing public Evgeny Vinokurov cover is the only real named portrait. CSS crops the approved portrait area without inventing a person or extending a photograph. Its original 94,790-byte JPEG is served directly so the face is not first reduced with the whole 16:9 composite. The face inside that source is approximately 254px wide; source resolution still limits large Focus presentation. No AI enhancement or external image is used.

Career retains its existing repository illustration. The remaining visual motifs are existing/original CSS and SVG diagrams, not screenshots of invented products or published articles.

GOATRECRUTAINER retains the actual project name. The map is schematic; EchoWall has no invented contributions. Three demo concepts remain labelled and cannot open a published article. Public destinations, descriptions, IDs, ranking, synonyms and normalized topic evidence are unchanged.

## Spatial and focus behavior

Scene heights and deterministic desktop/compact positions are declared together in space.ts and exposed as CSS variables. Compact composition is deliberate, not desktop scaling.

The choreography planner and index are unchanged. The motion controller retains shared object/connector coordinates. It rebases remembered positions in document space when the introduction becomes visually hidden, preventing a root-layout jump from teleporting the selected object or search. Reduced motion remains immediate.

One visibility check after explicit focus and another at motion completion keep a selected keyboard island in view. These are bounded layout reads, not a per-frame measurement loop or a timer that delays input. No unrelated element is refocused. Observers, pending frames and media listeners retain their cleanup behavior.

The introduction's H1 remains available to assistive technology in Focus. The detail is an inline labelled section without modal semantics or a trap. Its first actions provide Back and Refine. Search/category controls remain native and labelled in all seven locales.

Returning the welcome heading is coordinated with search clearance through a finite opacity transition. It delays only that secondary heading, never search, results or actions. Reduced motion skips it.

## Local quality evidence

45 focused tests pass. The full suite has 1,143 tests: 1,132 pass and the same eleven failing identities occur on the preserved 3.0 baseline. No test is disabled. TypeScript and both build paths pass. ESLint has no errors and three existing warnings.

The browser gate covers seven locales, 320/390/768/1440px, nine query/cardinality states, Focus/return in normal and reduced motion, native mouse/touch gestures, keyboard entry/return, search refinement, filters, reset, the complete result list and noindex. Scoped Axe checks cover Explore, Focus and empty states. Real browser frame sampling checks stable identity, shared connector geometry and finite idle behavior. These checks do not establish subjective founder acceptance or universal device performance.

## Changed source inventory

Six final paired local samples (three at each of 390px and 1440px) measured 17.3–36.4ms input-to-two-render-frame intervals, p95 frame intervals around 16.8ms and a 33.4ms maximum. An earlier A sample reached 66.7ms; its cause is not established. JavaScript resource bodies add 281 bytes versus 3.0; CSS bodies are 216 bytes smaller. Cold image bodies add 82,434 bytes, primarily for the original portrait composite.

No long tasks were observed in the final samples. These are local Chrome observations, not guaranteed 60fps, hardware-mobile results or field-performance claims. Programmatically dispatched input in the timing trace does not supply reliable recent-user-input flags, so its layout-shift entries are not reported as field CLS. Runtime browser checks observed no unexpected external requests. The local Production-mode HTTP gate returns 404/no-store for all seven Lab routes while the normal homepage returns 200.

- components/experience-lab/experience-lab.tsx
- components/experience-lab/experience-lab.module.css
- components/experience-lab/focus-surface.tsx
- components/experience-lab/island-visual.tsx
- lib/experience-lab/space.ts
- lib/experience-lab/motion.ts
- tests/experience-lab.test.tsx
- tests/experience-lab-motion.test.ts
- docs/experience-lab.md

## Isolation and review

Production 404, noindex and sitemap exclusion remain unchanged. Homepage, global navigation, live search, auth, assessments, Writing readers, databases, analytics and provider configuration are untouched. Search input remains local memory.

Validation outputs, matching browser captures and actual interaction recordings are outside Git in .bts-engineering/lab-35-a/evidence and lab-35-review. Known baseline full-suite failures are reported separately; they are not disabled or repaired by this art-direction experiment. Real iOS Safari, actual screenreader use, hosted Preview and founder Human Experience acceptance remain separate checks.

Rollback is local: return to the preserved 3.0 branch/worktree, or revert this experiment's single commit if it is later selected. No database or provider rollback is required. Protected Preview publication requires separate authorization.
