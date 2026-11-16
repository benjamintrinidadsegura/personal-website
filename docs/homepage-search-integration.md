# Homepage and search integration candidate

Local verification completed on 2026-11-16. This document records the release
candidate; it introduces no application changes.

## Verified ancestry

The approved candidates already form one direct history:

1. Production baseline `7379c749b954f692b84885375ce1e0af9805001f`.
2. Adaptive homepage foundation `24756a912971f72fc36832ca0174ea11eee05fed`.
3. Adaptive homepage final `3ddd0c9a70f18d09f9c8d0e375409b4c2e7603f3`.
4. Collision correction `c203a57a7a408593a3113d2ec9765e43b66b1bf8`.
5. Semantic Discovery `4cca576bba5513980f3bf5885e08756d2b480583`.
6. Public index completion `759a3e066f79894c0d67fffde5f61e79e46bf9e7`.

Branch `codex/btshq-homepage-search-integration` was created directly at the last
commit. No merge, duplicate cherry-pick, conflict resolution or source rewrite
was necessary. Its application files remain byte-identical to that approved
candidate. This verification document is the only additional committed path.

## Local acceptance

- TypeScript and ESLint passed (three existing lint warnings).
- Integrated focused tests: 174 passed, zero failed or skipped.
- Full suite: 1,179 passed, eleven existing failures, zero skipped. All eleven
  failing identities match the previously verified baseline; no new failure.
- Webpack and Turbopack production builds passed, 50/50 pages. The first
  sandboxed Webpack attempt encountered a generated-folder EPERM; an unchanged
  rerun outside the sandbox passed. Build configuration was not modified.
- Six responsive widths: 320, 390, 768, 1280, 1440 and 1920 pixels.
- 792 geometry observations, including 54 moving states: no measured collision
  or horizontal overflow; search-lens center offsets were zero on both axes.
- 49 additional seven-locale browser states: no measured collision or overflow.
- Welcome quote, Danke/X, same-day dismissal, FYNS/public module navigation,
  Discover default, complete Explore, saved mode, retained query on mode switch,
  drag/reverse drag, keyboard Focus/return and global Ctrl+K navigation checked.
- 49 local homepage/Writing/module GETs passed canonical/hreflang checks.
  Additional checks verified FYNS/hub availability, Preview robots disallow-all,
  empty no-store Preview sitemap and absent Experience Lab routes returning 404.
- Sharing, publication/translation, privacy, paused analytics and private-route
  regressions passed. Production security/data readers remain unchanged.

The local app intentionally had no Supabase configuration: live Writing retrieval
was not certified. Published/empty/unavailable cases use existing controlled
regressions; historical public metadata was replayed offline only. No content was
fabricated or injected into the app.

## Remaining limits and release boundary

Reduced-motion logic passes its existing controller tests; actual browser OS
emulation, physical touch/iOS, full screenreader testing, field performance and
real-time video capture were not available. Finite moving-state measurements do
not establish every-frame collision freedom or guaranteed frame rate. Existing
global Pulse alias counts and the eleven baseline failures remain documented.

GO for a separately authorized protected Founder Preview. NO-GO for Production
until hosted acceptance and explicit release approval. No subjective Founder
approval is claimed. No push, deployment, database/configuration change or
analytics activation was performed. All prior branches/worktrees are preserved.

Rollback requires no external action now. Retain the approved source branches;
this document-only commit can be omitted independently. Any future deployment
must verify its own baseline, exact SHA, environment and rollback target first.

The complete portable evidence is delivered as `BTSHQ_Review_Latest.zip`; it
contains the cumulative path inventory, logs, screenshots and query comparisons.
