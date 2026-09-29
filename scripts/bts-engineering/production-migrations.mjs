#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  RunnerError,
  executeProcess,
  migrationSha256,
  redact,
  sha256,
} from "./runner.mjs";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_REPO_ROOT = resolve(MODULE_DIR, "../..");

export const PRODUCTION_TARGET = Object.freeze({
  environment: "PRODUCTION",
  projectName: "bts-online-production",
  projectRef: "mzpwytbbijfbkuhvfihl",
  sessionPoolerHost: "aws-0-eu-central-1.pooler.supabase.com",
  canonicalDirectHost: "db.mzpwytbbijfbkuhvfihl.supabase.co",
  databasePort: 5432,
  databaseName: "postgres",
});

export const DEV_PROJECT_REF = "fnnhosdwldjhyfoezkot";
export const CANONICAL_REGISTRY_SHA256 = "491659adb8499f6148ee5be4d7d1a9bb8eb013439fd5dfa07a56346c1d7c3864";
export const CANONICAL_MIGRATION_NAMES = Object.freeze([
  "20260721_001_echowall_foundation.sql",
  "20260722_002_grant_echowall_service_role.sql",
  "20260723000000_echowall_admin_moderation.sql",
  "20260723010000_echowall_deleted_recovery.sql",
  "20260813000000_writing_foundation.sql",
  "20260813010000_writing_visual_editor.sql",
  "20260814000000_writing_comments_foundation.sql",
  "20260815000000_writing_account_identity.sql",
  "20260816000000_writing_comment_ownership_lifecycle.sql",
  "20260817000000_writing_comment_moderation.sql",
  "20260818000000_newsletter_subscription_foundation.sql",
  "20260819000000_newsletter_delivery.sql",
  "20260819010000_newsletter_delivery_runtime_fix.sql",
  "20260919000000_life_alignment_relationship_engine.sql",
  "20260919010000_life_alignment_relationship_runtime_fix.sql",
  "20260920000000_private_feedback.sql",
  "20260921000000_private_feedback_contact.sql",
  "20260922000000_life_alignment_expansion_rounds.sql",
  "20260924000000_contextual_result_feedback.sql",
  "20260927000000_writing_completion.sql",
  "20260927010000_writing_delete_account_events.sql",
  "20260927020000_writing_newsletter_preparation.sql",
  "20260927030000_writing_translation_generation.sql",
  "20260927040000_writing_translation_generation_claim_repair.sql",
  "20260929000000_harden_service_role_table_privileges.sql",
  "20260930000000_btshq_online_brand_rename.sql",
]);

const FORBIDDEN_ARGUMENTS = new Set([
  "--linked",
  "--include-all",
  "--include-seed",
  "repair",
  "reset",
]);

const DATABASE_PROBE_SQL = `select 'BTS_PRODUCTION_DATABASE|' || current_database() as result
union all
select 'BTS_PRODUCTION_LEDGER|' || case
  when to_regclass('supabase_migrations.schema_migrations') is null then 'absent'
  else 'present'
end as result;`;

const MIGRATION_HISTORY_SQL = `select 'BTS_PRODUCTION_MIGRATION|' || version as result
from supabase_migrations.schema_migrations
order by version;`;

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function migrationVersion(filename) {
  const match = filename.match(/^(\d+)_.*\.sql$/);
  if (!match) throw new RunnerError(`Invalid canonical migration filename: ${filename}`, "MIGRATION_INVALID");
  return match[1];
}

export function redactProduction(value, secrets = []) {
  return redact(value, secrets)
    .replace(/\bBTS_PRODUCTION_DATABASE_URL\s*=\s*\S+/gi, "BTS_PRODUCTION_DATABASE_URL=[REDACTED]")
    .replace(/\bBTS_BACKUP_DB_URL\s*=\s*\S+/gi, "BTS_BACKUP_DB_URL=[REDACTED]");
}

