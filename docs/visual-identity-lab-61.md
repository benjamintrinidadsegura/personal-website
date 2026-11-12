# Visual Identity Lab 6.1 - natural content color

Base: f09e4a5949a9d6c3cff41b1d75c0fe861de483eb, protected Lab 6.0 checkout.
Branch: codex/btshq-visual-identity-lab-61.
Worktree: G:/Development/personal-website/.bts-engineering/lab-61/checkout.

## Exact five-file delta

- components/visual-identity-lab/visual-identity-lab.module.css: remove grayscale, contrast/brightness image filters, luminosity/color/multiply blending and reduced image opacity. Remove the tool's colored overlay. B/C portraits have no image overlay. Keep A's spatial edge fade; add a local mobile heading scrim for long translations instead of recoloring/dimming the portrait. Bound A's desktop portrait to 520x600 CSS pixels to reduce excessive enlargement. Keep all three compositions, search position, materials, surrounding navy/blue palette and actual content destinations.
- components/visual-identity-lab/visual-identity-lab.tsx: review label 6.1 only.
- app/experience-lab/identity/page.tsx: metadata version label 6.1 only; guard unchanged.
- tests/visual-identity-lab.test.tsx: regression forbidding grayscale/desaturation, image-filter declarations and color blending in the study.
- docs/visual-identity-lab-61.md: this evidence/review record.

No approved bitmap, SVG, project branding, metadata adapter, homepage, search engine, motion controller, database, dependency or provider configuration is changed. Three approved source assets match the protected 6.0 checkout byte-for-byte (asset-integrity.json). No AI enhancement, invented photographic detail or resampling of the source files was introduced.

## Visual assessment

Natural skin/hair tones restore a more human portrait. The original multicolor tool illustration is recognizable again. Navy/ice surfaces and small cyan accents carry the site identity instead of a uniform blue image treatment. A retains intentional edge fading only; its mobile text scrim is spatially limited to copy. Original colors are visible elsewhere. B/C portrait interiors and tool imagery render without image filters, blend modes, tint overlays or opacity reduction.

B remains my recommendation for the next founder comparison because of its editorial hierarchy and surrounding material contrast. A is still limited by the approximately 254x258 portrait crop within the approved composite JPEG; bounding enlargement does not create new detail. C now exposes the genuine difference between photography and illustration. Any final content-image curation and subjective art-direction acceptance remain founder decisions. No Human Experience PASS is asserted.

## Validation

- TypeScript: PASS; explicit typecheck and the optimized build's TypeScript phase.
- ESLint: PASS, zero errors and three existing unrelated warnings.
- Focused Lab/privacy/sharing regressions: 31/31 PASS, no skipped/todo tests.
- Default Turbopack Production build: PASS. An early invocation before dependency copying finished and an intermediate malformed CSS selector failed locally; both were corrected before final validation. No build/configuration workaround or dependency installation was used.
- Chrome geometry: all three variants x seven locales x 320/390/768/1440 CSS pixels; centered lens, no horizontal overflow or text/search collisions.
- Native keyboard direction navigation, Back and visible bounded focus: PASS at 390/1440px. No new idle mutations or unexpected external/non-GET requests in covered cases.
- Axe study scope: zero automated A/AA/2.1 AA violations. Complex background contrast still requires manual checking.
- Rendered-background contrast: 42 actual language/direction/viewport combinations, all sampled thresholds met. Minimum observed normal-text contrast 4.75:1; large text 7.12:1. This sampling is not a comprehensive accessibility certification.
- Computed style checks on every visible portrait/illustration/atlas image: filter none, mix-blend-mode normal, opacity 1. Zero scene animations.
- Image response bodies are unchanged in the sampled local browser: A/B 94,790 bytes, C 137,555 bytes at 390px and 152,457 bytes at 1440px. The same image optimizer URLs/sizes remain. No field loading, GPU, Safari or real-device performance claim follows.
- Source inventory, whitespace, secret signatures and before/after original-worktree preservation checked.

No full unrelated suite or second compiler path was required for this narrow image-treatment correction. Real iOS Safari/screenreader user testing and hosted Preview are NOT RUN. The inherited JavaScript-disabled Next.js hidden-streaming-shell limitation is unchanged and reproduces on the base; browser-review.json records it explicitly.

## Before/after evidence

Local evidence: G:/Development/personal-website/.bts-engineering/lab-61/evidence.

Matching actual browser images at 1440x1000 and 390x900: final-a/b/c-1440.png and final-a/b/c-390.png. Six comparison sheets: before-after-a/b/c-desktop.png and before-after-a/b/c-mobile.png. Left is unchanged Lab 6.0, right is Lab 6.1. The original 6.0 screenshots/worktree are preserved. These are browser renders, not generated mockups.

Live local comparison: http://127.0.0.1:3470/en/experience-lab/identity?direction=a (b/c for the others). Base remains at port 3460. The central search remains a labelled static representation; no adaptive search or new motion was integrated.

## Boundaries and rollback

All earlier worktrees/branches and unrelated source changes, especially the original .codex/config.toml, are preserved against the fresh snapshot. No push, merge, deployment, Production access/mutation, Supabase change or added dependency occurred.

To discard the refinement, use the unchanged 6.0 checkout/commit or later authorize reverting this single local refinement commit. Stop only the 3470 server if desired. No database, environment or provider rollback is required.
