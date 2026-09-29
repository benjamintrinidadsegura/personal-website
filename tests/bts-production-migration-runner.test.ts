import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  CANONICAL_MIGRATION_NAMES,
  DEV_PROJECT_REF,
  PRODUCTION_TARGET,
  assertProductionArgumentsSafe,
  createProductionMigrationRunner,
  expectedApplyConfirmation,
  parseProductionArgs,
  productionChildEnvironment,
  redactProduction,
  requireExactPendingSuffix,
  validateCanonicalMigrationSet,
  validateManifestBoundConfirmation,
  validateProductionDatabaseUrl,
  validateRemoteProductionHistory,
} from "../scripts/bts-engineering/production-migrations.mjs";
import { RunnerError, sha256 } from "../scripts/bts-engineering/runner.mjs";

const REPO_ROOT = join(import.meta.dirname, "..");
const PASSWORD = "production-runner-test-password";
const PRODUCTION_URL = [
  `postgresql://postgres.${PRODUCTION_TARGET.projectRef}`,
  `${PASSWORD}@${PRODUCTION_TARGET.sessionPoolerHost}:5432/postgres?sslmode=require`,
].join(":");

function migrationRecords() {
  return CANONICAL_MIGRATION_NAMES.map((name) => ({
    name,
    version: name.match(/^(\d+)_/)![1],
    hash: `hash-${name}`,
  }));
}

function expectCode(code: string) {
  return (error: unknown) => error instanceof RunnerError && error.code === code;
}

function makeCanonicalFixture() {
  const root = join(tmpdir(), `bts-production-runner-${crypto.randomUUID()}`);
  mkdirSync(join(root, "scripts/bts-engineering"), { recursive: true });
  mkdirSync(join(root, "supabase/migrations"), { recursive: true });
  writeFileSync(
    join(root, "scripts/bts-engineering/migration-checksums.json"),
    readFileSync(join(REPO_ROOT, "scripts/bts-engineering/migration-checksums.json")),
  );
  for (const name of CANONICAL_MIGRATION_NAMES) {
    writeFileSync(
      join(root, "supabase/migrations", name),
      readFileSync(join(REPO_ROOT, "supabase/migrations", name)),
    );
  }
  return root;
}

test("Production URL accepts only the pinned Session Pooler identity", () => {
  const target = validateProductionDatabaseUrl(PRODUCTION_URL);
  assert.equal(target.projectRef, PRODUCTION_TARGET.projectRef);
  assert.equal(target.databaseHost, PRODUCTION_TARGET.sessionPoolerHost);
  assert.equal(target.connectionMode, "session_pooler");
  assert.equal(target.port, 5432);
});

test("Production URL rejects the DEV project ref", () => {
  const value = [
    `postgresql://postgres.${DEV_PROJECT_REF}`,
    `${PASSWORD}@${PRODUCTION_TARGET.sessionPoolerHost}:5432/postgres?sslmode=require`,
  ].join(":");
  assert.throws(() => validateProductionDatabaseUrl(value), expectCode("PRODUCTION_TARGET_REJECTED"));
});

test("Production URL rejects an unknown project ref", () => {
  const value = [
    "postgresql://postgres.aaaaaaaaaaaaaaaaaaaa",
    `${PASSWORD}@${PRODUCTION_TARGET.sessionPoolerHost}:5432/postgres?sslmode=require`,
  ].join(":");
  assert.throws(() => validateProductionDatabaseUrl(value), expectCode("PRODUCTION_TARGET_REJECTED"));
});

test("Production URL rejects the wrong host", () => {
  const value = [
    `postgresql://postgres.${PRODUCTION_TARGET.projectRef}`,
    `${PASSWORD}@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require`,
  ].join(":");
  assert.throws(() => validateProductionDatabaseUrl(value), expectCode("PRODUCTION_TARGET_REJECTED"));
});

