import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

import {
  ARTICLE_ID,
  ARTICLE_SLUG,
  APPROVED_IMPORT_SQL_SHA256,
  APPROVED_PAYLOAD_SHA256,
  POSTGRES_DOCKER_IMAGE,
  PRODUCTION_AUTHOR_ID,
  PromotionError,
  SOURCE_PROJECT_REF,
  TARGET_LOCALES,
  apply,
  bodyJsonSha256,
  buildProductionPreflightSql,
  buildPromotionSql,
  createProductionPromotionDatabase,
  expectedImportConfirmation,
  parseProductionPreflightOutput,
  sha256,
  validateImportConfirmation,
  validateProductionPreflight,
  validatePromotionPayload,
} from "../scripts/bts-engineering/production-writing-promotion.mjs";
import { CANONICAL_MIGRATION_NAMES, PRODUCTION_TARGET } from "../scripts/bts-engineering/production-migrations.mjs";

const bodyJson = { version: "1", blocks: [{ id: "fixture", type: "paragraph", content: [] }] };
const fixtureHash = bodyJsonSha256(bodyJson);
const fixtureHashes = {
  de: fixtureHash,
  en: fixtureHash,
  es: fixtureHash,
  tr: fixtureHash,
  pl: fixtureHash,
  el: fixtureHash,
  ru: fixtureHash,
};
const PASSWORD = "promotion-transport-test-password";
const PRODUCTION_URL = `postgresql://postgres.${PRODUCTION_TARGET.projectRef}:${PASSWORD}@${PRODUCTION_TARGET.sessionPoolerHost}:5432/postgres?sslmode=require`;

function article() {
  return {
    id: ARTICLE_ID,
    author_id: PRODUCTION_AUTHOR_ID,
    slug: ARTICLE_SLUG,
    title: "Warum ich bts.online gebaut habe",
    deck: "Fixture deck",
    excerpt: "Fixture excerpt for validation.",
    body: "Fixture source body for validation.",
    content_type: "essay",
    topics: ["Ideas"],
    status: "published",
    created_at: "2026-09-27T00:00:00+00:00",
    updated_at: "2026-09-27T00:00:00+00:00",
    published_at: "2026-09-27T00:00:00+00:00",
    body_json: bodyJson,
    source_locale: "de",
    source_revision: 1,
  };
}

function translation(locale: string) {
  return {
    article_id: ARTICLE_ID,
    locale,
    title: `Fixture ${locale}`,
    deck: `Fixture deck ${locale}`,
    excerpt: `Fixture excerpt ${locale}`,
    body: `Fixture translated body ${locale}`,
    body_json: bodyJson,
    status: "translated",
    source_revision: 1,
    generated_at: "2026-09-27T00:00:00+00:00",
    manually_edited: false,
    created_at: "2026-09-27T00:00:00+00:00",
    updated_at: "2026-09-27T00:00:00+00:00",
    generation_claim_id: null,
    generation_claimed_at: null,
    generation_attempts: 0,
    last_error_code: null,
  };
}

function payload() {
  return {
    schemaVersion: 1,
    operation: "writing_content_promotion",
    sourceProjectRef: SOURCE_PROJECT_REF,
    productionProjectRef: PRODUCTION_TARGET.projectRef,
    productionAuthorId: PRODUCTION_AUTHOR_ID,
    article: article(),
    translations: TARGET_LOCALES.map(translation),
    bodyJsonSha256: fixtureHashes,
  };
}

