# BTS Engineering Runner

The BTS Engineering Runner is the repository-local path for completing an engineering ticket without turning the operator into a command relay. It bundles deterministic checks while keeping DEV database access, migration application, Production, secrets, and destructive Git behind explicit safety boundaries.

## Security model

- Codex remains in `workspace-write` with `on-request` approvals. Full Access is not used.
- `.codex/config.toml` routes eligible approval requests through Codex auto-review and restricts command network destinations to the exact pinned DEV database hostname and the existing GitHub remote host.
- `scripts/bts-engineering/config.json` is an exact allowlist: environment `DEV`, project name `bts-online-dev`, one project ref, one database host, port `5432`, and database `postgres`. Any mismatch fails before a network command.
- The runner reads only `DATABASE_URL` from the ignored `.env.local` when it is not already present in the process environment. It removes `SUPABASE_ACCESS_TOKEN` from every child environment and redacts database URLs, passwords, tokens, and JWT-shaped values from logs.
- The direct DEV URL is used with `sslmode=require`. No Production target or fallback hostname exists.
- Database verification files must live under `supabase/tests`, contain exactly one `DO` statement, contain no explicit transaction control or dangerous persistent/external operation, deliberately raise the reviewed success sentinel, and prove zero residue through the runner's follow-up query.
- Git checkpointing accepts an exact path allowlist, rejects credential-shaped paths/content and unexpected diffs, and exposes no destructive Git command. Push is ordinary, never forced.

Detailed diagnostic output is redacted and written under ignored `.bts-engineering/logs`. Operator output is intentionally limited to the documented status lines.

## Normal ticket workflow

### 1. Local validation

```powershell
npm.cmd run bts:local
```

This runs all repository tests in one process, typecheck, lint, a production build with application credentials blanked, `git diff --check`, and migration checksum integrity. Regression tests, typecheck, lint, and the diff check run concurrently because they are independent and read-only. The resource-intensive build follows that group so it has sole ownership of `.next` and does not compete with the other CPU-heavy checks. Add one or more `--targeted <tests/file.test.ts>` arguments by invoking the Node runner directly when a ticket benefits from an early focused test.

### 2. DEV preflight

```powershell
npm.cmd run bts:preflight
```

Preflight verifies the exact DEV URL, checks pre-existing fixture residue, reads remote migration versions, compares the immutable local checksum registry, and runs `supabase db push --dry-run`.

If no migration is pending, it emits `BTS PREFLIGHT PASSED`.

If exactly one migration is pending, it emits `MIGRATION APPROVAL REQUIRED` with its filename, target, and SHA-256 hash, records a credential-free 30-minute preflight state, and stops. More than one pending migration fails closed.

### 3. Migration gate

The runner never calls migration apply from local validation, preflight, verification, smoke, post, or checkpoint.

Only after the operator explicitly approves the exact reported migration may Codex invoke:

```powershell
node scripts/bts-engineering/runner.mjs apply --confirmation "APPLY bts-online-dev <exact-migration.sql>"
```

The apply command revalidates the target, fresh preflight state, exact pending count, filename, hash, and a second dry-run before an ordinary `db push`. It never uses `--include-all`. An additive repair migration is a new pending migration and therefore creates a new gate.

### 4. DEV verification and post-migration closeout

```powershell
npm.cmd run bts:verify
npm.cmd run bts:post
```

Verification executes the reviewed SQL file through one Supabase CLI database process. The Newsletter harness uses generated fixtures, an advisory transaction lock, and a read-only existing admin identity. A unique exception raised only after every assertion passes forces PostgreSQL to roll back the complete implicit statement transaction; a second read-only query proves zero residue. Ordinary assertion failures also roll back when the statement fails, but use a different sentinel.

Post closeout rechecks migration synchronization, runs rollback verification, database lint, security advisors, residue verification, and final local validation. It emits `READY FOR HUMAN UX REVIEW`; skip that human step unless the ticket contains a real visual or product judgment.

The harness proves state behavior in one PostgreSQL session. It does **not** claim true multi-session concurrency. Concurrency properties remain covered by deterministic local tests and SQL lock/constraint review unless a separately approved isolated strategy is introduced.

### 5. Checkpoint

Codex first reviews the exact diff, then dry-runs checkpoint safety with every intended path:

```powershell
node scripts/bts-engineering/runner.mjs checkpoint --dry-run --message "type(scope): summary" --path <path> --path <path>
```

After `READY TO CHECKPOINT`, omit `--dry-run` to stage only those paths, commit, perform a normal push to the existing tracking branch, verify `HEAD` equals the tracking branch, and verify a clean tree.

## Safe smoke block

```powershell
npm.cmd run test:runner
npm.cmd run bts:local
npm.cmd run bts:smoke-dev
```