test("Production URL rejects missing sslmode=require and non-PostgreSQL URLs", () => {
  const withoutSsl = [
    `postgresql://postgres.${PRODUCTION_TARGET.projectRef}`,
    `${PASSWORD}@${PRODUCTION_TARGET.sessionPoolerHost}:5432/postgres`,
  ].join(":");
  const https = `https://${PRODUCTION_TARGET.sessionPoolerHost}/postgres?sslmode=require`;
  assert.throws(() => validateProductionDatabaseUrl(withoutSsl), expectCode("PRODUCTION_TARGET_REJECTED"));
  assert.throws(() => validateProductionDatabaseUrl(https), expectCode("PRODUCTION_TARGET_REJECTED"));
});

test("Production credential redaction removes the URL, password, and credential-bearing assignment", () => {
  const text = `BTS_PRODUCTION_DATABASE_URL=${PRODUCTION_URL} failed with ${PASSWORD}`;
  const redacted = redactProduction(text, [PRODUCTION_URL, PASSWORD]);
  assert.doesNotMatch(redacted, new RegExp(PASSWORD));
  assert.equal(redacted.includes(PRODUCTION_URL), false);
  assert.match(redacted, /BTS_PRODUCTION_DATABASE_URL=\[REDACTED\]/);
});

test("Production child environment removes all database credentials and access tokens", () => {
  const base: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
    PATH: "safe",
    BTS_PRODUCTION_DATABASE_URL: PRODUCTION_URL,
    BTS_BACKUP_DB_URL: "forbidden",
    DATABASE_URL: "forbidden",
    SUPABASE_ACCESS_TOKEN: "forbidden",
    PGPASSWORD: "forbidden",
  };
  const env = productionChildEnvironment(base) as NodeJS.ProcessEnv;
  assert.equal(env["PATH"], "safe");
  assert.equal(env["BTS_PRODUCTION_DATABASE_URL"], undefined);
  assert.equal(env["BTS_BACKUP_DB_URL"], undefined);
  assert.equal(env["DATABASE_URL"], undefined);
  assert.equal(env["SUPABASE_ACCESS_TOKEN"], undefined);
  assert.equal(env["PGPASSWORD"], undefined);
});

test("empty remote history is accepted and leaves all 26 migrations pending", () => {
  const result = validateRemoteProductionHistory([], migrationRecords());
  assert.equal(result.applied.length, 0);
  assert.deepEqual(result.pending.map(({ name }: { name: string }) => name), CANONICAL_MIGRATION_NAMES);
});

test("an exact remote prefix is accepted", () => {
  const migrations = migrationRecords();
  const result = validateRemoteProductionHistory(migrations.slice(0, 4).map(({ version }) => version), migrations);
  assert.equal(result.applied.length, 4);
  assert.deepEqual(result.pending, migrations.slice(4));
});

test("a gapped remote history is rejected", () => {
  const migrations = migrationRecords();
  assert.throws(
    () => validateRemoteProductionHistory([migrations[0].version, migrations[2].version], migrations),
    expectCode("PRODUCTION_REMOTE_HISTORY_GAPPED"),
  );
});

test("an unknown remote migration is rejected", () => {
  assert.throws(
    () => validateRemoteProductionHistory(["19990101000000"], migrationRecords()),
    expectCode("PRODUCTION_REMOTE_UNKNOWN_MIGRATION"),
  );
});

test("the canonical registry and exact 26-file chain pass integrity", () => {
  const migrations = validateCanonicalMigrationSet(REPO_ROOT);
  assert.equal(migrations.length, 26);
  assert.deepEqual(migrations.map(({ name }: { name: string }) => name), CANONICAL_MIGRATION_NAMES);
});

