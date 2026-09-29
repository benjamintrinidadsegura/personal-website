#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CANONICAL_MIGRATION_NAMES,
  PRODUCTION_TARGET,
  productionChildEnvironment,
  redactProduction,
  validateCanonicalMigrationSet,
  validateProductionDatabaseUrl,
} from "./production-migrations.mjs";
import {
  APPROVED_PAYLOAD_SHA256,
  ARTICLE_ID,
  PRODUCTION_AUTHOR_ID,
  TARGET_LOCALES,
  bodyJsonSha256,
  validatePromotionPayload,
} from "./production-writing-promotion.mjs";
import { executeProcess } from "./runner.mjs";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(MODULE_DIR, "../..");
export const OLD_BRAND = "bts.online";
export const NEW_BRAND = "btshq.online";
export const OLD_SLUG = "warum-ich-bts-online-gebaut-habe";
export const NEW_SLUG = "warum-ich-btshq-online-gebaut-habe";
export const BRAND_MIGRATION = "20260930000000_btshq_online_brand_rename.sql";
export const POSTGRES_DOCKER_IMAGE = "postgres:17-alpine";

const PROMOTION_ROOT = join(REPO_ROOT, ".bts-engineering/production/content-promotion");
const SOURCE_PAYLOAD_PATH = join(PROMOTION_ROOT, `writing-${ARTICLE_ID}.payload.json`);
const ARTIFACT_ROOT = join(REPO_ROOT, ".bts-engineering/production/content-rename");
const PAYLOAD_PATH = join(ARTIFACT_ROOT, `writing-${ARTICLE_ID}.btshq-rename.payload.json`);
const SQL_PATH = join(ARTIFACT_ROOT, `writing-${ARTICLE_ID}.btshq-rename.sql`);
const LATEST_MANIFEST_PATH = join(ARTIFACT_ROOT, "latest-manifest.json");
const SECRET_PATTERN = /(?:postgres(?:ql)?:\/\/[^\s]+|\bsbp_[A-Za-z0-9_-]{20,}\b|SUPABASE_ACCESS_TOKEN\s*=)/iu;

export class BrandRenameError extends Error {
  constructor(message, code = "BRAND_RENAME_ERROR", details = {}) {
    super(message);
    this.name = "BrandRenameError";
    this.code = code;
    this.details = details;
  }
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assert(condition, message, code = "BRAND_RENAME_VALIDATION_FAILED", details = {}) {
  if (!condition) throw new BrandRenameError(message, code, details);
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function relativePath(path) {
  return relative(REPO_ROOT, path).replaceAll("\\", "/");
}

function oldIdentityCount(value) {
  const serialized = JSON.stringify(value);
  return (serialized.match(/bts\.online/gu) ?? []).length + (serialized.match(/bts-online/gu) ?? []).length;
}

export function renameBrandValue(value) {
  if (typeof value === "string") {
    return value.replaceAll(OLD_BRAND, NEW_BRAND).replaceAll("bts-online", "btshq-online");
  }
  if (Array.isArray(value)) return value.map(renameBrandValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, renameBrandValue(nested)]));
  }
  return value;
}

function bodyHashes(article, translations) {
  return Object.fromEntries([
    ["de", bodyJsonSha256(article.body_json)],
    ...translations.map((translation) => [translation.locale, bodyJsonSha256(translation.body_json)]),
  ].sort(([left], [right]) => left.localeCompare(right)));
}

export function buildRenamePayload(approvedPromotionPayload) {
  validatePromotionPayload(approvedPromotionPayload);
  const before = {
    article: structuredClone(approvedPromotionPayload.article),
    translations: structuredClone(approvedPromotionPayload.translations),
  };
  const after = renameBrandValue(before);
  return {
    schemaVersion: 1,
    operation: "writing_brand_domain_rename",
    productionProjectRef: PRODUCTION_TARGET.projectRef,
    productionAuthorId: PRODUCTION_AUTHOR_ID,
    articleId: ARTICLE_ID,
    oldBrand: OLD_BRAND,
    newBrand: NEW_BRAND,
    oldSlug: OLD_SLUG,
    newSlug: NEW_SLUG,
    before,
    after,
    beforeBodyJsonSha256: bodyHashes(before.article, before.translations),
    afterBodyJsonSha256: bodyHashes(after.article, after.translations),
  };
}