function expectCode(code: string) {
  return (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === code;
}

test("promotion payload is exactly one Production-bound article and six clean translations", () => {
  const result = validatePromotionPayload(payload(), { expectedBodyJsonSha256: fixtureHashes });
  assert.equal(result.articleId, ARTICLE_ID);
  assert.deepEqual(result.locales, TARGET_LOCALES);
  assert.equal(JSON.stringify(payload()).includes("author_id"), true);
  assert.equal(payload().article.author_id, PRODUCTION_AUTHOR_ID);
  assert.equal(payload().translations.every((row) => row.generation_claim_id === null && row.last_error_code === null), true);
});

test("promotion payload rejects active claims, unknown locales, and unrelated fields", () => {
  const claimed = payload();
  Object.assign(claimed.translations[0], { generation_claim_id: "00000000-0000-0000-0000-000000000001" });
  assert.throws(() => validatePromotionPayload(claimed, { expectedBodyJsonSha256: fixtureHashes }), expectCode("PROMOTION_VALIDATION_FAILED"));

  const locale = payload();
  Object.assign(locale.translations[0], { locale: "fr" });
  assert.throws(() => validatePromotionPayload(locale, { expectedBodyJsonSha256: fixtureHashes }), expectCode("PROMOTION_SCOPE_REJECTED"));

  const unrelated = { ...payload(), subscribers: [] };
  assert.throws(() => validatePromotionPayload(unrelated, { expectedBodyJsonSha256: fixtureHashes }), expectCode("PROMOTION_SCOPE_REJECTED"));
});

test("import SQL is serializable, advisory-locked, transactional, and conflict-safe", () => {
  const sql = buildPromotionSql(payload(), { expectedBodyJsonSha256: fixtureHashes });
  assert.match(sql, /^begin;/u);
  assert.match(sql, /set transaction isolation level serializable;/u);
  assert.match(sql, /pg_advisory_xact_lock/u);
  assert.match(sql, new RegExp(`auth\\.users where id = '${PRODUCTION_AUTHOR_ID}'::uuid`));
  assert.match(sql, /role = 'admin' and is_active = true/u);
  assert.match(sql, /BTS_WRITING_PROMOTION_UNRELATED_WRITING_ROWS/u);
  assert.match(sql, /BTS_WRITING_PROMOTION_SLUG_CONFLICT/u);
  assert.match(sql, /to_jsonb\(v_existing_article\) is distinct from v_article/u);
  assert.match(sql, /BTS_WRITING_PROMOTION_TRANSLATION_CONFLICT/u);
  assert.match(sql, /writing_articles\) <> 1/u);
  assert.match(sql, /writing_article_translations\) <> 6/u);
  assert.match(sql, /generation_claim_id is not null/u);
  assert.match(sql, /status in \('stale','failed'\)/u);
  assert.doesNotMatch(sql, /update public\.writing_/u);
  assert.doesNotMatch(sql, /on conflict/u);
  assert.match(sql, /commit;\s*$/u);
});

test("manifest-bound confirmation must match exactly", () => {
  const manifestHash = "a".repeat(64);
  const confirmation = expectedImportConfirmation(manifestHash);
  assert.match(confirmation, new RegExp(`^IMPORT PRODUCTION WRITING ${PRODUCTION_TARGET.projectName}`));
  assert.equal(validateImportConfirmation(confirmation, manifestHash), true);
  assert.throws(() => validateImportConfirmation(`${confirmation}-changed`, manifestHash), expectCode("PROMOTION_APPLY_GATE_REQUIRED"));
});

test("apply cannot proceed without the exact current manifest-bound confirmation", async () => {
  await assert.rejects(
    apply({ confirmation: "IMPORT PRODUCTION WRITING invalid", env: { NODE_ENV: "test" } }),
    expectCode("PROMOTION_APPLY_GATE_REQUIRED"),
  );
});

test("Production preflight distinguishes first-import empty state from the exact approved idempotent state", () => {
  const migrationVersions = CANONICAL_MIGRATION_NAMES.map((name) => name.match(/^(\d+)_/)![1]);
  const snapshot = {
    migrationVersions,
    authUserCount: 1,
    activeAdminCount: 1,
    articleCount: 0,
    translationCount: 0,
    slugConflictCount: 0,
    otherWritingCount: 0,
    approvedArticleCount: 0,
    approvedTranslationCount: 0,
    activeClaimCount: 0,
    problemTranslationCount: 0,
  };
  assert.deepEqual(validateProductionPreflight(snapshot), { applied: 26, pending: 0, state: "empty" });
  const approved = {
    ...snapshot,
    articleCount: 1,
    translationCount: 6,
    approvedArticleCount: 1,
    approvedTranslationCount: 6,
  };
  assert.deepEqual(validateProductionPreflight(approved, undefined, { expectedState: "approved" }), { applied: 26, pending: 0, state: "approved" });
  assert.deepEqual(validateProductionPreflight(approved, undefined, { expectedState: "empty-or-approved" }), { applied: 26, pending: 0, state: "approved" });
  assert.throws(() => validateProductionPreflight({ ...snapshot, migrationVersions: migrationVersions.slice(1) }), expectCode("PROMOTION_PRODUCTION_STATE_REJECTED"));
  assert.throws(() => validateProductionPreflight({ ...snapshot, articleCount: 1 }), expectCode("PROMOTION_PRODUCTION_STATE_REJECTED"));
  assert.throws(() => validateProductionPreflight({ ...approved, approvedTranslationCount: 5 }, undefined, { expectedState: "approved" }), expectCode("PROMOTION_PRODUCTION_STATE_REJECTED"));
  assert.throws(() => validateProductionPreflight({ ...approved, activeClaimCount: 1 }, undefined, { expectedState: "approved" }), expectCode("PROMOTION_PRODUCTION_STATE_REJECTED"));
  assert.throws(() => validateProductionPreflight({ ...approved, problemTranslationCount: 1 }, undefined, { expectedState: "approved" }), expectCode("PROMOTION_PRODUCTION_STATE_REJECTED"));
  assert.throws(() => validateProductionPreflight({ ...snapshot, activeAdminCount: 0 }), expectCode("PROMOTION_PRODUCTION_STATE_REJECTED"));
});