test("migration checksum drift is rejected", () => {
  const root = makeCanonicalFixture();
  try {
    const first = join(root, "supabase/migrations", CANONICAL_MIGRATION_NAMES[0]);
    writeFileSync(first, `${readFileSync(first, "utf8")}\n-- drift\n`);
    assert.throws(() => validateCanonicalMigrationSet(root), expectCode("PRODUCTION_MIGRATION_CHECKSUM_DRIFT"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("registry drift is rejected", () => {
  const root = makeCanonicalFixture();
  try {
    const registry = join(root, "scripts/bts-engineering/migration-checksums.json");
    writeFileSync(registry, `${readFileSync(registry, "utf8").trim()}\n\n`);
    assert.throws(() => validateCanonicalMigrationSet(root), expectCode("PRODUCTION_REGISTRY_DRIFT"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the pending migration list must be the exact canonical suffix", () => {
  const migrations = migrationRecords();
  const pending = migrations.slice(7);
  assert.equal(requireExactPendingSuffix(pending.map(({ name }) => name), pending), true);
  assert.throws(
    () => requireExactPendingSuffix(pending.slice(1).map(({ name }) => name), pending),
    expectCode("PRODUCTION_DRY_RUN_MISMATCH"),
  );
});

test("linked, include, repair, reset, and unknown CLI arguments are rejected", () => {
  for (const value of ["--linked", "--include-all", "--include-seed", "repair", "reset"]) {
    assert.throws(() => assertProductionArgumentsSafe([value]), expectCode("PRODUCTION_COMMAND_REJECTED"));
  }
  assert.throws(() => parseProductionArgs(["dry-run", "--unexpected"]), expectCode("PRODUCTION_ARGUMENT_INVALID"));
});

test("apply is impossible without the exact manifest-bound confirmation", () => {
  const manifestHash = "a".repeat(64);
  assert.throws(() => validateManifestBoundConfirmation(undefined, manifestHash), expectCode("PRODUCTION_APPLY_GATE_REQUIRED"));
  assert.throws(
    () => validateManifestBoundConfirmation(`${expectedApplyConfirmation(manifestHash)}-changed`, manifestHash),
    expectCode("PRODUCTION_APPLY_GATE_REQUIRED"),
  );
  assert.equal(validateManifestBoundConfirmation(expectedApplyConfirmation(manifestHash), manifestHash), true);
});

test("local Production dry-run simulation writes only a sanitized manifest and rejects unbound apply", async () => {
  const stateRoot = join(tmpdir(), `bts-production-state-${crypto.randomUUID()}`);
  const calls: string[][] = [];
  const childEnvironments: NodeJS.ProcessEnv[] = [];
  const execute = async (_command: string, args: string[], options: { env: NodeJS.ProcessEnv }) => {
    calls.push(args);
    childEnvironments.push(options.env);
    if (args.includes("--file")) {
      return {
        code: 0,
        signal: null,
        stdout: "BTS_PRODUCTION_DATABASE|postgres\nBTS_PRODUCTION_LEDGER|absent\n",
        stderr: "",
      };
    }
    if (args.includes("--dry-run")) {
      return { code: 0, signal: null, stdout: `${CANONICAL_MIGRATION_NAMES.join("\n")}\n`, stderr: "" };
    }
    throw new Error("unexpected apply invocation");
  };

  try {
    const runner = createProductionMigrationRunner({
      repoRoot: REPO_ROOT,
      stateRoot,
      env: { PATH: process.env.PATH, BTS_PRODUCTION_DATABASE_URL: PRODUCTION_URL },
      execute,
      now: () => new Date("2026-09-29T00:00:00.000Z"),
    });
    const result = await runner.dryRun();
    const bytes = readFileSync(result.manifestPath, "utf8");
    assert.equal(result.manifestSha256, sha256(bytes));
    assert.equal(result.manifest.environment, "PRODUCTION");
    assert.equal(result.manifest.pending.length, 26);
    assert.equal(bytes.includes(PASSWORD), false);
    assert.equal(bytes.includes(PRODUCTION_URL), false);
    assert.equal(calls.every((args) => args.includes("--db-url") && !args.includes("--linked")), true);
    assert.equal(childEnvironments.every((env) => env.BTS_PRODUCTION_DATABASE_URL === undefined), true);

    const callsBeforeApply = calls.length;
    await assert.rejects(
      runner.apply({ confirmation: `${result.confirmation}-wrong` }),
      expectCode("PRODUCTION_APPLY_GATE_REQUIRED"),
    );
    assert.equal(calls.length, callsBeforeApply);
  } finally {
    rmSync(stateRoot, { recursive: true, force: true });
  }
});
