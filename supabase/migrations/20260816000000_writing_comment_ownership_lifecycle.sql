alter table public.writing_comments
  add column edited_at timestamptz,
  add column author_deleted_at timestamptz;

-- Add and validate the lifecycle-aware constraints before removing the 1A/1B.1
-- active-comment constraints. Existing rows all have author_deleted_at = null.
alter table public.writing_comments
  add constraint writing_comments_lifecycle_body_check check (
    (
      author_deleted_at is null
      and char_length(body) between 2 and 3000
      and body = btrim(body)
      and char_length(body) - char_length(replace(body, chr(10), '')) <= 59
    )
    or (
      author_deleted_at is not null
      and identity_kind = 'account'
      and body = ''
    )
  ) not valid,
  add constraint writing_comments_lifecycle_display_name_check check (
    (
      author_deleted_at is null
      and char_length(guest_display_name) between 2 and 40
      and guest_display_name = btrim(guest_display_name)
      and position(chr(10) in guest_display_name) = 0
      and position(chr(13) in guest_display_name) = 0
    )
    or (
      author_deleted_at is not null
      and identity_kind = 'account'
      and guest_display_name = ''
    )
  ) not valid,
  add constraint writing_comments_lifecycle_identity_check check (
    (
      identity_kind = 'guest'
      and account_profile_id is null
      and author_deleted_at is null
    )
    or (
      identity_kind = 'account'
      and account_profile_id is not null
      and author_deleted_at is null
    )
    or (
      identity_kind = 'account'
      and account_profile_id is null
      and author_deleted_at is not null
    )
  ) not valid,
  add constraint writing_comments_lifecycle_timestamp_check check (
    (edited_at is null or edited_at >= created_at)
    and (author_deleted_at is null or author_deleted_at >= created_at)
  ) not valid;

alter table public.writing_comments
  validate constraint writing_comments_lifecycle_body_check;
alter table public.writing_comments
  validate constraint writing_comments_lifecycle_display_name_check;
alter table public.writing_comments
  validate constraint writing_comments_lifecycle_identity_check;
alter table public.writing_comments
  validate constraint writing_comments_lifecycle_timestamp_check;

alter table public.writing_comments
  drop constraint writing_comments_body_length_check,
  drop constraint writing_comments_body_trimmed_check,
  drop constraint writing_comments_body_line_limit_check,
  drop constraint writing_comments_guest_name_length_check,
  drop constraint writing_comments_guest_name_trimmed_check,
  drop constraint writing_comments_guest_name_single_line_check,
  drop constraint writing_comments_identity_consistency_check;

alter table public.bts_account_profiles
  add column deleted_at timestamptz,
  alter column user_id drop not null;

create function public.prepare_bts_account_profile_unlink()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  if old.user_id is null and new.user_id is not null then
    raise exception using message = 'BTS_PROFILE_REATTACH_FORBIDDEN', errcode = 'P0001';
  end if;

  if old.user_id is not null and new.user_id is null then
    new.deleted_at := coalesce(new.deleted_at, clock_timestamp());
    new.display_name := 'Deleted account';
    new.updated_at := clock_timestamp();
  end if;

  return new;
end;
$$;

revoke all on function public.prepare_bts_account_profile_unlink()
  from public, anon, authenticated, service_role;

create trigger prepare_bts_account_profile_unlink_before_update
before update of user_id on public.bts_account_profiles
for each row
execute function public.prepare_bts_account_profile_unlink();

alter table public.bts_account_profiles
  drop constraint bts_account_profiles_user_id_fkey,
  add constraint bts_account_profiles_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete set null,
  add constraint bts_account_profiles_lifecycle_check check (
    (user_id is not null and deleted_at is null)
    or (user_id is null and deleted_at is not null)
  ) not valid;

alter table public.bts_account_profiles
  validate constraint bts_account_profiles_lifecycle_check;

-- Preserve the 1B.1 RPC shape during phased deployment while making account
-- unlinking private immediately. Tombstones require the viewer-aware v2 shape.
create or replace function public.list_public_writing_comments(p_article_id uuid)
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
    case
      when comment.identity_kind = 'account' and profile.deleted_at is not null then 'Deleted account'
      else comment.guest_display_name
    end,
    comment.body,
    comment.created_at,
    case
      when comment.identity_kind = 'account' and profile.deleted_at is null then exists (
        select 1
        from public.admin_users as admin
        where admin.user_id = profile.user_id
          and admin.role = 'admin'
          and admin.is_active = true
      )
      else false
    end
  from public.writing_comments as comment
  left join public.bts_account_profiles as profile on profile.id = comment.account_profile_id
  where comment.article_id = p_article_id
    and comment.author_deleted_at is null
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