export function validateProductionDatabaseUrl(rawValue) {
  if (!rawValue) {
    throw new RunnerError("BTS_PRODUCTION_DATABASE_URL is missing", "MISSING_PRODUCTION_CREDENTIALS");
  }
  if (rawValue.toLowerCase().includes(DEV_PROJECT_REF)) {
    throw new RunnerError("DEV project identity is forbidden for the Production runner", "PRODUCTION_TARGET_REJECTED");
  }

  let url;
  try {
    url = new URL(rawValue);
  } catch {
    throw new RunnerError("BTS_PRODUCTION_DATABASE_URL is not a valid URL", "INVALID_PRODUCTION_CREDENTIALS");
  }

  if (url.protocol !== "postgresql:") {
    throw new RunnerError("Production database URL must use postgresql", "PRODUCTION_TARGET_REJECTED");
  }
  if (url.hostname.toLowerCase() !== PRODUCTION_TARGET.sessionPoolerHost) {
    throw new RunnerError("Production database host is not the pinned Session Pooler", "PRODUCTION_TARGET_REJECTED", {
      host: url.hostname.toLowerCase(),
    });
  }
  const port = url.port ? Number(url.port) : 5432;
  if (port !== PRODUCTION_TARGET.databasePort) {
    throw new RunnerError("Production Session Pooler port must be 5432", "PRODUCTION_TARGET_REJECTED", { port });
  }
  if (decodeURIComponent(url.pathname.replace(/^\//, "")) !== PRODUCTION_TARGET.databaseName) {
    throw new RunnerError("Production database name must be postgres", "PRODUCTION_TARGET_REJECTED");
  }

  const username = decodeURIComponent(url.username);
  const expectedUsername = `postgres.${PRODUCTION_TARGET.projectRef}`;
  if (username !== expectedUsername) {
    const suppliedRef = username.match(/^postgres\.([a-z0-9]+)$/i)?.[1] ?? "unknown";
    throw new RunnerError("Production Session Pooler username does not contain the pinned project ref", "PRODUCTION_TARGET_REJECTED", {
      suppliedRef,
    });
  }
  if (!url.password) {
    throw new RunnerError("Production database password is missing", "INVALID_PRODUCTION_CREDENTIALS");
  }
  const sslModes = url.searchParams.getAll("sslmode");
  if (sslModes.length !== 1 || sslModes[0]?.toLowerCase() !== "require") {
    throw new RunnerError("Production database URL must contain exactly sslmode=require", "PRODUCTION_TARGET_REJECTED");
  }
  if (url.hash) {
    throw new RunnerError("Production database URL fragments are not permitted", "PRODUCTION_TARGET_REJECTED");
  }

  return {
    url: url.toString(),
    password: decodeURIComponent(url.password),
    databaseHost: url.hostname.toLowerCase(),
    projectRef: PRODUCTION_TARGET.projectRef,
    connectionMode: "session_pooler",
    port,
  };
}

export function productionChildEnvironment(base = process.env) {
  const env = { ...base, SUPABASE_TELEMETRY_DISABLED: "1", NEXT_TELEMETRY_DISABLED: "1" };
  for (const key of Object.keys(env)) {
    if (/^(?:DATABASE_URL|BTS_BACKUP_DB_URL|BTS_PRODUCTION_DATABASE_URL|SUPABASE_ACCESS_TOKEN|SUPABASE_DB_URL|PGPASSWORD)$/i.test(key)) {
      delete env[key];
    }
  }
  return env;
}

export function assertProductionArgumentsSafe(args) {
  const normalized = args.map((value) => String(value).toLowerCase());
  const forbidden = normalized.find((value) => FORBIDDEN_ARGUMENTS.has(value));
  if (forbidden) {
    throw new RunnerError(`Forbidden Production migration argument: ${forbidden}`, "PRODUCTION_COMMAND_REJECTED");
  }
  if (normalized.includes("migration") && normalized.includes("repair")) {
    throw new RunnerError("Migration repair is forbidden in the Production runner", "PRODUCTION_COMMAND_REJECTED");
  }
  return true;
}

export function validateCanonicalMigrationSet(repoRoot = DEFAULT_REPO_ROOT) {
  const checksumPath = join(repoRoot, "scripts/bts-engineering/migration-checksums.json");
  const migrationDir = join(repoRoot, "supabase/migrations");
  const registryBytes = readFileSync(checksumPath);
  if (migrationSha256(registryBytes) !== CANONICAL_REGISTRY_SHA256) {
    throw new RunnerError("Production migration checksum registry drifted", "PRODUCTION_REGISTRY_DRIFT");
  }

  const registry = JSON.parse(registryBytes.toString("utf8"));
  if (registry.schemaVersion !== 1 || registry.algorithm !== "sha256" || typeof registry.migrations !== "object") {
    throw new RunnerError("Production migration checksum registry contract is invalid", "PRODUCTION_REGISTRY_DRIFT");
  }

  const registryNames = Object.keys(registry.migrations).sort();
  const diskNames = readdirSync(migrationDir).filter((name) => name.endsWith(".sql")).sort();
  if (!arraysEqual(registryNames, CANONICAL_MIGRATION_NAMES) || !arraysEqual(diskNames, CANONICAL_MIGRATION_NAMES)) {
    throw new RunnerError(`Production migration filename chain is not the exact canonical ${CANONICAL_MIGRATION_NAMES.length}-file set`, "PRODUCTION_MIGRATION_SET_DRIFT", {
      expectedCount: CANONICAL_MIGRATION_NAMES.length,
      registryCount: registryNames.length,
      diskCount: diskNames.length,
    });
  }

  const migrations = CANONICAL_MIGRATION_NAMES.map((name) => {
    const hash = migrationSha256(readFileSync(join(migrationDir, name)));
    if (registry.migrations[name] !== hash) {
      throw new RunnerError("Production migration checksum drifted", "PRODUCTION_MIGRATION_CHECKSUM_DRIFT", { name });
    }
    return { name, version: migrationVersion(name), hash };
  });
  return migrations;
}

export function parseRemoteProductionMigrations(output) {
  const versions = [];
  for (const match of String(output).matchAll(/BTS_PRODUCTION_MIGRATION\|([0-9]+)/g)) {
    if (versions.includes(match[1])) {
      throw new RunnerError("Remote migration history contains a duplicate version", "PRODUCTION_REMOTE_HISTORY_INVALID", {
        version: match[1],
      });
    }
    versions.push(match[1]);
  }
  return versions;
}

export function validateRemoteProductionHistory(remoteVersions, migrations) {
  const localVersions = migrations.map(({ version }) => version);
  const unknown = remoteVersions.filter((version) => !localVersions.includes(version));
  if (unknown.length) {
    throw new RunnerError("Production contains unknown migration versions", "PRODUCTION_REMOTE_UNKNOWN_MIGRATION", { unknown });
  }
  const expectedPrefix = localVersions.slice(0, remoteVersions.length);
  if (!arraysEqual(remoteVersions, expectedPrefix)) {
    throw new RunnerError("Production migration history is not an exact canonical prefix", "PRODUCTION_REMOTE_HISTORY_GAPPED", {
      remoteVersions,
    });
  }
  return {
    applied: migrations.slice(0, remoteVersions.length),
    pending: migrations.slice(remoteVersions.length),
  };
}

export function parseDryRunMigrationNames(output, migrations) {
  const text = String(output);
  const discovered = migrations
    .filter(({ name, version }) => text.includes(name) || new RegExp(`(?:^|[^0-9])${version}(?:[^0-9]|$)`).test(text))
    .map(({ name }) => name);
  const unknown = [...text.matchAll(/\b([0-9]+_[A-Za-z0-9][A-Za-z0-9_.-]*\.sql)\b/g)]
    .map((match) => match[1])
    .filter((name) => !CANONICAL_MIGRATION_NAMES.includes(name));
  if (unknown.length) {
    throw new RunnerError("Production dry-run exposed an unknown migration", "PRODUCTION_DRY_RUN_UNKNOWN_MIGRATION", { unknown });
  }
  return discovered;
}

export function requireExactPendingSuffix(actualNames, expectedMigrations) {
  const expectedNames = expectedMigrations.map(({ name }) => name);
  if (!arraysEqual(actualNames, expectedNames)) {
    throw new RunnerError("Production dry-run pending set is not the exact canonical suffix", "PRODUCTION_DRY_RUN_MISMATCH", {
      expected: expectedNames,
      actual: actualNames,
    });
  }
  return true;
}

export function expectedApplyConfirmation(manifestSha256) {
  return `APPLY PRODUCTION ${PRODUCTION_TARGET.projectName} ${PRODUCTION_TARGET.projectRef} ${PRODUCTION_TARGET.canonicalDirectHost} ${manifestSha256}`;
}

export function validateManifestBoundConfirmation(confirmation, manifestSha256) {
  const expected = expectedApplyConfirmation(manifestSha256);
  if (!confirmation || confirmation !== expected) {
    throw new RunnerError("Exact manifest-bound Production apply confirmation is required", "PRODUCTION_APPLY_GATE_REQUIRED");
  }
  return true;
}

export function parseProductionArgs(argv) {
  assertProductionArgumentsSafe(argv);
  const [command, ...rest] = argv;
  if (command === "dry-run" && rest.length === 0) return { command, options: {} };
  if (command === "apply" && rest.length === 2 && rest[0] === "--confirmation" && rest[1]) {
    return { command, options: { confirmation: rest[1] } };
  }
  throw new RunnerError(
    "Usage: production-migrations.mjs <dry-run|apply --confirmation \"APPLY PRODUCTION ... <manifest-sha256>\">",
    "PRODUCTION_ARGUMENT_INVALID",
  );
}

export function createProductionMigrationRunner(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? DEFAULT_REPO_ROOT);
  const stateRoot = resolve(options.stateRoot ?? join(repoRoot, ".bts-engineering/production"));
  const execute = options.execute ?? executeProcess;
  const baseEnvironment = options.env ?? process.env;
  const now = options.now ?? (() => new Date());
  const timeoutMs = options.timeoutMs ?? 120_000;
  const secrets = new Set();

  function databaseTarget() {
    const raw = baseEnvironment.BTS_PRODUCTION_DATABASE_URL;
    const target = validateProductionDatabaseUrl(raw);
    secrets.add(raw);
    secrets.add(target.url);
    secrets.add(target.password);
    return target;
  }

  async function runSupabase(args, label) {
    assertProductionArgumentsSafe(args);
    const cliPath = join(repoRoot, "node_modules/supabase/dist/supabase.js");
    if (!existsSync(cliPath)) throw new RunnerError("Required local Supabase CLI is missing", "PRODUCTION_TOOL_MISSING");
    const result = await execute(process.execPath, [cliPath, ...args], {
      cwd: repoRoot,
      env: productionChildEnvironment(baseEnvironment),
      timeoutMs,
    });
    if (result.code !== 0) {
      throw new RunnerError(`${label} failed`, "PRODUCTION_COMMAND_FAILED", {
        code: result.code,
        output: redactProduction(`${result.stdout}\n${result.stderr}`, [...secrets]).slice(-4_000),
      });
    }
    return result;
  }

  async function query(target, sql, label) {
    const tempRoot = join(stateRoot, "tmp");
    mkdirSync(tempRoot, { recursive: true });
    const file = join(tempRoot, `${randomUUID()}.sql`);
    writeFileSync(file, `${sql.trim()}\n`, "utf8");
    try {
      return await runSupabase(["db", "query", "--db-url", target.url, "--file", file], label);
    } finally {
      rmSync(file, { force: true });
    }
  }

  async function inspectRemoteHistory(target, migrations) {
    const probe = await query(target, DATABASE_PROBE_SQL, "Production migration-ledger probe");
    const probeOutput = `${probe.stdout}\n${probe.stderr}`;
    if (!probeOutput.includes("BTS_PRODUCTION_DATABASE|postgres")) {
      throw new RunnerError("Production database identity probe failed", "PRODUCTION_TARGET_REJECTED");
    }
    const ledgerAbsent = probeOutput.includes("BTS_PRODUCTION_LEDGER|absent");
    const ledgerPresent = probeOutput.includes("BTS_PRODUCTION_LEDGER|present");
    if (ledgerAbsent === ledgerPresent) {
      throw new RunnerError("Production migration ledger state was ambiguous", "PRODUCTION_REMOTE_HISTORY_INVALID");
    }
    const remoteVersions = ledgerAbsent
      ? []
      : parseRemoteProductionMigrations(`${(await query(target, MIGRATION_HISTORY_SQL, "Production migration history inspection")).stdout}`);
    return { remoteVersions, ...validateRemoteProductionHistory(remoteVersions, migrations) };
  }

  async function migrationDryRun(target, migrations, expectedPending) {
    const result = await runSupabase(["db", "push", "--db-url", target.url, "--dry-run"], "Production migration dry-run");
    const output = `${result.stdout}\n${result.stderr}`;
    const actualPending = parseDryRunMigrationNames(output, migrations);
    requireExactPendingSuffix(actualPending, expectedPending);
    return { actualPending, outputHash: sha256(redactProduction(output, [...secrets])) };
  }

  function manifestContents(target, migrations, history, createdAt) {
    return {
      schemaVersion: 1,
      environment: PRODUCTION_TARGET.environment,
      projectName: PRODUCTION_TARGET.projectName,
      projectRef: PRODUCTION_TARGET.projectRef,
      databaseHost: target.databaseHost,
      canonicalDirectHost: PRODUCTION_TARGET.canonicalDirectHost,
      connectionMode: target.connectionMode,
      migrations: migrations.map(({ name, hash }) => ({ filename: name, sha256: hash })),
      applied: history.applied.map(({ name }) => name),
      pending: history.pending.map(({ name }) => name),
      createdAt: createdAt.toISOString(),
    };
  }

  function writeManifest(target, migrations, history) {
    const manifest = manifestContents(target, migrations, history, now());
    const bytes = `${JSON.stringify(manifest, null, 2)}\n`;
    if (redactProduction(bytes, [...secrets]) !== bytes) {
      throw new RunnerError("Production manifest contained credential-shaped data", "PRODUCTION_MANIFEST_REJECTED");
    }
    const manifestSha256 = sha256(bytes);
    const manifestDir = join(stateRoot, "manifests");
    const timestamp = manifest.createdAt.replace(/[:.]/g, "-");
    const manifestPath = join(manifestDir, `${timestamp}-${manifestSha256}.json`);
    mkdirSync(manifestDir, { recursive: true });
    writeFileSync(manifestPath, bytes, "utf8");
    const pointerPath = join(stateRoot, "latest-manifest.json");
    writeFileSync(pointerPath, `${JSON.stringify({ manifestPath, manifestSha256 }, null, 2)}\n`, "utf8");
    return { manifest, manifestPath, manifestSha256 };
  }

  function loadLatestManifest() {
    const pointerPath = join(stateRoot, "latest-manifest.json");
    if (!existsSync(pointerPath)) {
      throw new RunnerError("A Production dry-run manifest is required", "PRODUCTION_APPLY_GATE_REQUIRED");
    }
    const pointer = JSON.parse(readFileSync(pointerPath, "utf8"));
    const manifestPath = resolve(pointer.manifestPath ?? "");
    const allowedRoot = resolve(join(stateRoot, "manifests"));
    if (!manifestPath.startsWith(`${allowedRoot}\\`) && !manifestPath.startsWith(`${allowedRoot}/`)) {
      throw new RunnerError("Production manifest path escaped the evidence directory", "PRODUCTION_APPLY_GATE_REQUIRED");
    }
    const bytes = readFileSync(manifestPath, "utf8");
    const manifestSha256 = sha256(bytes);
    if (manifestSha256 !== pointer.manifestSha256) {
      throw new RunnerError("Production manifest hash does not match the recorded gate", "PRODUCTION_APPLY_GATE_REQUIRED");
    }
    return { manifest: JSON.parse(bytes), manifestPath, manifestSha256 };
  }

  async function dryRun() {
    const target = databaseTarget();
    const migrations = validateCanonicalMigrationSet(repoRoot);
    const history = await inspectRemoteHistory(target, migrations);
    const dryRunResult = await migrationDryRun(target, migrations, history.pending);
    const evidence = writeManifest(target, migrations, history);
    return {
      status: "ready-for-manifest-bound-apply",
      ...evidence,
      remoteVersions: history.remoteVersions,
      pending: dryRunResult.actualPending,
      dryRunOutputHash: dryRunResult.outputHash,
      confirmation: expectedApplyConfirmation(evidence.manifestSha256),
    };
  }

  async function apply({ confirmation } = {}) {
    const evidence = loadLatestManifest();
    validateManifestBoundConfirmation(confirmation, evidence.manifestSha256);
    const target = databaseTarget();
    const migrations = validateCanonicalMigrationSet(repoRoot);
    const expectedMigrations = migrations.map(({ name, hash }) => ({ filename: name, sha256: hash }));
    if (
      evidence.manifest.environment !== PRODUCTION_TARGET.environment
      || evidence.manifest.projectName !== PRODUCTION_TARGET.projectName
      || evidence.manifest.projectRef !== PRODUCTION_TARGET.projectRef
      || evidence.manifest.databaseHost !== target.databaseHost
      || evidence.manifest.canonicalDirectHost !== PRODUCTION_TARGET.canonicalDirectHost
      || evidence.manifest.connectionMode !== target.connectionMode
      || JSON.stringify(evidence.manifest.migrations) !== JSON.stringify(expectedMigrations)
    ) {
      throw new RunnerError("Production manifest no longer matches the pinned target or migration chain", "PRODUCTION_APPLY_GATE_REQUIRED");
    }
    const history = await inspectRemoteHistory(target, migrations);
    const currentApplied = history.applied.map(({ name }) => name);
    const currentPending = history.pending.map(({ name }) => name);
    if (!arraysEqual(currentApplied, evidence.manifest.applied) || !arraysEqual(currentPending, evidence.manifest.pending)) {
      throw new RunnerError("Production migration state changed after manifest generation", "PRODUCTION_APPLY_GATE_REQUIRED");
    }
    await migrationDryRun(target, migrations, history.pending);
    await runSupabase(["db", "push", "--db-url", target.url], "Manifest-bound Production migration apply");
    return { applied: currentPending, manifestSha256: evidence.manifestSha256 };
  }

  return {
    repoRoot,
    stateRoot,
    databaseTarget,
    inspectRemoteHistory,
    migrationDryRun,
    dryRun,
    apply,
  };
}

export async function main(argv = process.argv.slice(2)) {
  const { command, options } = parseProductionArgs(argv);
  const runner = createProductionMigrationRunner();
  if (command === "dry-run") {
    const result = await runner.dryRun();
    const relPath = relative(runner.repoRoot, result.manifestPath).replaceAll("\\", "/");
    console.log(JSON.stringify({
      status: result.status,
      manifestPath: relPath,
      manifestSha256: result.manifestSha256,
      applied: result.manifest.applied,
      pending: result.pending,
      confirmation: result.confirmation,
    }, null, 2));
    return result;
  }
  if (command === "apply") return await runner.apply(options);
  throw new RunnerError("Unknown Production migration command", "PRODUCTION_ARGUMENT_INVALID");
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const code = error instanceof RunnerError ? error.code : "UNEXPECTED_ERROR";
    const secret = process.env.BTS_PRODUCTION_DATABASE_URL;
    console.error(`PRODUCTION MIGRATION RUNNER FAILED — ${code}: ${redactProduction(error.message, [secret])}`);
    if (error instanceof RunnerError && Object.keys(error.details).length) {
      console.error(redactProduction(JSON.stringify(error.details), [secret]));
    }
    process.exitCode = 1;
  });
}