test("read-only preflight compares complete rows to the approved payload without an overwrite path", () => {
  const root = join(import.meta.dirname, "../.bts-engineering/production/content-promotion");
  const payload = JSON.parse(readFileSync(join(root, `writing-${ARTICLE_ID}.payload.json`), "utf8"));
  const sql = buildProductionPreflightSql(payload);
  assert.match(sql, /to_jsonb\(candidate\) = [\s\S]* -> 'article'/u);
  assert.match(sql, /to_jsonb\(candidate\) = approved/u);
  assert.match(sql, /BTS_PROMOTION_ACTIVE_CLAIMS/u);
  assert.match(sql, /BTS_PROMOTION_PROBLEM_TRANSLATIONS/u);
  assert.doesNotMatch(sql, /\b(?:insert|update|delete|truncate)\b/iu);
});

test("promotion transport requires the explicit pinned Production database URL", () => {
  assert.throws(
    () => createProductionPromotionDatabase({ env: {} }).databaseTarget(),
    expectCode("MISSING_PRODUCTION_CREDENTIALS"),
  );

  const accepted = createProductionPromotionDatabase({ env: { BTS_PRODUCTION_DATABASE_URL: PRODUCTION_URL } }).databaseTarget();
  assert.equal(accepted.projectRef, PRODUCTION_TARGET.projectRef);
  assert.equal(accepted.databaseHost, PRODUCTION_TARGET.sessionPoolerHost);

  const invalid = [
    `postgresql://postgres.fnnhosdwldjhyfoezkot:${PASSWORD}@${PRODUCTION_TARGET.sessionPoolerHost}:5432/postgres?sslmode=require`,
    `postgresql://postgres.aaaaaaaaaaaaaaaaaaaa:${PASSWORD}@${PRODUCTION_TARGET.sessionPoolerHost}:5432/postgres?sslmode=require`,
    `postgresql://postgres.${PRODUCTION_TARGET.projectRef}:${PASSWORD}@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require`,
    `postgresql://postgres.${PRODUCTION_TARGET.projectRef}:${PASSWORD}@${PRODUCTION_TARGET.sessionPoolerHost}:6543/postgres?sslmode=require`,
    `postgresql://postgres.${PRODUCTION_TARGET.projectRef}:${PASSWORD}@${PRODUCTION_TARGET.sessionPoolerHost}:5432/wrong?sslmode=require`,
    `postgresql://postgres.${PRODUCTION_TARGET.projectRef}:${PASSWORD}@${PRODUCTION_TARGET.sessionPoolerHost}:5432/postgres`,
  ];
  for (const url of invalid) {
    assert.throws(
      () => createProductionPromotionDatabase({ env: { BTS_PRODUCTION_DATABASE_URL: url } }).databaseTarget(),
      (error: unknown) => expectCode("PRODUCTION_TARGET_REJECTED")(error) || expectCode("INVALID_PRODUCTION_CREDENTIALS")(error),
    );
  }
});

test("promotion transport redacts database credentials from failures", async () => {
  const stateRoot = join(tmpdir(), `bts-promotion-transport-${crypto.randomUUID()}`);
  const database = createProductionPromotionDatabase({
    env: { PATH: process.env.PATH, BTS_PRODUCTION_DATABASE_URL: PRODUCTION_URL },
    stateRoot,
    execute: async () => ({
      code: 1,
      signal: null,
      stdout: "",
      stderr: `connection failed for ${PRODUCTION_URL} using ${PASSWORD}`,
    }),
  });
  try {
    const target = database.databaseTarget();
    await assert.rejects(
      database.query(target, "select 1", "test query"),
      (error: unknown) => {
        if (!(error instanceof PromotionError)) return false;
        const serialized = JSON.stringify(error.details);
        return error.code === "PROMOTION_DATABASE_QUERY_FAILED"
          && !serialized.includes(PRODUCTION_URL)
          && !serialized.includes(PASSWORD);
      },
    );
  } finally {
    rmSync(stateRoot, { recursive: true, force: true });
  }
});

