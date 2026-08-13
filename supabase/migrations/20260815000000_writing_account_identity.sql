create type public.writing_comment_identity_kind as enum (
  'guest',
  'account'
);

create table public.bts_account_profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete restrict,
  display_name text not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint bts_account_profiles_display_name_length_check
    check (char_length(display_name) between 2 and 40),
  constraint bts_account_profiles_display_name_trimmed_check
    check (display_name = btrim(display_name)),
  constraint bts_account_profiles_display_name_spacing_check
    check (position('  ' in display_name) = 0),
  constraint bts_account_profiles_display_name_single_line_check
    check (position(chr(10) in display_name) = 0 and position(chr(13) in display_name) = 0),
  constraint bts_account_profiles_display_name_reserved_check
    check (lower(display_name) not in (
      'guest', 'author', 'admin', 'administrator', 'moderator',
      'staff', 'support', 'bts.online', 'bts studio'
    ))
);

alter table public.writing_comments
  add column identity_kind public.writing_comment_identity_kind not null default 'guest',
  add column account_profile_id uuid references public.bts_account_profiles (id) on delete restrict,
  add constraint writing_comments_identity_consistency_check check (
    (identity_kind = 'guest' and account_profile_id is null)
    or (identity_kind = 'account' and account_profile_id is not null)
  );

create index writing_comments_account_profile_created_idx
  on public.writing_comments (account_profile_id, created_at desc)
  where identity_kind = 'account';

create table public.writing_account_comment_events (
  id bigint generated always as identity primary key,
  account_profile_id uuid not null references public.bts_account_profiles (id) on delete restrict,
  article_id uuid not null references public.writing_articles (id) on delete restrict,
  comment_id uuid references public.writing_comments (id) on delete set null,
  network_hash text not null,
  message_hash text not null,
  form_token_hash text not null unique,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  check (network_hash ~ '^[0-9a-f]{64}$'),
  check (message_hash ~ '^[0-9a-f]{64}$'),
  check (form_token_hash ~ '^[0-9a-f]{64}$')
);

create index writing_account_comment_events_profile_created_idx
  on public.writing_account_comment_events (account_profile_id, created_at desc);
create index writing_account_comment_events_network_created_idx
  on public.writing_account_comment_events (network_hash, created_at desc);
create index writing_account_comment_events_message_profile_article_created_idx
  on public.writing_account_comment_events (
    message_hash, account_profile_id, article_id, created_at desc
  );
create index writing_account_comment_events_expires_idx
  on public.writing_account_comment_events (expires_at);

alter table public.bts_account_profiles enable row level security;
alter table public.writing_account_comment_events enable row level security;

revoke all on table public.bts_account_profiles from public, anon, authenticated, service_role;
revoke all on table public.writing_account_comment_events from public, anon, authenticated, service_role;
revoke all on sequence public.writing_account_comment_events_id_seq from public, anon, authenticated, service_role;

grant select on table public.bts_account_profiles to service_role;

