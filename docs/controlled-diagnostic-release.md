# Controlled Writing and sitemap diagnostic release preparation

28 October 2026, Europe/Berlin. **GO for review of the isolated candidate; NO-GO for commit, push or deployment now.** Production product release remains NO-GO. A hosted Preview and a controlled diagnostic Production release require separate approval and the checks below. Nothing was committed, pushed or deployed, and no Git branch or external setting was changed.

## Verified repository and release base

- Original repository: `G:\Development\personal-website`; branch `main`; HEAD `eaf63dd8ba484395ad82a67c736c1b435411077e`.
- The complete incoming status contains 63 modified/untracked files. The index is empty. All incoming file bytes, including `.codex/config.toml`, are preserved. The only new non-ignored file from this preparation task is this report.
- Local `main` is one commit ahead of `origin/main`. That extra commit changes Writing pagination, its tests and a local content-recovery fixture: five files, 698 insertions and 16 deletions. It is unrelated to diagnostics and excluded.
- A fresh authorized GitHub branch read confirms remote `main` is still `599021773e105b0ea4221275c4a0d8e32df6dd5e`, matching the current Vercel Production deployment. GitHub reports the branch is not protected. No tracked GitHub workflow, `vercel.json` or `.vercelignore` exists at that base; no active local push hook or custom hooks path was found.
- Vercel project `btshq-online`, `prj_unkyAkItBZl4z15yQDutrM1j9RLw`, belongs to Hobby team `team_Fmo1I7pf25j6YvmjcPndRbdJ`, slug `benjamin-trinidad-segura`.
- The latest three Production deployments use `main`. Current READY deployment: `dpl_APGSVYRe4gcaP5Fxmf4JtefS3Zr4`, Git `5990217…`. Public aliases include `btshq.online` and `btshq-online.vercel.app`; `www.btshq.online` redirects to the canonical domain. Their domain records have no branch-specific mapping. No custom environments were returned.

The candidate is a local Git archive export of **the actual Production commit**, not a branch or cherry-pick from the development HEAD. Paths:

- Baseline: `.bts-engineering/diagnostic-release-prep/baseline/`.
- Review candidate: `.bts-engineering/diagnostic-release-prep/candidate/`.
- Reviewable patches: `01-sharing-security.patch` and `02-writing-diagnostics.patch` beside those directories.
- `candidate-review.json` records exact file inventory, unchanged-source count and patch SHA-256 values. Both patches pass `git apply --check` against the baseline. The complete candidate is compared against all baseline source files; 657 existing files remain byte-identical.

The export has no independent Git metadata; Git commands run there can still discover the parent development repository. Therefore the candidate's source inventory and patch checks, rather than its apparent Git status, establish isolation. No commit or push must be made from that directory. Existing installed dependencies were linked for local checks; no package was installed or upgraded.

## Exact proposed release file inventory

There are **16 changed/new source and documentation files** relative to Production: nine runtime files, six test/helper files and this runbook. No generated evidence, environment file, local content payload, build output, `.vercel` data or modified `.codex/config.toml` belongs in either commit.

