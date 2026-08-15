#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_REPO_ROOT = resolve(MODULE_DIR, "../..");
const OPERATOR_STATUSES = new Set([
  "BTS PREFLIGHT PASSED",
  "MIGRATION APPROVAL REQUIRED",
  "BTS DEV VERIFICATION PASSED",
  "READY FOR HUMAN UX REVIEW",
  "READY TO CHECKPOINT",
  "BTS ENGINEERING BLOCK COMPLETE",
  "BTS PERFORMANCE OBSERVATION RECORDED",
  "BLOCKED — HUMAN DECISION REQUIRED",
  "FAILED — ENGINEERING ACTION REQUIRED",
]);
const FORBIDDEN_GIT_ARGUMENTS = /(^|\s)(--force(?:-|\s|$)|-f(?:\s|$)|--delete|reset|clean|checkout|restore|rebase|filter-branch|filter-repo)(\s|$)?/i;
const FORBIDDEN_SQL = [
  /\bbegin\s*;/i,
  /\bcommit\s*;/i,
  /\brollback\s*;/i,
  /\btruncate\b/i,
  /\bdrop\s+(database|schema|table|role)\b/i,
  /\balter\s+system\b/i,
  /\bcreate\s+extension\b/i,
  /\bcopy\b[\s\S]*\bprogram\b/i,
  /\bdblink\b/i,
  /\bpg_net\b/i,
  /\bhttp_(get|post|put|delete)\b/i,
  /\bcron\.schedule\b/i,
  /\\[a-z]/i,
];
const SECRET_PATH = /(^|\/)(\.env($|\.)|[^/]+\.(pem|key|p12|pfx)|id_(rsa|ed25519))$/i;
const SECRET_TEXT = [
  /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:SUPABASE_ACCESS_TOKEN|BREVO_API_KEY|DATABASE_URL)\s*=(?!=)\s*[^\s=]+/i,
  /\bsbp_[A-Za-z0-9_-]{20,}\b/,
];

