import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  RunnerError,
  assertCheckpointPaths,
  createRunner,
  executeProcess,
  parseRemoteMigrations,
  redact,
  safeChildEnvironment,
  sha256,
  validateDatabaseUrl,
  validateVerificationSql,
} from "../scripts/bts-engineering/runner.mjs";

const TARGET = {
  environment: "DEV",
  projectName: "bts-online-dev",
  projectRef: "fnnhosdwldjhyfoezkot",
  databaseHost: "db.fnnhosdwldjhyfoezkot.supabase.co",
  databasePort: 5432,
  databaseName: "postgres",
};
const DEV_URL = ["postgresql://postgres", "do-not-log-this@db.fnnhosdwldjhyfoezkot.supabase.co:5432/postgres"].join(":");

function config() {
  return {
    schemaVersion: 1,
    target: TARGET,
    timeoutsMs: { localCommand: 5_000, databaseCommand: 5_000, build: 5_000, git: 5_000 },
    verification: {
      defaultFile: "supabase/tests/success_rollback.sql",
      failureSmokeFile: "supabase/tests/failure_rollback.sql",
      successSentinel: "BTS_VERIFICATION_PASSED_ROLLED_BACK",
      residueSentinel: "BTS_ENGINEERING_RESIDUE_ZERO",
      failureSentinel: "BTS_EXPECTED_ASSERTION_FAILURE",
    },
  };
}

function makeRunnerRepo(migrationNames = ["20260101000000_first.sql"]) {
  const root = mkdtempSync(join(tmpdir(), "bts-runner-test-"));
  mkdirSync(join(root, "scripts/bts-engineering"), { recursive: true });
  mkdirSync(join(root, "supabase/migrations"), { recursive: true });
  mkdirSync(join(root, "supabase/tests"), { recursive: true });
  mkdirSync(join(root, "node_modules/supabase/dist"), { recursive: true });
  mkdirSync(join(root, "node_modules/.bin"), { recursive: true });
  const checksums: Record<string, string> = {};
  for (const name of migrationNames) {
    const sql = `select '${name}';\n`;
    writeFileSync(join(root, "supabase/migrations", name), sql);
    checksums[name] = sha256(sql);
  }
  writeFileSync(join(root, "scripts/bts-engineering/config.json"), JSON.stringify(config()));
  writeFileSync(join(root, "scripts/bts-engineering/migration-checksums.json"), JSON.stringify({ schemaVersion: 1, algorithm: "sha256", migrations: checksums }));
  writeFileSync(join(root, ".env.local"), `${"DATABASE_URL"}=${DEV_URL}\n${"SUPABASE_ACCESS_TOKEN"}=must-not-be-used\n`);
  writeFileSync(
    join(root, "supabase/tests/success_rollback.sql"),
    "do $$\nbegin\n  raise exception 'BTS_VERIFICATION_PASSED_ROLLED_BACK';\nend;\n$$;\n",
  );
  writeFileSync(
    join(root, "supabase/tests/failure_rollback.sql"),
    "do $$\nbegin\n  raise exception 'BTS_EXPECTED_ASSERTION_FAILURE';\nend;\n$$;\n",
  );
  writeFileSync(join(root, "node_modules/supabase/dist/supabase.js"), "");
  return root;
}

function ok(stdout = "") {
  return { code: 0, signal: null, stdout, stderr: "" };
}

test("DEV target is positively pinned and Production-shaped targets fail closed", () => {
  const parsed = validateDatabaseUrl(DEV_URL, TARGET);
  assert.equal(parsed.host, TARGET.databaseHost);
  assert.match(parsed.url, /sslmode=require/);
  assert.throws(
    () => validateDatabaseUrl(["postgresql://postgres", "secret@db.production-ref.supabase.co:5432/postgres"].join(":"), TARGET),
    (error: unknown) => error instanceof RunnerError && error.code === "TARGET_REJECTED",
  );
  assert.throws(
    () => validateDatabaseUrl(DEV_URL, { ...TARGET, environment: "PRODUCTION", projectName: "bts-online-production" }),
    (error: unknown) => error instanceof RunnerError && error.code === "TARGET_REJECTED",
  );
});

test("missing credentials fail before any command runs", () => {
  assert.throws(
    () => validateDatabaseUrl(undefined, TARGET),
    (error: unknown) => error instanceof RunnerError && error.code === "MISSING_CREDENTIALS",
  );
});

