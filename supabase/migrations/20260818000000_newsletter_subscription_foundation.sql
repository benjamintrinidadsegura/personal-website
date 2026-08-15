create type public.newsletter_subscription_status as enum (
  'pending',
  'confirmed',
  'unsubscribed',
  'suppressed'
);

create type public.newsletter_subscription_event_type as enum (
  'requested',
  'confirmed',
  'unsubscribed',
  'resubscribe_requested',
  'suppressed'
);

create table public.newsletter_consent_versions (
  version text primary key,
  consent_text_en text not null,
  consent_text_de text not null,
  privacy_version text not null,
  effective_at timestamptz not null default pg_catalog.clock_timestamp(),
  retired_at timestamptz,
  constraint newsletter_consent_versions_version_check
    check (pg_catalog.char_length(version) between 3 and 80 and version = pg_catalog.btrim(version)),
  constraint newsletter_consent_versions_copy_check
    check (
      pg_catalog.char_length(consent_text_en) between 20 and 1000
      and pg_catalog.char_length(consent_text_de) between 20 and 1000
      and pg_catalog.char_length(privacy_version) between 3 and 80
    ),
  constraint newsletter_consent_versions_retirement_check
    check (retired_at is null or retired_at >= effective_at)
);

insert into public.newsletter_consent_versions (
  version,
  consent_text_en,
  consent_text_de,
  privacy_version
) values (
  'newsletter-consent-v1',
  'I consent to receive the bts.online newsletter by email: New Writing and occasional updates from the Digital HQ. No fixed schedule, no spam. I can unsubscribe at any time.',
  'Ich willige ein, den bts.online Newsletter per E-Mail zu erhalten: Neue Texte und gelegentliche Updates aus dem Digital HQ. Kein fester Rhythmus, kein Spam. Ich kann mich jederzeit abmelden.',
  'newsletter-privacy-v1'
);