export class RunnerError extends Error {
  constructor(message, code = "RUNNER_ERROR", details = {}) {
    super(message);
    this.name = "RunnerError";
    this.code = code;
    this.details = details;
  }
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function redact(value, secrets = []) {
  let text = String(value ?? "");
  for (const secret of secrets.filter(Boolean).sort((a, b) => b.length - a.length)) {
    text = text.split(secret).join("[REDACTED]");
  }
  return text
    .replace(/postgres(?:ql)?:\/\/[^\s'"<>]+/gi, "postgresql://[REDACTED]")
    .replace(/\b(SUPABASE_ACCESS_TOKEN|DATABASE_URL|BREVO_API_KEY)=\S+/gi, "$1=[REDACTED]")
    .replace(/\bsbp_[A-Za-z0-9_-]{20,}\b/g, "[REDACTED_TOKEN]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED_JWT]");
}

export function parseDotEnvValue(contents, key) {
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || match[1] !== key) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return value;
  }
  return undefined;
}

export function validateDatabaseUrl(rawValue, target) {
  if (!rawValue) throw new RunnerError("DATABASE_URL is missing", "MISSING_CREDENTIALS");
  let url;
  try {
    url = new URL(rawValue);
  } catch {
    throw new RunnerError("DATABASE_URL is not a valid URL", "INVALID_CREDENTIALS");
  }
  if (!new Set(["postgres:", "postgresql:"]).has(url.protocol)) {
    throw new RunnerError("DATABASE_URL must use PostgreSQL", "TARGET_REJECTED");
  }
  if (url.hostname.toLowerCase() !== target.databaseHost.toLowerCase()) {
    throw new RunnerError("Database hostname is not the pinned DEV target", "TARGET_REJECTED", { host: url.hostname });
  }
  if (!url.hostname.includes(target.projectRef)) {
    throw new RunnerError("Database hostname does not contain the pinned DEV project ref", "TARGET_REJECTED");
  }
  const port = url.port ? Number(url.port) : 5432;
  if (port !== target.databasePort) {
    throw new RunnerError("Database port is not permitted for the pinned DEV target", "TARGET_REJECTED", { port });
  }
  if (decodeURIComponent(url.pathname.replace(/^\//, "")) !== target.databaseName) {
    throw new RunnerError("Database name is not permitted for the pinned DEV target", "TARGET_REJECTED");
  }
  if (decodeURIComponent(url.username) !== "postgres" || !url.password) {
    throw new RunnerError("DATABASE_URL must contain the scoped DEV database credentials", "INVALID_CREDENTIALS");
  }
  if (target.environment !== "DEV" || !/-dev$/i.test(target.projectName)) {
    throw new RunnerError("Configured target is not explicitly DEV", "TARGET_REJECTED");
  }
  url.searchParams.set("sslmode", "require");
  return { url: url.toString(), password: decodeURIComponent(url.password), host: url.hostname, projectRef: target.projectRef };
}

export function migrationVersion(filename) {
  const match = filename.match(/^(\d+)_.*\.sql$/);
  if (!match) throw new RunnerError(`Invalid migration filename: ${filename}`, "MIGRATION_INVALID");
  return match[1];
}

export function parseRemoteMigrations(output) {
  const versions = new Set();
  for (const match of String(output).matchAll(/BTS_MIGRATION\|([0-9]+)/g)) versions.add(match[1]);
  return [...versions].sort();
}

export function validateVerificationSql(sql, { expectedFailure = false } = {}) {
  if (!/^\s*do\s+\$\$/i.test(sql) || !/\$\$\s*;\s*$/i.test(sql)) {
    throw new RunnerError("Verification SQL must be exactly one DO statement", "SQL_CONTRACT_REJECTED");
  }
  for (const pattern of FORBIDDEN_SQL) {
    if (pattern.test(sql)) throw new RunnerError(`Verification SQL contains a forbidden operation: ${pattern}`, "SQL_CONTRACT_REJECTED");
  }
  if (!expectedFailure && !sql.includes("BTS_VERIFICATION_PASSED_ROLLED_BACK")) {
    throw new RunnerError("Verification SQL is missing the rollback success sentinel", "SQL_CONTRACT_REJECTED");
  }
  return true;
}

export function assertNoSecrets(paths, repoRoot) {
  for (const path of paths) {
    const normalized = path.replaceAll("\\", "/");
    if (SECRET_PATH.test(normalized) && normalized !== ".env.example") {
      throw new RunnerError(`Secret-bearing path cannot be checkpointed: ${path}`, "CHECKPOINT_REJECTED");
    }
    const absolute = resolve(repoRoot, path);
    if (!existsSync(absolute) || statSync(absolute).isDirectory()) continue;
    const contents = readFileSync(absolute, "utf8");
    for (const pattern of SECRET_TEXT) {
      if (pattern.test(contents)) throw new RunnerError(`Credential-shaped content rejected in ${path}`, "CHECKPOINT_REJECTED");
    }
  }
}

export function assertCheckpointPaths(actualPaths, intendedPaths) {
  const actual = [...new Set(actualPaths.map((path) => path.replaceAll("\\", "/")))].sort();
  const intended = [...new Set(intendedPaths.map((path) => path.replaceAll("\\", "/")))].sort();
  const unexpected = actual.filter((path) => !intended.includes(path));
  const missing = intended.filter((path) => !actual.includes(path));
  if (unexpected.length || missing.length) {
    throw new RunnerError("Working tree does not match the intended checkpoint paths", "CHECKPOINT_REJECTED", { unexpected, missing });
  }
  for (const path of actual) {
    if (path.startsWith(".git/") || path.startsWith(".next/") || path.startsWith("node_modules/") || path.startsWith(".bts-engineering/")) {
      throw new RunnerError(`Generated or protected path rejected: ${path}`, "CHECKPOINT_REJECTED");
    }
  }
  return actual;
}

export function parseStatusPaths(output) {
  const paths = [];
  for (const line of String(output).split(/\r?\n/)) {
    if (!line) continue;
    if (line.length < 4) throw new RunnerError("Could not parse git status", "GIT_STATUS_INVALID");
    let path = line.slice(3).trim();
    if (path.includes(" -> ")) path = path.split(" -> ").at(-1);
    if (path.startsWith('"') && path.endsWith('"')) path = JSON.parse(path);
    paths.push(path.replaceAll("\\", "/"));
  }
  return paths;
}

function safeRelative(repoRoot, path) {
  const absolute = isAbsolute(path) ? resolve(path) : resolve(repoRoot, path);
  const rel = relative(repoRoot, absolute);
  if (!rel || rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel)) {
    throw new RunnerError("Path must be inside the repository", "PATH_REJECTED");
  }
  return rel.replaceAll("\\", "/");
}

export function safeChildEnvironment(base, { blankApplicationSecrets = false } = {}) {
  const env = { ...base, SUPABASE_TELEMETRY_DISABLED: "1", NEXT_TELEMETRY_DISABLED: "1" };
  delete env.SUPABASE_ACCESS_TOKEN;
  if (blankApplicationSecrets) {
    for (const key of Object.keys(env)) {
      if (/(_SECRET|_TOKEN|_KEY|DATABASE_URL|SUPABASE_URL|BREVO)/i.test(key)) delete env[key];
    }
    Object.assign(env, {
      SUPABASE_URL: "",
      SUPABASE_PUBLISHABLE_KEY: "",
      SUPABASE_SECRET_KEY: "",
      DATABASE_URL: "",
      BREVO_API_KEY: "",
    });
  }
  return env;
}

export async function executeProcess(command, args, options = {}) {
  if (command.toLowerCase().includes("git") && FORBIDDEN_GIT_ARGUMENTS.test(args.join(" "))) {
    throw new RunnerError("Destructive Git operation rejected", "DESTRUCTIVE_GIT_REJECTED");
  }
  const timeoutMs = options.timeoutMs ?? 120000;
  return await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const maxOutput = options.maxOutput ?? 2_000_000;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { if (stdout.length < maxOutput) stdout += chunk; });
    child.stderr.on("data", (chunk) => { if (stderr.length < maxOutput) stderr += chunk; });
    child.on("error", (error) => {
      clearTimeout(timer);
      rejectPromise(new RunnerError(`Could not start ${command}: ${error.message}`, "COMMAND_START_FAILED"));
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (timedOut) rejectPromise(new RunnerError(`${command} timed out`, "COMMAND_TIMEOUT", { stdout, stderr }));
      else resolvePromise({ code: code ?? -1, signal, stdout, stderr });
    });
  });
}

