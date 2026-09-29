import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const REPO_ROOT = join(import.meta.dirname, "..");
const MIGRATION_DIR = join(REPO_ROOT, "supabase/migrations");
const HARDENING_MIGRATION = "20260929000000_harden_service_role_table_privileges.sql";
const AFFECTED_TABLES = [
  "admin_users",
  "echo_contacts",
  "echo_moderation_events",
  "echo_rate_limits",
  "echoes",
] as const;
const APPROVED_SERVICE_ROLE_SELECT_TABLES = [
  "bts_account_profiles",
  "echoes",
  "writing_article_translations",
  "writing_articles",
  "writing_comments",
  "writing_discussions",
] as const;

function withoutComments(source: string) {
  return source.replace(/--.*$/gm, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function allMigrationSql() {
  return readdirSync(MIGRATION_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => readFileSync(join(MIGRATION_DIR, name), "utf8"))
    .join("\n");
}

function migrationHash(bytes: Buffer) {
  const canonical = Buffer.from(bytes.toString("utf8").replace(/\r\n?/g, "\n"), "utf8");
  return createHash("sha256").update(canonical).digest("hex");
}

test("ACL hardening revokes only the four residual privileges from the five affected tables", () => {
  const sql = withoutComments(readFileSync(join(MIGRATION_DIR, HARDENING_MIGRATION), "utf8"));
  assert.equal(
    sql,
    "revoke truncate, references, trigger, maintain on table public.admin_users, public.echo_contacts, "
      + "public.echo_moderation_events, public.echo_rate_limits, public.echoes from service_role;",
  );

  for (const privilege of ["truncate", "references", "trigger", "maintain"]) {
    assert.match(sql, new RegExp(`revoke [^;]*\\b${privilege}\\b[^;]* from service_role;`));
  }
  assert.doesNotMatch(sql, /\bselect\b/);
  assert.doesNotMatch(sql, /\b(?:public|anon|authenticated)\b(?!\.)/);
});

test("the intentional service_role SELECT allowlist remains declared", () => {
  const sql = withoutComments(allMigrationSql());
  for (const table of APPROVED_SERVICE_ROLE_SELECT_TABLES) {
    assert.match(sql, new RegExp(`grant select on table public\\.${table} to service_role;`));
  }

  const hardening = withoutComments(readFileSync(join(MIGRATION_DIR, HARDENING_MIGRATION), "utf8"));
  for (const table of APPROVED_SERVICE_ROLE_SELECT_TABLES) {
    assert.doesNotMatch(hardening, new RegExp(`revoke [^;]*select[^;]*public\\.${table}`));
  }
});

test("every public application table retains deny-by-default direct access for public, anon, and authenticated", () => {
  const sql = withoutComments(allMigrationSql());
  const tables = [...sql.matchAll(/create table public\.([a-z0-9_]+)/g)].map((match) => match[1]);
  assert.equal(new Set(tables).size, 32);

  const revokes = sql.split(";").flatMap((statement) => {
    const match = /revoke all on table (.+?) from ([^;]+)$/.exec(statement.trim());
    if (!match) return [];
    return [{
      tables: [...match[1].matchAll(/public\.([a-z0-9_]+)/g)].map((entry) => entry[1]),
      roles: new Set(match[2].split(",").map((role) => role.trim())),
    }];
  });

  for (const table of tables) {
    const revoke = revokes.find((entry) => entry.tables.includes(table));
    assert.ok(revoke, `missing table revoke for ${table}`);
    for (const role of ["public", "anon", "authenticated"]) {
      assert.equal(revoke.roles.has(role), true, `${table} must revoke ${role}`);
    }
  }
});

test("the immutable registry verifies every pre-existing migration byte-for-byte", () => {
  const registry = JSON.parse(
    readFileSync(join(REPO_ROOT, "scripts/bts-engineering/migration-checksums.json"), "utf8"),
  ) as { migrations: Record<string, string> };
  const existing = Object.entries(registry.migrations).filter(([name]) => name !== HARDENING_MIGRATION);
  assert.equal(existing.length, 25);

  for (const [name, expected] of existing) {
    const actual = migrationHash(readFileSync(join(MIGRATION_DIR, name)));
    assert.equal(actual, expected, `${name} changed after application`);
  }
});

test("the hardening migration touches no table or role outside the verified ACL scope", () => {
  const sql = withoutComments(readFileSync(join(MIGRATION_DIR, HARDENING_MIGRATION), "utf8"));
  const tables = [...sql.matchAll(/public\.([a-z0-9_]+)/g)].map((match) => match[1]);
  assert.deepEqual(tables, AFFECTED_TABLES);
  assert.deepEqual([...sql.matchAll(/\b(?:service_role|authenticated|anon)\b/g)].map((match) => match[0]), ["service_role"]);
});