export function validateRenamePayload(payload) {
  const keys = Object.keys(payload ?? {}).sort();
  const expectedKeys = [
    "after", "afterBodyJsonSha256", "articleId", "before", "beforeBodyJsonSha256", "newBrand",
    "newSlug", "oldBrand", "oldSlug", "operation", "productionAuthorId", "productionProjectRef", "schemaVersion",
  ].sort();
  assert(arraysEqual(keys, expectedKeys), "Rename payload fields changed", "BRAND_RENAME_SCOPE_REJECTED");
  assert(payload.schemaVersion === 1 && payload.operation === "writing_brand_domain_rename", "Rename payload identity changed");
  assert(payload.productionProjectRef === PRODUCTION_TARGET.projectRef, "Rename payload Production target changed");
  assert(payload.productionAuthorId === PRODUCTION_AUTHOR_ID && payload.articleId === ARTICLE_ID, "Rename payload identity binding changed");
  assert(payload.oldBrand === OLD_BRAND && payload.newBrand === NEW_BRAND, "Rename brand pair changed");
  assert(payload.oldSlug === OLD_SLUG && payload.newSlug === NEW_SLUG, "Rename slug pair changed");

  const promotionShape = {
    schemaVersion: 1,
    operation: "writing_content_promotion",
    sourceProjectRef: "fnnhosdwldjhyfoezkot",
    productionProjectRef: PRODUCTION_TARGET.projectRef,
    productionAuthorId: PRODUCTION_AUTHOR_ID,
    article: payload.before.article,
    translations: payload.before.translations,
    bodyJsonSha256: payload.beforeBodyJsonSha256,
  };
  validatePromotionPayload(promotionShape);
  assert(payload.before.article.slug === OLD_SLUG, "Before-state slug changed");
  assert(payload.before.article.title === "Warum ich bts.online gebaut habe", "Before-state title changed");
  assert(payload.after.article.slug === NEW_SLUG, "After-state slug changed");
  assert(payload.after.article.title === "Warum ich btshq.online gebaut habe", "After-state title changed");
  assert(oldIdentityCount(payload.before) === 274, "Before-state old identity occurrence count changed", "BRAND_RENAME_SOURCE_DRIFT");
  assert(oldIdentityCount(payload.after) === 0, "After-state retains the old identity", "BRAND_RENAME_SCOPE_REJECTED");
  assert(JSON.stringify(payload.after) === JSON.stringify(renameBrandValue(payload.before)), "After-state contains changes beyond the exact rename", "BRAND_RENAME_SCOPE_REJECTED");
  assert(JSON.stringify(payload.beforeBodyJsonSha256) === JSON.stringify(bodyHashes(payload.before.article, payload.before.translations)), "Before body hashes changed");
  assert(JSON.stringify(payload.afterBodyJsonSha256) === JSON.stringify(bodyHashes(payload.after.article, payload.after.translations)), "After body hashes changed");
  assert(payload.after.article.id === ARTICLE_ID && payload.after.article.author_id === PRODUCTION_AUTHOR_ID, "After article identity changed");
  assert(payload.after.article.source_revision === 1 && payload.after.article.status === "published", "After article revision/status changed");
  assert(payload.after.translations.length === 6, "After translation count changed");
  assert(arraysEqual(payload.after.translations.map(({ locale }) => locale).sort(), [...TARGET_LOCALES]), "After locale set changed");
  for (const translation of payload.after.translations) {
    assert(translation.article_id === ARTICLE_ID, `${translation.locale} article identity changed`);
    assert(translation.status === "translated" && translation.source_revision === 1, `${translation.locale} status/revision changed`);
    assert(translation.generation_claim_id === null && translation.generation_claimed_at === null, `${translation.locale} claim state changed`);
    assert(translation.generation_attempts === 0 && translation.last_error_code === null, `${translation.locale} failure state changed`);
  }
  assert(!SECRET_PATTERN.test(JSON.stringify(payload)), "Rename payload contains credential-shaped data", "BRAND_RENAME_SECRET_REJECTED");
  return { articleId: ARTICLE_ID, oldSlug: OLD_SLUG, newSlug: NEW_SLUG, locales: [...TARGET_LOCALES] };
}

function payloadDollarTag(payloadText) {
  return `$btshq_rename_${sha256(payloadText).slice(0, 16)}$`;
}

