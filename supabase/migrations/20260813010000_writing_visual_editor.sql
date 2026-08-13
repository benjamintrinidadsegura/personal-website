alter table public.writing_articles
  add column body_json jsonb;

alter table public.writing_articles
  add constraint writing_articles_body_json_shape_check check (
    body_json is null or (
      jsonb_typeof(body_json) = 'object'
      and body_json ? 'version'
      and body_json ? 'blocks'
      and body_json -> 'version' = '1'::jsonb
      and jsonb_typeof(body_json -> 'blocks') = 'array'
      and pg_column_size(body_json) <= 131072
    )
  );

create function public.save_writing_draft_v2(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_title text,
  p_deck text,
  p_excerpt text,
  p_body text,
  p_body_json jsonb,
  p_content_type text,
  p_topics text[]
)
returns table (updated_at timestamptz, slug text, status text)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  perform public.assert_bts_admin(true);
  if p_id is null or p_expected_updated_at is null
    or p_title is null or p_deck is null or p_excerpt is null or p_body is null or p_body_json is null
    or p_content_type is null or p_topics is null
    or char_length(p_title) > 160
    or char_length(p_deck) > 240 or char_length(p_excerpt) > 320 or char_length(p_body) > 24000
    or jsonb_typeof(p_body_json) is distinct from 'object'
    or p_body_json -> 'version' is distinct from '1'::jsonb
    or jsonb_typeof(p_body_json -> 'blocks') is distinct from 'array'
    or pg_column_size(p_body_json) > 131072
    or p_content_type not in ('essay', 'note') or cardinality(p_topics) not between 1 and 8
    or exists (
      select 1 from unnest(p_topics) as topic
      where topic is null or topic <> trim(topic) or char_length(topic) not between 1 and 40
    )
    or cardinality(p_topics) <> (
      select count(distinct lower(topic)) from unnest(p_topics) as topic
    ) then
    raise exception using message = 'WRITING_INVALID_INPUT', errcode = 'P0001';
  end if;

  return query
  update public.writing_articles as wa set
    title = p_title, deck = p_deck, excerpt = p_excerpt,
    body = p_body, body_json = p_body_json,
    content_type = p_content_type, topics = p_topics,
    updated_at = clock_timestamp()
  where wa.id = p_id
    and wa.status = 'draft'
    and wa.updated_at = p_expected_updated_at
  returning wa.updated_at, wa.slug, wa.status;
  if not found then raise exception using message = 'WRITING_STALE_OR_MISSING', errcode = 'P0001'; end if;
end;
$$;

create function public.publish_writing_article_v2(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_title text,
  p_deck text,
  p_excerpt text,
  p_body text,
  p_body_json jsonb,
  p_content_type text,
  p_topics text[],
  p_slug_base text
)
returns table (updated_at timestamptz, slug text, status text)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_existing_slug text;
  v_slug text;
  v_suffix integer := 1;
begin
  perform public.assert_bts_admin(true);
  if p_id is null or p_expected_updated_at is null
    or p_title is null or p_deck is null or p_excerpt is null or p_body is null or p_body_json is null
    or p_content_type is null or p_topics is null or p_slug_base is null
    or char_length(p_title) not between 3 and 160
    or char_length(p_deck) > 240
    or char_length(p_excerpt) not between 10 and 320
    or char_length(p_body) not between 20 and 24000
    or jsonb_typeof(p_body_json) is distinct from 'object'
    or p_body_json -> 'version' is distinct from '1'::jsonb
    or jsonb_typeof(p_body_json -> 'blocks') is distinct from 'array'
    or pg_column_size(p_body_json) > 131072
    or p_content_type not in ('essay', 'note') or cardinality(p_topics) not between 1 and 8
    or exists (
      select 1 from unnest(p_topics) as topic
      where topic is null or topic <> trim(topic) or char_length(topic) not between 1 and 40
    )
    or cardinality(p_topics) <> (
      select count(distinct lower(topic)) from unnest(p_topics) as topic
    )
    or char_length(p_slug_base) not between 1 and 80
    or p_slug_base !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception using message = 'WRITING_INVALID_INPUT', errcode = 'P0001';
  end if;

  select wa.slug into v_existing_slug from public.writing_articles as wa
  where wa.id = p_id and wa.updated_at = p_expected_updated_at for update;
  if not found then raise exception using message = 'WRITING_STALE_OR_MISSING', errcode = 'P0001'; end if;

  v_slug := v_existing_slug;
  if v_slug is null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('writing-slug-allocation'));
    v_slug := left(p_slug_base, 80);
    while exists (select 1 from public.writing_articles as wa where wa.slug = v_slug and wa.id <> p_id) loop
      v_suffix := v_suffix + 1;
      v_slug := left(p_slug_base, 80 - char_length(v_suffix::text) - 1) || '-' || v_suffix::text;
    end loop;
  end if;

  return query
  update public.writing_articles as wa set
    title = p_title, deck = p_deck, excerpt = p_excerpt,
    body = p_body, body_json = p_body_json,
    content_type = p_content_type, topics = p_topics, slug = v_slug,
    status = 'published', published_at = coalesce(wa.published_at, clock_timestamp()),
    updated_at = clock_timestamp()
  where wa.id = p_id
  returning wa.updated_at, wa.slug, wa.status;
end;
$$;

revoke all on function public.save_writing_draft_v2(uuid, timestamptz, text, text, text, text, jsonb, text, text[]) from public, anon, authenticated, service_role;
revoke all on function public.publish_writing_article_v2(uuid, timestamptz, text, text, text, text, jsonb, text, text[], text) from public, anon, authenticated, service_role;

grant execute on function public.save_writing_draft_v2(uuid, timestamptz, text, text, text, text, jsonb, text, text[]) to authenticated;
grant execute on function public.publish_writing_article_v2(uuid, timestamptz, text, text, text, text, jsonb, text, text[], text) to authenticated;

notify pgrst, 'reload schema';