create function public.set_bts_account_display_name(
  p_actor_user_id uuid,
  p_display_name text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_display_name text;
begin
  if p_actor_user_id is null
    or p_display_name is null
    or char_length(p_display_name) not between 2 and 40
    or p_display_name <> btrim(p_display_name)
    or position('  ' in p_display_name) > 0
    or position(chr(9) in p_display_name) > 0
    or position(chr(10) in p_display_name) > 0
    or position(chr(13) in p_display_name) > 0
    or p_display_name ~ U&'[\0001-\0008\000B\000C\000E-\001F\007F-\009F\061C\200E\200F\202A-\202E\2066-\2069]'
    or lower(p_display_name) in (
      'guest', 'author', 'admin', 'administrator', 'moderator',
      'staff', 'support', 'bts.online', 'bts studio'
    ) then
    raise exception using message = 'BTS_PROFILE_INVALID_DISPLAY_NAME', errcode = 'P0001';
  end if;

  if not exists (
    select 1 from auth.users as users where users.id = p_actor_user_id
  ) then
    raise exception using message = 'BTS_PROFILE_UNAUTHORIZED', errcode = 'P0001';
  end if;

  insert into public.bts_account_profiles as profile (
    user_id,
    display_name
  ) values (
    p_actor_user_id,
    p_display_name
  )
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    updated_at = clock_timestamp()
  returning profile.display_name into v_display_name;

  return v_display_name;
end;
$$;

create function public.submit_account_writing_comment(
  p_actor_user_id uuid,
  p_article_id uuid,
  p_body text,
  p_network_hash text,
  p_message_hash text,
  p_form_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_comment_id uuid;
  v_profile_id uuid;
  v_display_name text;
  v_article_status text;
  v_discussion_state public.writing_discussion_state := 'open';
begin
  if p_actor_user_id is null
    or p_article_id is null
    or p_body is null
    or p_network_hash is null
    or p_message_hash is null
    or p_form_token_hash is null
    or char_length(p_body) not between 2 and 3000
    or p_body <> btrim(p_body)
    or char_length(p_body) - char_length(replace(p_body, chr(10), '')) > 59
    or p_network_hash !~ '^[0-9a-f]{64}$'
    or p_message_hash !~ '^[0-9a-f]{64}$'
    or p_form_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using message = 'WRITING_ACCOUNT_COMMENT_INVALID_INPUT', errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('writing-discussion:' || p_article_id::text, 0)
  );

  select article.status into v_article_status
  from public.writing_articles as article
  where article.id = p_article_id
  for update;
  if not found or v_article_status <> 'published' then
    raise exception using message = 'WRITING_COMMENT_ARTICLE_UNAVAILABLE', errcode = 'P0001';
  end if;

  select discussion.state into v_discussion_state
  from public.writing_discussions as discussion
  where discussion.article_id = p_article_id
  for share;
  v_discussion_state := coalesce(v_discussion_state, 'open'::public.writing_discussion_state);
  if v_discussion_state = 'closed' then
    raise exception using message = 'WRITING_COMMENT_DISCUSSION_CLOSED', errcode = 'P0001';
  end if;
  if v_discussion_state = 'disabled' then
    raise exception using message = 'WRITING_COMMENT_DISCUSSION_DISABLED', errcode = 'P0001';
  end if;

  select profile.id, profile.display_name into v_profile_id, v_display_name
  from public.bts_account_profiles as profile
  where profile.user_id = p_actor_user_id
  for share;
  if not found then
    raise exception using message = 'WRITING_ACCOUNT_COMMENT_PROFILE_REQUIRED', errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('writing-account:' || v_profile_id::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('writing-account-network:' || p_network_hash, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'writing-account-message:' || v_profile_id::text || ':' || p_article_id::text || ':' || p_message_hash,
      0
    )
  );

  if exists (
    select 1 from public.writing_account_comment_events
    where form_token_hash = p_form_token_hash
  ) then
    raise exception using message = 'WRITING_COMMENT_TOKEN_REPLAY', errcode = 'P0001';
  end if;

  if (
    select count(*) from public.writing_account_comment_events
    where account_profile_id = v_profile_id
      and created_at > v_now - interval '15 minutes'
  ) >= 5 then
    raise exception using message = 'WRITING_ACCOUNT_COMMENT_RATE_15', errcode = 'P0001';
  end if;

  if (
    select count(*) from public.writing_account_comment_events
    where account_profile_id = v_profile_id
      and created_at > v_now - interval '24 hours'
  ) >= 25 then
    raise exception using message = 'WRITING_ACCOUNT_COMMENT_RATE_24', errcode = 'P0001';
  end if;

  if (
    select count(*) from public.writing_account_comment_events
    where network_hash = p_network_hash
      and created_at > v_now - interval '15 minutes'
  ) >= 10 then
    raise exception using message = 'WRITING_ACCOUNT_COMMENT_NETWORK_RATE_15', errcode = 'P0001';
  end if;

  if (
    select count(*) from public.writing_account_comment_events
    where network_hash = p_network_hash
      and created_at > v_now - interval '24 hours'
  ) >= 50 then
    raise exception using message = 'WRITING_ACCOUNT_COMMENT_NETWORK_RATE_24', errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.writing_account_comment_events
    where account_profile_id = v_profile_id
      and article_id = p_article_id
      and message_hash = p_message_hash
      and created_at > v_now - interval '24 hours'
  ) then
    raise exception using message = 'WRITING_COMMENT_DUPLICATE', errcode = 'P0001';
  end if;

  insert into public.writing_comments (
    article_id,
    parent_comment_id,
    guest_display_name,
    body,
    moderation_status,
    identity_kind,
    account_profile_id
  ) values (
    p_article_id,
    null,
    v_display_name,
    p_body,
    'visible',
    'account',
    v_profile_id
  ) returning id into v_comment_id;

  insert into public.writing_account_comment_events (
    account_profile_id,
    article_id,
    comment_id,
    network_hash,
    message_hash,
    form_token_hash,
    expires_at
  ) values (
    v_profile_id,
    p_article_id,
    v_comment_id,
    p_network_hash,
    p_message_hash,
    p_form_token_hash,
    v_now + interval '48 hours'
  );

  return v_comment_id;
end;
$$;

create function public.list_public_writing_comments(p_article_id uuid)
returns table (
  id uuid,
  identity_kind text,
  display_name text,
  body text,
  created_at timestamptz,
  is_author boolean
)
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
  select
    comment.id,
    comment.identity_kind::text,
    comment.guest_display_name,
    comment.body,
    comment.created_at,
    case
      when comment.identity_kind = 'account' then exists (
        select 1
        from public.bts_account_profiles as profile
        join public.admin_users as admin on admin.user_id = profile.user_id
        where profile.id = comment.account_profile_id
          and admin.role = 'admin'
          and admin.is_active = true
      )
      else false
    end
  from public.writing_comments as comment
  where comment.article_id = p_article_id
    and comment.moderation_status = 'visible'
    and comment.parent_comment_id is null
    and exists (
      select 1
      from public.writing_articles as article
      where article.id = p_article_id
        and article.status = 'published'
        and article.published_at is not null
    )
  order by comment.created_at asc, comment.id asc
  limit 50
$$;

revoke all on function public.set_bts_account_display_name(uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.submit_account_writing_comment(uuid, uuid, text, text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.list_public_writing_comments(uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.set_bts_account_display_name(uuid, text)
  to service_role;
grant execute on function public.submit_account_writing_comment(uuid, uuid, text, text, text, text)
  to service_role;
grant execute on function public.list_public_writing_comments(uuid)
  to service_role;

notify pgrst, 'reload schema';
