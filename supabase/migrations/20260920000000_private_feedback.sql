create type public.feedback_status as enum (
  'new',
  'read',
  'archived'
);

create type public.feedback_source_context as enum (
  'home',
  'writing',
  'fyns',
  'world-map',
  'life-alignment',
  'projects',
  'people',
  'discovery',
  'other'
);

create table public.private_feedback (
  id uuid primary key default extensions.gen_random_uuid(),
  message text not null
    check (
      message = pg_catalog.btrim(message)
      and pg_catalog.char_length(message) between 1 and 4000
    ),
  name text
    check (
      name is null
      or (
        name = pg_catalog.btrim(name)
        and pg_catalog.char_length(name) between 1 and 80
      )
    ),
  source_context public.feedback_source_context not null,
  status public.feedback_status not null default 'new',
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (updated_at >= created_at)
);

create index private_feedback_status_created_idx
  on public.private_feedback (status, created_at desc, id desc);

create table public.feedback_submission_limits (
  id bigint generated always as identity primary key,
  network_hash text not null check (network_hash ~ '^[0-9a-f]{64}$'),
  form_token_hash text not null unique check (form_token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  expires_at timestamptz not null,
  check (expires_at > created_at)
);

create index feedback_submission_limits_network_created_idx
  on public.feedback_submission_limits (network_hash, created_at desc);
create index feedback_submission_limits_expires_idx
  on public.feedback_submission_limits (expires_at);

alter table public.private_feedback enable row level security;
alter table public.private_feedback force row level security;
alter table public.feedback_submission_limits enable row level security;
alter table public.feedback_submission_limits force row level security;

revoke all on table public.private_feedback from public, anon, authenticated, service_role;
revoke all on table public.feedback_submission_limits from public, anon, authenticated, service_role;
revoke all on sequence public.feedback_submission_limits_id_seq from public, anon, authenticated, service_role;

create or replace function public.submit_private_feedback(
  p_message text,
  p_name text,
  p_source_context public.feedback_source_context,
  p_network_hash text,
  p_form_token_hash text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if p_message is null
    or p_message <> pg_catalog.btrim(p_message)
    or pg_catalog.char_length(p_message) not between 1 and 4000
    or (
      p_name is not null
      and (
        p_name <> pg_catalog.btrim(p_name)
        or pg_catalog.char_length(p_name) not between 1 and 80
      )
    )
    or p_source_context is null
    or p_network_hash is null
    or p_network_hash !~ '^[0-9a-f]{64}$'
    or p_form_token_hash is null
    or p_form_token_hash !~ '^[0-9a-f]{64}$'
  then
    raise exception using message = 'FEEDBACK_INVALID_INPUT', errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_network_hash, 0)
  );

  delete from public.feedback_submission_limits as submission_limit
  where submission_limit.expires_at <= v_now;

  if exists (
    select 1
    from public.feedback_submission_limits as submission_limit
    where submission_limit.form_token_hash = p_form_token_hash
  ) then
    raise exception using message = 'FEEDBACK_TOKEN_REPLAY', errcode = 'P0001';
  end if;

  if (
    select pg_catalog.count(*)
    from public.feedback_submission_limits as submission_limit
    where submission_limit.network_hash = p_network_hash
      and submission_limit.created_at > v_now - interval '15 minutes'
  ) >= 3 then
    raise exception using message = 'FEEDBACK_RATE_15', errcode = 'P0001';
  end if;

  if (
    select pg_catalog.count(*)
    from public.feedback_submission_limits as submission_limit
    where submission_limit.network_hash = p_network_hash
      and submission_limit.created_at > v_now - interval '24 hours'
  ) >= 10 then
    raise exception using message = 'FEEDBACK_RATE_24', errcode = 'P0001';
  end if;

  insert into public.private_feedback (
    message,
    name,
    source_context
  ) values (
    p_message,
    nullif(p_name, ''),
    p_source_context
  );

  insert into public.feedback_submission_limits (
    network_hash,
    form_token_hash,
    expires_at
  ) values (
    p_network_hash,
    p_form_token_hash,
    v_now + interval '48 hours'
  );

  return true;
end;
$$;