test("apply transport mounts the exact approved SQL read-only and invokes Docker psql without credentials in argv", async () => {
  let invocation: { command: string; args: string[]; env: NodeJS.ProcessEnv } | undefined;
  const database = createProductionPromotionDatabase({
    env: { PATH: process.env.PATH, BTS_PRODUCTION_DATABASE_URL: PRODUCTION_URL },
    execute: async (command: string, args: string[], options: { env: NodeJS.ProcessEnv }) => {
      invocation = { command, args, env: options.env };
      return { code: 0, signal: null, stdout: "", stderr: "" };
    },
  });
  const target = database.databaseTarget();
  await database.executeApprovedImport(target);

  assert.ok(invocation);
  assert.equal(invocation.command, "docker");
  assert.equal(invocation.args.includes(POSTGRES_DOCKER_IMAGE), true);
  assert.equal(invocation.args.includes("BTS_PRODUCTION_DATABASE_URL"), true);
  assert.equal(invocation.args.some((argument) => argument.includes("psql") && argument.includes("ON_ERROR_STOP=1")), true);
  assert.equal(invocation.args.some((argument) => argument === "db" || argument === "query" || argument.includes("node_modules/supabase")), false);
  assert.equal(invocation.args.some((argument) => argument.includes(PRODUCTION_URL) || argument.includes(PASSWORD)), false);
  const approvedSqlPath = resolve(import.meta.dirname, `../.bts-engineering/production/content-promotion/writing-${ARTICLE_ID}.import.sql`);
  const mount = invocation.args.find((argument) => argument.startsWith("type=bind,"));
  assert.equal(mount, `type=bind,source=${approvedSqlPath},target=/bts/promotion.sql,readonly`);
  assert.equal(invocation.env.BTS_PRODUCTION_DATABASE_URL, PRODUCTION_URL);
});

test("promotion runner has no Management API token dependency", () => {
  const source = readFileSync(join(import.meta.dirname, "../scripts/bts-engineering/production-writing-promotion.mjs"), "utf8");
  assert.doesNotMatch(source, /(?:process\.env|env)\.SUPABASE_ACCESS_TOKEN|api\.supabase\.com\/v1\/projects|managementQuery|requireAccessToken/u);
  assert.doesNotMatch(source, /node_modules\/supabase|\["db",\s*"query"\]/u);
  assert.match(source, /postgres:17-alpine/u);
  assert.match(source, /BTS_PRODUCTION_DATABASE_URL/u);
  assert.match(source, /state === "approved"[\s\S]*status: "already-applied"/u);
  assert.match(source, /executeApprovedImport\(target\)[\s\S]*expectedState: "approved"/u);
});

test("approved payload and import SQL remain byte-for-byte unchanged", () => {
  const root = join(import.meta.dirname, "../.bts-engineering/production/content-promotion");
  const payloadBytes = readFileSync(join(root, `writing-${ARTICLE_ID}.payload.json`));
  const sqlBytes = readFileSync(join(root, `writing-${ARTICLE_ID}.import.sql`));
  assert.equal(sha256(payloadBytes), APPROVED_PAYLOAD_SHA256);
  assert.equal(sha256(sqlBytes), APPROVED_IMPORT_SQL_SHA256);
});

test("approved import SQL is strict UTF-8 with preserved non-ASCII content", () => {
  const sqlPath = join(import.meta.dirname, `../.bts-engineering/production/content-promotion/writing-${ARTICLE_ID}.import.sql`);
  const sqlBytes = readFileSync(sqlPath);
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(sqlBytes);
  assert.deepEqual(Buffer.from(decoded, "utf8"), sqlBytes);
  assert.match(decoded, /[^\x00-\x7F]/u);
  assert.equal(sha256(sqlBytes), APPROVED_IMPORT_SQL_SHA256);
});

test("CLI preflight markers parse into the exact Production snapshot", () => {
  const migrations = CANONICAL_MIGRATION_NAMES.map((name) => `BTS_PROMOTION_MIGRATION|${name.match(/^(\d+)_/)![1]}`);
  const output = [
    "BTS_PROMOTION_DATABASE|postgres",
    ...migrations,
    "BTS_PROMOTION_AUTH_USER|1",
    "BTS_PROMOTION_ACTIVE_ADMIN|1",
    "BTS_PROMOTION_ARTICLES|0",
    "BTS_PROMOTION_TRANSLATIONS|0",
    "BTS_PROMOTION_SLUG_CONFLICTS|0",
    "BTS_PROMOTION_OTHER_WRITING|0",
    "BTS_PROMOTION_APPROVED_ARTICLES|0",
    "BTS_PROMOTION_APPROVED_TRANSLATIONS|0",
    "BTS_PROMOTION_ACTIVE_CLAIMS|0",
    "BTS_PROMOTION_PROBLEM_TRANSLATIONS|0",
  ].join("\n");
  assert.deepEqual(parseProductionPreflightOutput(output), {
    migrationVersions: CANONICAL_MIGRATION_NAMES.map((name) => name.match(/^(\d+)_/)![1]),
    authUserCount: 1,
    activeAdminCount: 1,
    articleCount: 0,
    translationCount: 0,
    slugConflictCount: 0,
    otherWritingCount: 0,
    approvedArticleCount: 0,
    approvedTranslationCount: 0,
    activeClaimCount: 0,
    problemTranslationCount: 0,
  });
});
