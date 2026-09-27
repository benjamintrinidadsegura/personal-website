create or replace function public.claim_writing_translation_generation(
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
  on conflict on constraint writing_article_translations_pkey do nothing;

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

revoke all on function public.claim_writing_translation_generation(uuid, text, bigint) from public, anon, authenticated, service_role;
grant execute on function public.claim_writing_translation_generation(uuid, text, bigint) to authenticated;

notify pgrst, 'reload schema';