`smoke-dev` bundles target verification, migration detection/dry-run, the successful Newsletter rollback harness, an intentional failed assertion, a final zero-residue proof, database lint, security advisors, performance evidence, and concise summaries. It never applies a migration.

The smoke process records its own execution duration and internal process counts. Because approval waiting occurs before that process starts, record the externally observed values after smoke completion rather than estimating them in advance:

```powershell
node scripts/bts-engineering/runner.mjs observe-performance --human-approvals-observed <count> --privileged-boundary-crossings-observed <count> --end-to-end-duration-ms-observed <milliseconds>
```

The runner cannot see Codex approval popups or pre-launch wait time from inside its child process. Until the observation command runs, those values are therefore recorded as `null`, never guessed. The observation preserves both execution-only duration and full end-to-end duration, with their difference identified as pre-launch boundary wait. Detailed metrics are written to ignored `.bts-engineering/performance/<run-id>.json` and `latest.json`; the operator sees only concise status lines.

## Critical performance standard

The runner optimizes two independent dimensions: routine human interruption and end-to-end wall-clock time from approved ticket to verified checkpoint. Quality and security are hard constraints, not optimization variables. An interruption improvement is not success if it materially slows the safe critical path without a documented quality or security reason; a speed improvement is not success if it skips required evidence.

The runner and future ticket workflows must not reduce prompts by delaying a genuine gate, intentionally extending work, serializing independent safe checks, adding unnecessary verification passes, repeating unchanged checks, performing redundant Supabase inspections, creating oversized harnesses, replacing fast commands with an unnecessarily slow bundle, or batching merely for appearance.

Required operating principles:

- Parallelize independent safe validation when practical. `smoke-dev` concurrently establishes read-only preflight evidence, concurrently runs the two collision-safe rollback transactions, and concurrently runs read-only health closeout checks.
- Keep dependent safety steps sequential. Positive target pinning and local checksums precede network work; migration dry-run follows migration-history inspection; final residue proof follows both rollback transactions; checkpoint follows verification.
- Reuse same-run evidence only while its target and repository fingerprints remain unchanged. The fingerprint covers the exact target, migration names/versions/hashes, checksum registry, and smoke verification files. A relevant change invalidates the evidence and fails closed. Preflight evidence is never reused across a new runner process for ordinary verification; the migration apply gate separately revalidates its fresh, scoped state.
- Combine operations only where it removes process or approval overhead. The rollback harnesses remain small, focused repository SQL files.
- Fail before dependent work on a blocking error. Already-started bounded parallel read-only work is allowed to settle so no orphan child process remains.
- Fix ordinary defects with the affected focused check first. Run the full regression matrix once at the final boundary unless a later change genuinely invalidates it.
- Never re-inspect unchanged migration history during the same smoke run. A migration, target, fingerprint, or external-state change requires a fresh preflight.

Each smoke performance record reports:

- total wall-clock duration;
- externally observed human approval count and privileged boundary crossings, or an explicit `null` when unavailable;
- total child processes, network-bearing processes, and Supabase CLI/process invocations;
- repeated evidence executions with the reason for every occurrence;
- retry count and reason for every retry (the runner does not retry automatically);
- actual parallel groups, their operations, reason, and duration;
- safety dependencies that remained sequential and why.

The final ticket report must keep four assessments separate: human interruption, wall-clock efficiency, verification efficiency, and quality/security confidence. It must include a `BEFORE` baseline, an `AFTER` measurement with validation coverage, and an `ASSESSMENT`; these must not be collapsed into one score. The intended result is faster engineering, fewer interruptions, and the same or better quality.

## Migration integrity

Every migration is registered in `scripts/bts-engineering/migration-checksums.json`. A new migration must be added with its SHA-256 hash before preflight. Any modification, removal, or unregistered migration fails local validation. Preflight also compares remote-applied versions with Git status, so changing both an applied migration and its checksum entry still fails. A just-applied, not-yet-committed migration is accepted only when it exactly matches the fresh gated apply state. Applied migrations are never repaired in place; create an additive migration.

## Credential cleanup

The runner does not require `SUPABASE_ACCESS_TOKEN`. It uses the ignored DEV `DATABASE_URL` and strips access tokens from children. Do not commit either credential. Windows user/machine environment variables are outside runner scope and are never changed automatically.

After verifying the runner, restart any process that inherited a temporary Supabase access token and revoke that token if it remains valid.

## Failure behavior

- Target mismatch, missing credentials, checksum divergence, ambiguous migrations, residue, forbidden SQL, unexpected diffs, secrets, timeouts, and command failures stop with `FAILED — ENGINEERING ACTION REQUIRED`.
- A pending migration stops with `MIGRATION APPROVAL REQUIRED`.
- The runner reports uncertainty if a failed database command cannot be followed by a successful residue check.
- Production, destructive Git, migration reset/repair, forced push, and deployment are not runner capabilities.