export function buildRenameSql(payload) {
  validateRenamePayload(payload);
  const payloadText = JSON.stringify(payload);
  const tag = payloadDollarTag(payloadText);
  return `begin;
set transaction isolation level serializable;
set local search_path = pg_catalog, pg_temp;
select pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended('btshq-online:production:writing-brand-rename:${ARTICLE_ID}', 0)
);

do $btshq_writing_brand_rename$
declare
  v_payload jsonb := ${tag}${payloadText}${tag}::jsonb;
  v_before_article jsonb := v_payload #> '{before,article}';
  v_after_article jsonb := v_payload #> '{after,article}';
  v_before_translation jsonb;
  v_after_translation jsonb;
  v_stored_article public.writing_articles%rowtype;
  v_stored_translation public.writing_article_translations%rowtype;
begin
  if v_payload ->> 'operation' <> 'writing_brand_domain_rename'
    or v_payload ->> 'productionProjectRef' <> '${PRODUCTION_TARGET.projectRef}'
    or v_payload ->> 'articleId' <> '${ARTICLE_ID}'
    or v_before_article ->> 'slug' <> '${OLD_SLUG}'
    or v_after_article ->> 'slug' <> '${NEW_SLUG}'
  then
    raise exception using message = 'BTSHQ_WRITING_RENAME_PAYLOAD_MISMATCH', errcode = 'P0001';
  end if;

  if not exists (select 1 from auth.users where id = '${PRODUCTION_AUTHOR_ID}'::uuid)
    or not exists (
      select 1 from public.admin_users
      where user_id = '${PRODUCTION_AUTHOR_ID}'::uuid and role = 'admin' and is_active = true
    )
  then
    raise exception using message = 'BTSHQ_WRITING_RENAME_ADMIN_MISSING', errcode = 'P0001';
  end if;

  if (select pg_catalog.count(*) from public.writing_articles) <> 1
    or (select pg_catalog.count(*) from public.writing_article_translations) <> 6
    or exists (select 1 from public.writing_articles where id <> '${ARTICLE_ID}'::uuid)
    or exists (select 1 from public.writing_article_translations where article_id <> '${ARTICLE_ID}'::uuid)
    or exists (select 1 from public.writing_comments)
    or exists (select 1 from public.writing_discussions)
    or exists (select 1 from public.writing_comment_moderation_events)
    or exists (select 1 from public.writing_comment_rate_limits)
    or exists (select 1 from public.writing_account_comment_events)
    or exists (select 1 from public.writing_discussion_state_events)
  then
    raise exception using message = 'BTSHQ_WRITING_RENAME_UNRELATED_STATE', errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.writing_articles
    where slug = '${NEW_SLUG}' and id <> '${ARTICLE_ID}'::uuid
  ) then
    raise exception using message = 'BTSHQ_WRITING_RENAME_SLUG_CONFLICT', errcode = '23505';
  end if;

  select * into v_stored_article
  from public.writing_articles
  where id = '${ARTICLE_ID}'::uuid
  for update;
  if not found or pg_catalog.to_jsonb(v_stored_article) is distinct from v_before_article then
    raise exception using message = 'BTSHQ_WRITING_RENAME_ARTICLE_PRECONDITION', errcode = 'P0001';
  end if;

  for v_before_translation in
    select item from pg_catalog.jsonb_array_elements(v_payload #> '{before,translations}') as item
  loop
    select * into v_stored_translation
    from public.writing_article_translations
    where article_id = '${ARTICLE_ID}'::uuid and locale = v_before_translation ->> 'locale'
    for update;
    if not found or pg_catalog.to_jsonb(v_stored_translation) is distinct from v_before_translation then
      raise exception using message = 'BTSHQ_WRITING_RENAME_TRANSLATION_PRECONDITION', errcode = 'P0001';
    end if;
  end loop;

  update public.writing_articles
  set slug = v_after_article ->> 'slug',
      title = v_after_article ->> 'title',
      deck = v_after_article ->> 'deck',
      excerpt = v_after_article ->> 'excerpt',
      body = v_after_article ->> 'body',
      topics = array(select pg_catalog.jsonb_array_elements_text(v_after_article -> 'topics')),
      body_json = v_after_article -> 'body_json'
  where id = '${ARTICLE_ID}'::uuid;

  for v_after_translation in
    select item from pg_catalog.jsonb_array_elements(v_payload #> '{after,translations}') as item
  loop
    update public.writing_article_translations
    set title = v_after_translation ->> 'title',
        deck = v_after_translation ->> 'deck',
        excerpt = v_after_translation ->> 'excerpt',
        body = v_after_translation ->> 'body',
        body_json = v_after_translation -> 'body_json'
    where article_id = '${ARTICLE_ID}'::uuid and locale = v_after_translation ->> 'locale';
  end loop;

  if (select pg_catalog.to_jsonb(article) from public.writing_articles as article where id = '${ARTICLE_ID}'::uuid)
       is distinct from v_after_article
    or exists (
      select 1
      from public.writing_article_translations as stored
      join lateral pg_catalog.jsonb_array_elements(v_payload #> '{after,translations}') as approved
        on approved ->> 'locale' = stored.locale
      where stored.article_id = '${ARTICLE_ID}'::uuid
        and pg_catalog.to_jsonb(stored) is distinct from approved
    )
    or (select pg_catalog.count(*) from public.writing_article_translations where article_id = '${ARTICLE_ID}'::uuid) <> 6
    or exists (
      select 1 from public.writing_article_translations
      where article_id = '${ARTICLE_ID}'::uuid
        and (status <> 'translated' or source_revision <> 1 or generation_claim_id is not null
          or generation_claimed_at is not null or generation_attempts <> 0 or last_error_code is not null)
    )
  then
    raise exception using message = 'BTSHQ_WRITING_RENAME_FINAL_STATE_MISMATCH', errcode = 'P0001';
  end if;
end;
$btshq_writing_brand_rename$;

commit;
`;
}

