alter table public.writing_articles
  add column source_locale text not null default 'de',
  add column source_revision bigint not null default 1,
  add constraint writing_articles_source_locale_check
    check (source_locale in ('de', 'en', 'es', 'tr', 'pl', 'el', 'ru')),
  add constraint writing_articles_source_revision_check
    check (source_revision >= 1);

create table public.writing_article_translations (
  article_id uuid not null references public.writing_articles (id) on delete cascade,
  locale text not null,
  title text not null default '',
  deck text not null default '',
  excerpt text not null default '',
  body text not null default '',
  body_json jsonb,
  status text not null default 'pending',
  source_revision bigint not null,
  generated_at timestamptz,
  manually_edited boolean not null default false,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key (article_id, locale),
  constraint writing_article_translations_locale_check
    check (locale in ('de', 'en', 'es', 'tr', 'pl', 'el', 'ru')),
  constraint writing_article_translations_status_check
    check (status in ('pending', 'translated', 'stale', 'failed')),
  constraint writing_article_translations_source_revision_check
    check (source_revision >= 1),
  constraint writing_article_translations_lengths_check
    check (
      char_length(title) <= 160
      and char_length(deck) <= 240
      and char_length(excerpt) <= 320
      and char_length(body) <= 24000
    ),
  constraint writing_article_translations_body_json_shape_check
    check (
      body_json is null or (
        jsonb_typeof(body_json) = 'object'
        and body_json ? 'version'
        and body_json ? 'blocks'
        and body_json -> 'version' = '1'::jsonb
        and jsonb_typeof(body_json -> 'blocks') = 'array'
        and pg_column_size(body_json) <= 131072
      )
    ),
  constraint writing_article_translations_complete_check
    check (
      status not in ('translated', 'stale') or (
        char_length(title) between 3 and 160
        and char_length(excerpt) between 10 and 320
        and char_length(body) between 20 and 24000
        and body_json is not null
        and generated_at is not null
      )
    )
);

create index writing_article_translations_public_idx
  on public.writing_article_translations (locale, article_id)
  where status = 'translated';

alter table public.writing_article_translations enable row level security;
revoke all on table public.writing_article_translations from public, anon, authenticated, service_role;
grant select on table public.writing_article_translations to service_role;

insert into public.writing_article_translations (article_id, locale, status, source_revision)
select article.id, language.locale, 'pending', article.source_revision
from public.writing_articles as article
cross join (values ('de'), ('en'), ('es'), ('tr'), ('pl'), ('el'), ('ru')) as language(locale)
where language.locale <> article.source_locale;

create or replace function public.create_writing_draft()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_actor uuid := public.assert_bts_admin(true);
  v_id uuid;
begin
  insert into public.writing_articles (author_id, source_locale, source_revision)
  values (v_actor, 'de', 1)
  returning id into v_id;

  insert into public.writing_article_translations (article_id, locale, status, source_revision)
  select v_id, language.locale, 'pending', 1
  from (values ('en'), ('es'), ('tr'), ('pl'), ('el'), ('ru')) as language(locale);

  return v_id;
end;
$$;

create function public.save_writing_draft_v3(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_title text,
  p_deck text,
  p_excerpt text,
  p_body text,
  p_body_json jsonb,
  p_content_type text,
  p_topics text[],
  p_source_locale text
)
returns table (updated_at timestamptz, slug text, status text, source_revision bigint)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_article public.writing_articles%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_source_changed boolean;
  v_source_revision bigint;