create function public.list_public_writing_comments_for_viewer(
  p_article_id uuid,
  p_actor_user_id uuid
)
returns table (
  id uuid,
  identity_kind text,
  display_name text,
  body text,
  created_at timestamptz,
  is_edited boolean,
  is_author_deleted boolean,
  is_author boolean,
  can_edit boolean,
  can_delete boolean,
  owner_version timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
  with viewer_profile as (
    select profile.id
    from public.bts_account_profiles as profile
    where profile.user_id = p_actor_user_id
      and profile.deleted_at is null
  )
  select
    comment.id,
    comment.identity_kind::text,
    case
      when comment.author_deleted_at is not null then null
      when comment.identity_kind = 'account' and owner_profile.deleted_at is not null then 'Deleted account'
      else comment.guest_display_name
    end,
    case when comment.author_deleted_at is not null then null else comment.body end,
    comment.created_at,
    comment.author_deleted_at is null and comment.edited_at is not null,
    comment.author_deleted_at is not null,
    case
      when comment.author_deleted_at is not null then false
      when comment.identity_kind = 'account' and owner_profile.deleted_at is null then exists (
        select 1
        from public.admin_users as admin
        where admin.user_id = owner_profile.user_id
          and admin.role = 'admin'
          and admin.is_active = true
      )
      else false
    end,
    coalesce((
      comment.author_deleted_at is null
      and comment.identity_kind = 'account'
      and comment.moderation_status = 'visible'
      and comment.account_profile_id = (select viewer_profile.id from viewer_profile)
      and coalesce(discussion.state, 'open'::public.writing_discussion_state) <> 'disabled'
    ), false),
    coalesce((
      comment.author_deleted_at is null
      and comment.identity_kind = 'account'
      and comment.moderation_status = 'visible'
      and comment.account_profile_id = (select viewer_profile.id from viewer_profile)
      and coalesce(discussion.state, 'open'::public.writing_discussion_state) <> 'disabled'
    ), false),
    case
      when comment.author_deleted_at is null
        and comment.identity_kind = 'account'
        and comment.moderation_status = 'visible'
        and comment.account_profile_id = (select viewer_profile.id from viewer_profile)
        and coalesce(discussion.state, 'open'::public.writing_discussion_state) <> 'disabled'
      then comment.updated_at
      else null
    end
  from public.writing_comments as comment
  join public.writing_articles as article on article.id = comment.article_id
  left join public.writing_discussions as discussion on discussion.article_id = comment.article_id
  left join public.bts_account_profiles as owner_profile on owner_profile.id = comment.account_profile_id
  where comment.article_id = p_article_id
    and article.status = 'published'
    and article.published_at is not null
    and comment.moderation_status = 'visible'
    and comment.parent_comment_id is null
    and (
      comment.author_deleted_at is null
      or exists (
        select 1
        from public.writing_comments as child
        where child.article_id = comment.article_id
          and child.parent_comment_id = comment.id
          and child.moderation_status = 'visible'
      )
    )
  order by comment.created_at asc, comment.id asc
  limit 50
$$;

create function public.edit_own_writing_comment(
  p_actor_user_id uuid,
  p_comment_id uuid,
  p_expected_updated_at timestamptz,
  p_body text
)
returns timestamptz
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_article_id uuid;
  v_article_status text;
  v_article_published_at timestamptz;
  v_discussion_state public.writing_discussion_state := 'open';
  v_profile_id uuid;
  v_identity_kind public.writing_comment_identity_kind;
  v_owner_profile_id uuid;
  v_moderation_status public.writing_comment_moderation_status;
  v_author_deleted_at timestamptz;
  v_edited_at timestamptz;
  v_updated_at timestamptz;
  v_existing_body text;
begin
  if p_actor_user_id is null
    or p_comment_id is null
    or p_expected_updated_at is null
    or p_body is null
    or char_length(p_body) not between 2 and 3000
    or p_body <> btrim(p_body)
    or char_length(p_body) - char_length(replace(p_body, chr(10), '')) > 59
    or p_body ~ U&'[\0001-\0008\000B\000C\000E-\001F\007F-\009F\061C\200E\200F\202A-\202E\2066-\2069]' then
    raise exception using message = 'WRITING_COMMENT_OWNER_INVALID_INPUT', errcode = 'P0001';
  end if;

  select profile.id into v_profile_id
  from public.bts_account_profiles as profile
  where profile.user_id = p_actor_user_id
    and profile.deleted_at is null;
  if not found then
    raise exception using message = 'WRITING_COMMENT_OWNER_UNAUTHORIZED', errcode = 'P0001';
  end if;

  -- Owner mutation lock order is comment advisory lock, discussion advisory
  -- lock, article row, discussion row, active profile row, comment row.
  -- Future reply insertion must share-lock its parent comment after taking the
  -- same comment advisory lock. Future moderation must use this order too.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('writing-comment-mutation:' || p_comment_id::text, 0)
  );

  select comment.article_id into v_article_id
  from public.writing_comments as comment
  where comment.id = p_comment_id;
  if not found then
    raise exception using message = 'WRITING_COMMENT_OWNER_UNAVAILABLE', errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('writing-discussion:' || v_article_id::text, 0)
  );

  select article.status, article.published_at
    into v_article_status, v_article_published_at
  from public.writing_articles as article
  where article.id = v_article_id
  for update;
  if not found or v_article_status <> 'published' or v_article_published_at is null then
    raise exception using message = 'WRITING_COMMENT_ARTICLE_UNAVAILABLE', errcode = 'P0001';
  end if;

  select discussion.state into v_discussion_state
  from public.writing_discussions as discussion
  where discussion.article_id = v_article_id
  for share;
  v_discussion_state := coalesce(v_discussion_state, 'open'::public.writing_discussion_state);
  if v_discussion_state = 'disabled' then
    raise exception using message = 'WRITING_COMMENT_DISCUSSION_DISABLED', errcode = 'P0001';
  end if;

  select profile.id into v_profile_id
  from public.bts_account_profiles as profile
  where profile.id = v_profile_id
    and profile.user_id = p_actor_user_id
    and profile.deleted_at is null
  for share;
  if not found then
    raise exception using message = 'WRITING_COMMENT_OWNER_UNAUTHORIZED', errcode = 'P0001';
  end if;

  select
    comment.identity_kind,
    comment.account_profile_id,
    comment.moderation_status,
    comment.author_deleted_at,
    comment.edited_at,
    comment.updated_at,
    comment.body
  into
    v_identity_kind,
    v_owner_profile_id,
    v_moderation_status,
    v_author_deleted_at,
    v_edited_at,
    v_updated_at,
    v_existing_body
  from public.writing_comments as comment
  where comment.id = p_comment_id
    and comment.article_id = v_article_id
  for update;

  if not found
    or v_identity_kind <> 'account'
    or v_owner_profile_id is distinct from v_profile_id
    or v_moderation_status <> 'visible'
    or v_author_deleted_at is not null then
    raise exception using message = 'WRITING_COMMENT_OWNER_UNAVAILABLE', errcode = 'P0001';
  end if;
  if v_updated_at is distinct from p_expected_updated_at then
    raise exception using message = 'WRITING_COMMENT_OWNER_STALE', errcode = 'P0001';
  end if;
  if v_existing_body = p_body then
    raise exception using message = 'WRITING_COMMENT_OWNER_NO_CHANGE', errcode = 'P0001';
  end if;
  if v_edited_at is not null and v_edited_at > v_now - interval '10 seconds' then
    raise exception using message = 'WRITING_COMMENT_OWNER_EDIT_COOLDOWN', errcode = 'P0001';
  end if;

  update public.writing_comments as comment
  set body = p_body,
      edited_at = v_now,
      updated_at = v_now
  where comment.id = p_comment_id
  returning comment.updated_at into v_updated_at;

  return v_updated_at;
