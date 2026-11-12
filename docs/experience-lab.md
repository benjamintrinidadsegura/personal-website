# Human Liquid Universe — consolidated Experience Lab

Base: Lab 6.1 Natural Color, `2613faa44a561adbf61967bc8b29d79ad205f5db`.
Branch: `codex/btshq-human-liquid-universe`.
Worktree: `.bts-engineering/human-liquid/checkout`.
Local review: http://127.0.0.1:3480/en/experience-lab.

## One visual language

The navy reading field and attached ice-blue material borrow their editorial contrast from 6.1 B. Distinct content silhouettes and genuine topic connections borrow their discovery purpose from 6.1 C. This is an authored composition, not concatenated CSS. The existing static identity studies remain at the identity route for comparison.

Desktop has one natural image-led work, two supporting works and three quiet text pathways. Mobile has a separate composition: selected work above the central search, two supporting works below it, further matches through the native list and previous/next/Home/End navigation. There is no orbit, random collage, decorative ribbon or grid of uniform cards.

All content imagery uses existing local assets without recoloring, image filters or blend modes. Evgeny is a single crop of the approved Spotlight photograph; source resolution limits its size/quality. Tool illustrations remain actual illustrations. World Map retains the existing attributed atlas. GOATRECRUTAINER uses original typography rather than an invented product screenshot. Writing demonstration concepts retain their demo labels and have no published destination.

Only the search lens has a bounded 6px backdrop treatment, layered edge light and material contrast, with an opaque unsupported-browser fallback. No new dependency, ambient animation or full-scene blur is introduced.

## Functional contracts

Git blobs are identical to Lab 5.2 `a13d69ffc721c286658afc609296095cbd124f79` for `lib/experience-lab/search.ts`, `data/experience-lab/catalog.ts`, `lib/experience-lab/context.ts`, `lib/experience-lab/choreography.ts`, `data/experience-lab/copy.ts` and `data/experience-lab/focus-copy.ts`.

Ranking, synonyms, categories, seven-locale copy, validation, real destinations and actual shared-topic relationships are unchanged. Selection changes a visual role, not the ranked list. All eleven identity wrappers stay mounted. Complete-list disclosure and sequential navigation retain access to every match. Only genuine shared topics receive connection labels. Search terms stay in page memory; no added persistence, server request, query logging or external service.

The lens is geometrically centered in the fixed primary core scene (minimum 780px desktop / 660px compact), not the changing Focus reading height or a sticky viewport toolbar. Queries, filters, Focus, return and reset retain that anchor. Longer Focus reading may scroll beneath it.

Focus retains the selected artwork/title, removes its duplicate interactive button from the accessibility tree, and supplies a real H2 and reading links. Context and related destinations use an initially collapsed localized native disclosure. Mobile Back/Refine controls sit in the light reading flow, avoiding long labels over the portrait. Keyboard return uses an inline title underline, never a large rectangular frame. Transparent native-button hit areas include the actual artwork, without adding a visible container or a second interactive element. Supporting captions use CSS flow rather than a post-hydration measured offset, avoiding the initial context-line layout shift.

The finite interruptible controller is adapted to normalized scene dimensions. It selectively uses already exercised controller-family geometry refinements from the later functional lab work (title-size continuity and measured controls), without importing that lab's rejected visual layout. Geometry is read on scene/size changes, not each frame. Existing choreography responds immediately, within 340ms; initial/reduced-motion states settle instantly. Retiring nodes keep their presentation-only silhouette during fade, without changing search membership. No frame loop runs while idle.

## Verification and evidence

Scripts, logs, actual captures, timestamped browser screencasts and preservation evidence are ignored local artifacts at `.bts-engineering/human-liquid/evidence`, outside committed source.

- TypeScript passes. ESLint has zero errors and three unchanged unrelated warnings.
- Focused Lab/static-identity/sharing/home-mode/analytics regressions: 67 pass, zero fail/skip/todo.
- Full suite: 1,165 tests, 1,154 pass, eleven fail. Their normalized identities exactly match a fresh unchanged-6.1 run (1,159 tests, 1,148 pass, eleven fail). This remains a full-suite FAIL on baseline debt; no tests are suppressed or weakened.
- Both production build commands pass; their final logs are `turbopack.log` and `webpack.log`. A Windows EPERM output-directory error required the same local Webpack build to be retried with appropriate filesystem rights; no configuration workaround was introduced.
- Seven locales at 320/390/768/1440px cover zero through six visible matches, Focus, return, reset and all results. Core search midpoint tolerance is 1px horizontal / 2px vertical, with no horizontal overflow or caption/control collisions in sampled states.
- Normal/reduced-motion keyboard, native CDP touch, mouse drag, rapid search interruption, filters, native disclosures and real/demo URL boundaries are exercised. Frame sampling checks connector endpoints, retained identities, search clearance and finite idle behavior.
- Scoped Axe covers Explore/Focus/empty at 320/1440px. Additional pixel/background contrast sampling covers seven locales; it identified mobile headings/toolbar issues missed by Axe and informed targeted corrections.
- Public-app smoke covers seven home locales, Discover/Explore, global search, Writing unavailable, tools, World Map, EchoWall, privacy and canonical metadata. Instrumented journeys record/reject unexpected external origins and non-GET/HEAD requests; none were observed in the instrumented journeys.
- Local Production-mode simulation retains seven Lab 404/private/no-store/noindex responses. Ordinary home remains successful; unavailable Writing makes sitemap fail deliberately instead of emitting partial URLs.
- Matching 1440x1050 / 390x900 captures compare 6.1 B, 6.1 C, 5.2 and this prototype; search, Focus and reduced-motion captures compare functional implementations. Actual browser recordings preserve frame timing.

