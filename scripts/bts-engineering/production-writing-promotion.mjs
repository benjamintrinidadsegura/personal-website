#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CANONICAL_MIGRATION_NAMES,
  PRODUCTION_TARGET,
  productionChildEnvironment,
  redactProduction,
  validateProductionDatabaseUrl,
  validateCanonicalMigrationSet,
} from "./production-migrations.mjs";
import { executeProcess } from "./runner.mjs";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(MODULE_DIR, "../..");
export const SOURCE_PROJECT_REF = "fnnhosdwldjhyfoezkot";
export const ARTICLE_ID = "a651ef2d-e4b0-4203-91ac-71afa145d36d";
export const ARTICLE_SLUG = "warum-ich-bts-online-gebaut-habe";
export const PRODUCTION_AUTHOR_ID = "eb38e959-46c0-49ac-9873-c9e3b964c8e7";
export const TARGET_LOCALES = Object.freeze(["el", "en", "es", "pl", "ru", "tr"]);
/** @type {Readonly<Record<string, string>>} */
export const EXPECTED_BODY_JSON_SHA256 = Object.freeze({
  de: "606e8344df1b380619f344c9063e30f69617b1d5c18c395ab38fa312b20a5504",
  en: "bf4ed40d5a2918ce4b3d6d79e6e4b3d9b3030d37c583345553d2d63319e8f7eb",
  es: "40f368b269dd61f7d655018d0113b83d66da4d3f0de3f47648c2c6707a8a435e",
  tr: "e537079c1a6b32c20cf3af3f95019ea55e5a2db6d1a146655175aed576c39cee",
  pl: "a4b858e89ad85c7103f88783c51684f5e9a9300dbc3b67f39c22c3eaacf099a8",
  el: "23fc8f58289f120f5c6c43312062aa61afe18e45d857ed2cc2af9c781a39b5a9",
  ru: "0a94747a53e0f9f8eeb5d45039e5e2a892c864db0f3585a8b86b04c6583ef6d1",
});

const ARTIFACT_ROOT = join(REPO_ROOT, ".bts-engineering/production/content-promotion");
const PAYLOAD_PATH = join(ARTIFACT_ROOT, `writing-${ARTICLE_ID}.payload.json`);
const SQL_PATH = join(ARTIFACT_ROOT, `writing-${ARTICLE_ID}.import.sql`);
const LATEST_MANIFEST_PATH = join(ARTIFACT_ROOT, "latest-manifest.json");
export const APPROVED_PAYLOAD_SHA256 = "28f09c8e630390aef9fddf6b9dd4f4dc478fd949952c3f3614c8b2edf0bde784";
export const APPROVED_IMPORT_SQL_SHA256 = "7e1c955e4321e854d96f8a8634977cb4089f9224107c747c7080fbbf30454f62";
export const POSTGRES_DOCKER_IMAGE = "postgres:17-alpine";
const SECRET_PATTERN = /(?:postgres(?:ql)?:\/\/[^\s]+|\bsbp_[A-Za-z0-9_-]{20,}\b|SUPABASE_ACCESS_TOKEN\s*=)/iu;

