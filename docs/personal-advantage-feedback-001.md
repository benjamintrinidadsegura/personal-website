# BTSHQ External Feedback #001

Final local quality and human-experience review, 2026-11-05.
Branch: `codex/personal-advantage-feedback-001`.
Base: `462ed61a5deaa9b199ece937824e051a51c768d4`. No commit or deployment.

## Download evidence and correction

The original result-to-export flow already waits for fonts, image decoding and
layout, paints a Canvas PNG, prepares a File, and invokes download/share from a
user action. Its existing seven-locale feedback already says that a download was
requested; it does not promise that the operating system saved it.

Baseline desktop Chromium and WebKit both saved readable 1080×1920 PNGs. The
external user's failure, especially on actual iOS Safari, is **not reproduced**.
The verified fault-injection defect is narrower: a synchronous failure in the
anchor click skipped cleanup, leaving one Blob URL allocated. Before: one URL,
zero cleanup callbacks; after: zero URLs after the existing 30-second grace.

The correction guarantees cleanup after activation failure, rejects unsupported
download anchors, validates the generated PNG header/dimensions, and sanitizes
filenames. Personal Advantage alone opts into an inline local-image fallback
with native image-menu guidance. Existing screenshot and native share paths stay
available. Images and synthetic assessment state stay in the local browser;
no upload, service or persistence format was added.

PNG header validation is a bounded guard, not a general PNG decoder. Browser
tests independently decode the complete exported files with Sharp.

## Closing questions and evidence integrity

All 65 primary questions remain. Context, enjoyment, social proof, overuse and
calibration measure different things and remain available.

The overlap is candidate-specific:

- `pair-interaction`: “How do they relate?” versus later `sequence`: “Which
  usually comes first?” and `replacement-test`: “Which loss would change how you
  operate more?” The current result model stores an interaction contribution,
  not an ordering or a component-loss interpretation.
- `outcome-check`: “Has that produced something concrete?” versus later
  `bridge-test`: “Have you created value specifically by bridging [the pair]?”
- A repeated identical archetype for the same candidate rechecks the same facet.

Only **unanswered** overlapping probes are omitted after earlier positive
relationship/outcome confirmation, or a settled answer to that exact facet.
Negative/uncertain relationship and outcome answers keep the later challenge.
Component-level primary preferences never substitute for combination evidence.
The convergent fixture goes from eight probes to seven. This is a conservative
shortening, not a promised reduction for every profile.

Every valid already-answered probe, including legacy results, retains its stable
ID and contribution. Resume reconciles IDs/options and finds the first unanswered
probe. Back changes can restore the omitted probe. Calibration, including its
veto, remains. A zero-candidate sparse assessment can now finish at the existing
cautious emerging result instead of being blocked by an empty calibration stage.

Scoring formulas, weights, confidence rules, contradictions and explanations were
not changed. Tests compare complete result maps for equal recorded evidence across
convergent, ambiguous, contradictory, sparse and empty profiles, answer prefixes
and calibration choices. This proves code contracts, not psychometric validity.

### Completed closing profiles

Counts below describe deterministic synthetic journeys with the stated response
policy, not a universal reduction. The initial plan can shrink as answers arrive.

| Profile / probe response policy | Original → new | Removed | Calibration and result |
| --- | --- | --- | --- |
| Strong, positive confirmations | 8 → 7 | `probe-7-systems-translation`, sequence after confirmed pair | Three calibration candidates; same ranking and strong-pattern core confidence |
| Ambiguous, unsure where available | 8 → 8 | None; later clarifications remain | Three candidates; same ranking and supported core confidence |
| Contradictory, negative combination answers | 9 → 9 | None; challenges remain | Three candidates; same ranking and supported core confidence |
| Sparse, one valid primary answer | 0 → 0 | None; no candidate is manufactured | No candidates to calibrate; emerging result, strength zero |
| Previously saved complete positive result | 8 → 8 | None; every recorded answer retained | Three candidates; result is exactly preserved |
| Previously saved partial, pair confirmed then unsure | 8 → 7 | Same unanswered sequence | Resume/back retained; three calibration candidates |

Remaining prompts either concern a different candidate or test a different facet:
outcomes, enjoyment, contexts, reliance by others, overuse or missing conditions.
Uncertain and contradictory profiles deliberately retain similar relationship
questions because the earlier answer did not establish the relationship. All
existing calibration choices, including rejection, remain meaningful.