export function expectedRenameConfirmation(manifestSha256) {
  return `APPLY PRODUCTION WRITING RENAME ${NEW_BRAND} ${PRODUCTION_TARGET.projectName} ${PRODUCTION_TARGET.projectRef} ${PRODUCTION_TARGET.canonicalDirectHost} ${ARTICLE_ID} ${manifestSha256}`;
}

export function validateRenameConfirmation(value, manifestSha256) {
  assert(value === expectedRenameConfirmation(manifestSha256), "Exact manifest-bound Production Writing rename confirmation is required", "BRAND_RENAME_APPLY_GATE_REQUIRED");
  return true;
}

export function buildRenamePreflightSql(payload) {
  validateRenamePayload(payload);
  const payloadText = JSON.stringify(payload);
  const tag = payloadDollarTag(payloadText);
  const expression = `${tag}${payloadText}${tag}::jsonb`;
  return `select 'BTSHQ_RENAME_DATABASE|' || pg_catalog.current_database()
union all select 'BTSHQ_RENAME_MIGRATION|' || version from supabase_migrations.schema_migrations
union all select 'BTSHQ_RENAME_AUTH_USER|' || pg_catalog.count(*)::text from auth.users where id = '${PRODUCTION_AUTHOR_ID}'::uuid
union all select 'BTSHQ_RENAME_ACTIVE_ADMIN|' || pg_catalog.count(*)::text from public.admin_users where user_id = '${PRODUCTION_AUTHOR_ID}'::uuid and role = 'admin' and is_active = true
union all select 'BTSHQ_RENAME_ARTICLES|' || pg_catalog.count(*)::text from public.writing_articles
union all select 'BTSHQ_RENAME_TRANSLATIONS|' || pg_catalog.count(*)::text from public.writing_article_translations
union all select 'BTSHQ_RENAME_BEFORE_ARTICLE|' || pg_catalog.count(*)::text from public.writing_articles as row where pg_catalog.to_jsonb(row) = (${expression} #> '{before,article}')
union all select 'BTSHQ_RENAME_AFTER_ARTICLE|' || pg_catalog.count(*)::text from public.writing_articles as row where pg_catalog.to_jsonb(row) = (${expression} #> '{after,article}')
union all select 'BTSHQ_RENAME_BEFORE_TRANSLATIONS|' || pg_catalog.count(*)::text from public.writing_article_translations as row where exists (select 1 from pg_catalog.jsonb_array_elements(${expression} #> '{before,translations}') as item where item ->> 'locale' = row.locale and item = pg_catalog.to_jsonb(row))
union all select 'BTSHQ_RENAME_AFTER_TRANSLATIONS|' || pg_catalog.count(*)::text from public.writing_article_translations as row where exists (select 1 from pg_catalog.jsonb_array_elements(${expression} #> '{after,translations}') as item where item ->> 'locale' = row.locale and item = pg_catalog.to_jsonb(row))
union all select 'BTSHQ_RENAME_ACTIVE_CLAIMS|' || pg_catalog.count(*)::text from public.writing_article_translations where generation_claim_id is not null or generation_claimed_at is not null
union all select 'BTSHQ_RENAME_PROBLEM_TRANSLATIONS|' || pg_catalog.count(*)::text from public.writing_article_translations where status <> 'translated' or source_revision <> 1 or generation_attempts <> 0 or last_error_code is not null
union all select 'BTSHQ_RENAME_SLUG_CONFLICTS|' || pg_catalog.count(*)::text from public.writing_articles where slug = '${NEW_SLUG}' and id <> '${ARTICLE_ID}'::uuid
union all select 'BTSHQ_RENAME_OTHER_WRITING|' || ((select pg_catalog.count(*) from public.writing_articles where id <> '${ARTICLE_ID}'::uuid) + (select pg_catalog.count(*) from public.writing_article_translations where article_id <> '${ARTICLE_ID}'::uuid) + (select pg_catalog.count(*) from public.writing_comments) + (select pg_catalog.count(*) from public.writing_discussions) + (select pg_catalog.count(*) from public.writing_comment_moderation_events) + (select pg_catalog.count(*) from public.writing_comment_rate_limits) + (select pg_catalog.count(*) from public.writing_account_comment_events) + (select pg_catalog.count(*) from public.writing_discussion_state_events))::text;`;
}