| Group | File | Purpose/dependency |
| --- | --- | --- |
| Security prerequisite | `lib/sharing/destinations.ts` | Existing approved closed public-route allowlist; depends only on the unchanged URL validator. |
| Security prerequisite | `tests/share-url-security.test.ts` | Positive and negative tests for all locales, invitation/auth/internal paths and legitimate public sharing. |
| Diagnostics | `lib/writing/read-diagnostics.ts` | Server-only logger and response observer; uses existing `server-only`, Node crypto and fixed classifications. |
| Diagnostics | `lib/writing/queries.ts` | Logs actual collection reads and unavailable/sitemap deliveries; internal origin IDs are stripped from public results. |
| Diagnostics | `lib/writing/read-deadline.ts` | Optional failure observer; original 2,500ms timeout and fallback preserved. |
| Diagnostics | `lib/supabase/server.ts` | Optional transparent fetch observation; fresh-client authentication unchanged. |
| Diagnostics | `app/sitemap.ts` | Logs actual generation status/counts using the already-existing status-bearing interface. |
| Diagnostics | `app/layout.tsx` | Adds only the `discovery_index` consumer argument to the existing search-content read. |
| Diagnostics | `app/page.tsx` | Adds only the `home` consumer argument to the existing homepage read. |
| Diagnostics | `app/writing/page.tsx` | Adds only the `writing_index` consumer argument to the deployed array-returning wrapper. |
| Diagnostics tests | `tests/helpers/load-source.ts` | Independent Node/TypeScript source-loading helper, with explicit mocked boundaries. |
| Diagnostics tests | `tests/helpers/writing-diagnostics.ts` | Sanitized logging and fixture-fetch harness. |
| Diagnostics tests | `tests/writing-public-query.test.ts` | Publication, translation, auth, deadline and cache-origin tests adapted to the deployed projection. |
| Diagnostics tests | `tests/writing-read-diagnostics.test.ts` | Credential-exclusion, error taxonomy, transparent fetch and actual installed-SDK auth fixture tests. |
| Diagnostics tests | `tests/writing-sitemap-diagnostics.test.ts` | Published/empty/unavailable, canonical/hreflang, seven-locale and no-added-stale-fallback tests. |
| Runbook | `docs/controlled-diagnostic-release.md` | This release and rollback plan. |

The sharing hardening is an **explicit independent safety prerequisite**, not a hidden dependency of logging. A fixture probe of the actual exported Production helper accepts a private invitation path; the candidate rejects it, and all five sharing-security tests pass. Releasing only the logging patch would leave that known security defect present. Review and approve the two groups separately; no new product feature is introduced.

## Deliberate separation from development phases

The candidate excludes Discover/Explore components, mode preference storage, homepage CSS, editorial continuations, contextual curation, People changes, navigation/focus changes, quote UI changes, related feature tests, the additional homepage npm script and the extra local pagination commit.

It also excludes the Phase 3.8 query optimization: the Production projection, including translation generation timestamps, is retained and no embedded translated-status filter is added. An AST comparison verifies the projection and complete slug-keyed detail callback match Production. Existing mappers still enforce published records, valid source/translation documents, translation revision checks, synthetic-content exclusion and available languages. No validation, timeout, retries, TTL, order, raw limit or invalidation behavior is weakened or changed.

The status-bearing collection interface already exists in Production, so no Discover component, localized recovery-copy file or schema change is needed for the diagnostics. The deployed Writing index's false-empty presentation is intentionally unchanged in this instrumentation-only candidate. It will now be distinguishable in logs. Its UI correction remains in development for separate release review; the new diagnostic test file does not silently import that UI change.

`package.json`, lockfile, Next configuration, publication mappers, types, locale registry, canonical helpers, privacy copy and Writing mutation actions are byte-identical to the Production base. The three TSX diffs contain only static consumer arguments. Cache context is outside the locale-keyed cached callback. No dynamic header/cookie access, new route or client prop is added. Both builds retain `/sitemap.xml` as static with 300-second revalidation, 31,536,000-second expiry and `published-writing` dependency tag.

The logger uses fixed allowlists and UUID-shaped correlation/provider IDs. It records no credentials, key fingerprints, sessions, raw JWTs, raw errors, URLs, article identifiers/bodies or personal data. Unknown JWT messages map to `unclassified`; a known category is not a claim about the underlying gateway or clock cause. Logging failures cannot change read outcomes. Credential-pattern scanning of the proposed delta found no matches; fixture tests provide the independent runtime sanitization check. A wider scan of 598 text source files found one existing synthetic database-URL fixture file, verified byte-identical to the baseline and using an explicit test-only password. No matched URL value was exposed and no real credential was identified.

## Git integration and prevention of accidental deployment

**VERIFIED:** the Git integration links this GitHub repository to the intended project, current remote/main matches Production, and recent Production builds originate from `main`. No pushes, PRs, tags, merge actions, deploy hooks, CLI deployment or alias changes were issued.

