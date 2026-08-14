create table public.writing_comment_moderation_events (
  id uuid primary key default extensions.gen_random_uuid(),
  comment_id uuid not null,
  article_id uuid not null references public.writing_articles (id) on delete restrict,
  actor_user_id uuid references auth.users (id) on delete set null,
  previous_state public.writing_comment_moderation_status not null,
  new_state public.writing_comment_moderation_status not null,
  reason_code text not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint writing_comment_moderation_events_state_change_check
    check (previous_state <> new_state),
  constraint writing_comment_moderation_events_reason_check
    check (reason_code in ('spam', 'harassment', 'personal_data', 'off_topic', 'other', 'correction'))
);

-- comment_id is intentionally a logical identifier rather than a foreign key.
-- An owner may later physically delete a restored leaf comment; its moderation
-- history must remain attributable to the immutable public comment UUID.
create index writing_comment_moderation_events_comment_created_idx
  on public.writing_comment_moderation_events (comment_id, created_at desc, id desc);
create index writing_comment_moderation_events_article_created_idx
  on public.writing_comment_moderation_events (article_id, created_at desc, id desc);

create table public.writing_discussion_state_events (
  id uuid primary key default extensions.gen_random_uuid(),
  article_id uuid not null references public.writing_articles (id) on delete restrict,
  actor_user_id uuid references auth.users (id) on delete set null,
  previous_state public.writing_discussion_state not null,
  new_state public.writing_discussion_state not null,
  previous_state_was_implicit boolean not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint writing_discussion_state_events_state_change_check
    check (previous_state <> new_state)
);

create index writing_discussion_state_events_article_created_idx
  on public.writing_discussion_state_events (article_id, created_at desc, id desc);

create index writing_comments_article_created_idx
  on public.writing_comments (article_id, created_at desc, id desc);

alter table public.writing_comment_moderation_events enable row level security;
alter table public.writing_discussion_state_events enable row level security;

revoke all on table public.writing_comment_moderation_events
  from public, anon, authenticated, service_role;
revoke all on table public.writing_discussion_state_events
  from public, anon, authenticated, service_role;