export function parseRenamePreflightOutput(output) {
  const text = String(output);
  const migrationVersions = [...text.matchAll(/BTSHQ_RENAME_MIGRATION\|([0-9]+)/gu)].map((match) => match[1]).sort();
  const database = [...text.matchAll(/BTSHQ_RENAME_DATABASE\|([^\s|]+)/gu)];
  assert(database.length === 1 && database[0][1] === "postgres", "Production database identity probe failed", "BRAND_RENAME_PRODUCTION_STATE_REJECTED");
  function count(marker) {
    const values = [...text.matchAll(new RegExp(`${marker}\\|([0-9]+)`, "gu"))];
    assert(values.length === 1, `${marker} was missing or ambiguous`, "BRAND_RENAME_PRODUCTION_STATE_REJECTED");
    return Number(values[0][1]);
  }
  return {
    migrationVersions,
    authUserCount: count("BTSHQ_RENAME_AUTH_USER"), activeAdminCount: count("BTSHQ_RENAME_ACTIVE_ADMIN"),
    articleCount: count("BTSHQ_RENAME_ARTICLES"), translationCount: count("BTSHQ_RENAME_TRANSLATIONS"),
    beforeArticleCount: count("BTSHQ_RENAME_BEFORE_ARTICLE"), afterArticleCount: count("BTSHQ_RENAME_AFTER_ARTICLE"),
    beforeTranslationCount: count("BTSHQ_RENAME_BEFORE_TRANSLATIONS"), afterTranslationCount: count("BTSHQ_RENAME_AFTER_TRANSLATIONS"),
    activeClaimCount: count("BTSHQ_RENAME_ACTIVE_CLAIMS"), problemTranslationCount: count("BTSHQ_RENAME_PROBLEM_TRANSLATIONS"),
    slugConflictCount: count("BTSHQ_RENAME_SLUG_CONFLICTS"), otherWritingCount: count("BTSHQ_RENAME_OTHER_WRITING"),
  };
}

function migrationVersions(names) {
  return names.map((name) => name.match(/^(\d+)_/u)?.[1]);
}

export function validateRenamePreflight(snapshot, { expectedState = "before", migrationState = "before-brand-migration" } = {}) {
  validateCanonicalMigrationSet(REPO_ROOT);
  const expectedMigrations = migrationState === "before-brand-migration"
    ? CANONICAL_MIGRATION_NAMES.slice(0, -1)
    : CANONICAL_MIGRATION_NAMES;
  assert(arraysEqual(snapshot.migrationVersions ?? [], migrationVersions(expectedMigrations)), "Production migration history is not the expected exact chain", "BRAND_RENAME_PRODUCTION_STATE_REJECTED");
  assert(Number(snapshot.authUserCount) === 1 && Number(snapshot.activeAdminCount) === 1, "Production admin binding mismatch", "BRAND_RENAME_PRODUCTION_STATE_REJECTED");
  assert(Number(snapshot.articleCount) === 1 && Number(snapshot.translationCount) === 6, "Production Writing cardinality mismatch", "BRAND_RENAME_PRODUCTION_STATE_REJECTED");
  assert(Number(snapshot.activeClaimCount) === 0 && Number(snapshot.problemTranslationCount) === 0, "Production translations are not clean", "BRAND_RENAME_PRODUCTION_STATE_REJECTED");
  assert(Number(snapshot.slugConflictCount) === 0 && Number(snapshot.otherWritingCount) === 0, "Production contains conflicting or unrelated Writing state", "BRAND_RENAME_PRODUCTION_STATE_REJECTED");
  const before = Number(snapshot.beforeArticleCount) === 1 && Number(snapshot.beforeTranslationCount) === 6 && Number(snapshot.afterArticleCount) === 0 && Number(snapshot.afterTranslationCount) === 0;
  const after = Number(snapshot.beforeArticleCount) === 0 && Number(snapshot.beforeTranslationCount) === 0 && Number(snapshot.afterArticleCount) === 1 && Number(snapshot.afterTranslationCount) === 6;
  assert(["before", "after", "before-or-after"].includes(expectedState), "Unknown rename verification state");
  if (expectedState === "before") assert(before, "Production does not exactly match the approved pre-rename state", "BRAND_RENAME_PRODUCTION_STATE_REJECTED");
  if (expectedState === "after") assert(after, "Production does not exactly match the approved post-rename state", "BRAND_RENAME_PRODUCTION_STATE_REJECTED");
  if (expectedState === "before-or-after") assert(before || after, "Production matches neither exact rename state", "BRAND_RENAME_PRODUCTION_STATE_REJECTED");
  return { state: after ? "after" : "before", migrationsApplied: expectedMigrations.length };
}

