create table public.writing_articles (
  id uuid primary key default extensions.gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete restrict,
  slug text unique,
  title text not null default '',
  deck text not null default '',
  excerpt text not null default '',
  body text not null default '',
  content_type text not null default 'essay' check (content_type in ('essay', 'note')),
  topics text[] not null default array['Ideas']::text[],
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  published_at timestamptz,
  check (cardinality(topics) between 1 and 8),
  check (array_position(topics, null) is null),
  check (char_length(title) <= 160 and char_length(deck) <= 240 and char_length(excerpt) <= 320 and char_length(body) <= 24000),
  check (status <> 'published' or (slug is not null and published_at is not null)),
  check (status <> 'published' or (char_length(title) between 3 and 160 and char_length(excerpt) between 10 and 320 and char_length(body) between 20 and 24000)),
  check (slug is null or (char_length(slug) <= 80 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'))
);

create index writing_articles_publication_idx
  on public.writing_articles (published_at desc)
  where status = 'published';

alter table public.writing_articles enable row level security;
revoke all on table public.writing_articles from public, anon, authenticated, service_role;
grant select on table public.writing_articles to service_role;

create or replace function public.assert_bts_admin(p_require_aal2 boolean default true)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_aal text := coalesce(auth.jwt() ->> 'aal', '');
begin
  if v_user_id is null or not exists (
    select 1 from public.admin_users as au
    where au.user_id = v_user_id and au.role = 'admin' and au.is_active = true
  ) then
    raise exception using message = 'BTS_ADMIN_UNAUTHORIZED', errcode = 'P0001';
  end if;
  if p_require_aal2 and v_aal <> 'aal2' then
    raise exception using message = 'BTS_ADMIN_MFA_REQUIRED', errcode = 'P0001';
  end if;
  return v_user_id;
end;
$$;

create function public.create_writing_draft()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  v_actor uuid := public.assert_bts_admin(true);
  v_id uuid;
begin
  insert into public.writing_articles (author_id) values (v_actor) returning id into v_id;
  return v_id;
end;
$$;

create function public.list_writing_articles(p_limit integer default 100)
returns setof public.writing_articles
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  perform public.assert_bts_admin(true);
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception using message = 'WRITING_INVALID_INPUT', errcode = 'P0001';
  end if;
  return query select * from public.writing_articles order by updated_at desc limit p_limit;
end;
$$;

create function public.get_writing_article_for_admin(p_id uuid)
returns setof public.writing_articles
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  perform public.assert_bts_admin(true);
  if p_id is null then raise exception using message = 'WRITING_INVALID_INPUT', errcode = 'P0001'; end if;
  return query select * from public.writing_articles where id = p_id;
end;
$$;

create function public.save_writing_article(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_title text,
  p_deck text,
  p_excerpt text,
  p_body text,
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
    or p_title is null or p_deck is null or p_excerpt is null or p_body is null
    or p_content_type is null or p_topics is null
    or char_length(p_title) > 160
    or char_length(p_deck) > 240 or char_length(p_excerpt) > 320 or char_length(p_body) > 24000
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
    title = p_title, deck = p_deck, excerpt = p_excerpt, body = p_body,
    content_type = p_content_type, topics = p_topics, updated_at = clock_timestamp()
  where wa.id = p_id and wa.updated_at = p_expected_updated_at
  returning wa.updated_at, wa.slug, wa.status;
  if not found then raise exception using message = 'WRITING_STALE_OR_MISSING', errcode = 'P0001'; end if;
end;
$$;

create function public.publish_writing_article(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_title text,
  p_deck text,
  p_excerpt text,
  p_body text,
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
    or p_title is null or p_deck is null or p_excerpt is null or p_body is null
    or p_content_type is null or p_topics is null or p_slug_base is null
    or char_length(p_title) not between 3 and 160
    or char_length(p_excerpt) not between 10 and 320 or char_length(p_body) not between 20 and 24000
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
    title = p_title, deck = p_deck, excerpt = p_excerpt, body = p_body,
    content_type = p_content_type, topics = p_topics, slug = v_slug,
    status = 'published', published_at = coalesce(wa.published_at, clock_timestamp()),
    updated_at = clock_timestamp()
  where wa.id = p_id
  returning wa.updated_at, wa.slug, wa.status;
end;
$$;

revoke all on function public.assert_bts_admin(boolean) from public, anon, authenticated, service_role;
revoke all on function public.create_writing_draft() from public, anon, authenticated, service_role;
revoke all on function public.list_writing_articles(integer) from public, anon, authenticated, service_role;
revoke all on function public.get_writing_article_for_admin(uuid) from public, anon, authenticated, service_role;
revoke all on function public.save_writing_article(uuid, timestamptz, text, text, text, text, text, text[]) from public, anon, authenticated, service_role;
revoke all on function public.publish_writing_article(uuid, timestamptz, text, text, text, text, text, text[], text) from public, anon, authenticated, service_role;

grant execute on function public.create_writing_draft() to authenticated;
grant execute on function public.list_writing_articles(integer) to authenticated;
grant execute on function public.get_writing_article_for_admin(uuid) to authenticated;
grant execute on function public.save_writing_article(uuid, timestamptz, text, text, text, text, text, text[]) to authenticated;
grant execute on function public.publish_writing_article(uuid, timestamptz, text, text, text, text, text, text[], text) to authenticated;
