import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { CANONICAL_MIGRATION_NAMES, PRODUCTION_TARGET } from "../scripts/bts-engineering/production-migrations.mjs";
import { APPROVED_PAYLOAD_SHA256 } from "../scripts/bts-engineering/production-writing-promotion.mjs";
import {
  BRAND_MIGRATION,
  NEW_BRAND,
  NEW_SLUG,
  OLD_BRAND,
  OLD_SLUG,
  buildRenamePayload,
  buildRenamePreflightSql,
  buildRenameSql,
  expectedRenameConfirmation,
  renameBrandValue,
  sha256,
  validateRenameConfirmation,
  validateRenamePayload,
  validateRenamePreflight,
} from "../scripts/bts-engineering/production-writing-brand-rename.mjs";

const ARTICLE_ID = "a651ef2d-e4b0-4203-91ac-71afa145d36d";
const sourceBytes = readFileSync(new URL(`../.bts-engineering/production/content-promotion/writing-${ARTICLE_ID}.payload.json`, import.meta.url));
const sourcePayload = JSON.parse(sourceBytes.toString("utf8"));

function versions(names = CANONICAL_MIGRATION_NAMES) {
  return names.map((name) => name.match(/^(\d+)_/u)?.[1]);
}

function snapshot(state: "before" | "after") {
  return {
    migrationVersions: versions(state === "before" ? CANONICAL_MIGRATION_NAMES.slice(0, -1) : CANONICAL_MIGRATION_NAMES),
    authUserCount: 1,
    activeAdminCount: 1,
    articleCount: 1,
    translationCount: 6,
    beforeArticleCount: state === "before" ? 1 : 0,
    afterArticleCount: state === "after" ? 1 : 0,
    beforeTranslationCount: state === "before" ? 6 : 0,
    afterTranslationCount: state === "after" ? 6 : 0,
    activeClaimCount: 0,
    problemTranslationCount: 0,
    slugConflictCount: 0,
    otherWritingCount: 0,
  };
}

test("rename payload is derived from the byte-approved one-article/six-translation source", () => {
  assert.equal(sha256(sourceBytes), APPROVED_PAYLOAD_SHA256);
  const payload = buildRenamePayload(sourcePayload);
  assert.deepEqual(validateRenamePayload(payload), {
    articleId: ARTICLE_ID,
    oldSlug: OLD_SLUG,
    newSlug: NEW_SLUG,
    locales: ["el", "en", "es", "pl", "ru", "tr"],
  });
  assert.deepEqual(payload.after, renameBrandValue(payload.before));
  assert.equal(payload.before.article.title, `Warum ich ${OLD_BRAND} gebaut habe`);
  assert.equal(payload.after.article.title, `Warum ich ${NEW_BRAND} gebaut habe`);
  assert.equal(payload.after.article.slug, NEW_SLUG);
});

test("all seven Writing versions are renamed without revision, shape, claim, or status drift", () => {
  const payload = buildRenamePayload(sourcePayload);
  const beforeRows = [payload.before.article, ...payload.before.translations];
  const afterRows = [payload.after.article, ...payload.after.translations];
  assert.equal(afterRows.length, 7);
  for (let index = 0; index < afterRows.length; index += 1) {
    const serialized = JSON.stringify(afterRows[index]);
    assert.equal(serialized.includes(OLD_BRAND), false);
    assert.equal(serialized.includes(OLD_BRAND.replace(".", "-")), false);
    assert.equal(serialized.includes(NEW_BRAND), true);
    assert.equal(afterRows[index].source_revision, beforeRows[index].source_revision);
    assert.equal(afterRows[index].status, beforeRows[index].status);
    assert.deepEqual(Object.keys(afterRows[index]).sort(), Object.keys(beforeRows[index]).sort());
  }
  for (const locale of ["de", "el", "en", "es", "pl", "ru", "tr"]) {
    assert.notEqual(payload.beforeBodyJsonSha256[locale], payload.afterBodyJsonSha256[locale]);
  }
});

test("rename SQL updates in place under SERIALIZABLE and exact before/after assertions", () => {
  const sql = buildRenameSql(buildRenamePayload(sourcePayload));
  assert.match(sql, /set transaction isolation level serializable/iu);
  assert.match(sql, /pg_advisory_xact_lock/iu);
  assert.match(sql, /to_jsonb\(v_stored_article\) is distinct from v_before_article/iu);
  assert.match(sql, /update public\.writing_articles/iu);
  assert.match(sql, /update public\.writing_article_translations/iu);
  assert.match(sql, /BTSHQ_WRITING_RENAME_FINAL_STATE_MISMATCH/u);
  assert.match(sql, /commit;/iu);
  assert.doesNotMatch(sql, /delete\s+from\s+public\.writing_/iu);
  assert.doesNotMatch(sql, /insert\s+into\s+public\.writing_(?:articles|article_translations)/iu);
});

test("preflight is read-only, payload-exact, and rejects partial or unrelated Production state", () => {
  const sql = buildRenamePreflightSql(buildRenamePayload(sourcePayload));
  assert.match(sql, /BTSHQ_RENAME_BEFORE_ARTICLE/u);
  assert.match(sql, /BTSHQ_RENAME_AFTER_TRANSLATIONS/u);
  assert.doesNotMatch(sql, /\b(?:insert|update|delete|truncate|alter|create|drop)\b/iu);
  assert.deepEqual(validateRenamePreflight(snapshot("before")), { state: "before", migrationsApplied: 25 });
  assert.deepEqual(validateRenamePreflight(snapshot("after"), { expectedState: "after", migrationState: "after-brand-migration" }), { state: "after", migrationsApplied: 26 });
  assert.throws(() => validateRenamePreflight({ ...snapshot("before"), beforeTranslationCount: 5 }), /approved pre-rename state/u);
  assert.throws(() => validateRenamePreflight({ ...snapshot("before"), otherWritingCount: 1 }), /conflicting or unrelated/u);
  assert.throws(() => validateRenamePreflight({ ...snapshot("before"), activeClaimCount: 1 }), /not clean/u);
});

test("apply requires the exact manifest-bound Production rename confirmation", () => {
  const hash = "a".repeat(64);
  const expected = `APPLY PRODUCTION WRITING RENAME ${NEW_BRAND} ${PRODUCTION_TARGET.projectName} ${PRODUCTION_TARGET.projectRef} ${PRODUCTION_TARGET.canonicalDirectHost} ${ARTICLE_ID} ${hash}`;
  assert.equal(expectedRenameConfirmation(hash), expected);
  assert.equal(validateRenameConfirmation(expected, hash), true);
  assert.throws(() => validateRenameConfirmation(`${expected} `, hash), /Exact manifest-bound/u);
});

test("additive brand migration preserves history and advances current consent evidence", () => {
  const sql = readFileSync(new URL(`../supabase/migrations/${BRAND_MIGRATION}`, import.meta.url), "utf8");
  assert.match(sql, /begin;/iu);
  assert.match(sql, /newsletter-consent-v2/u);
  assert.match(sql, /btshq\.online newsletter/iu);
  assert.match(sql, /btshq\.online Newsletter/u);
  assert.match(sql, /create or replace function public\.set_bts_account_display_name/iu);
  assert.match(sql, /security definer[\s\S]*set search_path = pg_catalog, pg_temp/iu);
  assert.match(sql, /commit;/iu);
  assert.doesNotMatch(sql, /update\s+public\.newsletter_consent_versions/iu);
  assert.doesNotMatch(sql, /delete\s+from/iu);
});