create function public.assert_writing_comment_moderator(p_actor_user_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  if p_actor_user_id is null or not exists (
    select 1
    from public.admin_users as admin
    where admin.user_id = p_actor_user_id
      and admin.role = 'admin'
      and admin.is_active = true
  ) then
    raise exception using message = 'WRITING_COMMENT_MODERATION_UNAUTHORIZED', errcode = 'P0001';
  end if;
end;
$$;

create function public.list_writing_discussion_summaries(
  p_actor_user_id uuid,
  p_limit integer default 100
)
returns table (
  article_id uuid,
  discussion_state public.writing_discussion_state,
  discussion_updated_at timestamptz,
  visible_count bigint,
  held_count bigint,
  spam_count bigint,
  removed_count bigint,
  latest_comment_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform public.assert_writing_comment_moderator(p_actor_user_id);
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception using message = 'WRITING_COMMENT_MODERATION_INVALID_INPUT', errcode = 'P0001';
  end if;

  return query
  select
    article.id,
    coalesce(discussion.state, 'open'::public.writing_discussion_state),
    discussion.updated_at,
    count(comment.id) filter (where comment.moderation_status = 'visible'),
    count(comment.id) filter (where comment.moderation_status = 'held'),
    count(comment.id) filter (where comment.moderation_status = 'spam'),
    count(comment.id) filter (where comment.moderation_status = 'removed'),
    max(comment.created_at)
  from public.writing_articles as article
  left join public.writing_discussions as discussion on discussion.article_id = article.id
  left join public.writing_comments as comment on comment.article_id = article.id
  where article.status = 'published'
    and article.published_at is not null
  group by article.id, discussion.state, discussion.updated_at, article.updated_at
  order by max(comment.created_at) desc nulls last,
    article.updated_at desc,
    article.id desc
  limit p_limit;
end;
$$;

create function public.get_writing_discussion_for_moderation(
  p_actor_user_id uuid,
  p_article_id uuid
)
returns table (
  article_id uuid,
  discussion_state public.writing_discussion_state,
  discussion_updated_at timestamptz,
  visible_count bigint,
  held_count bigint,
  spam_count bigint,
  removed_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform public.assert_writing_comment_moderator(p_actor_user_id);
  if p_article_id is null then
    raise exception using message = 'WRITING_COMMENT_MODERATION_INVALID_INPUT', errcode = 'P0001';
  end if;

  return query
  select
    article.id,
    coalesce(discussion.state, 'open'::public.writing_discussion_state),
    discussion.updated_at,
    count(comment.id) filter (where comment.moderation_status = 'visible'),
    count(comment.id) filter (where comment.moderation_status = 'held'),
    count(comment.id) filter (where comment.moderation_status = 'spam'),
    count(comment.id) filter (where comment.moderation_status = 'removed')
  from public.writing_articles as article
  left join public.writing_discussions as discussion on discussion.article_id = article.id
  left join public.writing_comments as comment on comment.article_id = article.id
  where article.id = p_article_id
    and article.status = 'published'
    and article.published_at is not null
  group by article.id, discussion.state, discussion.updated_at;
end;
$$;

create function public.list_writing_comments_for_moderation(
  p_actor_user_id uuid,
  p_article_id uuid,
  p_limit integer default 50
)
returns table (
  id uuid,
  identity_kind text,
  display_name text,
  body text,
  moderation_state public.writing_comment_moderation_status,
  created_at timestamptz,
  edited_at timestamptz,
  updated_at timestamptz,
  is_author_deleted boolean,
  is_author boolean,
  latest_reason_code text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform public.assert_writing_comment_moderator(p_actor_user_id);
  if p_article_id is null or p_limit is null or p_limit < 1 or p_limit > 50 then
    raise exception using message = 'WRITING_COMMENT_MODERATION_INVALID_INPUT', errcode = 'P0001';
  end if;
  if not exists (
    select 1
    from public.writing_articles as article
    where article.id = p_article_id
      and article.status = 'published'
      and article.published_at is not null
  ) then
    raise exception using message = 'WRITING_COMMENT_MODERATION_ARTICLE_UNAVAILABLE', errcode = 'P0001';
  end if;

  return query
  select
    comment.id,
    comment.identity_kind::text,
    case
      when comment.author_deleted_at is not null then null
      when comment.identity_kind = 'account' and owner_profile.deleted_at is not null then 'Deleted account'
      else comment.guest_display_name
    end,
    case when comment.author_deleted_at is not null then null else comment.body end,
    comment.moderation_status,
    comment.created_at,
    comment.edited_at,
    comment.updated_at,
    comment.author_deleted_at is not null,
    case
      when comment.author_deleted_at is not null then false
      when comment.identity_kind = 'account' and owner_profile.deleted_at is null then exists (
        select 1
        from public.admin_users as author_admin
        where author_admin.user_id = owner_profile.user_id
          and author_admin.role = 'admin'
          and author_admin.is_active = true
      )
      else false
    end,
    latest_event.reason_code
  from public.writing_comments as comment
  left join public.bts_account_profiles as owner_profile
    on owner_profile.id = comment.account_profile_id
  left join lateral (
    select event.reason_code
    from public.writing_comment_moderation_events as event
    where event.comment_id = comment.id
    order by event.created_at desc, event.id desc
    limit 1
  ) as latest_event on true
  where comment.article_id = p_article_id
  order by comment.created_at desc, comment.id desc
  limit p_limit;
end;
$$;

create function public.set_writing_discussion_state(
  p_actor_user_id uuid,
  p_article_id uuid,
  p_expected_updated_at timestamptz,
  p_target_state public.writing_discussion_state
)
returns table (
  article_id uuid,
  article_slug text,
  new_state public.writing_discussion_state,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_article_slug text;
  v_article_status text;
  v_article_published_at timestamptz;
  v_previous_state public.writing_discussion_state := 'open';
  v_previous_updated_at timestamptz;
  v_previous_was_implicit boolean;
  v_actor_is_active boolean;
begin
  if p_actor_user_id is null or p_article_id is null or p_target_state is null then
    raise exception using message = 'WRITING_COMMENT_MODERATION_INVALID_INPUT', errcode = 'P0001';
  end if;
  perform public.assert_writing_comment_moderator(p_actor_user_id);

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('writing-discussion:' || p_article_id::text, 0)
  );

  select article.slug, article.status, article.published_at
    into v_article_slug, v_article_status, v_article_published_at
  from public.writing_articles as article
  where article.id = p_article_id
  for update;
  if not found or v_article_status <> 'published' or v_article_published_at is null or v_article_slug is null then
    raise exception using message = 'WRITING_COMMENT_MODERATION_ARTICLE_UNAVAILABLE', errcode = 'P0001';
  end if;

  select discussion.state, discussion.updated_at
    into v_previous_state, v_previous_updated_at
  from public.writing_discussions as discussion
  where discussion.article_id = p_article_id
  for update;
  v_previous_was_implicit := not found;
  if v_previous_was_implicit then
    v_previous_state := 'open'::public.writing_discussion_state;
    v_previous_updated_at := null;
  end if;

  select true into v_actor_is_active
  from public.admin_users as admin
  where admin.user_id = p_actor_user_id
    and admin.role = 'admin'
    and admin.is_active = true
  for share;
  if not found or v_actor_is_active is not true then
    raise exception using message = 'WRITING_COMMENT_MODERATION_UNAUTHORIZED', errcode = 'P0001';
  end if;

  if v_previous_was_implicit then
    if p_expected_updated_at is not null then
      raise exception using message = 'WRITING_COMMENT_MODERATION_STALE', errcode = 'P0001';
    end if;
  elsif p_expected_updated_at is null or v_previous_updated_at is distinct from p_expected_updated_at then
    raise exception using message = 'WRITING_COMMENT_MODERATION_STALE', errcode = 'P0001';
  end if;
  if v_previous_state = p_target_state then
    raise exception using message = 'WRITING_COMMENT_MODERATION_NO_CHANGE', errcode = 'P0001';
  end if;

  if v_previous_was_implicit then
    insert into public.writing_discussions (article_id, state, created_at, updated_at)
    values (p_article_id, p_target_state, v_now, v_now);
  else
    update public.writing_discussions as discussion
    set state = p_target_state,
        updated_at = v_now
    where discussion.article_id = p_article_id;
  end if;

  insert into public.writing_discussion_state_events (
    article_id,
    actor_user_id,
    previous_state,
    new_state,
    previous_state_was_implicit,
    created_at
  ) values (
    p_article_id,
    p_actor_user_id,
    v_previous_state,
    p_target_state,
    v_previous_was_implicit,
    v_now
  );

  return query select p_article_id, v_article_slug, p_target_state, v_now;
end;
$$;

create function public.moderate_writing_comment(
  p_actor_user_id uuid,
  p_comment_id uuid,
  p_expected_updated_at timestamptz,
  p_target_state public.writing_comment_moderation_status,
  p_reason_code text
)
returns table (
  article_id uuid,
  article_slug text,
  new_state public.writing_comment_moderation_status,
  updated_at timestamptz,
  public_changed boolean
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_article_id uuid;
  v_article_slug text;
  v_article_status text;
  v_article_published_at timestamptz;
  v_current_state public.writing_comment_moderation_status;
  v_current_updated_at timestamptz;
  v_author_deleted_at timestamptz;
  v_actor_is_active boolean;
  v_public_changed boolean;
begin
  if p_actor_user_id is null
    or p_comment_id is null
    or p_expected_updated_at is null
    or p_target_state is null
    or p_reason_code is null
    or p_reason_code not in ('spam', 'harassment', 'personal_data', 'off_topic', 'other', 'correction') then
    raise exception using message = 'WRITING_COMMENT_MODERATION_INVALID_INPUT', errcode = 'P0001';
  end if;
  perform public.assert_writing_comment_moderator(p_actor_user_id);

  -- Preserve the 1B owner-mutation order. Future reply insertion must acquire
  -- this parent comment advisory lock and later a parent FOR KEY SHARE lock.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('writing-comment-mutation:' || p_comment_id::text, 0)
  );

  select comment.article_id into v_article_id
  from public.writing_comments as comment
  where comment.id = p_comment_id;
  if not found then
    raise exception using message = 'WRITING_COMMENT_MODERATION_UNAVAILABLE', errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('writing-discussion:' || v_article_id::text, 0)
  );

  select article.slug, article.status, article.published_at
    into v_article_slug, v_article_status, v_article_published_at
  from public.writing_articles as article
  where article.id = v_article_id
  for update;
  if not found or v_article_status <> 'published' or v_article_published_at is null or v_article_slug is null then
    raise exception using message = 'WRITING_COMMENT_MODERATION_ARTICLE_UNAVAILABLE', errcode = 'P0001';
  end if;

  perform 1
  from public.writing_discussions as discussion
  where discussion.article_id = v_article_id
  for share;
  -- A missing row intentionally remains implicit Open.

  select true into v_actor_is_active
  from public.admin_users as admin
  where admin.user_id = p_actor_user_id
    and admin.role = 'admin'
    and admin.is_active = true
  for share;
  if not found or v_actor_is_active is not true then
    raise exception using message = 'WRITING_COMMENT_MODERATION_UNAUTHORIZED', errcode = 'P0001';
  end if;

  select comment.moderation_status, comment.updated_at, comment.author_deleted_at
    into v_current_state, v_current_updated_at, v_author_deleted_at
  from public.writing_comments as comment
  where comment.id = p_comment_id
    and comment.article_id = v_article_id
  for update;
  if not found then
    raise exception using message = 'WRITING_COMMENT_MODERATION_UNAVAILABLE', errcode = 'P0001';
  end if;
  if v_author_deleted_at is not null then
    raise exception using message = 'WRITING_COMMENT_MODERATION_TOMBSTONE', errcode = 'P0001';
  end if;
  if v_current_updated_at is distinct from p_expected_updated_at then
    raise exception using message = 'WRITING_COMMENT_MODERATION_STALE', errcode = 'P0001';
  end if;
  if v_current_state = p_target_state then
    raise exception using message = 'WRITING_COMMENT_MODERATION_NO_CHANGE', errcode = 'P0001';
  end if;

  v_public_changed := v_current_state = 'visible' or p_target_state = 'visible';
  update public.writing_comments as comment
  set moderation_status = p_target_state,
      updated_at = v_now
  where comment.id = p_comment_id;

  insert into public.writing_comment_moderation_events (
    comment_id,
    article_id,
    actor_user_id,
    previous_state,
    new_state,
    reason_code,
    created_at
  ) values (
    p_comment_id,
    v_article_id,
    p_actor_user_id,
    v_current_state,
    p_target_state,
    p_reason_code,
    v_now
  );

  return query select v_article_id, v_article_slug, p_target_state, v_now, v_public_changed;
end;
$$;

revoke all on function public.assert_writing_comment_moderator(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.list_writing_discussion_summaries(uuid, integer)
  from public, anon, authenticated, service_role;
revoke all on function public.get_writing_discussion_for_moderation(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.list_writing_comments_for_moderation(uuid, uuid, integer)
  from public, anon, authenticated, service_role;
revoke all on function public.set_writing_discussion_state(uuid, uuid, timestamptz, public.writing_discussion_state)
  from public, anon, authenticated, service_role;
revoke all on function public.moderate_writing_comment(uuid, uuid, timestamptz, public.writing_comment_moderation_status, text)
  from public, anon, authenticated, service_role;

grant execute on function public.list_writing_discussion_summaries(uuid, integer)
  to service_role;
grant execute on function public.get_writing_discussion_for_moderation(uuid, uuid)
  to service_role;
grant execute on function public.list_writing_comments_for_moderation(uuid, uuid, integer)
  to service_role;
grant execute on function public.set_writing_discussion_state(uuid, uuid, timestamptz, public.writing_discussion_state)
  to service_role;
grant execute on function public.moderate_writing_comment(uuid, uuid, timestamptz, public.writing_comment_moderation_status, text)
  to service_role;

notify pgrst, 'reload schema';
