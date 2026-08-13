create type public.writing_discussion_state as enum (
  'open',
  'closed',
  'disabled'
);

create type public.writing_comment_moderation_status as enum (
  'visible',
  'held',
  'spam',
  'removed'
);

-- Missing settings intentionally resolve to open. Existing and newly published
-- articles therefore receive the additive product default without a backfill.
create table public.writing_discussions (
  article_id uuid primary key references public.writing_articles (id) on delete cascade,
  state public.writing_discussion_state not null default 'open',
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table public.writing_comments (
  id uuid primary key default extensions.gen_random_uuid(),
  sequence_id bigint generated always as identity unique,
  article_id uuid not null references public.writing_articles (id) on delete restrict,
  parent_comment_id uuid,
  guest_display_name text not null,
  body text not null,
  moderation_status public.writing_comment_moderation_status not null default 'visible',
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (article_id, id),
  constraint writing_comments_parent_same_article_fk
    foreign key (article_id, parent_comment_id)
    references public.writing_comments (article_id, id)
    on delete restrict,
  constraint writing_comments_guest_name_length_check
    check (char_length(guest_display_name) between 2 and 40),
  constraint writing_comments_body_length_check
    check (char_length(body) between 2 and 3000),
  constraint writing_comments_guest_name_trimmed_check
    check (guest_display_name = btrim(guest_display_name)),
  constraint writing_comments_body_trimmed_check
    check (body = btrim(body)),
  constraint writing_comments_guest_name_single_line_check
    check (position(chr(10) in guest_display_name) = 0 and position(chr(13) in guest_display_name) = 0),
  constraint writing_comments_body_line_limit_check
    check (char_length(body) - char_length(replace(body, chr(10), '')) <= 59)
);

create index writing_comments_public_roots_idx
  on public.writing_comments (article_id, created_at asc, id asc)
  where moderation_status = 'visible' and parent_comment_id is null;
create index writing_comments_parent_created_idx
  on public.writing_comments (parent_comment_id, created_at asc, id asc)
  where parent_comment_id is not null;
create index writing_comments_moderation_created_idx
  on public.writing_comments (moderation_status, created_at desc);

create table public.writing_comment_rate_limits (
  id bigint generated always as identity primary key,
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

create index writing_comment_rate_network_created_idx
  on public.writing_comment_rate_limits (network_hash, created_at desc);
create index writing_comment_rate_message_network_created_idx
  on public.writing_comment_rate_limits (message_hash, network_hash, created_at desc);
create index writing_comment_rate_expires_idx
  on public.writing_comment_rate_limits (expires_at);

alter table public.writing_discussions enable row level security;
alter table public.writing_comments enable row level security;
alter table public.writing_comment_rate_limits enable row level security;

revoke all on table public.writing_discussions from public, anon, authenticated, service_role;
revoke all on table public.writing_comments from public, anon, authenticated, service_role;
revoke all on table public.writing_comment_rate_limits from public, anon, authenticated, service_role;
revoke all on sequence public.writing_comments_sequence_id_seq from public, anon, authenticated, service_role;
revoke all on sequence public.writing_comment_rate_limits_id_seq from public, anon, authenticated, service_role;

grant select on table public.writing_discussions to service_role;
grant select on table public.writing_comments to service_role;

create function public.submit_guest_writing_comment(
  p_article_id uuid,
  p_parent_comment_id uuid,
  p_display_name text,
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
  v_article_status text;
  v_discussion_state public.writing_discussion_state := 'open';
begin
  if p_article_id is null
    or p_display_name is null
    or p_body is null
    or p_network_hash is null
    or p_message_hash is null
    or p_form_token_hash is null
    or char_length(p_display_name) not between 2 and 40
    or p_display_name <> btrim(p_display_name)
    or position(chr(10) in p_display_name) > 0
    or position(chr(13) in p_display_name) > 0
    or char_length(p_body) not between 2 and 3000
    or p_body <> btrim(p_body)
    or char_length(p_body) - char_length(replace(p_body, chr(10), '')) > 59
    or p_network_hash !~ '^[0-9a-f]{64}$'
    or p_message_hash !~ '^[0-9a-f]{64}$'
    or p_form_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using message = 'WRITING_COMMENT_INVALID_INPUT', errcode = 'P0001';
  end if;

  -- Future state-changing RPCs must take this same lock before closing or
  -- disabling a discussion, so an accepted write cannot race that transition.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('writing-discussion:' || p_article_id::text, 0)
  );

  select wa.status into v_article_status
  from public.writing_articles as wa
  where wa.id = p_article_id
  for update;
  if not found or v_article_status <> 'published' then
    raise exception using message = 'WRITING_COMMENT_ARTICLE_UNAVAILABLE', errcode = 'P0001';
  end if;

  select wd.state into v_discussion_state
  from public.writing_discussions as wd
  where wd.article_id = p_article_id
  for share;
  v_discussion_state := coalesce(v_discussion_state, 'open'::public.writing_discussion_state);
  if v_discussion_state = 'closed' then
    raise exception using message = 'WRITING_COMMENT_DISCUSSION_CLOSED', errcode = 'P0001';
  end if;
  if v_discussion_state = 'disabled' then
    raise exception using message = 'WRITING_COMMENT_DISCUSSION_DISABLED', errcode = 'P0001';
  end if;

  if p_parent_comment_id is not null and not exists (
    select 1
    from public.writing_comments as parent
    where parent.article_id = p_article_id
      and parent.id = p_parent_comment_id
      and parent.moderation_status = 'visible'
  ) then
    raise exception using message = 'WRITING_COMMENT_INVALID_PARENT', errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_network_hash, 0));
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_message_hash || ':' || p_network_hash, 0)
  );

  if exists (
    select 1 from public.writing_comment_rate_limits
    where form_token_hash = p_form_token_hash
  ) then
    raise exception using message = 'WRITING_COMMENT_TOKEN_REPLAY', errcode = 'P0001';
  end if;

  if (
    select count(*) from public.writing_comment_rate_limits
    where network_hash = p_network_hash
      and created_at > v_now - interval '15 minutes'
  ) >= 3 then
    raise exception using message = 'WRITING_COMMENT_RATE_15', errcode = 'P0001';
  end if;

  if (
    select count(*) from public.writing_comment_rate_limits
    where network_hash = p_network_hash
      and created_at > v_now - interval '24 hours'
  ) >= 10 then
    raise exception using message = 'WRITING_COMMENT_RATE_24', errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.writing_comment_rate_limits
    where message_hash = p_message_hash
      and network_hash = p_network_hash
      and created_at > v_now - interval '24 hours'
  ) then
    raise exception using message = 'WRITING_COMMENT_DUPLICATE', errcode = 'P0001';
  end if;

  insert into public.writing_comments (
    article_id,
    parent_comment_id,
    guest_display_name,
    body,
    moderation_status
  ) values (
    p_article_id,
    p_parent_comment_id,
    p_display_name,
    p_body,
    'visible'
  ) returning id into v_comment_id;

  insert into public.writing_comment_rate_limits (
    comment_id,
    network_hash,
    message_hash,
    form_token_hash,
    expires_at
  ) values (
    v_comment_id,
    p_network_hash,
    p_message_hash,
    p_form_token_hash,
    v_now + interval '48 hours'
  );

  return v_comment_id;
end;
$$;

revoke all on function public.submit_guest_writing_comment(uuid, uuid, text, text, text, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.submit_guest_writing_comment(uuid, uuid, text, text, text, text, text)
  to service_role;

notify pgrst, 'reload schema';