export class PromotionError extends Error {
  constructor(message, code = "PROMOTION_ERROR", details = {}) {
    super(message);
    this.name = "PromotionError";
    this.code = code;
    this.details = details;
  }
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function bodyJsonSha256(value) {
  return sha256(JSON.stringify(value));
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function assert(condition, message, code = "PROMOTION_VALIDATION_FAILED", details = {}) {
  if (!condition) throw new PromotionError(message, code, details);
}

function assertExactKeys(value, expected, label) {
  const actual = Object.keys(value ?? {}).sort();
  const wanted = [...expected].sort();
  assert(arraysEqual(actual, wanted), `${label} contains unexpected or missing fields`, "PROMOTION_SCOPE_REJECTED", {
    label,
    actual,
    expected: wanted,
  });
}

const ARTICLE_FIELDS = Object.freeze([
  "id", "author_id", "slug", "title", "deck", "excerpt", "body", "content_type", "topics", "status",
  "created_at", "updated_at", "published_at", "body_json", "source_locale", "source_revision",
]);
const TRANSLATION_FIELDS = Object.freeze([
  "article_id", "locale", "title", "deck", "excerpt", "body", "body_json", "status", "source_revision",
  "generated_at", "manually_edited", "created_at", "updated_at", "generation_claim_id",
  "generation_claimed_at", "generation_attempts", "last_error_code",
]);
const PAYLOAD_FIELDS = Object.freeze([
  "schemaVersion", "operation", "sourceProjectRef", "productionProjectRef", "productionAuthorId",
  "article", "translations", "bodyJsonSha256",
]);

export function validatePromotionPayload(payload, { expectedBodyJsonSha256 = EXPECTED_BODY_JSON_SHA256 } = {}) {
  assertExactKeys(payload, PAYLOAD_FIELDS, "promotion payload");
  assert(payload.schemaVersion === 1, "Unsupported promotion payload schema");
  assert(payload.operation === "writing_content_promotion", "Unexpected promotion operation");
  assert(payload.sourceProjectRef === SOURCE_PROJECT_REF, "Unexpected source project");
  assert(payload.productionProjectRef === PRODUCTION_TARGET.projectRef, "Unexpected Production project");
  assert(payload.productionAuthorId === PRODUCTION_AUTHOR_ID, "Unexpected Production author binding");
  assertExactKeys(payload.article, ARTICLE_FIELDS, "article");
  assert(payload.article.id === ARTICLE_ID, "Unexpected article ID");
  assert(payload.article.author_id === PRODUCTION_AUTHOR_ID, "Article author is not bound to Production admin");
  assert(payload.article.slug === ARTICLE_SLUG, "Unexpected article slug");
  assert(payload.article.title === "Warum ich bts.online gebaut habe", "Unexpected source title");
  assert(payload.article.status === "published", "Source article is not published");
  assert(payload.article.source_locale === "de", "Unexpected source locale");
  assert(payload.article.source_revision === 1, "Unexpected source revision");
  assert(bodyJsonSha256(payload.article.body_json) === expectedBodyJsonSha256.de, "DE body_json checksum mismatch");

  assert(Array.isArray(payload.translations) && payload.translations.length === 6, "Exactly six translations are required");
  const locales = payload.translations.map(({ locale }) => locale).sort();
  assert(arraysEqual(locales, TARGET_LOCALES), "Translation locale set mismatch", "PROMOTION_SCOPE_REJECTED", { locales });
  for (const translation of payload.translations) {
    assertExactKeys(translation, TRANSLATION_FIELDS, `translation:${translation.locale ?? "unknown"}`);
    assert(translation.article_id === ARTICLE_ID, `Unexpected article ID for ${translation.locale}`);
    assert(translation.status === "translated", `${translation.locale} is not translated`);
    assert(translation.source_revision === 1, `${translation.locale} source revision mismatch`);
    assert(translation.generation_claim_id === null, `${translation.locale} has an active claim`);
    assert(translation.generation_claimed_at === null, `${translation.locale} has a claim timestamp`);
    assert(translation.generation_attempts === 0, `${translation.locale} attempts were not reset`);
    assert(translation.last_error_code === null, `${translation.locale} retains failure state`);
    assert(bodyJsonSha256(translation.body_json) === expectedBodyJsonSha256[translation.locale], `${translation.locale} body_json checksum mismatch`);
  }

  assertExactKeys(payload.bodyJsonSha256, Object.keys(expectedBodyJsonSha256), "body_json checksum map");
  for (const [locale, expected] of Object.entries(expectedBodyJsonSha256)) {
    assert(payload.bodyJsonSha256[locale] === expected, `${locale} manifest checksum mismatch`);
  }

  const serialized = JSON.stringify(payload);
  assert(!SECRET_PATTERN.test(serialized), "Promotion payload contains credential-shaped data", "PROMOTION_SECRET_REJECTED");
  return {
    articleId: ARTICLE_ID,
    slug: ARTICLE_SLUG,
    sourceRevision: 1,
    locales,
  };
}

function payloadDollarTag(payloadText) {
  let suffix = sha256(payloadText).slice(0, 16);
  let tag = `$bts_payload_${suffix}$`;
  while (payloadText.includes(tag)) {
    suffix = sha256(suffix).slice(0, 16);
    tag = `$bts_payload_${suffix}$`;
  }
  return tag;
}

export function buildPromotionSql(payload, validationOptions) {
  validatePromotionPayload(payload, validationOptions);
  const payloadText = JSON.stringify(payload);
  const tag = payloadDollarTag(payloadText);
  return `begin;
set transaction isolation level serializable;
set local search_path = pg_catalog, pg_temp;
select pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended('bts-online:production:writing-promotion:${ARTICLE_ID}', 0)
);

do $bts_writing_promotion$
declare
  v_payload jsonb := ${tag}${payloadText}${tag}::jsonb;
  v_article jsonb := v_payload -> 'article';
  v_translation jsonb;
  v_existing_article public.writing_articles%rowtype;
  v_existing_translation public.writing_article_translations%rowtype;
  v_locales text[];
  v_article_exists boolean;
begin
  if v_payload ->> 'operation' <> 'writing_content_promotion'
    or v_payload ->> 'productionProjectRef' <> '${PRODUCTION_TARGET.projectRef}'
    or v_payload ->> 'productionAuthorId' <> '${PRODUCTION_AUTHOR_ID}'
    or v_article ->> 'id' <> '${ARTICLE_ID}'
    or v_article ->> 'slug' <> '${ARTICLE_SLUG}'
    or v_article ->> 'status' <> 'published'
    or v_article ->> 'source_locale' <> 'de'
    or (v_article ->> 'source_revision')::bigint <> 1
  then
    raise exception using message = 'BTS_WRITING_PROMOTION_PAYLOAD_MISMATCH', errcode = 'P0001';
  end if;

  select pg_catalog.array_agg(item ->> 'locale' order by item ->> 'locale')
  into v_locales
  from pg_catalog.jsonb_array_elements(v_payload -> 'translations') as item;
  if v_locales is distinct from array['el','en','es','pl','ru','tr']::text[] then
    raise exception using message = 'BTS_WRITING_PROMOTION_LOCALE_MISMATCH', errcode = 'P0001';
  end if;

  if not exists (select 1 from auth.users where id = '${PRODUCTION_AUTHOR_ID}'::uuid) then
    raise exception using message = 'BTS_WRITING_PROMOTION_AUTH_USER_MISSING', errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.admin_users
    where user_id = '${PRODUCTION_AUTHOR_ID}'::uuid and role = 'admin' and is_active = true
  ) then
    raise exception using message = 'BTS_WRITING_PROMOTION_ACTIVE_ADMIN_MISSING', errcode = 'P0001';
  end if;

  if exists (select 1 from public.writing_articles where id <> '${ARTICLE_ID}'::uuid)
    or exists (select 1 from public.writing_article_translations where article_id <> '${ARTICLE_ID}'::uuid)
    or exists (select 1 from public.writing_comments)
    or exists (select 1 from public.writing_discussions)
    or exists (select 1 from public.writing_comment_moderation_events)
    or exists (select 1 from public.writing_comment_rate_limits)
    or exists (select 1 from public.writing_account_comment_events)
    or exists (select 1 from public.writing_discussion_state_events)
  then
    raise exception using message = 'BTS_WRITING_PROMOTION_UNRELATED_WRITING_ROWS', errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.writing_articles
    where slug = '${ARTICLE_SLUG}' and id <> '${ARTICLE_ID}'::uuid
  ) then
    raise exception using message = 'BTS_WRITING_PROMOTION_SLUG_CONFLICT', errcode = '23505';
  end if;

  select * into v_existing_article
  from public.writing_articles
  where id = '${ARTICLE_ID}'::uuid
  for update;
  v_article_exists := found;

  if v_article_exists then
    if pg_catalog.to_jsonb(v_existing_article) is distinct from v_article then
      raise exception using message = 'BTS_WRITING_PROMOTION_ARTICLE_CONFLICT', errcode = 'P0001';
    end if;
    if (select pg_catalog.count(*) from public.writing_article_translations where article_id = '${ARTICLE_ID}'::uuid) <> 6 then
      raise exception using message = 'BTS_WRITING_PROMOTION_TRANSLATION_SET_CONFLICT', errcode = 'P0001';
    end if;
    for v_translation in select item from pg_catalog.jsonb_array_elements(v_payload -> 'translations') as item loop
      select * into v_existing_translation
      from public.writing_article_translations
      where article_id = '${ARTICLE_ID}'::uuid and locale = v_translation ->> 'locale'
      for update;
      if not found or pg_catalog.to_jsonb(v_existing_translation) is distinct from v_translation then
        raise exception using message = 'BTS_WRITING_PROMOTION_TRANSLATION_CONFLICT', errcode = 'P0001';
      end if;
    end loop;
  else
    if exists (select 1 from public.writing_articles)
      or exists (select 1 from public.writing_article_translations)
    then
      raise exception using message = 'BTS_WRITING_PROMOTION_NONEMPTY_WRITING_STATE', errcode = 'P0001';
    end if;

    insert into public.writing_articles (
      id, author_id, slug, title, deck, excerpt, body, content_type, topics, status,
      created_at, updated_at, published_at, body_json, source_locale, source_revision
    ) values (
      (v_article ->> 'id')::uuid,
      (v_article ->> 'author_id')::uuid,
      v_article ->> 'slug',
      v_article ->> 'title',
      v_article ->> 'deck',
      v_article ->> 'excerpt',
      v_article ->> 'body',
      v_article ->> 'content_type',
      array(select pg_catalog.jsonb_array_elements_text(v_article -> 'topics')),
      v_article ->> 'status',
      (v_article ->> 'created_at')::timestamptz,
      (v_article ->> 'updated_at')::timestamptz,
      (v_article ->> 'published_at')::timestamptz,
      v_article -> 'body_json',
      v_article ->> 'source_locale',
      (v_article ->> 'source_revision')::bigint
    );

    for v_translation in select item from pg_catalog.jsonb_array_elements(v_payload -> 'translations') as item loop
      insert into public.writing_article_translations (
        article_id, locale, title, deck, excerpt, body, body_json, status, source_revision,
        generated_at, manually_edited, created_at, updated_at, generation_claim_id,
        generation_claimed_at, generation_attempts, last_error_code
      ) values (
        (v_translation ->> 'article_id')::uuid,
        v_translation ->> 'locale',
        v_translation ->> 'title',
        v_translation ->> 'deck',
        v_translation ->> 'excerpt',
        v_translation ->> 'body',
        v_translation -> 'body_json',
        v_translation ->> 'status',
        (v_translation ->> 'source_revision')::bigint,
        (v_translation ->> 'generated_at')::timestamptz,
        (v_translation ->> 'manually_edited')::boolean,
        (v_translation ->> 'created_at')::timestamptz,
        (v_translation ->> 'updated_at')::timestamptz,
        null,
        null,
        0,
        null
      );
    end loop;
  end if;

  if (select pg_catalog.count(*) from public.writing_articles) <> 1
    or (select pg_catalog.count(*) from public.writing_article_translations) <> 6
    or (select pg_catalog.count(*) from public.writing_article_translations where generation_claim_id is not null) <> 0
    or (select pg_catalog.count(*) from public.writing_article_translations where status in ('stale','failed')) <> 0
    or (select pg_catalog.count(*) from public.writing_article_translations where generation_attempts <> 0 or last_error_code is not null) <> 0
  then
    raise exception using message = 'BTS_WRITING_PROMOTION_FINAL_STATE_MISMATCH', errcode = 'P0001';
  end if;
  if (select body_json from public.writing_articles where id = '${ARTICLE_ID}'::uuid)
       is distinct from (v_article -> 'body_json')
    or exists (
      select 1
      from public.writing_article_translations as stored
      join lateral pg_catalog.jsonb_array_elements(v_payload -> 'translations') as approved
        on approved ->> 'locale' = stored.locale
      where stored.article_id = '${ARTICLE_ID}'::uuid
        and stored.body_json is distinct from approved -> 'body_json'
    )
  then
    raise exception using message = 'BTS_WRITING_PROMOTION_BODY_MISMATCH', errcode = 'P0001';
  end if;
end;
$bts_writing_promotion$;

commit;
`;
}

export function expectedImportConfirmation(manifestSha256) {
  return `IMPORT PRODUCTION WRITING ${PRODUCTION_TARGET.projectName} ${PRODUCTION_TARGET.projectRef} ${PRODUCTION_TARGET.canonicalDirectHost} ${ARTICLE_ID} ${manifestSha256}`;
}

export function validateImportConfirmation(value, manifestSha256) {
  const expected = expectedImportConfirmation(manifestSha256);
  assert(value === expected, "Exact manifest-bound Production import confirmation is required", "PROMOTION_APPLY_GATE_REQUIRED");
  return true;
}

const PRODUCTION_PREFLIGHT_SQL_BASE = `select 'BTS_PROMOTION_DATABASE|' || pg_catalog.current_database() as result
union all
select 'BTS_PROMOTION_MIGRATION|' || version from supabase_migrations.schema_migrations
union all
select 'BTS_PROMOTION_AUTH_USER|' || pg_catalog.count(*)::text from auth.users where id = '${PRODUCTION_AUTHOR_ID}'::uuid
union all
select 'BTS_PROMOTION_ACTIVE_ADMIN|' || pg_catalog.count(*)::text from public.admin_users where user_id = '${PRODUCTION_AUTHOR_ID}'::uuid and role = 'admin' and is_active = true
union all
select 'BTS_PROMOTION_ARTICLES|' || pg_catalog.count(*)::text from public.writing_articles
union all
select 'BTS_PROMOTION_TRANSLATIONS|' || pg_catalog.count(*)::text from public.writing_article_translations
union all
select 'BTS_PROMOTION_SLUG_CONFLICTS|' || pg_catalog.count(*)::text from public.writing_articles where slug = '${ARTICLE_SLUG}' and id <> '${ARTICLE_ID}'::uuid
union all
select 'BTS_PROMOTION_OTHER_WRITING|' || (
  (select pg_catalog.count(*) from public.writing_comments)
  + (select pg_catalog.count(*) from public.writing_discussions)
  + (select pg_catalog.count(*) from public.writing_comment_moderation_events)
  + (select pg_catalog.count(*) from public.writing_comment_rate_limits)
  + (select pg_catalog.count(*) from public.writing_account_comment_events)
  + (select pg_catalog.count(*) from public.writing_discussion_state_events)
)::text`;

export function buildProductionPreflightSql(payload) {
  validatePromotionPayload(payload);
  const payloadText = JSON.stringify(payload);
  const tag = payloadDollarTag(payloadText);
  const payloadExpression = `${tag}${payloadText}${tag}::jsonb`;
  return `${PRODUCTION_PREFLIGHT_SQL_BASE}
union all
select 'BTS_PROMOTION_APPROVED_ARTICLES|' || pg_catalog.count(*)::text
from public.writing_articles as candidate
where pg_catalog.to_jsonb(candidate) = (${payloadExpression} -> 'article')
union all
select 'BTS_PROMOTION_APPROVED_TRANSLATIONS|' || pg_catalog.count(*)::text
from public.writing_article_translations as candidate
where exists (
  select 1
  from pg_catalog.jsonb_array_elements(${payloadExpression} -> 'translations') as approved
  where approved ->> 'locale' = candidate.locale
    and pg_catalog.to_jsonb(candidate) = approved
)
union all
select 'BTS_PROMOTION_ACTIVE_CLAIMS|' || pg_catalog.count(*)::text
from public.writing_article_translations
where generation_claim_id is not null or generation_claimed_at is not null
union all
select 'BTS_PROMOTION_PROBLEM_TRANSLATIONS|' || pg_catalog.count(*)::text
from public.writing_article_translations
where status <> 'translated'
  or source_revision <> 1
  or generation_attempts <> 0
  or last_error_code is not null;`;
}

export function parseProductionPreflightOutput(output) {
  const text = String(output);
  const migrationVersions = [...text.matchAll(/BTS_PROMOTION_MIGRATION\|([0-9]+)/gu)].map((match) => match[1]).sort();
  function count(marker) {
    const matches = [...text.matchAll(new RegExp(`${marker}\\|([0-9]+)`, "gu"))];
    assert(matches.length === 1, `Production preflight marker ${marker} was missing or ambiguous`, "PROMOTION_PRODUCTION_STATE_REJECTED");
    return Number(matches[0][1]);
  }
  const databaseMatches = [...text.matchAll(/BTS_PROMOTION_DATABASE\|([^\s|]+)/gu)];
  assert(databaseMatches.length === 1 && databaseMatches[0][1] === "postgres", "Production database identity probe failed", "PROMOTION_PRODUCTION_STATE_REJECTED");
  return {
    migrationVersions,
    authUserCount: count("BTS_PROMOTION_AUTH_USER"),
    activeAdminCount: count("BTS_PROMOTION_ACTIVE_ADMIN"),
    articleCount: count("BTS_PROMOTION_ARTICLES"),
    translationCount: count("BTS_PROMOTION_TRANSLATIONS"),
    slugConflictCount: count("BTS_PROMOTION_SLUG_CONFLICTS"),
    otherWritingCount: count("BTS_PROMOTION_OTHER_WRITING"),
    approvedArticleCount: count("BTS_PROMOTION_APPROVED_ARTICLES"),
    approvedTranslationCount: count("BTS_PROMOTION_APPROVED_TRANSLATIONS"),
    activeClaimCount: count("BTS_PROMOTION_ACTIVE_CLAIMS"),
    problemTranslationCount: count("BTS_PROMOTION_PROBLEM_TRANSLATIONS"),
  };
}

export function createProductionPromotionDatabase(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? REPO_ROOT);
  const stateRoot = resolve(options.stateRoot ?? join(ARTIFACT_ROOT, "tmp"));
  const baseEnvironment = options.env ?? process.env;
  const execute = options.execute ?? executeProcess;
  const dockerCommand = options.dockerCommand ?? "docker";
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

  async function executePsqlFile(target, file, label) {
    assert(existsSync(file), `${label} SQL file is missing`, "PROMOTION_ARTIFACT_MISSING");
    const containerSqlPath = "/bts/promotion.sql";
    const args = [
      "run",
      "--rm",
      "--mount",
      `type=bind,source=${resolve(file)},target=${containerSqlPath},readonly`,
      "--env",
      "BTS_PRODUCTION_DATABASE_URL",
      POSTGRES_DOCKER_IMAGE,
      "sh",
      "-c",
      `exec psql "$BTS_PRODUCTION_DATABASE_URL" -v ON_ERROR_STOP=1 -f ${containerSqlPath}`,
    ];
    const childEnvironment = {
      ...productionChildEnvironment(baseEnvironment),
      BTS_PRODUCTION_DATABASE_URL: target.url,
    };
    try {
      const result = await execute(dockerCommand, args, {
        cwd: repoRoot,
        env: childEnvironment,
        timeoutMs,
      });
      if (result.code !== 0) {
        throw new PromotionError(`${label} failed`, "PROMOTION_DATABASE_QUERY_FAILED", {
          transport: "docker_psql",
          code: result.code,
          output: redactProduction(`${result.stdout}\n${result.stderr}`, [...secrets]).slice(-4_000),
        });
      }
      return result;
    } catch (error) {
      if (error instanceof PromotionError) throw error;
      const details = typeof error === "object" && error !== null && "details" in error ? error.details : {};
      throw new PromotionError(`${label} failed`, "PROMOTION_DATABASE_QUERY_FAILED", {
        transport: "docker_psql",
        errorClass: error instanceof Error ? error.name : "UnknownError",
        transportCode: typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
        output: redactProduction(`${error instanceof Error ? error.message : String(error)}\n${JSON.stringify(details)}`, [...secrets]).slice(-4_000),
      });
    }
  }

  async function query(target, sql, label) {
    mkdirSync(stateRoot, { recursive: true });
    const file = join(stateRoot, `${randomUUID()}.sql`);
    writeFileSync(file, `${sql.trim()}\n`, "utf8");
    try {
      return await executePsqlFile(target, file, label);
    } finally {
      rmSync(file, { force: true });
    }
  }

  async function executeApprovedImport(target) {
    const sqlBytes = readFileSync(SQL_PATH);
    assert(sha256(sqlBytes) === APPROVED_IMPORT_SQL_SHA256, "Approved promotion SQL checksum changed", "PROMOTION_ARTIFACT_DRIFT");
    return await executePsqlFile(target, SQL_PATH, "Manifest-bound Production Writing import");
  }

  async function preflight({ expectedState = "empty" } = {}) {
    const target = databaseTarget();
    const { payload } = readApprovedArtifacts();
    const result = await query(target, buildProductionPreflightSql(payload), "Production Writing promotion preflight");
    const snapshot = parseProductionPreflightOutput(`${result.stdout}\n${result.stderr}`);
    const verification = validateProductionPreflight(snapshot, repoRoot, { expectedState });
    return { target, snapshot, state: verification.state };
  }

  return { databaseTarget, query, preflight, executeApprovedImport };
}

function expectedMigrationVersions(repoRoot) {
  validateCanonicalMigrationSet(repoRoot);
  return CANONICAL_MIGRATION_NAMES.map((name) => name.match(/^(\d+)_/u)?.[1]);
}

export function validateProductionPreflight(snapshot, repoRoot = REPO_ROOT, { expectedState = "empty" } = {}) {
  const expectedVersions = expectedMigrationVersions(repoRoot);
  assert(arraysEqual(snapshot.migrationVersions ?? [], expectedVersions), "Production migration history is not the exact canonical chain", "PROMOTION_PRODUCTION_STATE_REJECTED");
  assert(Number(snapshot.authUserCount) === 1, "Production author does not exist exactly once in auth.users", "PROMOTION_PRODUCTION_STATE_REJECTED");
  assert(Number(snapshot.activeAdminCount) === 1, "Production author is not an active admin", "PROMOTION_PRODUCTION_STATE_REJECTED");
  assert(Number(snapshot.slugConflictCount) === 0, "Production slug conflict exists", "PROMOTION_PRODUCTION_STATE_REJECTED");
  assert(Number(snapshot.otherWritingCount) === 0, "Unrelated Production Writing rows exist", "PROMOTION_PRODUCTION_STATE_REJECTED");
  const empty = Number(snapshot.articleCount) === 0
    && Number(snapshot.translationCount) === 0
    && Number(snapshot.approvedArticleCount) === 0
    && Number(snapshot.approvedTranslationCount) === 0
    && Number(snapshot.activeClaimCount) === 0
    && Number(snapshot.problemTranslationCount) === 0;
  const approved = Number(snapshot.articleCount) === 1
    && Number(snapshot.translationCount) === 6
    && Number(snapshot.approvedArticleCount) === 1
    && Number(snapshot.approvedTranslationCount) === 6
    && Number(snapshot.activeClaimCount) === 0
    && Number(snapshot.problemTranslationCount) === 0;
  assert(["empty", "approved", "empty-or-approved"].includes(expectedState), "Unknown Production Writing verification state", "PROMOTION_VALIDATION_FAILED");
  if (expectedState === "empty") assert(empty, "Production Writing state is not empty", "PROMOTION_PRODUCTION_STATE_REJECTED");
  if (expectedState === "approved") assert(approved, "Production Writing state does not exactly match the approved promotion", "PROMOTION_PRODUCTION_STATE_REJECTED");
  if (expectedState === "empty-or-approved") assert(empty || approved, "Production Writing state is neither empty nor the exact approved promotion", "PROMOTION_PRODUCTION_STATE_REJECTED");
  return { applied: expectedVersions.length, pending: 0, state: approved ? "approved" : "empty" };
}

function relativePath(path) {
  return relative(REPO_ROOT, path).replaceAll("\\", "/");
}

function readApprovedArtifacts() {
  assert(existsSync(PAYLOAD_PATH) && existsSync(SQL_PATH), "Approved promotion payload or SQL is missing", "PROMOTION_ARTIFACT_MISSING");
  const payloadBytes = readFileSync(PAYLOAD_PATH);
  const sqlBytes = readFileSync(SQL_PATH);
  assert(sha256(payloadBytes) === APPROVED_PAYLOAD_SHA256, "Approved promotion payload checksum changed", "PROMOTION_ARTIFACT_DRIFT");
  assert(sha256(sqlBytes) === APPROVED_IMPORT_SQL_SHA256, "Approved promotion SQL checksum changed", "PROMOTION_ARTIFACT_DRIFT");
  assert(!SECRET_PATTERN.test(`${payloadBytes.toString("utf8")}\n${sqlBytes.toString("utf8")}`), "Approved promotion artifacts contain credential-shaped data", "PROMOTION_SECRET_REJECTED");
  const payload = JSON.parse(payloadBytes.toString("utf8"));
  validatePromotionPayload(payload);
  assert(buildPromotionSql(payload) === sqlBytes.toString("utf8"), "Approved promotion SQL no longer matches its payload", "PROMOTION_ARTIFACT_DRIFT");
  return { payload, payloadBytes, sqlBytes };
}

function writeReleaseManifest(payload, productionPreflight, target, now = new Date()) {
  mkdirSync(ARTIFACT_ROOT, { recursive: true });
  const payloadSha256 = APPROVED_PAYLOAD_SHA256;
  const sqlSha256 = APPROVED_IMPORT_SQL_SHA256;
  const manifest = {
    schemaVersion: 2,
    environment: "PRODUCTION",
    operation: "writing_content_promotion",
    projectName: PRODUCTION_TARGET.projectName,
    projectRef: PRODUCTION_TARGET.projectRef,
    canonicalHost: PRODUCTION_TARGET.canonicalDirectHost,
    databaseHost: target.databaseHost,
    connectionMode: target.connectionMode,
    executionTransport: {
      kind: "docker_psql",
      image: POSTGRES_DOCKER_IMAGE,
      sqlMount: "read_only",
      onErrorStop: true,
    },
    sourceProjectRef: SOURCE_PROJECT_REF,
    articleId: ARTICLE_ID,
    slug: ARTICLE_SLUG,
    sourceLocale: "de",
    sourceRevision: 1,
    productionAuthorId: PRODUCTION_AUTHOR_ID,
    translationLocales: [...TARGET_LOCALES],
    bodyJsonSha256: { ...EXPECTED_BODY_JSON_SHA256 },
    payload: { path: relativePath(PAYLOAD_PATH), sha256: payloadSha256 },
    importSql: { path: relativePath(SQL_PATH), sha256: sqlSha256 },
    productionPreflight: {
      migrationsApplied: CANONICAL_MIGRATION_NAMES.length,
      migrationsPending: 0,
      writingArticles: Number(productionPreflight.articleCount),
      writingTranslations: Number(productionPreflight.translationCount),
      activeAdminMatches: Number(productionPreflight.activeAdminCount),
      slugConflicts: Number(productionPreflight.slugConflictCount),
      unrelatedWritingRows: Number(productionPreflight.otherWritingCount),
    },
    expectedPostImport: {
      writingArticles: 1,
      writingTranslations: 6,
      activeTranslationClaims: 0,
      staleOrFailedTranslations: 0,
    },
    createdAt: now.toISOString(),
  };
  const manifestBytes = `${JSON.stringify(manifest, null, 2)}\n`;
  assert(!SECRET_PATTERN.test(manifestBytes), "Promotion manifest contains credential-shaped data", "PROMOTION_SECRET_REJECTED");
  const manifestSha256 = sha256(manifestBytes);
  const manifestDir = join(ARTIFACT_ROOT, "manifests");
  mkdirSync(manifestDir, { recursive: true });
  const manifestPath = join(manifestDir, `${manifest.createdAt.replace(/[:.]/gu, "-")}-${manifestSha256}.json`);
  writeFileSync(manifestPath, manifestBytes, "utf8");
  writeFileSync(LATEST_MANIFEST_PATH, `${JSON.stringify({ manifestPath: relativePath(manifestPath), manifestSha256 }, null, 2)}\n`, "utf8");
  return { manifest, manifestPath, manifestSha256, payloadSha256, sqlSha256 };
}

function loadReleaseArtifacts() {
  assert(existsSync(LATEST_MANIFEST_PATH), "Promotion manifest is missing", "PROMOTION_APPLY_GATE_REQUIRED");
  const pointer = JSON.parse(readFileSync(LATEST_MANIFEST_PATH, "utf8"));
  const manifestPath = resolve(REPO_ROOT, pointer.manifestPath ?? "");
  const manifestRoot = resolve(join(ARTIFACT_ROOT, "manifests"));
  assert(manifestPath.startsWith(`${manifestRoot}\\`) || manifestPath.startsWith(`${manifestRoot}/`), "Promotion manifest path escaped the evidence directory", "PROMOTION_APPLY_GATE_REQUIRED");
  const manifestBytes = readFileSync(manifestPath, "utf8");
  const manifestSha256 = sha256(manifestBytes);
  assert(manifestSha256 === pointer.manifestSha256, "Promotion manifest checksum mismatch", "PROMOTION_APPLY_GATE_REQUIRED");
  const manifest = JSON.parse(manifestBytes);
  assert(manifest.schemaVersion === 2, "Promotion manifest schema is obsolete", "PROMOTION_APPLY_GATE_REQUIRED");
  assert(manifest.projectRef === PRODUCTION_TARGET.projectRef
    && manifest.canonicalHost === PRODUCTION_TARGET.canonicalDirectHost
    && manifest.databaseHost === PRODUCTION_TARGET.sessionPoolerHost
    && manifest.connectionMode === "session_pooler", "Promotion manifest target identity mismatch", "PROMOTION_APPLY_GATE_REQUIRED");
  assert(manifest.executionTransport?.kind === "docker_psql"
    && manifest.executionTransport.image === POSTGRES_DOCKER_IMAGE
    && manifest.executionTransport.sqlMount === "read_only"
    && manifest.executionTransport.onErrorStop === true, "Promotion manifest execution transport mismatch", "PROMOTION_APPLY_GATE_REQUIRED");
  assert(manifest.payload.sha256 === APPROVED_PAYLOAD_SHA256, "Promotion manifest payload is not the approved artifact", "PROMOTION_APPLY_GATE_REQUIRED");
  assert(manifest.importSql.sha256 === APPROVED_IMPORT_SQL_SHA256, "Promotion manifest SQL is not the approved artifact", "PROMOTION_APPLY_GATE_REQUIRED");
  const payloadBytes = readFileSync(resolve(REPO_ROOT, manifest.payload.path));
  const sqlBytes = readFileSync(resolve(REPO_ROOT, manifest.importSql.path));
  assert(sha256(payloadBytes) === manifest.payload.sha256, "Promotion payload checksum mismatch", "PROMOTION_APPLY_GATE_REQUIRED");
  assert(sha256(sqlBytes) === manifest.importSql.sha256, "Promotion SQL checksum mismatch", "PROMOTION_APPLY_GATE_REQUIRED");
  const payload = JSON.parse(payloadBytes.toString("utf8"));
  validatePromotionPayload(payload);
  assert(buildPromotionSql(payload) === sqlBytes.toString("utf8"), "Promotion SQL no longer matches the approved payload", "PROMOTION_APPLY_GATE_REQUIRED");
  return { manifest, manifestPath, manifestSha256, payload };
}

export async function dryRun(options = {}) {
  const approved = readApprovedArtifacts();
  const database = createProductionPromotionDatabase(options);
  const { target, snapshot: productionPreflight } = await database.preflight({ expectedState: "empty" });
  const evidence = writeReleaseManifest(approved.payload, productionPreflight, target, options.now?.() ?? new Date());
  return {
    status: "ready-for-manifest-bound-apply",
    ...evidence,
    payloadPath: PAYLOAD_PATH,
    sqlPath: SQL_PATH,
    confirmation: expectedImportConfirmation(evidence.manifestSha256),
  };
}

/** @param {{ confirmation?: string, env?: NodeJS.ProcessEnv }} [options] */
export async function apply({ confirmation, env = process.env } = {}) {
  const evidence = loadReleaseArtifacts();
  validateImportConfirmation(confirmation, evidence.manifestSha256);
  const database = createProductionPromotionDatabase({ env });
  const { target, state } = await database.preflight({ expectedState: "empty-or-approved" });
  assert(evidence.manifest.databaseHost === target.databaseHost
    && evidence.manifest.connectionMode === target.connectionMode, "Promotion manifest no longer matches the validated Production connection", "PROMOTION_APPLY_GATE_REQUIRED");
  if (state === "approved") return { status: "already-applied", manifestSha256: evidence.manifestSha256 };
  await database.executeApprovedImport(target);
  const postApply = await database.preflight({ expectedState: "approved" });
  assert(postApply.target.databaseHost === target.databaseHost
    && postApply.target.connectionMode === target.connectionMode, "Post-apply verification target changed", "PROMOTION_PRODUCTION_STATE_REJECTED");
  return { status: "applied", manifestSha256: evidence.manifestSha256, productionState: postApply.state };
}

export async function verify(options = {}) {
  const database = createProductionPromotionDatabase(options);
  const { snapshot, state } = await database.preflight({ expectedState: "approved" });
  return { status: "verified", state, snapshot };
}

function parseArgs(argv) {
  if (argv.length === 1 && argv[0] === "dry-run") return { command: "dry-run", options: {} };
  if (argv.length === 1 && argv[0] === "verify") return { command: "verify", options: {} };
  if (argv.length === 3 && argv[0] === "apply" && argv[1] === "--confirmation" && argv[2]) {
    return { command: "apply", options: { confirmation: argv[2] } };
  }
  throw new PromotionError(
    "Usage: production-writing-promotion.mjs <dry-run|verify|apply --confirmation \"IMPORT PRODUCTION WRITING ...\">",
    "PROMOTION_ARGUMENT_INVALID",
  );
}

export async function main(argv = process.argv.slice(2)) {
  const { command, options } = parseArgs(argv);
  if (command === "dry-run") {
    const result = await dryRun();
    console.log(JSON.stringify({
      status: result.status,
      artifactPath: relativePath(result.payloadPath),
      artifactSha256: result.payloadSha256,
      importSqlPath: relativePath(result.sqlPath),
      importSqlSha256: result.sqlSha256,
      manifestPath: relativePath(result.manifestPath),
      manifestSha256: result.manifestSha256,
      confirmation: result.confirmation,
      source: { articleId: ARTICLE_ID, translations: 6, bodyHashesVerified: 7 },
      productionPreflight: result.manifest.productionPreflight,
      expectedPostImport: result.manifest.expectedPostImport,
    }, null, 2));
    return result;
  }
  if (command === "verify") {
    const result = await verify();
    console.log(JSON.stringify({
      status: result.status,
      state: result.state,
      migrationsApplied: result.snapshot.migrationVersions.length,
      migrationsPending: 0,
      writingArticles: result.snapshot.articleCount,
      writingTranslations: result.snapshot.translationCount,
      activeTranslationClaims: result.snapshot.activeClaimCount,
      problematicTranslations: result.snapshot.problemTranslationCount,
      unrelatedWritingRows: result.snapshot.otherWritingCount,
    }, null, 2));
    return result;
  }
  return apply(options);
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const code = typeof error?.code === "string" ? error.code : "PROMOTION_UNEXPECTED_ERROR";
    console.error(`PRODUCTION WRITING PROMOTION FAILED — ${code}: ${String(error.message).slice(0, 500)}`);
    process.exitCode = 1;
  });
}