create table public.newsletter_subscribers (
  id uuid primary key default extensions.gen_random_uuid(),
  email text,
  email_hash text not null unique,
  status public.newsletter_subscription_status not null default 'pending',
  consent_version text not null references public.newsletter_consent_versions (version) on delete restrict,
  confirmation_token_hash text unique,
  confirmation_expires_at timestamptz,
  confirmation_used_at timestamptz,
  unsubscribe_nonce uuid,
  requested_at timestamptz not null default pg_catalog.clock_timestamp(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  suppressed_at timestamptz,
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint newsletter_subscribers_email_hash_check
    check (email_hash ~ '^[0-9a-f]{64}$'),
  constraint newsletter_subscribers_email_check
    check (
      email is null
      or (
        pg_catalog.char_length(email) between 3 and 254
        and email = pg_catalog.lower(pg_catalog.btrim(email))
        and email !~ '[[:cntrl:]]'
        and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      )
    ),
  constraint newsletter_subscribers_confirmation_hash_check
    check (confirmation_token_hash is null or confirmation_token_hash ~ '^[0-9a-f]{64}$'),
  constraint newsletter_subscribers_timestamps_check
    check (
      updated_at >= requested_at
      and (confirmed_at is null or confirmed_at >= requested_at)
      and (unsubscribed_at is null or (confirmed_at is not null and unsubscribed_at >= confirmed_at))
      and (suppressed_at is null or (confirmed_at is not null and suppressed_at >= confirmed_at))
      and (confirmation_used_at is null or confirmation_used_at >= requested_at)
    ),
  constraint newsletter_subscribers_state_check
    check (
      (
        status = 'pending'
        and email is not null
        and confirmation_token_hash is not null
        and confirmation_expires_at is not null
        and confirmation_used_at is null
        and unsubscribe_nonce is null
        and confirmed_at is null
        and unsubscribed_at is null
        and suppressed_at is null
      )
      or (
        status = 'confirmed'
        and email is not null
        and confirmation_used_at is not null
        and confirmed_at is not null
        and unsubscribe_nonce is not null
        and unsubscribed_at is null
        and suppressed_at is null
        and (
          (confirmation_token_hash is null and confirmation_expires_at is null)
          or (confirmation_token_hash is not null and confirmation_expires_at is not null)
        )
      )
      or (
        status = 'unsubscribed'
        and email is null
        and confirmation_token_hash is null
        and confirmation_expires_at is null
        and confirmation_used_at is not null
        and confirmed_at is not null
        and unsubscribe_nonce is not null
        and unsubscribed_at is not null
        and suppressed_at is null
      )
      or (
        status = 'suppressed'
        and email is null
        and confirmation_token_hash is null
        and confirmation_expires_at is null
        and confirmation_used_at is not null
        and confirmed_at is not null
        and unsubscribe_nonce is not null
        and unsubscribed_at is null
        and suppressed_at is not null
      )
    )
);

create index newsletter_subscribers_status_updated_idx
  on public.newsletter_subscribers (status, updated_at desc);
create index newsletter_subscribers_pending_cleanup_idx
  on public.newsletter_subscribers (requested_at)
  where status = 'pending';
create index newsletter_subscribers_confirmation_expiry_idx
  on public.newsletter_subscribers (confirmation_expires_at)
  where confirmation_token_hash is not null;

create table public.newsletter_subscription_events (
  id bigint generated always as identity primary key,
  subscriber_id uuid not null references public.newsletter_subscribers (id) on delete cascade,
  email_hash text not null,
  event_type public.newsletter_subscription_event_type not null,
  consent_version text not null references public.newsletter_consent_versions (version) on delete restrict,
  occurred_at timestamptz not null default pg_catalog.clock_timestamp(),
  retention_until timestamptz,
  constraint newsletter_subscription_events_email_hash_check
    check (email_hash ~ '^[0-9a-f]{64}$'),
  constraint newsletter_subscription_events_retention_check
    check (retention_until is null or retention_until > occurred_at)
);

create index newsletter_subscription_events_subscriber_occurred_idx
  on public.newsletter_subscription_events (subscriber_id, occurred_at desc);
create index newsletter_subscription_events_retention_idx
  on public.newsletter_subscription_events (retention_until)
  where retention_until is not null;

create table public.newsletter_abuse_events (
  id bigint generated always as identity primary key,
  network_hash text not null,
  email_hash text not null,
  form_token_hash text not null unique,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  expires_at timestamptz not null,
  constraint newsletter_abuse_events_hashes_check
    check (
      network_hash ~ '^[0-9a-f]{64}$'
      and email_hash ~ '^[0-9a-f]{64}$'
      and form_token_hash ~ '^[0-9a-f]{64}$'
    ),
  constraint newsletter_abuse_events_expiry_check
    check (expires_at > created_at)
);

create index newsletter_abuse_events_network_created_idx
  on public.newsletter_abuse_events (network_hash, created_at desc);
create index newsletter_abuse_events_email_created_idx
  on public.newsletter_abuse_events (email_hash, created_at desc);
create index newsletter_abuse_events_expires_idx
  on public.newsletter_abuse_events (expires_at);

alter table public.newsletter_consent_versions enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_subscription_events enable row level security;
alter table public.newsletter_abuse_events enable row level security;

revoke all on table public.newsletter_consent_versions from public, anon, authenticated, service_role;
revoke all on table public.newsletter_subscribers from public, anon, authenticated, service_role;
revoke all on table public.newsletter_subscription_events from public, anon, authenticated, service_role;
revoke all on table public.newsletter_abuse_events from public, anon, authenticated, service_role;
revoke all on sequence public.newsletter_subscription_events_id_seq from public, anon, authenticated, service_role;
revoke all on sequence public.newsletter_abuse_events_id_seq from public, anon, authenticated, service_role;

create function public.request_newsletter_subscription(
  p_email text,
  p_email_hash text,
  p_network_hash text,
  p_form_token_hash text,
  p_confirmation_token_hash text,
  p_consent_version text
)
returns table (
  subscriber_id uuid,
  should_send boolean,
  confirmation_expires_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_subscriber_id uuid;
  v_status public.newsletter_subscription_status;
  v_requested_at timestamptz;
  v_should_send boolean := false;
  v_confirmation_expires_at timestamptz;
  v_event_type public.newsletter_subscription_event_type := 'requested';
begin
  if p_email is null
    or p_email <> pg_catalog.lower(pg_catalog.btrim(p_email))
    or pg_catalog.char_length(p_email) not between 3 and 254
    or p_email ~ '[[:cntrl:]]'
    or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_email_hash is null
    or p_email_hash !~ '^[0-9a-f]{64}$'
    or p_network_hash is null
    or p_network_hash !~ '^[0-9a-f]{64}$'
    or p_form_token_hash is null
    or p_form_token_hash !~ '^[0-9a-f]{64}$'
    or p_confirmation_token_hash is null
    or p_confirmation_token_hash !~ '^[0-9a-f]{64}$'
    or p_consent_version is null
    or not exists (
      select 1
      from public.newsletter_consent_versions as consent
      where consent.version = p_consent_version
        and consent.retired_at is null
    ) then
    raise exception using message = 'NEWSLETTER_INVALID_INPUT', errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('newsletter-network:' || p_network_hash, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('newsletter-email:' || p_email_hash, 0)
  );

  if exists (
    select 1 from public.newsletter_abuse_events as event
    where event.form_token_hash = p_form_token_hash
  ) then
    raise exception using message = 'NEWSLETTER_TOKEN_REPLAY', errcode = 'P0001';
  end if;

  if (
    select pg_catalog.count(*)
    from public.newsletter_abuse_events as event
    where event.network_hash = p_network_hash
      and event.created_at > v_now - interval '15 minutes'
  ) >= 3 then
    raise exception using message = 'NEWSLETTER_RATE_15', errcode = 'P0001';
  end if;

  if (
    select pg_catalog.count(*)
    from public.newsletter_abuse_events as event
    where event.network_hash = p_network_hash
      and event.created_at > v_now - interval '24 hours'
  ) >= 10 then
    raise exception using message = 'NEWSLETTER_RATE_24', errcode = 'P0001';
  end if;

  if (
    select pg_catalog.count(*)
    from public.newsletter_abuse_events as event
    where event.email_hash = p_email_hash
      and event.created_at > v_now - interval '24 hours'
  ) >= 3 then
    raise exception using message = 'NEWSLETTER_EMAIL_RATE_24', errcode = 'P0001';
  end if;

  insert into public.newsletter_abuse_events (
    network_hash,
    email_hash,
    form_token_hash,
    expires_at
  ) values (
    p_network_hash,
    p_email_hash,
    p_form_token_hash,
    v_now + interval '48 hours'
  );

  select subscriber.id, subscriber.status, subscriber.requested_at
    into v_subscriber_id, v_status, v_requested_at
  from public.newsletter_subscribers as subscriber
  where subscriber.email_hash = p_email_hash
  for update;

  if not found then
    v_confirmation_expires_at := v_now + interval '24 hours';
    insert into public.newsletter_subscribers (
      email,
      email_hash,
      status,
      consent_version,
      confirmation_token_hash,
      confirmation_expires_at,
      requested_at,
      updated_at
    ) values (
      p_email,
      p_email_hash,
      'pending',
      p_consent_version,
      p_confirmation_token_hash,
      v_confirmation_expires_at,
      v_now,
      v_now
    ) returning id into v_subscriber_id;
    v_should_send := true;
  elsif v_status = 'unsubscribed' then
    v_confirmation_expires_at := v_now + interval '24 hours';
    v_event_type := 'resubscribe_requested';
    update public.newsletter_subscribers as subscriber set
      email = p_email,
      status = 'pending',
      consent_version = p_consent_version,
      confirmation_token_hash = p_confirmation_token_hash,
      confirmation_expires_at = v_confirmation_expires_at,
      confirmation_used_at = null,
      unsubscribe_nonce = null,
      requested_at = v_now,
      confirmed_at = null,
      unsubscribed_at = null,
      suppressed_at = null,
      updated_at = v_now
    where subscriber.id = v_subscriber_id;
    v_should_send := true;
  elsif v_status = 'pending' and v_requested_at <= v_now - interval '15 minutes' then
    v_confirmation_expires_at := v_now + interval '24 hours';
    update public.newsletter_subscribers as subscriber set
      email = p_email,
      consent_version = p_consent_version,
      confirmation_token_hash = p_confirmation_token_hash,
      confirmation_expires_at = v_confirmation_expires_at,
      requested_at = v_now,
      updated_at = v_now
    where subscriber.id = v_subscriber_id;
    v_should_send := true;
  end if;

  if v_should_send then
    insert into public.newsletter_subscription_events (
      subscriber_id,
      email_hash,
      event_type,
      consent_version,
      occurred_at
    ) values (
      v_subscriber_id,
      p_email_hash,
      v_event_type,
      p_consent_version,
      v_now
    );
  end if;

  return query select v_subscriber_id, v_should_send, v_confirmation_expires_at;
end;
$$;

create function public.confirm_newsletter_subscription(
  p_confirmation_token_hash text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_subscriber_id uuid;
  v_email_hash text;
  v_status public.newsletter_subscription_status;
  v_consent_version text;
  v_confirmation_expires_at timestamptz;
  v_confirmation_used_at timestamptz;
begin
  if p_confirmation_token_hash is null
    or p_confirmation_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using message = 'NEWSLETTER_INVALID_INPUT', errcode = 'P0001';
  end if;

  select
    subscriber.id,
    subscriber.email_hash,
    subscriber.status,
    subscriber.consent_version,
    subscriber.confirmation_expires_at,
    subscriber.confirmation_used_at
  into
    v_subscriber_id,
    v_email_hash,
    v_status,
    v_consent_version,
    v_confirmation_expires_at,
    v_confirmation_used_at
  from public.newsletter_subscribers as subscriber
  where subscriber.confirmation_token_hash = p_confirmation_token_hash
  for update;

  if not found then return 'invalid'; end if;
  if v_status = 'confirmed' and v_confirmation_used_at is not null then
    return 'already_confirmed';
  end if;
  if v_status <> 'pending' or v_confirmation_expires_at < v_now then
    return 'invalid';
  end if;

  update public.newsletter_subscribers as subscriber set
    status = 'confirmed',
    confirmation_used_at = v_now,
    unsubscribe_nonce = extensions.gen_random_uuid(),
    confirmed_at = v_now,
    updated_at = v_now
  where subscriber.id = v_subscriber_id;

  insert into public.newsletter_subscription_events (
    subscriber_id,
    email_hash,
    event_type,
    consent_version,
    occurred_at
  ) values (
    v_subscriber_id,
    v_email_hash,
    'confirmed',
    v_consent_version,
    v_now
  );

  return 'confirmed';
end;
$$;

create function public.unsubscribe_newsletter_subscription(
  p_subscriber_id uuid,
  p_unsubscribe_nonce uuid
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_email_hash text;
  v_status public.newsletter_subscription_status;
  v_consent_version text;
begin
  if p_subscriber_id is null or p_unsubscribe_nonce is null then
    raise exception using message = 'NEWSLETTER_INVALID_INPUT', errcode = 'P0001';
  end if;

  select subscriber.email_hash, subscriber.status, subscriber.consent_version
    into v_email_hash, v_status, v_consent_version
  from public.newsletter_subscribers as subscriber
  where subscriber.id = p_subscriber_id
    and subscriber.unsubscribe_nonce = p_unsubscribe_nonce
  for update;

  if not found then return 'invalid'; end if;
  if v_status = 'unsubscribed' then return 'already_unsubscribed'; end if;
  if v_status <> 'confirmed' then return 'invalid'; end if;

  update public.newsletter_subscribers as subscriber set
    email = null,
    status = 'unsubscribed',
    confirmation_token_hash = null,
    confirmation_expires_at = null,
    unsubscribed_at = v_now,
    updated_at = v_now
  where subscriber.id = p_subscriber_id;

  insert into public.newsletter_subscription_events (
    subscriber_id,
    email_hash,
    event_type,
    consent_version,
    occurred_at
  ) values (
    p_subscriber_id,
    v_email_hash,
    'unsubscribed',
    v_consent_version,
    v_now
  );

  return 'unsubscribed';
end;
$$;

create function public.cleanup_expired_newsletter_data()
returns table (pending_deleted bigint, abuse_deleted bigint, token_hashes_cleared bigint)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_pending_deleted bigint;
  v_abuse_deleted bigint;
  v_token_hashes_cleared bigint;
begin
  delete from public.newsletter_subscribers as subscriber
  where subscriber.status = 'pending'
    and subscriber.requested_at < pg_catalog.clock_timestamp() - interval '7 days';
  get diagnostics v_pending_deleted = row_count;

  delete from public.newsletter_abuse_events as event
  where event.expires_at < pg_catalog.clock_timestamp();
  get diagnostics v_abuse_deleted = row_count;

  update public.newsletter_subscribers as subscriber set
    confirmation_token_hash = null,
    confirmation_expires_at = null,
    updated_at = pg_catalog.clock_timestamp()
  where subscriber.status = 'confirmed'
    and subscriber.confirmation_token_hash is not null
    and subscriber.confirmation_expires_at < pg_catalog.clock_timestamp();
  get diagnostics v_token_hashes_cleared = row_count;

  return query select v_pending_deleted, v_abuse_deleted, v_token_hashes_cleared;
end;
$$;

revoke all on function public.request_newsletter_subscription(text, text, text, text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.confirm_newsletter_subscription(text)
  from public, anon, authenticated, service_role;
revoke all on function public.unsubscribe_newsletter_subscription(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.cleanup_expired_newsletter_data()
  from public, anon, authenticated, service_role;

grant execute on function public.request_newsletter_subscription(text, text, text, text, text, text)
  to service_role;
grant execute on function public.confirm_newsletter_subscription(text)
  to service_role;
grant execute on function public.unsubscribe_newsletter_subscription(uuid, uuid)
  to service_role;
grant execute on function public.cleanup_expired_newsletter_data()
  to service_role;

notify pgrst, 'reload schema';