function readSourcePayload() {
  assert(existsSync(SOURCE_PAYLOAD_PATH), "Approved promotion payload is missing", "BRAND_RENAME_ARTIFACT_MISSING");
  const bytes = readFileSync(SOURCE_PAYLOAD_PATH);
  assert(sha256(bytes) === APPROVED_PAYLOAD_SHA256, "Approved promotion payload checksum changed", "BRAND_RENAME_SOURCE_DRIFT");
  const payload = JSON.parse(bytes.toString("utf8"));
  validatePromotionPayload(payload);
  return payload;
}

function rowHashes(state) {
  return {
    article: sha256(JSON.stringify(state.article)),
    translations: Object.fromEntries(state.translations.map((translation) => [translation.locale, sha256(JSON.stringify(translation))]).sort(([left], [right]) => left.localeCompare(right))),
  };
}

export function prepareArtifacts({ now = () => new Date() } = {}) {
  const payload = buildRenamePayload(readSourcePayload());
  validateRenamePayload(payload);
  const payloadBytes = `${JSON.stringify(payload, null, 2)}\n`;
  const sqlBytes = buildRenameSql(payload);
  const payloadSha256 = sha256(payloadBytes);
  const sqlSha256 = sha256(sqlBytes);
  mkdirSync(ARTIFACT_ROOT, { recursive: true });
  writeFileSync(PAYLOAD_PATH, payloadBytes, "utf8");
  writeFileSync(SQL_PATH, sqlBytes, "utf8");
  const manifest = {
    schemaVersion: 1,
    environment: "PRODUCTION",
    operation: "writing_brand_domain_rename",
    projectName: PRODUCTION_TARGET.projectName,
    projectRef: PRODUCTION_TARGET.projectRef,
    canonicalHost: PRODUCTION_TARGET.canonicalDirectHost,
    articleId: ARTICLE_ID,
    oldBrand: OLD_BRAND,
    newBrand: NEW_BRAND,
    oldSlug: OLD_SLUG,
    newSlug: NEW_SLUG,
    translationLocales: [...TARGET_LOCALES],
    sourceRevision: 1,
    migrationPrerequisite: { beforeApplied: 25, applyRequires: 26, requiredMigration: BRAND_MIGRATION },
    before: { ...rowHashes(payload.before), bodyJson: payload.beforeBodyJsonSha256 },
    after: { ...rowHashes(payload.after), bodyJson: payload.afterBodyJsonSha256 },
    payload: { path: relativePath(PAYLOAD_PATH), sha256: payloadSha256 },
    sql: { path: relativePath(SQL_PATH), sha256: sqlSha256 },
    executionTransport: { kind: "docker_psql", image: POSTGRES_DOCKER_IMAGE, sqlMount: "read_only", onErrorStop: true },
    createdAt: now().toISOString(),
  };
  const manifestBytes = `${JSON.stringify(manifest, null, 2)}\n`;
  assert(!SECRET_PATTERN.test(manifestBytes), "Rename manifest contains credential-shaped data", "BRAND_RENAME_SECRET_REJECTED");
  const manifestSha256 = sha256(manifestBytes);
  const manifestDir = join(ARTIFACT_ROOT, "manifests");
  mkdirSync(manifestDir, { recursive: true });
  const manifestPath = join(manifestDir, `${manifest.createdAt.replace(/[:.]/gu, "-")}-${manifestSha256}.json`);
  writeFileSync(manifestPath, manifestBytes, "utf8");
  writeFileSync(LATEST_MANIFEST_PATH, `${JSON.stringify({ manifestPath: relativePath(manifestPath), manifestSha256 }, null, 2)}\n`, "utf8");
  return { manifest, manifestPath, manifestSha256, payloadPath: PAYLOAD_PATH, payloadSha256, sqlPath: SQL_PATH, sqlSha256, confirmation: expectedRenameConfirmation(manifestSha256) };
}