end;
$$;

create function public.delete_own_writing_comment(
  p_actor_user_id uuid,
  p_comment_id uuid,
  p_expected_updated_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_article_id uuid;
  v_article_status text;
  v_article_published_at timestamptz;
  v_discussion_state public.writing_discussion_state := 'open';
  v_profile_id uuid;
  v_identity_kind public.writing_comment_identity_kind;
  v_owner_profile_id uuid;
  v_moderation_status public.writing_comment_moderation_status;
  v_author_deleted_at timestamptz;
  v_updated_at timestamptz;
  v_has_children boolean;
begin
  if p_actor_user_id is null or p_comment_id is null or p_expected_updated_at is null then
    raise exception using message = 'WRITING_COMMENT_OWNER_INVALID_INPUT', errcode = 'P0001';
  end if;

  select profile.id into v_profile_id
  from public.bts_account_profiles as profile
  where profile.user_id = p_actor_user_id
    and profile.deleted_at is null;
  if not found then
    raise exception using message = 'WRITING_COMMENT_OWNER_UNAUTHORIZED', errcode = 'P0001';
  end if;

  -- Keep this lock order identical to edit_own_writing_comment. The final
  -- FOR UPDATE also conflicts with the parent key lock used by a future reply,
  -- so a child can never be silently cascaded or orphaned during deletion.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('writing-comment-mutation:' || p_comment_id::text, 0)
  );

  select comment.article_id into v_article_id
  from public.writing_comments as comment
  where comment.id = p_comment_id;
  if not found then
    return 'absent';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('writing-discussion:' || v_article_id::text, 0)
  );

  select article.status, article.published_at
    into v_article_status, v_article_published_at
  from public.writing_articles as article
  where article.id = v_article_id
  for update;
  if not found or v_article_status <> 'published' or v_article_published_at is null then
    raise exception using message = 'WRITING_COMMENT_ARTICLE_UNAVAILABLE', errcode = 'P0001';
  end if;

  select discussion.state into v_discussion_state
  from public.writing_discussions as discussion
  where discussion.article_id = v_article_id
  for share;
  v_discussion_state := coalesce(v_discussion_state, 'open'::public.writing_discussion_state);
  if v_discussion_state = 'disabled' then
    raise exception using message = 'WRITING_COMMENT_DISCUSSION_DISABLED', errcode = 'P0001';
  end if;

  select profile.id into v_profile_id
  from public.bts_account_profiles as profile
  where profile.id = v_profile_id
    and profile.user_id = p_actor_user_id
    and profile.deleted_at is null
  for share;
  if not found then
    raise exception using message = 'WRITING_COMMENT_OWNER_UNAUTHORIZED', errcode = 'P0001';
  end if;

  select
    comment.identity_kind,
    comment.account_profile_id,
    comment.moderation_status,
    comment.author_deleted_at,
    comment.updated_at
  into
    v_identity_kind,
    v_owner_profile_id,
    v_moderation_status,
    v_author_deleted_at,
    v_updated_at
  from public.writing_comments as comment
  where comment.id = p_comment_id
    and comment.article_id = v_article_id
  for update;

  if not found then
    return 'absent';
  end if;
  if v_author_deleted_at is not null then
    return 'tombstoned';
  end if;
  if v_identity_kind <> 'account'
    or v_owner_profile_id is distinct from v_profile_id
    or v_moderation_status <> 'visible' then
    raise exception using message = 'WRITING_COMMENT_OWNER_UNAVAILABLE', errcode = 'P0001';
  end if;
  if v_updated_at is distinct from p_expected_updated_at then
    raise exception using message = 'WRITING_COMMENT_OWNER_STALE', errcode = 'P0001';
  end if;

  select exists (
    select 1
    from public.writing_comments as child
    where child.article_id = v_article_id
      and child.parent_comment_id = p_comment_id
  ) into v_has_children;

  if not v_has_children then
    delete from public.writing_comments as comment
    where comment.id = p_comment_id;
    return 'deleted';
  end if;

  update public.writing_comments as comment
  set body = '',
      guest_display_name = '',
      account_profile_id = null,
      author_deleted_at = v_now,
      updated_at = v_now
  where comment.id = p_comment_id;

  return 'tombstoned';
end;
$$;

revoke all on function public.list_public_writing_comments_for_viewer(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.list_public_writing_comments(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.edit_own_writing_comment(uuid, uuid, timestamptz, text)
  from public, anon, authenticated, service_role;
revoke all on function public.delete_own_writing_comment(uuid, uuid, timestamptz)
  from public, anon, authenticated, service_role;

grant execute on function public.list_public_writing_comments_for_viewer(uuid, uuid)
  to service_role;
grant execute on function public.list_public_writing_comments(uuid)
  to service_role;
grant execute on function public.edit_own_writing_comment(uuid, uuid, timestamptz, text)
  to service_role;
grant execute on function public.delete_own_writing_comment(uuid, uuid, timestamptz)
  to service_role;

notify pgrst, 'reload schema';