For **equal recorded evidence**, baseline and candidate maps are deeply equal.
A different comparison matters too: completing all eight old questions positively
versus completing the seven-question closing changes the strong fixture's raw
core evidence strength from 16.0965 to 16.2165 (+0.12). Its rank and confidence
class do not change. A resumed partial fixture with one confirmed pair and later
uncertainty has a +0.40 raw-strength difference against the hypothetical old full
journey, again without changing rank or confidence class. The existing interaction
average explains these differences; no answer is synthesized to compensate.
In the other completed fixtures the
ranking and confidence classes also remain unchanged. Threshold-adjacent cases
are not proven invariant for every possible hypothetical omitted answer.

Expert UX assessment: one fewer redundant confirmation is useful, but the closing
still follows up to 65 primary questions and usually three calibration cards.
This is a modest reduction in fatigue, not evidence that the entire assessment
now feels short. Actual user retesting remains necessary.

## Result evidence disclosure

The full `advantage-evidence` content now follows the primary insights, playbook,
experiments, one-pager and feedback. A native, initially collapsed `details/summary`
uses localized labels in all seven locales, including “Wie wurde mein Ergebnis
ermittelt?”. All evidence items and confidence information remain available;
the result map, stored answers and exported content are unchanged by this move.

Evidence is last in result navigation. Clicking it, repeating the same fragment,
Back navigation and resuming a result with that fragment open the disclosure.
Focus goes to the native summary. The existing global navigation previously
scheduled focus onto a child heading two frames later; its narrowly scoped
details-target handling now opens the disclosure and focuses the summary instead.
Other section targets retain their existing behavior and tests.

The summary contains plain text, with the methods heading inside the expanded
content. Tests cover native markup, accessible text, Enter/Space, focus, content
preservation, URL history, reload/resume and mobile width. Playwright's ARIA
serializer does not consistently expose the native disclosure role; these checks
do not claim a real VoiceOver/NVDA screenreader session.

## Verification

| Check | Result |
| --- | --- |
| TypeScript, `tsc --noEmit` | PASS |
| ESLint, `eslint .` | PASS; zero errors, three pre-existing warnings |
| Relevant Personal Advantage/navigation/shared sharing suites | PASS, 181/181 |
| Unchanged baseline, all `*.test.ts` and `*.test.tsx` | FAIL: 1,090 passed / 1,100; ten failures |
| Candidate, all `*.test.ts` and `*.test.tsx` | FAIL: 1,101 passed / 1,111; the exact same ten failures |
| New full-suite regressions | Zero after the final correction |
| Repository `runner.mjs local` | Previously FAIL at the same regression gate; no green overall gate claimed |
| Turbopack production build | PASS, 11.7 seconds |
| Webpack production build | PASS, 34.3 seconds |
| Browser suite | PASS: six cases, zero failures; one Firefox case NOT RUN (114.8 seconds) |

Browser evidence: Chromium and desktop WebKit each saved all three formats in
all seven locales (de/en/es/tr/pl/el/ru), 42 real files total. Decoded dimensions:
story 1080×1920, portrait 1080×1350, square 1080×1080. Filenames, nonblank pixels,
unchanged answers and console errors are asserted. Mobile 390px viewport tests
cover blocked-click feedback, inline image decoding, screenshot fallback after
encoding failure, delayed URL cleanup, resume/back/calibration and sparse finish.
Both supported engines also test evidence disclosure in all seven locales,
desktop/mobile presentation, keyboard toggling and fragment/history navigation.
Firefox is installed but cannot launch here (`spawn UNKNOWN`). Real iOS Safari
and operating-system native share/save completion are NOT RUN. Desktop WebKit
and a mobile viewport do not establish iOS compatibility.

### Exact baseline debt

The baseline source copy was verified against all 689 committed files, allowing
only checkout line-ending conversion. None contains the candidate changes.
Every failure below reproduces on baseline and candidate with the same cause.
Counts are Node's reported totals; the brand-rename module fails during import,
so tests inside that module do not register. Its operations are outside this
application-only Preview scope.

