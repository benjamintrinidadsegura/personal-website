alter table public.writing_article_translations
  add column generation_claim_id uuid,
  add column generation_claimed_at timestamptz,
  add column generation_attempts integer not null default 0,
  add column last_error_code text,
  add constraint writing_article_translations_generation_claim_check
    check ((generation_claim_id is null) = (generation_claimed_at is null)),
  add constraint writing_article_translations_generation_attempts_check
    check (generation_attempts >= 0),
  add constraint writing_article_translations_last_error_check
    check (last_error_code is null or last_error_code in (
      'configuration_missing',
      'authentication_provider',
      'rate_limit',
      'timeout_network',
      'invalid_structured_response',
      'content_too_large',
      'persistence_conflict'
    ));

create function public.clear_writing_translation_claims_for_new_revision()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  if new.source_revision is distinct from old.source_revision then
    update public.writing_article_translations as translation set
      generation_claim_id = null,
      generation_claimed_at = null,
      last_error_code = null
    where translation.article_id = new.id;
  end if;
  return new;
end;
$$;

create trigger clear_writing_translation_claims_after_revision
after update of source_revision on public.writing_articles
for each row execute function public.clear_writing_translation_claims_for_new_revision();

create function public.protect_manual_writing_translation_from_generation()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  if new.status = 'translated' and new.manually_edited then
    new.generation_claim_id := null;
    new.generation_claimed_at := null;
    new.last_error_code := null;
  end if;
  return new;
end;
$$;

create trigger protect_manual_writing_translation_before_write
before insert or update on public.writing_article_translations
for each row execute function public.protect_manual_writing_translation_from_generation();

