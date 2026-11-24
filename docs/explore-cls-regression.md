# Streamed loading and saved Explore CLS

The failed ffdd Preview painted its loading boundary at 60svh (506.39px at
320×844), with the footer already visible. When the complete Explore tree
replaced it, that footer left the viewport: CLS0.38170171800947866.

Direct protected-browser inspection found no `data-navigation-loading` guard in
the deployed CSSOM. The checked-in global stylesheet, unchanged in this respect
since85d340e, and fresh local Turbopack/Webpack builds contain the100svh reserve.
Neither the persisted native radio bootstrap nor font loading accounts for the
measured initial506px boundary. The reason the hosted artifact omits these
checked-in rules remains unverified; do not attribute it to a specific optimizer,
build cache or source commit without further evidence.

A GET-only test-browser counterfactual added only the existing100svh reserve to
that hosted loading element. Three reloads measured CLS0 with the footer still
visible (outside the first viewport). No deployed source or settings changed.

The correction puts that same viewport reserve in `app/loading.tsx` as an inline
minimum height and removes its contradictory60svh utility. It is intrinsic
initial-stream geometry, not a fixed content height, delayed transition, opacity
mask or manual scroll adjustment. The fallback disappears with the actual page;
settled content and footer spacing are unchanged. Global guards remain compatible
but are no longer required to establish the fallback's minimum height.

`tests/loading-layout.test.tsx` verifies seven-locale accessible server markup
without a stylesheet. `scripts/verify-explore-cls.mjs` uses an existing Playwright
installation and loopback production server. It measures actual session-window
CLS for20 reloads320px,10 at390px,10 at1440px, short viewports and seven locales.
Each reload must beHTTP200, CLS≤0.1, no horizontal overflow, preserved Explore
selection and footer after main. `BTS_SIMULATE_MISSING_GUARDS=true` removes exactly
the two old global loading guards in the test browser, leaving assertions intact.
It never modifies a server or accepts a remote target.

Run with `BTS_TEST_ORIGIN`, `BTS_BROWSER_MODULE`, `BTS_CHROME_PATH` and
`BTS_EVIDENCE_DIR` set to the isolated local environment; no backend credentials
are needed. Geometry checks intentionally use unavailable optional Writing data.
Normal-motion/keyboard/resize checks are additional to the reduced-motion reload
matrix. Do not confuse test-browser CSS counterfactuals with a hosted candidate
retest. A separately approved protected Preview of the new commit must repeat
the unchanged reload gate and inspect actual delivered initial markup/CSS.

The correction is deliberately not an unconditional release claim: the first
local matrix passed the required20/10/10 reloads at320/390/1440 but a subsequent
320×568 native-scroll-restoration case exceeded0.1. A stress run without both
global guards also failed that short-viewport condition. A serial repeat did
not reproduce the CLS excursion, but found Spanish Explore overflow. Retain
these failures: neither a later passing probe nor the primary viewport fix
waives them. The new runner collects every failed assertion before exiting
nonzero, so a failure does not silently omit the remaining locale coverage.
The intermittent second loading phase is not attributed to fonts, React,
prefetch or a build cache without further evidence. Overall local acceptance
remains FAIL while any such result is unresolved; protected acceptance and
Production remain NO-GO, even if a review-only correction commit is preserved.
The complete final50-reload matrix measured CLS0–0.0678, with zero in the
20/10/10 main viewport cases; ES/RU overflow assertions still failed. Identical
320px overflow was measured on unchanged ffdd and this correction (ES336px,
RU354px scroll width), so it is existing behavior rather than an effect of the
loading height change. It is documented here, not redesigned in this task.

Production remains NO-GO pending that hosted retest and the existing independent
backup/recovery, Writing-provider and owner/legal gates. Roll back a future
Preview only through a separately approved exact deployment; no main reset,
force-push, environment change or backend workaround is part of this correction.