create or replace function public.list_private_feedback(
  p_filter text default 'active',
  p_limit integer default 50
)
returns table (
  id uuid,
  name text,
  message_preview text,
  source_context public.feedback_source_context,
  status public.feedback_status,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform public.assert_bts_admin(true);
  if p_filter not in ('active', 'new', 'read', 'archived')
    or p_limit is null
    or p_limit < 1
    or p_limit > 50
  then
    raise exception using message = 'FEEDBACK_ADMIN_INVALID_INPUT', errcode = 'P0001';
  end if;

  return query
  select
    feedback.id,
    feedback.name,
    pg_catalog.left(feedback.message, 240),
    feedback.source_context,
    feedback.status,
    feedback.created_at,
    feedback.updated_at
  from public.private_feedback as feedback
  where
    (p_filter = 'active' and feedback.status in ('new', 'read'))
    or feedback.status::text = p_filter
  order by
    case feedback.status
      when 'new' then 0
      when 'read' then 1
      else 2
    end,
    feedback.created_at desc,
    feedback.id desc
  limit p_limit;
end;
$$;

create or replace function public.get_private_feedback(p_feedback_id uuid)
returns table (
  id uuid,
  name text,
  message text,
  source_context public.feedback_source_context,
  status public.feedback_status,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform public.assert_bts_admin(true);
  if p_feedback_id is null then
    raise exception using message = 'FEEDBACK_ADMIN_INVALID_INPUT', errcode = 'P0001';
  end if;

  return query
  select
    feedback.id,
    feedback.name,
    feedback.message,
    feedback.source_context,
    feedback.status,
    feedback.created_at,
    feedback.updated_at
  from public.private_feedback as feedback
  where feedback.id = p_feedback_id;
end;
$$;

create or replace function public.manage_private_feedback(
  p_feedback_id uuid,
  p_action text,
  p_expected_status public.feedback_status
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_current public.feedback_status;
  v_action text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_action, '')));
  v_new public.feedback_status;
begin
  perform public.assert_bts_admin(true);
  if p_feedback_id is null
    or p_expected_status is null
    or v_action not in ('mark_read', 'archive', 'delete')
  then
    raise exception using message = 'FEEDBACK_ADMIN_INVALID_INPUT', errcode = 'P0001';
  end if;

  select feedback.status
  into v_current
  from public.private_feedback as feedback
  where feedback.id = p_feedback_id
  for update;

  if not found then
    raise exception using message = 'FEEDBACK_ADMIN_NOT_FOUND', errcode = 'P0001';
  end if;
  if v_current <> p_expected_status then
    raise exception using message = 'FEEDBACK_ADMIN_STALE', errcode = 'P0001';
  end if;

  if v_action = 'delete' then
    delete from public.private_feedback as feedback
    where feedback.id = p_feedback_id;
    return 'deleted';
  end if;

  v_new := case
    when v_current = 'new' and v_action = 'mark_read' then 'read'::public.feedback_status
    when v_current in ('new', 'read') and v_action = 'archive' then 'archived'::public.feedback_status
    else null
  end;
  if v_new is null then
    raise exception using message = 'FEEDBACK_ADMIN_INVALID_TRANSITION', errcode = 'P0001';
  end if;

  update public.private_feedback as feedback
  set
    status = v_new,
    updated_at = pg_catalog.clock_timestamp()
  where feedback.id = p_feedback_id;

  return v_new::text;
end;
$$;

revoke all on function public.submit_private_feedback(
  text,
  text,
  public.feedback_source_context,
  text,
  text
) from public, anon, authenticated, service_role;
revoke all on function public.list_private_feedback(text, integer)
  from public, anon, authenticated, service_role;
revoke all on function public.get_private_feedback(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.manage_private_feedback(uuid, text, public.feedback_status)
  from public, anon, authenticated, service_role;

grant execute on function public.submit_private_feedback(
  text,
  text,
  public.feedback_source_context,
  text,
  text
) to service_role;
grant execute on function public.list_private_feedback(text, integer) to authenticated;
grant execute on function public.get_private_feedback(uuid) to authenticated;
grant execute on function public.manage_private_feedback(uuid, text, public.feedback_status) to authenticated;