**INFERRED, not independently verified as a current setting:** `main` remains the configured Production Branch. The available normalized project/context responses do not expose the active Branch Tracking or automatic domain-assignment fields. Past deployments do not prove these settings cannot have changed. GitHub's Actions workflow-list endpoint was rejected by the connector; no claim is made about an independently inspected remote Actions configuration.

Vercel normally creates Production deployments for its configured production branch and Preview deployments for other branches. A non-production push is therefore a deployment action too; it needs authorization. Before any future push, obtain a current authorized read of Production **Branch Tracking** and domain auto-assignment, and confirm the proposed diagnostic branch is not production-tracked. If that evidence remains unavailable, **do not push**; an explicitly approved direct Preview deployment is an alternative only after authenticated project linking and an upload review. No Git/Vercel settings should be changed to make this task possible. [Git deployment rules](https://vercel.com/docs/git).

Never push the current development `main`, use `push --all`, force-push, merge a diagnostic PR to `main`, or deploy the current dirty repository. The main branch is unprotected, so no branch-policy safety net should be assumed. The current no-push/no-deploy boundary guarantees no accidental Production release in this preparation task.

## Proposed branch and commit strategy, not executed

1. After explicit commit authorization, re-read live Production and remote `main`. If either moved from `5990217…`, stop and rebase the preparation on the new verified live source; do not apply stale patches silently.
2. Create a clean separate worktree from full SHA `599021773e105b0ea4221275c4a0d8e32df6dd5e`, then a new branch such as `codex/writing-sitemap-diagnostics`. Do not switch/reset/stash the original development checkout. Verify this branch name is unused and not production-tracked before any push.
3. Apply `01-sharing-security.patch`, inspect the two-file diff and run its security suite. Stage those exact two paths; proposed commit: `fix(security): restrict public share destinations`.
4. Apply `02-writing-diagnostics.patch` as a complete unit. It contains all eight diagnostic runtime paths, five helper/test paths and the runbook. Review the full diff against the Production base and stage only that explicit list; proposed commit: `chore(observability): trace public Writing reads and sitemap generation`.
5. Verify the complete two-commit delta contains exactly the 16 paths above, no generated/private artifacts and no development pagination/Discover commits. Run the relevant tests and both builds from the clean checkout. Preserve the full-suite exceptions below honestly; resolve or explicitly accept them before a release gate is waived.
6. Stop for separate push/Preview approval. Only after the live Branch Tracking check, push the exact named branch/ref; never rely on an implicit `git push` target. Verify any created deployment belongs to the intended project, reviewed commit and Preview target. A PR review may follow if authorized; merging it into the production branch is a separate Production-release action.

## Fresh candidate validation

All commands below ran in the candidate export unless stated otherwise. Builds and localhost runs had blank application secrets; no local app was connected to Production.

| Command/check | Result |
| --- | --- |
| `npm.cmd run typecheck` | Exit 0. |
| `npm.cmd run lint -- .` | Exit 0; zero errors, three existing warnings in the admin Writing form, language switcher and Life Vision timeline. |
| `node node_modules/tsx/dist/cli.mjs --test tests/writing-public-query.test.ts tests/writing-read-diagnostics.test.ts tests/writing-sitemap-diagnostics.test.ts tests/share-url-security.test.ts` | 26 passed; zero failed/skipped/TODO; 2,714.3375ms. |
| Relevant 16-file suite, listed below | 182 passed; zero failed/skipped/TODO; 6,646.7827ms. Covers publication, translation, sitemap, sharing, search, navigation, HQ Pulse, quotes, seven locales, analytics privacy and injected-origin contracts. |
| `node .bts-engineering/phase5/run-isolated.mjs` | Turbopack exit 0; compilation 30.6s, TypeScript 13.2s, 51/51 pages. |
| `node .bts-engineering/phase5/run-isolated.mjs --webpack` | Webpack exit 0; compilation 31.4s, TypeScript 3.3s, 51/51 pages. |
| Localhost-only HTTP smoke | 15/15 passed: Home/Writing in seven locales plus sitemap. Correct HTML languages, no Discover panels or internal diagnostic fields; original empty UI retained on the isolated unavailable index; localhost sitemap fails closed. Test server stopped. |
| Full `npm.cmd run bts:local -- --skip-build` | **Exit 1: 1,004 passed, 10 failed, 1,014 total**, zero skipped/TODO; 12,972.1486ms. TypeScript, lint and the parent checkout whitespace check passed, but the full regression gate is not green. |
| Unchanged baseline control: same six failing test files | **62 passed, the same 10 failed, 72 total**; 1,095.0104ms. This reproduces every full-run failure without diagnostic/security changes. |
| Original development tree: `npm.cmd run bts:local -- --skip-build` | Fresh exit 0: **1,063 passed**, zero failed/cancelled/skipped/TODO; 15,011.2189ms. TypeScript, ESLint and whitespace checks passed, with the same three existing lint warnings. |
| Diff/isolation | Both patches apply-check cleanly and replay to all 16 exact candidate file bytes. Independent whitespace checks pass on all proposed paths. The first replay exposed only Windows line-ending conversion; replay with command-local `core.autocrlf=false` matches byte-for-byte without changing Git configuration. All 63 incoming original files remain unchanged. |

Relevant suite command:

```powershell
node node_modules/tsx/dist/cli.mjs --test tests/writing-public-query.test.ts tests/writing-read-diagnostics.test.ts tests/writing-sitemap-diagnostics.test.ts tests/share-url-security.test.ts tests/writing-foundation.test.ts tests/writing-completion.test.ts tests/writing-translation-provider.test.ts tests/writing-social-share.test.ts tests/quote-universe.test.ts tests/public-seven-locales.test.ts tests/public-content-hygiene.test.ts tests/search-discovery-foundation.test.ts tests/navigation-feedback.test.ts tests/hq-pulse.test.ts tests/cloudflare-web-analytics.test.ts tests/site-url-client-boundary.test.tsx
```

The six baseline-control files were `discovery-engine.test.ts`, `final-release-audit.test.ts`, `life-alignment-modules.test.ts`, `production-writing-brand-rename.test.ts`, `production-writing-promotion.test.ts` and `writing-comments-foundation.test.ts` under `tests/`.

The ten failures comprise five unavailable-fixture/file failures in the Production promotion/brand tooling, two Discovery source-contract assertions, one obsolete no-analytics assertion despite existing Cloudflare disclosure, one CRLF-sensitive Self-source equality and one CRLF-sensitive Comments catch-source assertion. The original content promotion JSON/SQL lives in ignored local directories; it was not copied into the candidate or proposed commits. These tests are not evidence of a new database failure. No test was skipped, weakened or broadly rewritten to hide the baseline failures.

The freshly repeated 1,063 passing development tests belong to the complete development tree; they are not the result of this narrower Production-base candidate. Its log is `.bts-engineering/logs/2026-10-28T15-41-22-121Z-2f2e1e68.log`. Counts from overlapping focused suites must not be added together.

**Local build limitation:** because the export sits inside the original repository and links installed dependencies, Next inferred the outer workspace root and warned about multiple lockfiles. Webpack also emitted three CSS-optimization warnings with malformed scanned utility tokens. The application compiled, but these local `.next` artifacts are **not approved deployment artifacts**. Their origin is not conclusively isolated; a clean hosted Preview build must confirm the warnings do not recur. No build configuration was changed to suppress them, and no `--prebuilt` deployment is proposed.

## Preview readiness and limits

A fresh metadata-only environment read, with decryption disabled, returned 18 variable definitions. `SITE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` and the operational secrets are Production-only. The only listed Preview variable is `NEWSLETTER_FROM_EMAIL`. No values were retrieved or printed. SSO protection covers deployments except custom domains.

Therefore an approved hosted Preview can verify build integrity, unchanged homepage/search, locales, sharing controls, sanitized missing-configuration logs, and safe sitemap/canonical behavior. It **cannot verify live published Writing, the Production JWT rejection, or Production ISR** with the existing Preview environment. Do not copy Production credentials, resume Development or change environment mappings to make that Preview appear representative.

No hosted Preview was created: the user explicitly stopped this task before every deployment, including Preview. The prepared localhost checks are server/HTTP smoke tests, not new browser E2E or production-read evidence. A clean source-based Preview is the next recommended verification stage after explicit approval, not a current deployment GO.

## Exact controlled Production diagnostic sequence, future approval required

1. Finish/approve the two-commit candidate and obtain the live Git integration settings described above. Resolve or explicitly accept the reproduced baseline test exceptions. Obtain a clean hosted Preview build and read-only acceptance. Reconfirm current Production deployment/aliases and capture the immediate previous rollback target; it is currently `dpl_APGSVYRe4gcaP5Fxmf4JtefS3Zr4`.
2. Obtain **explicit Production diagnostic deployment authorization**, including staging and the intended promotion/rollback scope. A production build with no assigned domains still uses Production configuration and is a Production deployment; it is not covered by Preview approval.
3. From a clean, reviewed checkout linked to the existing project and an authorized CLI session, stage a fresh source build without assigning public domains. The following commands are a future runbook only; none was executed:

```powershell
# Verify existing authorized identity/project before these commands; never supply tokens on the command line.
vercel deploy --prod --skip-domain --scope benjamin-trinidad-segura
vercel inspect <staged-deployment-id-or-url> --scope benjamin-trinidad-segura
```

Verify exact commit, team/project, Production target, READY state, expected route cache declaration and that `btshq.online` still points to the prior deployment. Abort if these checks differ. Never deploy from the ignored candidate directory or use its generated `.next` output. No environment pull, key change, migration, database mutation or cache purge is required. The CLI session was not independently verified in this task; if it is unavailable, stop for the existing official authorization flow rather than extracting connector credentials. The scoped connector can inspect deployment status/logs. [Staging/promotion behavior](https://vercel.com/docs/deployments/promoting-a-deployment), [deploy options](https://vercel.com/docs/cli/deploy).

4. Use the existing authenticated deployment-access path for a small set of read-only public GETs on the staged deployment. Do not create a bypass secret or public share link without approval. Verify safe log output, consumer/origin correlations and publication filters; do not submit forms or invoke admin mutations. A staged host may differ from the canonical host, so it cannot alone establish live CDN behavior.
5. Only when promotion is explicitly authorized, promote that already built Production deployment. Do not promote a Preview as if it were the same artifact: Preview promotion rebuilds with Production environment variables. Use the reviewed staged Production deployment:

```powershell
vercel promote <verified-staged-production-deployment-id-or-url> --scope benjamin-trinidad-segura
```

The equivalent existing connector promotion identifies both `projectId` and `deploymentId` under the intended team; it is a mutation and was not called here. Re-read the live alias immediately after promotion. Do not merge/push `main` as a substitute for this controlled sequence.
6. Immediately collect a fresh 30-minute Vercel runtime window within Hobby's one-hour retention. Make only a few ordinary public reads of Home, Writing locales and sitemap; capture UTC timestamps, response status, Vercel IDs and cache/Age/ETag/Last-Modified headers. Do not invalidate caches or use bypass/cache-busting requests as proof of origin execution.
7. Correlate `btshq.writing_read` delivery UUIDs with origin UUIDs and, when present, the final UUID-shaped Supabase request ID. Query the same bounded authorized Supabase API window. Distinguish upstream HTTP 401/auth-claim classification, application deadline, successful zero rows, rejected records and populated accepted data. Never retrieve JWTs or unsanitized headers/messages.
8. Link each actual sitemap generation to its collection delivery and emitted counts. Compare the served XML with the actual current validated public set and available languages; never assume `17 × 7` or use saved metadata to fabricate URLs. If there is no generation record during CDN HITs, treat regeneration as unknown. If successful fresh generation coexists with old served XML, request provider-side route-cache/regeneration/invalidation evidence for those IDs; do not introduce a paid service or speculative cache change.
9. Stop and report the identified error boundary or remaining evidence gap. No observed 401 during a short window is not proof of reliability. A recognized rejected-claim reason identifies a failed validation, not automatically its underlying cause. Keep all publication and withdrawal rules intact while deciding any subsequent correction separately.

## Success, abort and rollback criteria

Diagnostic success means the correct isolated commit is running, public behavior/security remain within the approved baseline, and a collection outcome can be traced across consumer, cache-origin record, provider response and sitemap execution where those executions occur. Logs must contain only the defined safe fields. At least one successful public read and any observed failure must be classified honestly. Absence of a reproduced failure or a fresh sitemap execution leaves the corresponding question unresolved.

Abort or roll back an approved diagnostic rollout for credential/personal-data logging, new public 5xx failures, unpublished/private content exposure, canonical/locale regressions, sharing failures, significant new read latency or unexpected domain/commit assignment. Record evidence before the one-hour retention expires. Product release remains NO-GO until intermittent authentication and sitemap publication/withdrawal propagation are independently established.

Rollback procedure after an authorized rollout:

1. If the staged build has not been promoted, leave the live aliases on the old deployment and stop; there is no public-traffic rollback to perform.
2. After promotion, confirm the immediately previous live deployment is still the recorded target. Hobby supports rollback to the immediately previous Production deployment; do not promise arbitrary historical rollback. The supported scoped connector call is `request_rollback` with project `prj_unkyAkItBZl4z15yQDutrM1j9RLw`, team `team_Fmo1I7pf25j6YvmjcPndRbdJ`, and that verified previous deployment ID. With the current baseline, the target would be `dpl_APGSVYRe4gcaP5Fxmf4JtefS3Zr4`. Invoke only within explicit rollout/rollback authorization.
3. Verify the live aliases and ordinary Writing/Home/sitemap GETs after rollback. No schema/data or credential rollback is needed. Restoring the old deployment also restores its known Writing/sitemap defects and older sharing behavior; rollback is incident containment, not a reliability/security fix. App data-cache history may remain, so do not claim cache withdrawal safety from alias rollback alone.
4. Vercel turns off Production domain auto-assignment after rollback. Do not re-enable it or promote another build automatically; report the state for separate review. [Rollback constraints and effects](https://vercel.com/docs/instant-rollback).

Local preparation rollback requires only discarding this new report and optionally the ignored preparation directory after checking resolved paths and retaining needed evidence. Do not delete through the dependency junctions, reset/stash the development checkout or overwrite `.codex/config.toml`. Nothing external needs rollback because this task changed no external system.

## Highest remaining risks and recommendation

1. **Production cause remains unresolved:** PGRST303's failed claim and the old two-slug sitemap's refresh/withdrawal behavior need live execution evidence. Instrumentation is not a verified fix.
2. **Candidate validation differs from the full development gate:** the same ten pre-existing failures recur on the export, ignored fixtures make part of the suite non-portable, and local nested builds have root/CSS warnings. A clean hosted source build and an explicit decision on those baseline exceptions are still required.
3. **Release controls and environment mismatch:** `main` is unprotected, the exact active Vercel branch-tracking/auto-assignment fields are not exposed by the available connector, and Preview lacks the Production data configuration. A push must not be treated as harmless and Preview success cannot establish Production reliability.

**Recommendation: GO for review of the 16-file candidate and two proposed commits. NO-GO for commit/push/deployment under the current authorization; NO-GO for Production release readiness.** After explicit approval and live release-control verification, a clean hosted Preview is the next stage. A controlled Production diagnostic rollout requires its own approval after Preview acceptance. Preserve all development phases; do not start new feature work.