function loadArtifacts() {
  assert(existsSync(LATEST_MANIFEST_PATH), "Rename manifest is missing", "BRAND_RENAME_APPLY_GATE_REQUIRED");
  const pointer = JSON.parse(readFileSync(LATEST_MANIFEST_PATH, "utf8"));
  const manifestPath = resolve(REPO_ROOT, pointer.manifestPath ?? "");
  const manifestRoot = resolve(join(ARTIFACT_ROOT, "manifests"));
  assert(manifestPath.startsWith(`${manifestRoot}\\`) || manifestPath.startsWith(`${manifestRoot}/`), "Rename manifest path escaped evidence root", "BRAND_RENAME_APPLY_GATE_REQUIRED");
  const manifestBytes = readFileSync(manifestPath);
  const manifestSha256 = sha256(manifestBytes);
  assert(manifestSha256 === pointer.manifestSha256, "Rename manifest checksum mismatch", "BRAND_RENAME_APPLY_GATE_REQUIRED");
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  assert(manifest.projectRef === PRODUCTION_TARGET.projectRef && manifest.canonicalHost === PRODUCTION_TARGET.canonicalDirectHost, "Rename manifest target changed", "BRAND_RENAME_APPLY_GATE_REQUIRED");
  const payloadBytes = readFileSync(resolve(REPO_ROOT, manifest.payload.path));
  const sqlBytes = readFileSync(resolve(REPO_ROOT, manifest.sql.path));
  assert(sha256(payloadBytes) === manifest.payload.sha256 && sha256(sqlBytes) === manifest.sql.sha256, "Rename artifact checksum mismatch", "BRAND_RENAME_APPLY_GATE_REQUIRED");
  const payload = JSON.parse(payloadBytes.toString("utf8"));
  validateRenamePayload(payload);
  assert(buildRenameSql(payload) === sqlBytes.toString("utf8"), "Rename SQL does not match payload", "BRAND_RENAME_APPLY_GATE_REQUIRED");
  return { manifest, manifestPath, manifestSha256, payload, sqlPath: resolve(REPO_ROOT, manifest.sql.path) };
}

export function createRenameDatabase(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? REPO_ROOT);
  const stateRoot = resolve(options.stateRoot ?? join(ARTIFACT_ROOT, "tmp"));
  const environment = options.env ?? process.env;
  const execute = options.execute ?? executeProcess;
  const dockerCommand = options.dockerCommand ?? "docker";
  const timeoutMs = options.timeoutMs ?? 120_000;
  const secrets = new Set();

  function target() {
    const raw = environment.BTS_PRODUCTION_DATABASE_URL;
    const validated = validateProductionDatabaseUrl(raw);
    secrets.add(raw); secrets.add(validated.url); secrets.add(validated.password);
    return validated;
  }

  async function psqlFile(validated, file, label) {
    const containerPath = "/btshq/rename.sql";
    const args = ["run", "--rm", "--mount", `type=bind,source=${resolve(file)},target=${containerPath},readonly`, "--env", "BTS_PRODUCTION_DATABASE_URL", POSTGRES_DOCKER_IMAGE, "sh", "-c", `exec psql "$BTS_PRODUCTION_DATABASE_URL" -v ON_ERROR_STOP=1 -f ${containerPath}`];
    const childEnvironment = { ...productionChildEnvironment(environment), BTS_PRODUCTION_DATABASE_URL: validated.url };
    try {
      const result = await execute(dockerCommand, args, { cwd: repoRoot, env: childEnvironment, timeoutMs });
      if (result.code !== 0) throw new BrandRenameError(`${label} failed`, "BRAND_RENAME_DATABASE_FAILED", { transport: "docker_psql", code: result.code, output: redactProduction(`${result.stdout}\n${result.stderr}`, [...secrets]).slice(-4_000) });
      return result;
    } catch (error) {
      if (error instanceof BrandRenameError) throw error;
      throw new BrandRenameError(`${label} failed`, "BRAND_RENAME_DATABASE_FAILED", { transport: "docker_psql", errorClass: error instanceof Error ? error.name : "UnknownError", transportCode: error?.code, output: redactProduction(error instanceof Error ? error.message : String(error), [...secrets]).slice(-4_000) });
    }
  }

  async function query(validated, sql, label) {
    mkdirSync(stateRoot, { recursive: true });
    const file = join(stateRoot, `${randomUUID()}.sql`);
    writeFileSync(file, `${sql.trim()}\n`, "utf8");
    try { return await psqlFile(validated, file, label); } finally { rmSync(file, { force: true }); }
  }

  async function preflight(payload, validationOptions) {
    const validated = target();
    const result = await query(validated, buildRenamePreflightSql(payload), "Production Writing rename preflight");
    const snapshot = parseRenamePreflightOutput(`${result.stdout}\n${result.stderr}`);
    const verification = validateRenamePreflight(snapshot, validationOptions);
    return { target: validated, snapshot, state: verification.state };
  }

  return { target, psqlFile, preflight };
}