create function public.claim_writing_translation_generation(
  p_id uuid,
  p_locale text,
  p_source_revision bigint
)
returns table (
  claim_id uuid,
  article_id uuid,
  source_locale text,
  target_locale text,
  source_revision bigint,
  title text,
  deck text,
  excerpt text,
  body_json jsonb
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_article public.writing_articles%rowtype;
  v_translation public.writing_article_translations%rowtype;
  v_claim_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  perform public.assert_bts_admin(true);
  if p_id is null or p_locale is null or p_source_revision is null
    or p_locale not in ('de', 'en', 'es', 'tr', 'pl', 'el', 'ru')
    or p_source_revision < 1
  then
    raise exception using message = 'WRITING_TRANSLATION_INVALID_INPUT', errcode = 'P0001';
  end if;

  select article.* into v_article
  from public.writing_articles as article
  where article.id = p_id
  for update;
  if not found then raise exception using message = 'WRITING_NOT_FOUND', errcode = 'P0001'; end if;
  if v_article.status <> 'published' or v_article.slug is null or v_article.published_at is null then
    raise exception using message = 'WRITING_TRANSLATION_NOT_PUBLISHED', errcode = 'P0001';
  end if;
  if p_source_revision <> v_article.source_revision then
    raise exception using message = 'WRITING_TRANSLATION_STALE_SOURCE', errcode = 'P0001';
  end if;
  if p_locale = v_article.source_locale then return; end if;
  if v_article.body_json is null or pg_catalog.jsonb_typeof(v_article.body_json) <> 'object' then
    raise exception using message = 'WRITING_TRANSLATION_INVALID_SOURCE', errcode = 'P0001';
  end if;

  insert into public.writing_article_translations (article_id, locale, status, source_revision)
  values (v_article.id, p_locale, 'pending', v_article.source_revision)
  on conflict (article_id, locale) do nothing;

  select translation.* into v_translation
  from public.writing_article_translations as translation
  where translation.article_id = v_article.id and translation.locale = p_locale
  for update;

  if v_translation.status = 'translated' and v_translation.source_revision = v_article.source_revision then return; end if;
  if v_translation.generation_claim_id is not null
    and v_translation.generation_claimed_at >= v_now - interval '10 minutes'
  then
    return;
  end if;

  v_claim_id := extensions.gen_random_uuid();
  update public.writing_article_translations as translation set
    status = 'pending',
    source_revision = v_article.source_revision,
    generation_claim_id = v_claim_id,
    generation_claimed_at = v_now,
    generation_attempts = translation.generation_attempts + 1,
    last_error_code = null,
    updated_at = v_now
  where translation.article_id = v_article.id and translation.locale = p_locale;

  return query select
    v_claim_id,
    v_article.id,
    v_article.source_locale,
    p_locale,
    v_article.source_revision,
    v_article.title,
    v_article.deck,
    v_article.excerpt,
    v_article.body_json;
end;
$$;

create function public.complete_writing_translation_generation(
  p_id uuid,
  p_locale text,
  p_source_revision bigint,
  p_claim_id uuid,
  p_title text,
  p_deck text,
  p_excerpt text,
  p_body text,
  p_body_json jsonb
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_updated integer;
begin
  perform public.assert_bts_admin(true);
  if p_id is null or p_locale is null or p_source_revision is null or p_claim_id is null
    or p_title is null or p_deck is null or p_excerpt is null or p_body is null or p_body_json is null
    or p_locale not in ('de', 'en', 'es', 'tr', 'pl', 'el', 'ru')
    or pg_catalog.char_length(p_title) not between 3 and 160
    or pg_catalog.char_length(p_deck) > 240
    or pg_catalog.char_length(p_excerpt) not between 10 and 320
    or pg_catalog.char_length(p_body) not between 20 and 24000
    or pg_catalog.jsonb_typeof(p_body_json) is distinct from 'object'
    or p_body_json -> 'version' is distinct from '1'::jsonb
    or pg_catalog.jsonb_typeof(p_body_json -> 'blocks') is distinct from 'array'
    or pg_catalog.pg_column_size(p_body_json) > 131072
  then
    raise exception using message = 'WRITING_TRANSLATION_INVALID_INPUT', errcode = 'P0001';
  end if;
  perform 1
    from public.writing_articles as article
    where article.id = p_id
      and article.status = 'published'
      and article.source_revision = p_source_revision
      and article.source_locale <> p_locale
    for update;
  if not found then
    raise exception using message = 'WRITING_TRANSLATION_STALE_SOURCE', errcode = 'P0001';
  end if;

  update public.writing_article_translations as translation set
    title = p_title,
    deck = p_deck,
    excerpt = p_excerpt,
    body = p_body,
    body_json = p_body_json,
    status = 'translated',
    source_revision = p_source_revision,
    generated_at = v_now,
    manually_edited = false,
    generation_claim_id = null,
    generation_claimed_at = null,
    last_error_code = null,
    updated_at = v_now
  where translation.article_id = p_id
    and translation.locale = p_locale
    and translation.source_revision = p_source_revision
    and translation.generation_claim_id = p_claim_id;
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception using message = 'WRITING_TRANSLATION_CLAIM_LOST', errcode = 'P0001';
  end if;
  return true;
end;
$$;

create function public.fail_writing_translation_generation(
  p_id uuid,
  p_locale text,
  p_source_revision bigint,
  p_claim_id uuid,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_updated integer;
begin
  perform public.assert_bts_admin(true);
  if p_id is null or p_locale is null or p_source_revision is null or p_claim_id is null
    or p_locale not in ('de', 'en', 'es', 'tr', 'pl', 'el', 'ru')
    or p_error_code not in (
      'configuration_missing',
      'authentication_provider',
      'rate_limit',
      'timeout_network',
      'invalid_structured_response',
      'content_too_large',
      'persistence_conflict'
    )
  then
    raise exception using message = 'WRITING_TRANSLATION_INVALID_INPUT', errcode = 'P0001';
  end if;

  update public.writing_article_translations as translation set
    status = 'failed',
    generation_claim_id = null,
    generation_claimed_at = null,
    last_error_code = p_error_code,
    updated_at = pg_catalog.clock_timestamp()
  where translation.article_id = p_id
    and translation.locale = p_locale
    and translation.source_revision = p_source_revision
    and translation.generation_claim_id = p_claim_id;
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

revoke all on function public.clear_writing_translation_claims_for_new_revision() from public, anon, authenticated, service_role;
revoke all on function public.protect_manual_writing_translation_from_generation() from public, anon, authenticated, service_role;
revoke all on function public.claim_writing_translation_generation(uuid, text, bigint) from public, anon, authenticated, service_role;
revoke all on function public.complete_writing_translation_generation(uuid, text, bigint, uuid, text, text, text, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.fail_writing_translation_generation(uuid, text, bigint, uuid, text) from public, anon, authenticated, service_role;

grant execute on function public.claim_writing_translation_generation(uuid, text, bigint) to authenticated;
grant execute on function public.complete_writing_translation_generation(uuid, text, bigint, uuid, text, text, text, text, jsonb) to authenticated;
grant execute on function public.fail_writing_translation_generation(uuid, text, bigint, uuid, text) to authenticated;

notify pgrst, 'reload schema';