| Test | File | Verified cause |
| --- | --- | --- |
| context canvas cards navigate directly while preserving modified-link behavior | `tests/discovery-engine.test.ts` | LF-only function-boundary search fails on CRLF |
| top match is one full-card link or a non-interactive article | `tests/discovery-engine.test.ts` | Same LF-only boundary search |
| provider marks are local, byte-pinned first-party assets while restricted and neutral entries stay text-only | `tests/home-ai-summary.test.tsx` | CRLF changes `openai.svg` bytes; the canonical Git blob matches the approved hash |
| the approved Self implementation remains characterized and separate from the hub | `tests/life-alignment-modules.test.ts` | Whole-source equality expects LF |
| production-writing-brand-rename test module | `tests/production-writing-brand-rename.test.ts` | Module import requires an absent ignored byte-approved payload |
| read-only preflight compares complete rows to the approved payload without an overwrite path | `tests/production-writing-promotion.test.ts` | Same missing payload |
| apply transport mounts the exact approved SQL read-only and invokes Docker psql without credentials in argv | `tests/production-writing-promotion.test.ts` | Missing ignored approved import SQL |
| approved payload and import SQL remain byte-for-byte unchanged | `tests/production-writing-promotion.test.ts` | Missing ignored artifacts |
| approved import SQL is strict UTF-8 with preserved non-ASCII content | `tests/production-writing-promotion.test.ts` | Missing ignored import SQL |
| stalled and aborted Comments reads settle at unavailable without blocking Writing | `tests/writing-comments-foundation.test.ts` | Deadline/abort checks pass; the final LF-only source substring assertion fails |

Canonical Git source satisfies the five affected line-ending/hash assertions.
The tested application/operations files are unchanged by this candidate. The
candidate adds no database operations or content promotion. No baseline checks were
disabled, skipped or weakened, and no production payloads were copied.
These failures are acceptable **documented baseline debt for an isolated Preview**,
not a successful full quality gate or a blanket exception for future releases.

The final browser run waits for both actual cleanup timers before advancing its
virtual clock. This avoids racing React's passive unmount effect; the assertion
still requires zero live Blob URLs after the full grace period.

Ignored `.bts-engineering/feedback-001/` contains synthetic browser evidence and
check logs. It is not release content. The browser test requires a loopback server
on port 3237, installed Playwright (or `BTS_PERSONAL_ADVANTAGE_BROWSER_PACKAGE_DIR`),
and `node --import tsx --test tests/personal-advantage-export.browser.test.mjs`.

## Reusable product lessons

1. Separate requesting a browser action from achieving the user's outcome.
   Validate the actual exported file and offer a local fallback when save
   completion cannot be observed.
2. Deduplicate evidence, not merely similar wording. Preserve uncertainty,
   contradictory answers, calibration and stable saved identities.
3. Make sparse and failure paths finishable. The result should stay cautious
   when evidence is weak, and recovery should preserve the person's work.

## Review decision and rollback

Exact release inventory (nine modified files and six new files):

- `components/navigation/navigation-feedback.tsx`
- `components/personal-advantage/advantage-evidence.tsx`
- `components/personal-advantage/personal-advantage-experience.tsx`
- `components/personal-advantage/personal-advantage-share-dialog.tsx`
- `components/sharing/share-file-actions.tsx`
- `data/i18n/share-file.ts`
- `data/personal-advantage-locales.ts`
- `lib/personal-advantage-engine.ts`
- `lib/sharing/native-card-share.ts`
- `tests/personal-advantage-closing.test.ts`
- `tests/personal-advantage-evidence.test.ts`
- `tests/personal-advantage-export.test.ts`
- `tests/personal-advantage-export.browser.test.mjs`
- `tests/navigation-feedback.test.ts`
- `docs/personal-advantage-feedback-001.md`

GO for an isolated Preview after review and separate commit/push authorization,
with the baseline exception above. This is not Production release approval.
Actual external-device reproduction and empirical assessment validation
remain outstanding. There are no commits, pushes, environment changes or external
mutations. Production still points to the approved base.

Rollback is confined to this isolated worktree: restore the nine modified files
from the base and remove the six new files, only
after confirming no subsequent work exists. Leave the original development and
integration checkouts untouched. No production rollback is required.

The three residual risks are the unverified external device/native save path,
threshold-adjacent confidence and perceived fatigue beyond the tested profiles,
and the ten baseline failures that still keep the overall regression command red.