export function createRunner(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? DEFAULT_REPO_ROOT);
  const configPath = resolve(options.configPath ?? join(repoRoot, "scripts/bts-engineering/config.json"));
  const checksumPath = resolve(options.checksumPath ?? join(repoRoot, "scripts/bts-engineering/migration-checksums.json"));
  const config = options.config ?? readJson(configPath);
  const execute = options.execute ?? executeProcess;
  const baseEnvironment = options.env ?? process.env;
  const runId = options.runId ?? `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
  const stateRoot = resolve(options.stateRoot ?? join(repoRoot, ".bts-engineering"));
  const logPath = join(stateRoot, "logs", `${runId}.log`);
  const secrets = new Set();
  const clock = options.now ?? Date.now;
  const performanceStartedMs = clock();
  const processInvocations = [];
  const parallelGroups = [];
  const evidenceChecks = [];
  const retries = [];
  let commandCount = 0;

  function log(message) {
    mkdirSync(dirname(logPath), { recursive: true });
    appendFileSync(logPath, `${new Date().toISOString()} ${redact(message, [...secrets])}\n`, "utf8");
  }

  function status(name, detail) {
    if (!OPERATOR_STATUSES.has(name)) throw new RunnerError(`Unknown operator status: ${name}`, "STATUS_INVALID");
    console.log(detail ? `${name} — ${detail}` : name);
    log(detail ? `${name} — ${detail}` : name);
  }

  async function run(command, args, runOptions = {}) {
    commandCount += 1;
    const startedMs = clock();
    log(`RUN ${command} ${args.map((arg) => redact(arg, [...secrets])).join(" ")}`);
    let result;
    try {
      result = await execute(command, args, {
        cwd: repoRoot,
        env: runOptions.env ?? safeChildEnvironment(baseEnvironment, runOptions),
        timeoutMs: runOptions.timeoutMs,
      });
    } catch (error) {
      processInvocations.push({
        label: runOptions.label ?? command,
        tool: runOptions.tool ?? "process",
        networkBoundary: Boolean(runOptions.networkBoundary),
        durationMs: Math.max(0, clock() - startedMs),
        outcome: "failed-to-complete",
      });
      throw error;
    }
    processInvocations.push({
      label: runOptions.label ?? command,
      tool: runOptions.tool ?? "process",
      networkBoundary: Boolean(runOptions.networkBoundary),
      durationMs: Math.max(0, clock() - startedMs),
      outcome: result.code === 0 ? "passed" : "nonzero",
    });
    log(`EXIT ${result.code}\n${result.stdout}\n${result.stderr}`);
    if (result.code !== 0 && !runOptions.allowFailure) {
      throw new RunnerError(`${runOptions.label ?? command} failed`, "COMMAND_FAILED", {
        code: result.code,
        output: redact(`${result.stdout}\n${result.stderr}`, [...secrets]).slice(-4000),
      });
    }
    return result;
  }

  function localTool(name) {
    const javascriptEntries = {
      tsx: "node_modules/tsx/dist/cli.mjs",
      tsc: "node_modules/typescript/bin/tsc",
      eslint: "node_modules/eslint/bin/eslint.js",
      next: "node_modules/next/dist/bin/next",
    };
    if (javascriptEntries[name]) {
      const script = join(repoRoot, javascriptEntries[name]);
      if (!existsSync(script)) throw new RunnerError(`Required local executable is missing: ${name}`, "TOOL_MISSING");
      return { command: process.execPath, prefix: [script] };
    }
    if (name === "supabase") {
      const script = join(repoRoot, "node_modules/supabase/dist/supabase.js");
      if (!existsSync(script)) throw new RunnerError("Required local executable is missing: supabase", "TOOL_MISSING");
      return { command: process.execPath, prefix: [script] };
    }
    throw new RunnerError(`Unsupported local executable: ${name}`, "TOOL_MISSING");
  }

  async function runTool(name, args, runOptions = {}) {
    const tool = localTool(name);
    return await run(tool.command, [...tool.prefix, ...args], {
      ...runOptions,
      tool: name,
      networkBoundary: name === "supabase",
    });
  }

  async function runParallel(name, operations, reason) {
    const startedMs = clock();
    const results = await Promise.allSettled(operations.map(({ run: operation }) => operation()));
    parallelGroups.push({
      name,
      operations: operations.map(({ name: operationName }) => operationName),
      reason,
      durationMs: Math.max(0, clock() - startedMs),
    });
    const failure = results.find((result) => result.status === "rejected");
    if (failure) throw failure.reason;
    return results.map((result) => result.value);
  }

  function recordEvidenceCheck(name, reason) {
    evidenceChecks.push({ name, reason });
  }

  function databaseTarget() {
    const envPath = join(repoRoot, ".env.local");
    const raw = baseEnvironment.DATABASE_URL || (existsSync(envPath) ? parseDotEnvValue(readFileSync(envPath, "utf8"), "DATABASE_URL") : undefined);
    const target = validateDatabaseUrl(raw, config.target);
    secrets.add(raw);
    secrets.add(target.url);
    secrets.add(target.password);
    return target;
  }

  function blankBuildEnvironment() {
    const env = safeChildEnvironment(baseEnvironment, { blankApplicationSecrets: true });
    const envPath = join(repoRoot, ".env.local");
    if (existsSync(envPath)) {
      for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
        const match = rawLine.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
        if (match) env[match[1]] = "";
      }
    }
    return env;
  }

  function localMigrations() {
    const migrationDir = join(repoRoot, "supabase/migrations");
    return readdirSync(migrationDir)
      .filter((name) => name.endsWith(".sql"))
      .sort()
      .map((name) => ({ name, version: migrationVersion(name), hash: sha256(readFileSync(join(migrationDir, name))) }));
  }

  function validateMigrationIntegrity() {
    const lock = readJson(checksumPath);
    const migrations = localMigrations();
    const actualNames = migrations.map(({ name }) => name);
    const lockedNames = Object.keys(lock.migrations).sort();
    const missing = actualNames.filter((name) => !lockedNames.includes(name));
    const removed = lockedNames.filter((name) => !actualNames.includes(name));
    const changed = migrations.filter(({ name, hash }) => lock.migrations[name] && lock.migrations[name] !== hash).map(({ name }) => name);
    if (missing.length || removed.length || changed.length) {
      throw new RunnerError("Migration checksum registry is not synchronized", "MIGRATION_INTEGRITY_FAILED", { missing, removed, changed });
    }
    return migrations;
  }

  function verificationFile(input, expectedFailure = false) {
    const rel = safeRelative(repoRoot, input);
    if (!rel.startsWith("supabase/tests/") || !rel.endsWith(".sql")) {
      throw new RunnerError("Verification SQL must be a repository Supabase test file", "PATH_REJECTED");
    }
    const absolute = join(repoRoot, rel);
    if (!existsSync(absolute)) throw new RunnerError(`Verification file does not exist: ${rel}`, "PATH_REJECTED");
    validateVerificationSql(readFileSync(absolute, "utf8"), { expectedFailure });
    return { rel, absolute, hash: sha256(readFileSync(absolute)) };
  }

  const residueSql = `select 'BTS_ENGINEERING_RESIDUE_ZERO' as result\nwhere not exists (select 1 from public.writing_articles where slug like 'bts-engineering-%' or slug like 'codex-newsletter-rollback-%')\n  and not exists (select 1 from public.newsletter_subscribers where email like 'bts-engineering-%@example.invalid' or email like 'rollback-newsletter-%@example.invalid');`;
  const migrationSql = `select 'BTS_TARGET_PROBE|' || current_database() || '|' || current_user as result\nunion all\nselect 'BTS_MIGRATION|' || version as result from supabase_migrations.schema_migrations;`;

  async function query(target, sql, label, runOptions = {}) {
    const tempRoot = join(stateRoot, "tmp");
    mkdirSync(tempRoot, { recursive: true });
    const file = join(tempRoot, `${randomUUID()}.sql`);
    writeFileSync(file, `${sql.trim()}\n`, "utf8");
    try {
      return await runTool("supabase", ["db", "query", "--db-url", target.url, "--file", file], {
        timeoutMs: config.timeoutsMs.databaseCommand,
        label,
        ...runOptions,
      });
    } finally {
      rmSync(file, { force: true });
    }
  }

  async function checkResidue(target, { allowFailure = false, reason = "prove zero verification residue" } = {}) {
    recordEvidenceCheck("DEV residue", reason);
    const result = await query(target, residueSql, `DEV residue check: ${reason}`, { allowFailure });
    return result.code === 0 && `${result.stdout}\n${result.stderr}`.includes(config.verification.residueSentinel);
  }

  async function inspectMigrations(target) {
    const local = validateMigrationIntegrity();
    recordEvidenceCheck("DEV migration history", "establish the pinned remote/local migration state before any gate");
    const [probe, migrationStatus] = await runParallel("migration evidence", [
      { name: "remote migration history", run: () => query(target, migrationSql, "DEV migration inspection") },
      {
        name: "local applied-migration immutability",
        run: () => run("git", ["status", "--porcelain=v1", "--untracked-files=all", "--", "supabase/migrations"], {
          timeoutMs: config.timeoutsMs.git,
          label: "applied migration immutability check",
        }),
      },
    ], "the remote read and local Git inspection are independent and read-only");
    const probeOutput = `${probe.stdout}\n${probe.stderr}`;
    if (!probeOutput.includes("BTS_TARGET_PROBE|postgres|")) {
      throw new RunnerError("DEV identity probe did not return the expected database", "TARGET_REJECTED");
    }
    const remote = parseRemoteMigrations(probeOutput);
    const localVersions = local.map(({ version }) => version);
    const unknownRemote = remote.filter((version) => !localVersions.includes(version));
    if (unknownRemote.length) throw new RunnerError("Remote contains migration versions absent locally", "MIGRATION_DIVERGED", { unknownRemote });
    const changedMigrations = new Map();
    for (const line of migrationStatus.stdout.split(/\r?\n/).filter(Boolean)) changedMigrations.set(line.slice(3).trim().replaceAll("\\", "/"), line.slice(0, 2));
    let recentApply;
    const statePath = join(stateRoot, "state/preflight.json");
    if (existsSync(statePath)) {
      const state = readJson(statePath);
      if (state.applied && state.target?.projectRef === config.target.projectRef && Date.now() - Date.parse(state.applied.appliedAt) <= 30 * 60 * 1000) recentApply = state.applied;
    }
    const changedApplied = [];
    for (const version of remote) {
      const migration = local.find((entry) => entry.version === version);
      if (!migration) continue;
      const path = `supabase/migrations/${migration.name}`;
      const statusCode = changedMigrations.get(path);
      const isJustAppliedUntracked = statusCode === "??" && recentApply?.name === migration.name && recentApply?.hash === migration.hash;
      if (statusCode && !isJustAppliedUntracked) changedApplied.push(migration.name);
    }
    if (changedApplied.length) throw new RunnerError("An applied migration differs from HEAD", "APPLIED_MIGRATION_MODIFIED", { changedApplied });
    const pending = local.filter(({ version }) => !remote.includes(version));
    if (pending.length > 1) throw new RunnerError("More than one migration is pending; refusing ambiguous apply scope", "MIGRATION_AMBIGUOUS", { pending: pending.map(({ name }) => name) });
    return { local, remote, pending };
  }

  function migrationEvidenceFingerprint(migrations = validateMigrationIntegrity()) {
    return sha256(JSON.stringify({
      target: config.target,
      migrations: migrations.map(({ name, version, hash }) => ({ name, version, hash })),
      registryHash: sha256(readFileSync(checksumPath)),
    }));
  }

  function smokeEvidenceFingerprint() {
    const success = verificationFile(config.verification.defaultFile);
    const failure = verificationFile(config.verification.failureSmokeFile, true);
    return sha256(JSON.stringify({
      migrationEvidence: migrationEvidenceFingerprint(),
      verificationFiles: [
        { path: success.rel, hash: success.hash },
        { path: failure.rel, hash: failure.hash },
      ],
    }));
  }

  async function localValidation({ targeted = [], skipBuild = false } = {}) {
    validateMigrationIntegrity();
    const testFiles = readdirSync(join(repoRoot, "tests")).filter((name) => name.endsWith(".test.ts")).sort().map((name) => `tests/${name}`);
    const targetedFiles = targeted.map((path) => safeRelative(repoRoot, path));
    if (targetedFiles.length) await runTool("tsx", ["--test", ...targetedFiles], { timeoutMs: config.timeoutsMs.localCommand, label: "targeted tests" });
    await runParallel("independent local validation", [
      { name: "regression tests", run: () => runTool("tsx", ["--test", ...testFiles], { timeoutMs: config.timeoutsMs.localCommand, label: "regression tests" }) },
      { name: "typecheck", run: () => runTool("tsc", ["--noEmit"], { timeoutMs: config.timeoutsMs.localCommand, label: "typecheck" }) },
      { name: "lint", run: () => runTool("eslint", ["."], { timeoutMs: config.timeoutsMs.localCommand, label: "lint" }) },
      { name: "Git diff check", run: () => run("git", ["diff", "--check"], { timeoutMs: config.timeoutsMs.git, label: "git diff check" }) },
    ], "these checks are read-only, independent, and do not share generated output");
    if (!skipBuild) await runTool("next", ["build"], { timeoutMs: config.timeoutsMs.build, label: "production build", env: blankBuildEnvironment() });
    status("BTS PREFLIGHT PASSED", `local validation; ${commandCount} bundled child operations`);
    return { commandCount, testFiles: testFiles.length };
  }

  async function preflight() {
    const target = databaseTarget();
    const [residueClean, migrations] = await runParallel("DEV preflight evidence", [
      { name: "pre-existing residue", run: () => checkResidue(target, { reason: "establish a clean baseline before DEV verification" }) },
      { name: "migration state", run: () => inspectMigrations(target) },
    ], "both checks are read-only against the same positively pinned DEV target");
    if (!residueClean) throw new RunnerError("Preflight found verification residue", "RESIDUE_DETECTED");
    recordEvidenceCheck("migration dry-run", "confirm the exact pending/no-pending result after migration history is known");
    const dryRun = await runTool("supabase", ["db", "push", "--db-url", target.url, "--dry-run"], {
      timeoutMs: config.timeoutsMs.databaseCommand,
      label: "migration dry-run",
    });
    const pending = migrations.pending[0] ?? null;
    if (pending && !dryRun.stdout.includes(pending.name)) {
      throw new RunnerError("Dry-run did not identify the exact pending migration", "MIGRATION_DRY_RUN_MISMATCH");
    }
    if (!pending && !/up to date|no migrations/i.test(`${dryRun.stdout}\n${dryRun.stderr}`)) {
      throw new RunnerError("Dry-run did not confirm a no-migration state", "MIGRATION_DRY_RUN_MISMATCH");
    }
    const state = {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      target: { environment: config.target.environment, projectName: config.target.projectName, projectRef: config.target.projectRef, databaseHost: config.target.databaseHost },
      pending,
      evidenceFingerprint: migrationEvidenceFingerprint(migrations.local),
      dryRunHash: sha256(redact(`${dryRun.stdout}\n${dryRun.stderr}`, [...secrets])),
    };
    mkdirSync(join(stateRoot, "state"), { recursive: true });
    writeFileSync(join(stateRoot, "state/preflight.json"), `${JSON.stringify(state, null, 2)}\n`, "utf8");
    if (pending) {
      status("MIGRATION APPROVAL REQUIRED", `${pending.name}; ${config.target.projectName}; sha256 ${pending.hash}`);
      return { status: "migration-required", pending, commandCount, evidenceFingerprint: state.evidenceFingerprint };
    }
    status("BTS PREFLIGHT PASSED", `${config.target.projectName}; no pending migration; ${commandCount} bundled child operations`);
    return { status: "passed", commandCount, evidenceFingerprint: state.evidenceFingerprint };
  }

  async function verify({ file = config.verification.defaultFile, expectedFailure = false, deferResidue = false, reportStatus = true } = {}) {
    const target = databaseTarget();
    const verification = verificationFile(file, expectedFailure);
    const result = await runTool("supabase", ["db", "query", "--db-url", target.url, "--file", verification.absolute], {
      timeoutMs: config.timeoutsMs.databaseCommand,
      label: "rollback-only DEV verification",
      allowFailure: true,
    });
    const verificationOutput = `${result.stdout}\n${result.stderr}`;
    if (expectedFailure) {
      if (result.code === 0 || !verificationOutput.includes(config.verification.failureSentinel)) {
        throw new RunnerError("Expected assertion failure was not observed", "EXPECTED_FAILURE_MISSING");
      }
      if (!deferResidue && !(await checkResidue(target, { reason: "prove rollback after the expected assertion failure" }))) {
        throw new RunnerError("Residue check failed after expected assertion failure", "RESIDUE_DETECTED");
      }
      return { expectedFailure: true, rolledBack: true, commandCount };
    }
    if (result.code === 0 || !verificationOutput.includes(config.verification.successSentinel)) {
      throw new RunnerError("Rollback success sentinel was not observed", "VERIFICATION_INCOMPLETE");
    }
    if (!deferResidue && !(await checkResidue(target, { reason: "prove rollback after successful verification assertions" }))) {
      throw new RunnerError("Residue check failed after rollback verification", "RESIDUE_DETECTED");
    }
    if (reportStatus) status("BTS DEV VERIFICATION PASSED", `${verification.rel}; rollback and zero residue proven`);
    return { expectedFailure: false, rolledBack: true, commandCount, hash: verification.hash };
  }

  function performanceSnapshot({ humanApprovalsObserved, privilegedBoundaryCrossingsObserved, outcome = "passed", errorCode } = {}) {
    for (const [name, value] of Object.entries({ humanApprovalsObserved, privilegedBoundaryCrossingsObserved })) {
      if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
        throw new RunnerError(`${name} must be a non-negative integer`, "PERFORMANCE_OBSERVATION_INVALID");
      }
    }
    const countsByCheck = new Map();
    for (const check of evidenceChecks) countsByCheck.set(check.name, (countsByCheck.get(check.name) ?? 0) + 1);
    const repeatedChecks = [...countsByCheck.entries()]
      .filter(([, count]) => count > 1)
      .map(([name, count]) => ({
        name,
        executions: count,
        additionalExecutions: count - 1,
        reasons: evidenceChecks.filter((check) => check.name === name).map((check) => check.reason),
      }));
    const completedMs = clock();
    return {
      schemaVersion: 1,
      runId,
      startedAt: new Date(performanceStartedMs).toISOString(),
      completedAt: new Date(completedMs).toISOString(),
      durationMs: Math.max(0, completedMs - performanceStartedMs),
      outcome,
      ...(errorCode ? { errorCode } : {}),
      observations: {
        humanApprovals: humanApprovalsObserved ?? null,
        privilegedBoundaryCrossings: privilegedBoundaryCrossingsObserved ?? null,
        source: humanApprovalsObserved === undefined || privilegedBoundaryCrossingsObserved === undefined
          ? "external observation not supplied; the child process cannot see Codex approval UI events"
          : "externally observed and explicitly supplied",
      },
      processes: {
        total: processInvocations.length,
        supabase: processInvocations.filter(({ tool }) => tool === "supabase").length,
        networkBoundary: processInvocations.filter(({ networkBoundary }) => networkBoundary).length,
        invocations: processInvocations,
      },
      checks: {
        repeatedExecutions: repeatedChecks.reduce((total, check) => total + check.additionalExecutions, 0),
        repeated: repeatedChecks,
        retries: retries.length,
        retryReasons: retries.map(({ reason }) => reason),
        evidence: evidenceChecks,
      },
      execution: {
        parallelGroups,
        sequentialConstraints: [
          "target pinning and local checksum validation precede network work",
          "migration dry-run follows remote/local migration history because it validates that result",
          "rollback residue closeout follows both verification transactions because it proves their final state",
          "production build follows the parallel local read-only checks to avoid resource contention and shared .next output",
          "migration apply and checkpoint remain explicit gated paths and never run from smoke",
        ],
      },
    };
  }

  function writePerformanceReport(report) {
    const performanceRoot = join(stateRoot, "performance");
    mkdirSync(performanceRoot, { recursive: true });
    writeFileSync(join(performanceRoot, `${runId}.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    writeFileSync(join(performanceRoot, "latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    log(`PERFORMANCE ${JSON.stringify(report)}`);
  }

  function observePerformance({ humanApprovalsObserved, privilegedBoundaryCrossingsObserved, endToEndDurationMsObserved }) {
    for (const [name, value] of Object.entries({ humanApprovalsObserved, privilegedBoundaryCrossingsObserved, endToEndDurationMsObserved })) {
      if (!Number.isInteger(value) || value < 0) {
        throw new RunnerError(`${name} must be a non-negative integer`, "PERFORMANCE_OBSERVATION_INVALID");
      }
    }
    const latestPath = join(stateRoot, "performance/latest.json");
    if (!existsSync(latestPath)) throw new RunnerError("No smoke performance report exists to annotate", "PERFORMANCE_REPORT_MISSING");
    const report = readJson(latestPath);
    report.observations = {
      humanApprovals: humanApprovalsObserved,
      privilegedBoundaryCrossings: privilegedBoundaryCrossingsObserved,
      endToEndDurationMs: endToEndDurationMsObserved,
      runnerExecutionDurationMs: report.durationMs,
      preLaunchBoundaryWaitMs: Math.max(0, endToEndDurationMsObserved - report.durationMs),
      source: "externally observed after process completion",
    };
    writePerformanceReport(report);
    status("BTS PERFORMANCE OBSERVATION RECORDED", `${(endToEndDurationMsObserved / 1000).toFixed(1)}s end-to-end; approvals ${humanApprovalsObserved}; boundary ${privilegedBoundaryCrossingsObserved}`);
    return report;
  }

  async function smokeDev(observations = {}) {
    try {
      const initialSmokeFingerprint = smokeEvidenceFingerprint();
      const preflightResult = await preflight();
      if (preflightResult.status !== "passed") {
        const report = performanceSnapshot({ ...observations, outcome: "migration-gated" });
        writePerformanceReport(report);
        return { ...preflightResult, performance: report };
      }
      if (preflightResult.evidenceFingerprint !== migrationEvidenceFingerprint()) {
        throw new RunnerError("Preflight evidence changed before DEV verification", "PREFLIGHT_EVIDENCE_INVALIDATED");
      }
      await runParallel("rollback verification", [
        {
          name: "successful Newsletter assertions",
          run: () => verify({ deferResidue: true, reportStatus: false }),
        },
        {
          name: "intentional failed assertion",
          run: () => verify({ file: config.verification.failureSmokeFile, expectedFailure: true, deferResidue: true, reportStatus: false }),
        },
      ], "both use generated collision-safe fixtures, separate advisory locks, and rollback-only transactions");
      if (initialSmokeFingerprint !== smokeEvidenceFingerprint()) {
        throw new RunnerError("Relevant repository evidence changed during smoke verification", "PREFLIGHT_EVIDENCE_INVALIDATED");
      }
      const target = databaseTarget();
      await databaseHealth(target, { residueReason: "prove the final combined zero-residue state after both rollback transactions" });
      const report = performanceSnapshot(observations);
      writePerformanceReport(report);
      const approvals = report.observations.humanApprovals ?? "external";
      const crossings = report.observations.privilegedBoundaryCrossings ?? "external";
      status("BTS DEV VERIFICATION PASSED", `rollback matrix; ${(report.durationMs / 1000).toFixed(1)}s; approvals ${approvals}; boundary ${crossings}; Supabase ${report.processes.supabase}; retries ${report.checks.retries}`);
      return { status: "passed", commandCount, performance: report };
    } catch (error) {
      const report = performanceSnapshot({
        ...observations,
        outcome: "failed",
        errorCode: error instanceof RunnerError ? error.code : "UNEXPECTED_ERROR",
      });
      writePerformanceReport(report);
      throw error;
    }
  }

  async function databaseHealth(target, { residueReason = "prove zero residue at database health closeout" } = {}) {
    const [,, residueClean] = await runParallel("DEV health closeout", [
      {
        name: "database lint",
        run: () => runTool("supabase", ["db", "lint", "--db-url", target.url, "--level", "error", "--fail-on", "error"], {
          timeoutMs: config.timeoutsMs.databaseCommand,
          label: "database lint",
        }),
      },
      {
        name: "security advisors",
        run: () => runTool("supabase", ["db", "advisors", "--db-url", target.url, "--type", "security", "--level", "warn", "--fail-on", "error"], {
          timeoutMs: config.timeoutsMs.databaseCommand,
          label: "security advisors",
        }),
      },
      { name: "zero residue", run: () => checkResidue(target, { reason: residueReason }) },
    ], "lint, security advisors, and the residue query are independent read-only closeout checks");
    if (!residueClean) throw new RunnerError("Database health closeout found verification residue", "RESIDUE_DETECTED");
  }

  async function post({ skipLocal = false } = {}) {
    const target = databaseTarget();
    const migrations = await inspectMigrations(target);
    if (migrations.pending.length) throw new RunnerError("Post-migration closeout cannot run with a pending migration", "MIGRATION_PENDING");
    await verify();
    await databaseHealth(target);
    if (!skipLocal) await localValidation();
    status("READY FOR HUMAN UX REVIEW", "only if the ticket contains a genuine UX judgment");
    return { status: "passed", commandCount };
  }

  async function applyMigration({ confirmation }) {
    const expectedPrefix = `APPLY ${config.target.projectName} `;
    if (!confirmation?.startsWith(expectedPrefix)) throw new RunnerError("Exact migration approval phrase is required", "MIGRATION_GATE_REQUIRED");
    const requested = confirmation.slice(expectedPrefix.length);
    const statePath = join(stateRoot, "state/preflight.json");
    if (!existsSync(statePath)) throw new RunnerError("A fresh preflight state is required", "MIGRATION_GATE_REQUIRED");
    const state = readJson(statePath);
    if (!state.pending || state.pending.name !== requested || state.target.projectRef !== config.target.projectRef) {
      throw new RunnerError("Approval does not match the pinned preflight migration", "MIGRATION_GATE_REQUIRED");
    }
    if (!state.evidenceFingerprint || state.evidenceFingerprint !== migrationEvidenceFingerprint()) {
      throw new RunnerError("Repository or migration evidence changed after preflight", "MIGRATION_GATE_REQUIRED");
    }
    const created = Date.parse(state.createdAt);
    if (!Number.isFinite(created) || Date.now() - created > 30 * 60 * 1000) throw new RunnerError("Migration approval state has expired", "MIGRATION_GATE_REQUIRED");
    const target = databaseTarget();
    const inspection = await inspectMigrations(target);
    if (inspection.pending.length !== 1 || inspection.pending[0].name !== requested || inspection.pending[0].hash !== state.pending.hash) {
      throw new RunnerError("Migration state changed after approval", "MIGRATION_GATE_REQUIRED");
    }
    const dryRun = await runTool("supabase", ["db", "push", "--db-url", target.url, "--dry-run"], { timeoutMs: config.timeoutsMs.databaseCommand, label: "final migration dry-run" });
    if (!dryRun.stdout.includes(requested)) throw new RunnerError("Final dry-run does not match approval", "MIGRATION_DRY_RUN_MISMATCH");
    await runTool("supabase", ["db", "push", "--db-url", target.url], { timeoutMs: config.timeoutsMs.databaseCommand, label: "approved migration apply" });
    state.applied = { name: requested, hash: state.pending.hash, appliedAt: new Date().toISOString() };
    state.pending = null;
    writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    return { applied: requested, commandCount };
  }

  async function checkpoint({ paths, message, dryRun = false }) {
    if (!paths?.length) throw new RunnerError("Checkpoint requires explicit intended paths", "CHECKPOINT_REJECTED");
    if (!message?.trim() || /[\r\n]/.test(message)) throw new RunnerError("Checkpoint requires a single-line commit message", "CHECKPOINT_REJECTED");
    const branch = (await run("git", ["branch", "--show-current"], { timeoutMs: config.timeoutsMs.git, label: "branch inspection" })).stdout.trim();
    if (!branch) throw new RunnerError("Detached HEAD cannot be checkpointed", "CHECKPOINT_REJECTED");
    const upstreamResult = await run("git", ["rev-parse", "--abbrev-ref", "@{upstream}"], { timeoutMs: config.timeoutsMs.git, label: "tracking branch inspection" });
    const upstream = upstreamResult.stdout.trim();
    const statusResult = await run("git", ["status", "--porcelain=v1", "--untracked-files=all"], { timeoutMs: config.timeoutsMs.git, label: "working tree inspection" });
    const actual = assertCheckpointPaths(parseStatusPaths(statusResult.stdout), paths.map((path) => safeRelative(repoRoot, path)));
    assertNoSecrets(actual, repoRoot);
    await run("git", ["diff", "--check"], { timeoutMs: config.timeoutsMs.git, label: "git diff check" });
    if (dryRun) {
      status("READY TO CHECKPOINT", `${actual.length} reviewed paths; dry-run made no Git changes`);
      return { dryRun: true, branch, upstream, paths: actual, commandCount };
    }
    await run("git", ["add", "--", ...actual], { timeoutMs: config.timeoutsMs.git, label: "stage reviewed paths" });
    const stagedResult = await run("git", ["diff", "--cached", "--name-only"], { timeoutMs: config.timeoutsMs.git, label: "staged diff inspection" });
    assertCheckpointPaths(stagedResult.stdout.split(/\r?\n/).filter(Boolean), actual);
    await run("git", ["diff", "--cached", "--check"], { timeoutMs: config.timeoutsMs.git, label: "staged diff check" });
    await run("git", ["commit", "-m", message], { timeoutMs: config.timeoutsMs.git, label: "commit" });
    await run("git", ["push"], { timeoutMs: config.timeoutsMs.git, label: "normal push" });
    const head = (await run("git", ["rev-parse", "HEAD"], { timeoutMs: config.timeoutsMs.git, label: "HEAD verification" })).stdout.trim();
    const tracking = (await run("git", ["rev-parse", "@{upstream}"], { timeoutMs: config.timeoutsMs.git, label: "tracking verification" })).stdout.trim();
    if (head !== tracking) throw new RunnerError("HEAD does not equal its tracking branch after push", "CHECKPOINT_INCOMPLETE");
    const finalStatus = (await run("git", ["status", "--porcelain=v1"], { timeoutMs: config.timeoutsMs.git, label: "clean tree verification" })).stdout.trim();
    if (finalStatus) throw new RunnerError("Working tree is not clean after checkpoint", "CHECKPOINT_INCOMPLETE");
    status("BTS ENGINEERING BLOCK COMPLETE", `${branch} equals ${upstream}; clean working tree`);
    return { dryRun: false, head, branch, upstream, commandCount };
  }

  return {
    repoRoot,
    config,
    logPath,
    databaseTarget,
    validateMigrationIntegrity,
    localValidation,
    preflight,
    verify,
    smokeDev,
    post,
    applyMigration,
    checkpoint,
    performanceSnapshot,
    observePerformance,
    get commandCount() { return commandCount; },
  };
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = { paths: [], targeted: [] };
  for (let i = 0; i < rest.length; i += 1) {
    const value = rest[i];
    if (value === "--skip-build" || value === "--skip-local" || value === "--dry-run") options[value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = true;
    else if (value === "--path") options.paths.push(rest[++i]);
    else if (value === "--targeted") options.targeted.push(rest[++i]);
    else if (value === "--file" || value === "--message" || value === "--confirmation") options[value.slice(2)] = rest[++i];
    else if (value === "--human-approvals-observed" || value === "--privileged-boundary-crossings-observed" || value === "--end-to-end-duration-ms-observed") {
      const parsed = Number(rest[++i]);
      if (!Number.isInteger(parsed) || parsed < 0) throw new RunnerError(`${value} requires a non-negative integer`, "ARGUMENT_INVALID");
      options[value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = parsed;
    }
    else throw new RunnerError(`Unknown argument: ${value}`, "ARGUMENT_INVALID");
  }
  return { command, options };
}

export async function main(argv = process.argv.slice(2)) {
  const { command, options } = parseArgs(argv);
  const runner = createRunner();
  if (command === "local") return await runner.localValidation(options);
  if (command === "preflight") return await runner.preflight();
  if (command === "verify") return await runner.verify(options);
  if (command === "smoke-dev") return await runner.smokeDev(options);
  if (command === "post") return await runner.post(options);
  if (command === "apply") return await runner.applyMigration(options);
  if (command === "checkpoint") return await runner.checkpoint(options);
  if (command === "observe-performance") return runner.observePerformance(options);
  throw new RunnerError("Usage: runner.mjs <local|preflight|verify|smoke-dev|post|apply|checkpoint|observe-performance>", "ARGUMENT_INVALID");
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const code = error instanceof RunnerError ? error.code : "UNEXPECTED_ERROR";
    const detail = error instanceof RunnerError ? error.details : {};
    console.error(`FAILED — ENGINEERING ACTION REQUIRED — ${code}: ${redact(error.message)}`);
    if (Object.keys(detail).length) console.error(redact(JSON.stringify(detail)));
    process.exitCode = 1;
  });
}