begin
  perform public.assert_bts_admin(true);
  if p_id is null or p_expected_updated_at is null
    or p_title is null or p_deck is null or p_excerpt is null or p_body is null or p_body_json is null
    or p_content_type is null or p_topics is null or p_source_locale is null
    or char_length(p_title) > 160
    or char_length(p_deck) > 240 or char_length(p_excerpt) > 320 or char_length(p_body) > 24000
    or jsonb_typeof(p_body_json) is distinct from 'object'
    or p_body_json -> 'version' is distinct from '1'::jsonb
    or jsonb_typeof(p_body_json -> 'blocks') is distinct from 'array'
    or pg_column_size(p_body_json) > 131072
    or p_content_type not in ('essay', 'note')
    or p_source_locale not in ('de', 'en', 'es', 'tr', 'pl', 'el', 'ru')
    or cardinality(p_topics) not between 1 and 8
    or exists (
      select 1 from unnest(p_topics) as topic
      where topic is null or topic <> trim(topic) or char_length(topic) not between 1 and 40
    )
    or cardinality(p_topics) <> (select count(distinct lower(topic)) from unnest(p_topics) as topic) then
    raise exception using message = 'WRITING_INVALID_INPUT', errcode = 'P0001';
  end if;

  select article.* into v_article
  from public.writing_articles as article
  where article.id = p_id and article.status = 'draft' and article.updated_at = p_expected_updated_at
  for update;
  if not found then raise exception using message = 'WRITING_STALE_OR_MISSING', errcode = 'P0001'; end if;

  v_source_changed := v_article.title is distinct from p_title
    or v_article.deck is distinct from p_deck
    or v_article.excerpt is distinct from p_excerpt
    or v_article.body is distinct from p_body
    or v_article.body_json is distinct from p_body_json
    or v_article.source_locale is distinct from p_source_locale;
  v_source_revision := v_article.source_revision + case when v_source_changed then 1 else 0 end;

  update public.writing_articles as article set
    title = p_title,
    deck = p_deck,
    excerpt = p_excerpt,
    body = p_body,
    body_json = p_body_json,
    content_type = p_content_type,
    topics = p_topics,
    source_locale = p_source_locale,
    source_revision = v_source_revision,
    updated_at = v_now
  where article.id = p_id;

  delete from public.writing_article_translations as translation
  where translation.article_id = p_id and translation.locale = p_source_locale;
  insert into public.writing_article_translations (article_id, locale, status, source_revision)
  select p_id, language.locale, 'pending', v_source_revision
  from (values ('de'), ('en'), ('es'), ('tr'), ('pl'), ('el'), ('ru')) as language(locale)
  where language.locale <> p_source_locale
  on conflict (article_id, locale) do nothing;

  if v_source_changed then
    update public.writing_article_translations as translation set
      status = case when translation.status = 'translated' then 'stale' else translation.status end,
      source_revision = case when translation.status = 'pending' then v_source_revision else translation.source_revision end,
      updated_at = v_now
    where translation.article_id = p_id;
  end if;

  return query select v_now, v_article.slug, 'draft'::text, v_source_revision;
end;
$$;

create function public.publish_writing_article_v3(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_title text,
  p_deck text,
  p_excerpt text,
  p_body text,
  p_body_json jsonb,
  p_content_type text,
  p_topics text[],
  p_slug_base text,
  p_source_locale text
)
returns table (updated_at timestamptz, slug text, status text, source_revision bigint)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_article public.writing_articles%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_slug text;
  v_suffix integer := 1;
  v_source_changed boolean;
  v_source_revision bigint;
