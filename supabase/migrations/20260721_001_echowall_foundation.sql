create extension if not exists pgcrypto with schema extensions;

create type public.echo_status as enum (
  'pending',
  'approved',
  'rejected',
  'hidden',
  'deleted'
);

create type public.echo_category as enum (
  'thought',
  'feedback',
  'reaction',
  'message'
);

create table public.echoes (
  id uuid primary key default extensions.gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 40),
  message text not null check (char_length(message) between 10 and 500),
  category public.echo_category,
  status public.echo_status not null default 'pending',
  deletion_token_hash text not null unique,
  created_at timestamptz not null default clock_timestamp(),
  approved_at timestamptz,
  decided_at timestamptz,
  retention_until timestamptz,
  deleted_at timestamptz
);

create index echoes_status_approved_at_idx
  on public.echoes (status, approved_at desc);
create index echoes_status_created_at_idx
  on public.echoes (status, created_at desc);
create index echoes_retention_until_idx
  on public.echoes (retention_until)
  where retention_until is not null;

create table public.echo_contacts (
  echo_id uuid primary key references public.echoes (id) on delete cascade,
  email text not null check (char_length(email) <= 254),
  created_at timestamptz not null default clock_timestamp(),
  retention_until timestamptz
);

create index echo_contacts_retention_until_idx
  on public.echo_contacts (retention_until)
  where retention_until is not null;

create table public.echo_rate_limits (
  id bigint generated always as identity primary key,
  network_hash text not null,
  email_hash text,
  message_hash text not null,
  form_token_hash text not null unique,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  abuse_until timestamptz
);

create index echo_rate_limits_network_created_idx
  on public.echo_rate_limits (network_hash, created_at desc);
create index echo_rate_limits_email_created_idx
  on public.echo_rate_limits (email_hash, created_at desc)
  where email_hash is not null;
create index echo_rate_limits_message_network_created_idx
  on public.echo_rate_limits (message_hash, network_hash, created_at desc);
create index echo_rate_limits_message_email_created_idx
  on public.echo_rate_limits (message_hash, email_hash, created_at desc)
  where email_hash is not null;
create index echo_rate_limits_expires_at_idx
  on public.echo_rate_limits (expires_at);

create table public.echo_moderation_events (
  id bigint generated always as identity primary key,
  echo_id uuid not null references public.echoes (id) on delete cascade,
  actor_id uuid,
  action text not null,
  previous_status public.echo_status,
  new_status public.echo_status,
  reason text,
  created_at timestamptz not null default clock_timestamp(),
  retention_until timestamptz not null default (clock_timestamp() + interval '12 months')
);

create index echo_moderation_events_echo_created_idx
  on public.echo_moderation_events (echo_id, created_at desc);
create index echo_moderation_events_retention_until_idx
  on public.echo_moderation_events (retention_until);

alter table public.echoes enable row level security;
alter table public.echo_contacts enable row level security;
alter table public.echo_rate_limits enable row level security;
alter table public.echo_moderation_events enable row level security;

revoke all on table public.echoes from public, anon, authenticated;
revoke all on table public.echo_contacts from public, anon, authenticated;
revoke all on table public.echo_rate_limits from public, anon, authenticated;
revoke all on table public.echo_moderation_events from public, anon, authenticated;
revoke all on sequence public.echo_rate_limits_id_seq from public, anon, authenticated;
revoke all on sequence public.echo_moderation_events_id_seq from public, anon, authenticated;

create or replace function public.submit_echo(
  p_display_name text,
  p_message text,
  p_category public.echo_category,
  p_email text,
  p_network_hash text,
  p_email_hash text,
  p_message_hash text,
  p_form_token_hash text,
  p_deletion_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_echo_id uuid;
begin
  if p_network_hash is null or p_network_hash = ''
    or p_message_hash is null or p_message_hash = ''
    or p_form_token_hash is null or p_form_token_hash = ''
    or p_deletion_token_hash is null or p_deletion_token_hash = '' then
    raise exception using message = 'ECHOWALL_INVALID_INPUT', errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_network_hash, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_message_hash || ':' || p_network_hash, 0)
  );
  if p_email_hash is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(p_message_hash || ':' || p_email_hash, 0)
    );
  end if;

  if exists (
    select 1
    from public.echo_rate_limits
    where form_token_hash = p_form_token_hash
  ) then
    raise exception using message = 'ECHOWALL_TOKEN_REPLAY', errcode = 'P0001';
  end if;

  if (
    select count(*)
    from public.echo_rate_limits
    where network_hash = p_network_hash
      and created_at > v_now - interval '15 minutes'
  ) >= 3 then
    raise exception using message = 'ECHOWALL_RATE_15', errcode = 'P0001';
  end if;

  if (
    select count(*)
    from public.echo_rate_limits
    where network_hash = p_network_hash
      and created_at > v_now - interval '24 hours'
  ) >= 10 then
    raise exception using message = 'ECHOWALL_RATE_24', errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.echo_rate_limits
    where message_hash = p_message_hash
      and created_at > v_now - interval '24 hours'
      and (
        network_hash = p_network_hash
        or (
          p_email_hash is not null
          and email_hash = p_email_hash
        )
      )
  ) then
    raise exception using message = 'ECHOWALL_DUPLICATE', errcode = 'P0001';
  end if;

  insert into public.echoes (
    display_name,
    message,
    category,
    deletion_token_hash,
    retention_until
  ) values (
    p_display_name,
    p_message,
    p_category,
    p_deletion_token_hash,
    v_now + interval '90 days'
  )
  returning id into v_echo_id;

  if p_email is not null then
    insert into public.echo_contacts (echo_id, email, retention_until)
    values (v_echo_id, p_email, v_now + interval '90 days');
  end if;

  insert into public.echo_rate_limits (
    network_hash,
    email_hash,
    message_hash,
    form_token_hash,
    expires_at
  ) values (
    p_network_hash,
    p_email_hash,
    p_message_hash,
    p_form_token_hash,
    v_now + interval '48 hours'
  );

  return v_echo_id;
end;
$$;

revoke all on function public.submit_echo(
  text,
  text,
  public.echo_category,
  text,
  text,
  text,
  text,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.submit_echo(
  text,
  text,
  public.echo_category,
  text,
  text,
  text,
  text,
  text,
  text
) to service_role;