test("migration output parsing is deterministic", () => {
  assert.deepEqual(parseRemoteMigrations("BTS_MIGRATION|20260102\nBTS_MIGRATION|20260101\nBTS_MIGRATION|20260102"), ["20260101", "20260102"]);
});

test("migration checksum integrity rejects modified and unregistered migrations", () => {
  const root = makeRunnerRepo();
  try {
    const runner = createRunner({ repoRoot: root, config: config(), env: {} });
    assert.equal(runner.validateMigrationIntegrity().length, 1);
    writeFileSync(join(root, "supabase/migrations/20260101000000_first.sql"), "select 'changed';\n");
    assert.throws(
      () => runner.validateMigrationIntegrity(),
      (error: unknown) => error instanceof RunnerError && error.code === "MIGRATION_INTEGRITY_FAILED",
    );
    writeFileSync(join(root, "supabase/migrations/20260102000000_unregistered.sql"), "select 2;\n");
    assert.throws(() => runner.validateMigrationIntegrity(), RunnerError);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("verification SQL contract requires rollback and rejects persistent or external operations", () => {
  assert.equal(validateVerificationSql("do $$ begin raise exception 'BTS_VERIFICATION_PASSED_ROLLED_BACK'; end; $$;"), true);
  for (const sql of [
    "select 1;",
    "begin; select 1; commit;",
    "do $$ begin truncate public.items; raise exception 'BTS_VERIFICATION_PASSED_ROLLED_BACK'; end; $$;",
    "do $$ begin perform dblink('x'); raise exception 'BTS_VERIFICATION_PASSED_ROLLED_BACK'; end; $$;",
  ]) assert.throws(() => validateVerificationSql(sql), RunnerError);
});

test("the repository Newsletter harness satisfies the rollback contract and avoids fixed fixture identities", () => {
  const sql = readFileSync(new URL("../supabase/tests/newsletter_delivery_rollback.sql", import.meta.url), "utf8");
  assert.equal(validateVerificationSql(sql), true);
  assert.match(sql, /gen_random_uuid\(\)/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.doesNotMatch(sql, /update public\.admin_users/i);
  assert.match(sql, /BTS_VERIFICATION_PASSED_ROLLED_BACK/);
});

test("secret redaction covers explicit values, database URLs, access tokens, and JWTs", () => {
  const token = `sbp_${"a".repeat(24)}`;
  const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature";
  const output = redact(`${"DATABASE_URL"}=${DEV_URL} ${token} ${jwt} explicit-secret`, ["explicit-secret"]);
  assert.doesNotMatch(output, /do-not-log-this|explicit-secret|sbp_|eyJhbGci/);
  assert.match(output, /REDACTED/);
});

test("child environments strip account tokens and blank build credentials", () => {
  const env = safeChildEnvironment({
    PATH: "safe-path",
    SUPABASE_ACCESS_TOKEN: "account-token",
    DATABASE_URL: DEV_URL,
    ECHOWALL_FORM_TOKEN_SECRET: "form-secret",
    BREVO_API_KEY: "provider-secret",
  }, { blankApplicationSecrets: true });
  assert.equal(env.SUPABASE_ACCESS_TOKEN, undefined);
  assert.equal(env.DATABASE_URL, "");
  assert.equal(env.ECHOWALL_FORM_TOKEN_SECRET, undefined);
  assert.equal(env.BREVO_API_KEY, "");
  assert.equal(env.PATH, "safe-path");
});

test("command timeout and destructive Git rejection fail closed", async () => {
  await assert.rejects(
    executeProcess(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { timeoutMs: 30 }),
    (error: unknown) => error instanceof RunnerError && error.code === "COMMAND_TIMEOUT",
  );
  await assert.rejects(
    executeProcess("git", ["reset", "--hard"], { timeoutMs: 100 }),
    (error: unknown) => error instanceof RunnerError && error.code === "DESTRUCTIVE_GIT_REJECTED",
  );
});

test("preflight detects no-migration state without an apply command and emits one concise status", async () => {
  const root = makeRunnerRepo();
  const calls: string[][] = [];
  const messages: string[] = [];
  const originalLog = console.log;
  console.log = (message?: unknown) => { messages.push(String(message)); };
  try {
    const execute = async (_command: string, args: string[]) => {
      calls.push(args);
      if (_command === "git") return ok();
      const joined = args.includes("--file") ? readFileSync(args.at(-1)!, "utf8") : args.join(" ");
      if (joined.includes("BTS_TARGET_PROBE")) return ok("BTS_TARGET_PROBE|postgres|postgres\nBTS_MIGRATION|20260101000000\n");
      if (args.includes("--dry-run")) return ok("Remote database is up to date.\n");
      return ok("BTS_ENGINEERING_RESIDUE_ZERO\n");
    };
    const runner = createRunner({ repoRoot: root, config: config(), env: {}, execute });
    const result = await runner.preflight();
    assert.equal(result.status, "passed");
    assert.equal(calls.some((args) => args[0] === "db" && args[1] === "push" && !args.includes("--dry-run")), false);
    assert.equal(messages.length, 1);
    assert.match(messages[0], /^BTS PREFLIGHT PASSED/);
  } finally {
    console.log = originalLog;
    rmSync(root, { recursive: true, force: true });
  }
});

test("pending migration stops at the explicit gate and repair batches fail closed", async () => {
  const root = makeRunnerRepo(["20260101000000_first.sql", "20260102000000_second.sql"]);
  try {
    const calls: string[][] = [];
    const execute = async (_command: string, args: string[]) => {
      calls.push(args);
      if (_command === "git") return ok();
      const joined = args.includes("--file") ? readFileSync(args.at(-1)!, "utf8") : args.join(" ");
      if (joined.includes("BTS_TARGET_PROBE")) return ok("BTS_TARGET_PROBE|postgres|postgres\nBTS_MIGRATION|20260101000000\n");
      if (args.includes("--dry-run")) return ok("20260102000000_second.sql\n");
      return ok("BTS_ENGINEERING_RESIDUE_ZERO\n");
    };
    const runner = createRunner({ repoRoot: root, config: config(), env: {}, execute });
    const result = await runner.preflight();
    assert.equal(result.status, "migration-required");
    assert.equal(calls.some((args) => args[0] === "db" && args[1] === "push" && !args.includes("--dry-run")), false);
    await assert.rejects(
      runner.applyMigration({ confirmation: "yes" }),
      (error: unknown) => error instanceof RunnerError && error.code === "MIGRATION_GATE_REQUIRED",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }

  const repairRoot = makeRunnerRepo(["20260101000000_first.sql", "20260102000000_second.sql", "20260103000000_repair.sql"]);
  try {
    const execute = async (_command: string, args: string[]) => {
      if (_command === "git") return ok();
      const joined = args.includes("--file") ? readFileSync(args.at(-1)!, "utf8") : args.join(" ");
      if (joined.includes("BTS_TARGET_PROBE")) return ok("BTS_TARGET_PROBE|postgres|postgres\nBTS_MIGRATION|20260101000000\n");
      return ok("BTS_ENGINEERING_RESIDUE_ZERO\n");
    };
    const runner = createRunner({ repoRoot: repairRoot, config: config(), env: {}, execute });
    await assert.rejects(
      runner.preflight(),
      (error: unknown) => error instanceof RunnerError && error.code === "MIGRATION_AMBIGUOUS",
    );
  } finally {
    rmSync(repairRoot, { recursive: true, force: true });
  }
});

test("an applied migration cannot be hidden by updating its checksum entry", async () => {
  const root = makeRunnerRepo();
  try {
    execFileSync("git", ["init", "--initial-branch=main"], { cwd: root });
    execFileSync("git", ["config", "user.email", "runner@example.invalid"], { cwd: root });
    execFileSync("git", ["config", "user.name", "BTS Runner Test"], { cwd: root });
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "-m", "baseline"], { cwd: root });
    const migrationPath = join(root, "supabase/migrations/20260101000000_first.sql");
    const changedSql = "select 'silently changed';\n";
    writeFileSync(migrationPath, changedSql);
    writeFileSync(
      join(root, "scripts/bts-engineering/migration-checksums.json"),
      JSON.stringify({ schemaVersion: 1, algorithm: "sha256", migrations: { "20260101000000_first.sql": sha256(changedSql) } }),
    );
    const execute = async (command: string, args: string[], options: Parameters<typeof executeProcess>[2]) => {
      if (command === "git") return await executeProcess(command, args, options);
      const sql = args.includes("--file") ? readFileSync(args.at(-1)!, "utf8") : args.join(" ");
      if (sql.includes("BTS_TARGET_PROBE")) return ok("BTS_TARGET_PROBE|postgres|postgres\nBTS_MIGRATION|20260101000000\n");
      return ok("BTS_ENGINEERING_RESIDUE_ZERO\n");
    };
    const runner = createRunner({ repoRoot: root, config: config(), env: {}, execute });
    await assert.rejects(
      runner.preflight(),
      (error: unknown) => error instanceof RunnerError && error.code === "APPLIED_MIGRATION_MODIFIED",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("successful and failed-assertion verification both prove zero residue", async () => {
  const root = makeRunnerRepo();
  try {
    const childEnvironments: Array<NodeJS.ProcessEnv | undefined> = [];
    const execute = async (_command: string, args: string[], options: { env?: NodeJS.ProcessEnv }) => {
      childEnvironments.push(options.env);
      if (args.includes("--file")) {
        const file = args.at(-1) ?? "";
        if (file.endsWith("failure_rollback.sql")) return { code: 1, signal: null, stdout: "", stderr: "BTS_EXPECTED_ASSERTION_FAILURE" };
        if (file.endsWith("success_rollback.sql")) return { code: 1, signal: null, stdout: "", stderr: "BTS_VERIFICATION_PASSED_ROLLED_BACK" };
        return ok("BTS_ENGINEERING_RESIDUE_ZERO\n");
      }
      return ok("BTS_ENGINEERING_RESIDUE_ZERO\n");
    };
    const runner = createRunner({ repoRoot: root, config: config(), env: { SUPABASE_ACCESS_TOKEN: "must-not-propagate" }, execute });
    assert.equal((await runner.verify()).rolledBack, true);
    assert.equal((await runner.verify({ file: "supabase/tests/failure_rollback.sql", expectedFailure: true })).rolledBack, true);
    assert.equal(childEnvironments.every((env) => env?.SUPABASE_ACCESS_TOKEN === undefined), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ordinary command failures are surfaced as engineering failures", async () => {
  const root = makeRunnerRepo();
  try {
    const runner = createRunner({
      repoRoot: root,
      config: config(),
      env: {},
      execute: async () => ({ code: 2, signal: null, stdout: "", stderr: "simulated failure" }),
    });
    await assert.rejects(
      runner.preflight(),
      (error: unknown) => error instanceof RunnerError && error.code === "COMMAND_FAILED",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("smoke records both performance dimensions, avoids redundant migration inspection, and parallelizes safe work", async () => {
  const root = makeRunnerRepo();
  const messages: string[] = [];
  const originalLog = console.log;
  let active = 0;
  let maxActive = 0;
  let migrationInspections = 0;
  let residueChecks = 0;
  console.log = (message?: unknown) => { messages.push(String(message)); };
  try {
    const execute = async (command: string, args: string[]) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      try {
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 15));
        if (command === "git") return ok();
        if (args.includes("--dry-run")) return ok("Remote database is up to date.\n");
        if (args.includes("--file")) {
          const file = args.at(-1)!;
          if (file.endsWith("failure_rollback.sql")) return { code: 1, signal: null, stdout: "", stderr: "BTS_EXPECTED_ASSERTION_FAILURE" };
          if (file.endsWith("success_rollback.sql")) return { code: 1, signal: null, stdout: "", stderr: "BTS_VERIFICATION_PASSED_ROLLED_BACK" };
          const sql = readFileSync(file, "utf8");
          if (sql.includes("BTS_TARGET_PROBE")) {
            migrationInspections += 1;
            return ok("BTS_TARGET_PROBE|postgres|postgres\nBTS_MIGRATION|20260101000000\n");
          }
          if (sql.includes("BTS_ENGINEERING_RESIDUE_ZERO")) {
            residueChecks += 1;
            return ok("BTS_ENGINEERING_RESIDUE_ZERO\n");
          }
        }
        return ok();
      } finally {
        active -= 1;
      }
    };
    const runner = createRunner({ repoRoot: root, config: config(), env: {}, execute, runId: "performance-test" });
    const result = await runner.smokeDev({ humanApprovalsObserved: 1, privilegedBoundaryCrossingsObserved: 1 });
    assert.equal(result.status, "passed");
    assert.equal(result.performance.observations.humanApprovals, 1);
    assert.equal(result.performance.observations.privilegedBoundaryCrossings, 1);
    assert.equal(result.performance.processes.total, 9);
    assert.equal(result.performance.processes.supabase, 8);
    assert.equal(result.performance.processes.networkBoundary, 8);
    assert.equal(result.performance.checks.retries, 0);
    assert.equal(result.performance.checks.repeatedExecutions, 1);
    assert.equal(migrationInspections, 1);
    assert.equal(residueChecks, 2);
    assert.ok(maxActive >= 3, `expected safe parallel work, observed concurrency ${maxActive}`);
    assert.ok(result.performance.execution.parallelGroups.some((group: { name: string }) => group.name === "rollback verification"));
    const written = JSON.parse(readFileSync(join(root, ".bts-engineering/performance/latest.json"), "utf8"));
    assert.equal(written.processes.supabase, 8);
    assert.equal(messages.length, 2);
    assert.match(messages.at(-1)!, /approvals 1; boundary 1; Supabase 8; retries 0/);
    const observed = runner.observePerformance({
      humanApprovalsObserved: 1,
      privilegedBoundaryCrossingsObserved: 1,
      endToEndDurationMsObserved: 4_000,
    });
    assert.equal(observed.observations.endToEndDurationMs, 4_000);
    assert.equal(observed.observations.preLaunchBoundaryWaitMs, 4_000 - observed.durationMs);
    assert.match(messages.at(-1)!, /4\.0s end-to-end; approvals 1; boundary 1/);
  } finally {
    console.log = originalLog;
    rmSync(root, { recursive: true, force: true });
  }
});

test("unexpected checkpoint diffs are rejected", () => {
  assert.deepEqual(assertCheckpointPaths(["a.ts", "b.ts"], ["b.ts", "a.ts"]), ["a.ts", "b.ts"]);
  assert.throws(
    () => assertCheckpointPaths(["a.ts", "secret.txt"], ["a.ts"]),
    (error: unknown) => error instanceof RunnerError && error.code === "CHECKPOINT_REJECTED",
  );
});

test("checkpoint dry-run validates a real tracking repository without staging or committing", async () => {
  const temp = mkdtempSync(join(tmpdir(), "bts-checkpoint-test-"));
  const origin = join(temp, "origin.git");
  const work = join(temp, "work");
  try {
    execFileSync("git", ["init", "--bare", "--initial-branch=main", origin]);
    execFileSync("git", ["clone", origin, work]);
    execFileSync("git", ["config", "user.email", "runner@example.invalid"], { cwd: work });
    execFileSync("git", ["config", "user.name", "BTS Runner Test"], { cwd: work });
    writeFileSync(join(work, ".gitignore"), ".bts-engineering/\n");
    writeFileSync(join(work, "README.md"), "baseline\n");
    execFileSync("git", ["add", ".gitignore", "README.md"], { cwd: work });
    execFileSync("git", ["commit", "-m", "baseline"], { cwd: work });
    execFileSync("git", ["push", "-u", "origin", "main"], { cwd: work });

    writeFileSync(join(work, "intended.txt"), "reviewed change\n");
    writeFileSync(join(work, "unexpected.txt"), "unexpected change\n");
    const runner = createRunner({ repoRoot: work, config: config(), env: {} });
    await assert.rejects(runner.checkpoint({ paths: ["intended.txt"], message: "test: dry run", dryRun: true }), RunnerError);
    unlinkSync(join(work, "unexpected.txt"));
    const result = await runner.checkpoint({ paths: ["intended.txt"], message: "test: dry run", dryRun: true });
    assert.equal(result.dryRun, true);
    assert.match(execFileSync("git", ["status", "--porcelain"], { cwd: work, encoding: "utf8" }), /^\?\? intended\.txt/m);
    assert.equal(execFileSync("git", ["log", "-1", "--pretty=%s"], { cwd: work, encoding: "utf8" }).trim(), "baseline");
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("repository Codex config contains only supported, scoped safety settings", () => {
  const toml = readFileSync(new URL("../.codex/config.toml", import.meta.url), "utf8");
  assert.match(toml, /approval_policy = "on-request"/);
  assert.match(toml, /approvals_reviewer = "auto_review"/);
  assert.match(toml, /sandbox_mode = "workspace-write"/);
  assert.match(toml, /db\.fnnhosdwldjhyfoezkot\.supabase\.co/);
  assert.match(toml, /"github\.com" = "allow"/);
  assert.doesNotMatch(toml, /danger-full-access|dangerously_|SUPABASE_ACCESS_TOKEN|DATABASE_URL|[A-Z]:\\/i);
});