begin
  perform public.assert_bts_admin(true);
  if p_id is null or p_expected_updated_at is null
    or p_title is null or p_deck is null or p_excerpt is null or p_body is null or p_body_json is null
    or p_content_type is null or p_topics is null or p_slug_base is null or p_source_locale is null
    or char_length(p_title) not between 3 and 160
    or char_length(p_deck) > 240
    or char_length(p_excerpt) not between 10 and 320
    or char_length(p_body) not between 20 and 24000
    or jsonb_typeof(p_body_json) is distinct from 'object'
    or p_body_json -> 'version' is distinct from '1'::jsonb
    or jsonb_typeof(p_body_json -> 'blocks') is distinct from 'array'
    or pg_column_size(p_body_json) > 131072
    or p_content_type not in ('essay', 'note')
    or p_source_locale not in ('de', 'en', 'es', 'tr', 'pl', 'el', 'ru')
    or cardinality(p_topics) not between 1 and 8
    or exists (
      select 1 from unnest(p_topics) as topic
      where topic is null or topic <> trim(topic) or char_length(topic) not between 1 and 40
    )
    or cardinality(p_topics) <> (select count(distinct lower(topic)) from unnest(p_topics) as topic)
    or char_length(p_slug_base) not between 1 and 80
    or p_slug_base !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception using message = 'WRITING_INVALID_INPUT', errcode = 'P0001';
  end if;

  select article.* into v_article
  from public.writing_articles as article
  where article.id = p_id and article.updated_at = p_expected_updated_at
  for update;
  if not found then raise exception using message = 'WRITING_STALE_OR_MISSING', errcode = 'P0001'; end if;
  if v_article.status = 'published' and v_article.source_locale is distinct from p_source_locale then
    raise exception using message = 'WRITING_SOURCE_LOCALE_IMMUTABLE', errcode = 'P0001';
  end if;

  v_slug := v_article.slug;
  if v_slug is null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('writing-slug-allocation'));
    v_slug := left(p_slug_base, 80);
    while exists (select 1 from public.writing_articles as article where article.slug = v_slug and article.id <> p_id) loop
      v_suffix := v_suffix + 1;
      v_slug := left(p_slug_base, 80 - char_length(v_suffix::text) - 1) || '-' || v_suffix::text;
    end loop;
  end if;

  v_source_changed := v_article.title is distinct from p_title
    or v_article.deck is distinct from p_deck
    or v_article.excerpt is distinct from p_excerpt
    or v_article.body is distinct from p_body
    or v_article.body_json is distinct from p_body_json
    or v_article.source_locale is distinct from p_source_locale;
  v_source_revision := v_article.source_revision + case when v_source_changed then 1 else 0 end;

  update public.writing_articles as article set
    title = p_title,
    deck = p_deck,
    excerpt = p_excerpt,
    body = p_body,
    body_json = p_body_json,
    content_type = p_content_type,
    topics = p_topics,
    slug = v_slug,
    status = 'published',
    published_at = coalesce(article.published_at, v_now),
    source_locale = p_source_locale,
    source_revision = v_source_revision,
    updated_at = v_now
  where article.id = p_id;

  delete from public.writing_article_translations as translation
  where translation.article_id = p_id and translation.locale = p_source_locale;
  insert into public.writing_article_translations (article_id, locale, status, source_revision)
  select p_id, language.locale, 'pending', v_source_revision
  from (values ('de'), ('en'), ('es'), ('tr'), ('pl'), ('el'), ('ru')) as language(locale)
  where language.locale <> p_source_locale
  on conflict (article_id, locale) do nothing;

  if v_source_changed then
    update public.writing_article_translations as translation set
      status = case when translation.status = 'translated' then 'stale' else translation.status end,
      source_revision = case when translation.status = 'pending' then v_source_revision else translation.source_revision end,
      updated_at = v_now
    where translation.article_id = p_id;
  end if;

  return query select v_now, v_slug, 'published'::text, v_source_revision;
end;
$$;