## Exact source inventory

- `components/experience-lab/experience-lab.tsx`
- `components/experience-lab/experience-lab.module.css`
- `components/experience-lab/focus-surface.tsx`
- `components/experience-lab/island-visual.tsx`
- `lib/experience-lab/space.ts`
- `lib/experience-lab/motion.ts`
- `tests/experience-lab-focus.test.tsx`
- `tests/experience-lab-motion.test.ts`
- `docs/experience-lab.md`

## Measured performance and accessibility limits

Three paired local traces per implementation at 1440 and 390px use fresh Chrome contexts against warm optimized servers. In all twelve traces the p95 frame interval is 16.8ms and no main-thread long task is observed. The candidate still has an isolated 66.6ms mobile frame (desktop maximum 33.3ms); these results are not a universal 60fps or real-device claim. Synthetic input to two animation frames is 17.2–33.8ms desktop / 18.7–33.7ms compact, not field INP. The observed median script time is 111.1/106.2ms across each roughly three-second desktop/compact journey, versus 93.3/101.3ms on 5.2; style time is lower at 144.0/110.6ms versus 277.7/310.4ms. Small three-run samples do not establish causation or statistical performance guarantees.

Fresh-browser pre-input layout shift is 0 at all four sizes after correcting the context-line offset; local LCP observations are 724/468/192/472ms at 320/390/768/1440px. This is a warm local server/image cache, not a cold mobile network. The initial post-hydration 0.00035 context-line shift was reproduced, traced to measured title height and removed with CSS flow.

Resource observations for the tested trace show 420,285 encoded JS bytes / 42,001 CSS bytes, versus 420,507 / 44,079 on 5.2. The img-initiated encoded resource subset is 58,729 bytes desktop / 47,385 compact versus 118,835 / 75,167. These are the sampled resource subset, not a complete site-transfer budget. Existing image sizes hints were tightened to the actual artwork size.

Axe reports zero scoped WCAG A/AA/2.1 AA violations in six Explore/Focus/empty cases. Supplemental 56-state pixel/background sampling across seven locales measures 1,907 text runs with minimum ratio 5.37:1 and no sampled contrast failure. 165 hidden/antialiased text fragments, punctuation or small numbers were not reliably measurable with that method; this is not complete contrast certification. All seven locales at all four widths pass native Focus-control/portrait clearance. Native upper-artwork mouse/touch selection and animated artwork/search clearance also pass at all four widths.

Actual timestamp-preserving H.264 clips and fully decoded originals are `human-liquid-1440.mp4` and `human-liquid-390.mp4`. `comparison-1440.png` / `comparison-390.png` show matched 6.1 B, 6.1 C, 5.2 and consolidated initial views; `states-1440.png` / `states-390.png` compare 5.2 and this prototype in initial, AI search, Evgeny Focus and reduced-motion states. Individual full-size captures remain alongside the sheets. Founder visual/interaction review is still required.

## Limits and release boundary

The public homepage, content, dependencies, provider configuration, analytics, authentication and assessments are unchanged. Production 404/noindex protection remains. No remote push or deployment occurs.

A desktop Chrome viewport is not real iOS Safari, physical-device GPU, field INP/CLS, full screenreader or Founder Experience PASS. Performance observations retain their actual local sample limits. The existing Next streamed shell's JavaScript-disabled limitation is not redesigned here. Local Writing/Supabase is intentionally unavailable; smoke checks do not establish new Production reliability.

All 23 pre-existing worktrees, 37 original branch refs and byte hashes of 64 pre-existing dirty/untracked source files are checked against the pre-task snapshot, including the original .codex/config.toml. Build/media/diagnostic artifacts stay outside the commit.

Preview readiness requires separately authorized protected deployment. Founder judgment of quality and enjoyment remains open; Production remains guarded off. Local rollback is using the unchanged 6.1/5.2 worktree, or later reverting the single isolated prototype commit. No data/configuration rollback is necessary. Never reset another worktree.