export async function verifyBefore(options = {}) {
  const artifacts = loadArtifacts();
  const database = createRenameDatabase(options);
  const { snapshot, state } = await database.preflight(artifacts.payload, { expectedState: "before", migrationState: "before-brand-migration" });
  return { status: "verified-before", state, snapshot, manifestSha256: artifacts.manifestSha256 };
}

export async function apply({ confirmation, env = process.env } = {}) {
  const artifacts = loadArtifacts();
  validateRenameConfirmation(confirmation, artifacts.manifestSha256);
  const database = createRenameDatabase({ env });
  const before = await database.preflight(artifacts.payload, { expectedState: "before-or-after", migrationState: "after-brand-migration" });
  if (before.state === "after") return { status: "already-applied", manifestSha256: artifacts.manifestSha256 };
  await database.psqlFile(before.target, artifacts.sqlPath, "Manifest-bound Production Writing brand rename");
  const after = await database.preflight(artifacts.payload, { expectedState: "after", migrationState: "after-brand-migration" });
  return { status: "applied", state: after.state, manifestSha256: artifacts.manifestSha256 };
}

function parseArgs(argv) {
  if (argv.length === 1 && argv[0] === "prepare") return { command: "prepare", options: {} };
  if (argv.length === 1 && argv[0] === "verify-before") return { command: "verify-before", options: {} };
  if (argv.length === 3 && argv[0] === "apply" && argv[1] === "--confirmation" && argv[2]) return { command: "apply", options: { confirmation: argv[2] } };
  throw new BrandRenameError("Usage: production-writing-brand-rename.mjs <prepare|verify-before|apply --confirmation \"APPLY PRODUCTION WRITING RENAME ...\">", "BRAND_RENAME_ARGUMENT_INVALID");
}

export async function main(argv = process.argv.slice(2)) {
  const parsed = parseArgs(argv);
  if (parsed.command === "prepare") {
    const result = prepareArtifacts();
    console.log(JSON.stringify({ status: "prepared", payloadPath: relativePath(result.payloadPath), payloadSha256: result.payloadSha256, sqlPath: relativePath(result.sqlPath), sqlSha256: result.sqlSha256, manifestPath: relativePath(result.manifestPath), manifestSha256: result.manifestSha256, confirmation: result.confirmation, articleId: ARTICLE_ID, translations: 6 }, null, 2));
    return result;
  }
  if (parsed.command === "verify-before") {
    const result = await verifyBefore();
    console.log(JSON.stringify({ status: result.status, migrationsApplied: result.snapshot.migrationVersions.length, migrationsPending: 1, writingArticles: result.snapshot.articleCount, writingTranslations: result.snapshot.translationCount, activeClaims: result.snapshot.activeClaimCount, problematicTranslations: result.snapshot.problemTranslationCount, unrelatedWritingRows: result.snapshot.otherWritingCount, state: result.state }, null, 2));
    return result;
  }
  return apply({ ...parsed.options });
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const code = typeof error?.code === "string" ? error.code : "BRAND_RENAME_UNEXPECTED_ERROR";
    console.error(`PRODUCTION WRITING BRAND RENAME FAILED — ${code}: ${String(error.message).slice(0, 500)}`);
    process.exitCode = 1;
  });
}