create function public.list_writing_translation_statuses(p_id uuid)
returns table (
  locale text,
  status text,
  source_revision bigint,
  generated_at timestamptz,
  manually_edited boolean,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform public.assert_bts_admin(true);
  if p_id is null then raise exception using message = 'WRITING_INVALID_INPUT', errcode = 'P0001'; end if;
  if not exists (select 1 from public.writing_articles as article where article.id = p_id) then
    raise exception using message = 'WRITING_NOT_FOUND', errcode = 'P0001';
  end if;

  return query
  select article.source_locale, 'source'::text, article.source_revision, null::timestamptz, true, article.updated_at
  from public.writing_articles as article
  where article.id = p_id
  union all
  select translation.locale, translation.status, translation.source_revision, translation.generated_at, translation.manually_edited, translation.updated_at
  from public.writing_article_translations as translation
  where translation.article_id = p_id;
end;
$$;

create function public.apply_writing_translation(
  p_id uuid,
  p_locale text,
  p_source_revision bigint,
  p_title text,
  p_deck text,
  p_excerpt text,
  p_body text,
  p_body_json jsonb,
  p_manually_edited boolean default true
)
returns table (locale text, status text, source_revision bigint, generated_at timestamptz, manually_edited boolean)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_article public.writing_articles%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  perform public.assert_bts_admin(true);
  if p_id is null or p_locale is null or p_source_revision is null
    or p_title is null or p_deck is null or p_excerpt is null or p_body is null or p_body_json is null
    or p_manually_edited is null
    or p_locale not in ('de', 'en', 'es', 'tr', 'pl', 'el', 'ru')
    or char_length(p_title) not between 3 and 160
    or char_length(p_deck) > 240
    or char_length(p_excerpt) not between 10 and 320
    or char_length(p_body) not between 20 and 24000
    or jsonb_typeof(p_body_json) is distinct from 'object'
    or p_body_json -> 'version' is distinct from '1'::jsonb
    or jsonb_typeof(p_body_json -> 'blocks') is distinct from 'array'
    or pg_column_size(p_body_json) > 131072 then
    raise exception using message = 'WRITING_TRANSLATION_INVALID_INPUT', errcode = 'P0001';
  end if;

  select article.* into v_article
  from public.writing_articles as article
  where article.id = p_id
  for update;
  if not found then raise exception using message = 'WRITING_NOT_FOUND', errcode = 'P0001'; end if;
  if p_locale = v_article.source_locale then
    raise exception using message = 'WRITING_TRANSLATION_SOURCE_LOCALE', errcode = 'P0001';
  end if;
  if p_source_revision <> v_article.source_revision then
    raise exception using message = 'WRITING_TRANSLATION_STALE_SOURCE', errcode = 'P0001';
  end if;

  insert into public.writing_article_translations (
    article_id, locale, title, deck, excerpt, body, body_json, status,
    source_revision, generated_at, manually_edited, created_at, updated_at
  ) values (
    p_id, p_locale, p_title, p_deck, p_excerpt, p_body, p_body_json, 'translated',
    p_source_revision, v_now, p_manually_edited, v_now, v_now
  )
  on conflict (article_id, locale) do update set
    title = excluded.title,
    deck = excluded.deck,
    excerpt = excluded.excerpt,
    body = excluded.body,
    body_json = excluded.body_json,
    status = 'translated',
    source_revision = excluded.source_revision,
    generated_at = excluded.generated_at,
    manually_edited = excluded.manually_edited,
    updated_at = excluded.updated_at;

  return query select p_locale, 'translated'::text, p_source_revision, v_now, p_manually_edited;
end;
$$;

create function public.delete_writing_article(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_expected_title text
)
returns table (deleted_id uuid, deleted_slug text, deleted_status text)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_article public.writing_articles%rowtype;
begin
  perform public.assert_bts_admin(true);
  if p_id is null or p_expected_updated_at is null or p_expected_title is null then
    raise exception using message = 'WRITING_DELETE_INVALID_INPUT', errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('writing-delete:' || p_id::text, 0));
  select article.* into v_article
  from public.writing_articles as article
  where article.id = p_id
  for update;
  if not found then raise exception using message = 'WRITING_DELETE_NOT_FOUND', errcode = 'P0001'; end if;
  if v_article.updated_at is distinct from p_expected_updated_at or v_article.title is distinct from p_expected_title then
    raise exception using message = 'WRITING_DELETE_STALE', errcode = 'P0001';
  end if;

  delete from public.writing_comment_moderation_events as event where event.article_id = p_id;
  delete from public.writing_discussion_state_events as event where event.article_id = p_id;
  delete from public.writing_comments as comment where comment.article_id = p_id;
  delete from public.writing_discussions as discussion where discussion.article_id = p_id;
  delete from public.writing_article_translations as translation where translation.article_id = p_id;
  delete from public.writing_articles as article where article.id = p_id;

  return query select v_article.id, v_article.slug, v_article.status;
end;
$$;

revoke all on function public.save_writing_draft_v3(uuid, timestamptz, text, text, text, text, jsonb, text, text[], text)
  from public, anon, authenticated, service_role;
revoke all on function public.publish_writing_article_v3(uuid, timestamptz, text, text, text, text, jsonb, text, text[], text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.list_writing_translation_statuses(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.apply_writing_translation(uuid, text, bigint, text, text, text, text, jsonb, boolean)
  from public, anon, authenticated, service_role;
revoke all on function public.delete_writing_article(uuid, timestamptz, text)
  from public, anon, authenticated, service_role;

grant execute on function public.save_writing_draft_v3(uuid, timestamptz, text, text, text, text, jsonb, text, text[], text)
  to authenticated;
grant execute on function public.publish_writing_article_v3(uuid, timestamptz, text, text, text, text, jsonb, text, text[], text, text)
  to authenticated;
grant execute on function public.list_writing_translation_statuses(uuid)
  to authenticated;
grant execute on function public.apply_writing_translation(uuid, text, bigint, text, text, text, text, jsonb, boolean)
  to authenticated;
grant execute on function public.delete_writing_article(uuid, timestamptz, text)
  to authenticated;

notify pgrst, 'reload schema';
