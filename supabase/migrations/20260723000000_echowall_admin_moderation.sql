create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role = 'admin'),
  is_active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from public, anon, authenticated;

create or replace function public.get_admin_context()
returns table (user_id uuid, role text, is_active boolean)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using message = 'ECHOWALL_ADMIN_UNAUTHORIZED', errcode = 'P0001';
  end if;

  return query
  select au.user_id, au.role, au.is_active
  from public.admin_users as au
  where au.user_id = v_user_id
    and au.role = 'admin'
    and au.is_active = true;

  if not found then
    raise exception using message = 'ECHOWALL_ADMIN_UNAUTHORIZED', errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.assert_echowall_admin(p_require_aal2 boolean)
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
    raise exception using message = 'ECHOWALL_ADMIN_UNAUTHORIZED', errcode = 'P0001';
  end if;
  if p_require_aal2 and v_aal <> 'aal2' then
    raise exception using message = 'ECHOWALL_ADMIN_MFA_REQUIRED', errcode = 'P0001';
  end if;
  return v_user_id;
end;
$$;

create or replace function public.list_echoes_for_moderation(
  p_status public.echo_status default 'pending',
  p_limit integer default 50
)
returns table (
  id uuid,
  display_name text,
  message text,
  category public.echo_category,
  status public.echo_status,
  created_at timestamptz,
  approved_at timestamptz,
  decided_at timestamptz,
  has_private_contact boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  perform public.assert_echowall_admin(true);
  if p_status not in ('pending', 'approved', 'rejected', 'hidden') or p_limit < 1 or p_limit > 50 then
    raise exception using message = 'ECHOWALL_ADMIN_INVALID_INPUT', errcode = 'P0001';
  end if;
  return query
  select e.id, e.display_name, e.message, e.category, e.status,
    e.created_at, e.approved_at, e.decided_at,
    exists (select 1 from public.echo_contacts as ec where ec.echo_id = e.id)
  from public.echoes as e
  where e.status = p_status
  order by e.created_at desc
  limit p_limit;
end;
$$;

create or replace function public.get_echo_private_contact(p_echo_id uuid)
returns table (email text)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  perform public.assert_echowall_admin(true);
  if p_echo_id is null then
    raise exception using message = 'ECHOWALL_ADMIN_INVALID_INPUT', errcode = 'P0001';
  end if;
  return query select ec.email from public.echo_contacts as ec where ec.echo_id = p_echo_id;
end;
$$;

create or replace function public.get_echo_moderation_history(p_echo_id uuid)
returns table (
  action text,
  previous_status public.echo_status,
  new_status public.echo_status,
  reason text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  perform public.assert_echowall_admin(true);
  if p_echo_id is null then
    raise exception using message = 'ECHOWALL_ADMIN_INVALID_INPUT', errcode = 'P0001';
  end if;
  return query
  select eme.action, eme.previous_status, eme.new_status, eme.reason, eme.created_at
  from public.echo_moderation_events as eme
  where eme.echo_id = p_echo_id
  order by eme.created_at desc;
end;
$$;

create or replace function public.moderate_echo(
  p_echo_id uuid,
  p_action text,
  p_expected_status public.echo_status,
  p_reason text default null
)
returns table (new_status public.echo_status, public_changed boolean)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_actor uuid := public.assert_echowall_admin(true);
  v_current public.echo_status;
  v_new public.echo_status;
  v_action text := lower(trim(coalesce(p_action, '')));
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
  v_now timestamptz := clock_timestamp();
  v_public_changed boolean := false;
begin
  if p_echo_id is null or p_expected_status is null
    or v_action not in ('approve', 'reject', 'hide', 'restore', 'delete') then
    raise exception using message = 'ECHOWALL_ADMIN_INVALID_INPUT', errcode = 'P0001';
  end if;
  if char_length(coalesce(v_reason, '')) > 500
    or (v_action in ('reject', 'hide', 'delete') and char_length(coalesce(v_reason, '')) < 5) then
    raise exception using message = 'ECHOWALL_ADMIN_INVALID_REASON', errcode = 'P0001';
  end if;

  select e.status into v_current from public.echoes as e
  where e.id = p_echo_id for update;
  if not found then
    raise exception using message = 'ECHOWALL_ADMIN_NOT_FOUND', errcode = 'P0001';
  end if;
  if v_current <> p_expected_status then
    raise exception using message = 'ECHOWALL_ADMIN_STALE', errcode = 'P0001';
  end if;

  v_new := case
    when v_current = 'pending' and v_action = 'approve' then 'approved'::public.echo_status
    when v_current = 'pending' and v_action = 'reject' then 'rejected'::public.echo_status
    when v_current = 'pending' and v_action = 'delete' then 'deleted'::public.echo_status
    when v_current = 'approved' and v_action = 'hide' then 'hidden'::public.echo_status
    when v_current = 'approved' and v_action = 'delete' then 'deleted'::public.echo_status
    when v_current = 'hidden' and v_action = 'restore' then 'approved'::public.echo_status
    when v_current = 'hidden' and v_action = 'delete' then 'deleted'::public.echo_status
    when v_current = 'rejected' and v_action = 'delete' then 'deleted'::public.echo_status
    else null
  end;
  if v_new is null then
    raise exception using message = 'ECHOWALL_ADMIN_INVALID_TRANSITION', errcode = 'P0001';
  end if;

  v_public_changed := v_new = 'approved' or v_current = 'approved';
  update public.echoes as e set
    status = v_new,
    approved_at = case when v_new = 'approved' then v_now when v_new in ('rejected', 'deleted') then null else e.approved_at end,
    decided_at = v_now,
    deleted_at = case when v_new = 'deleted' then v_now else null end
  where e.id = p_echo_id;

  if v_new = 'deleted' then
    delete from public.echo_contacts as ec where ec.echo_id = p_echo_id;
  end if;

  insert into public.echo_moderation_events (
    echo_id, actor_id, action, previous_status, new_status, reason
  ) values (p_echo_id, v_actor, v_action, v_current, v_new, v_reason);

  return query select v_new, v_public_changed;
end;
$$;

revoke all on function public.assert_echowall_admin(boolean) from public, anon, authenticated;
revoke all on function public.get_admin_context() from public, anon, authenticated;
revoke all on function public.list_echoes_for_moderation(public.echo_status, integer) from public, anon, authenticated;
revoke all on function public.get_echo_private_contact(uuid) from public, anon, authenticated;
revoke all on function public.get_echo_moderation_history(uuid) from public, anon, authenticated;
revoke all on function public.moderate_echo(uuid, text, public.echo_status, text) from public, anon, authenticated;

grant execute on function public.get_admin_context() to authenticated;
grant execute on function public.list_echoes_for_moderation(public.echo_status, integer) to authenticated;
grant execute on function public.get_echo_private_contact(uuid) to authenticated;
grant execute on function public.get_echo_moderation_history(uuid) to authenticated;
grant execute on function public.moderate_echo(uuid, text, public.echo_status, text) to authenticated;
