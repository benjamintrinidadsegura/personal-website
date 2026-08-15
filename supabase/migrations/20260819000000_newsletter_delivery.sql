create type public.newsletter_edition_state as enum ('draft', 'sending', 'sent', 'failed');
create type public.newsletter_delivery_state as enum (
  'pending', 'sending', 'sent', 'failed', 'skipped', 'reconciliation_required'
);
create type public.newsletter_provider_event_type as enum (
  'delivered', 'hard_bounce', 'complaint', 'unsubscribe', 'delivery_failure'
);

create table public.newsletter_editions (
  id uuid primary key default extensions.gen_random_uuid(),
  writing_article_id uuid not null references public.writing_articles (id) on delete restrict,
  article_title text not null,
  article_excerpt text not null,
  canonical_url text not null,
  subject text not null,
  preheader text not null default '',
  introduction text not null default '',
  state public.newsletter_edition_state not null default 'draft',
  version bigint not null default 1,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  send_started_at timestamptz,
  sent_at timestamptz,
  constraint newsletter_editions_snapshot_check check (
    pg_catalog.char_length(article_title) between 3 and 160
    and pg_catalog.char_length(article_excerpt) between 10 and 320
    and pg_catalog.char_length(canonical_url) between 12 and 500
    and canonical_url !~ '[[:cntrl:]]'
    and pg_catalog.char_length(subject) between 3 and 120
    and pg_catalog.char_length(preheader) between 0 and 160
    and pg_catalog.char_length(introduction) between 0 and 600
    and article_title !~ '[[:cntrl:]]'
    and article_excerpt !~ '[[:cntrl:]]'
    and subject !~ '[[:cntrl:]]'
    and preheader !~ '[[:cntrl:]]'
    and introduction !~ '[[:cntrl:]]'
  ),
  constraint newsletter_editions_version_check check (version > 0),
  constraint newsletter_editions_state_timestamps_check check (
    (state = 'draft' and send_started_at is null and sent_at is null)
    or (state in ('sending', 'failed') and send_started_at is not null and sent_at is null)
    or (state = 'sent' and send_started_at is not null and sent_at is not null and sent_at >= send_started_at)
  )
);

create index newsletter_editions_created_idx on public.newsletter_editions (created_at desc);
create index newsletter_editions_writing_idx on public.newsletter_editions (writing_article_id, created_at desc);

create table public.newsletter_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  edition_id uuid not null references public.newsletter_editions (id) on delete restrict,
  subscriber_id uuid not null references public.newsletter_subscribers (id) on delete restrict,
  state public.newsletter_delivery_state not null default 'pending',
  provider_message_reference text,
  failure_code text,
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  unique (edition_id, subscriber_id),
  constraint newsletter_deliveries_provider_reference_check check (
    provider_message_reference is null
    or (pg_catalog.char_length(provider_message_reference) between 1 and 300 and provider_message_reference !~ '[[:cntrl:]]')
  ),
  constraint newsletter_deliveries_failure_check check (
    failure_code is null
    or (pg_catalog.char_length(failure_code) between 1 and 80 and failure_code ~ '^[a-z0-9_]+$')
  ),
  constraint newsletter_deliveries_state_check check (
    (state = 'pending' and claimed_at is null and completed_at is null and provider_message_reference is null and failure_code is null)
    or (state = 'sending' and claimed_at is not null and completed_at is null and provider_message_reference is null and failure_code is null)
    or (state = 'sent' and claimed_at is not null and completed_at is not null and provider_message_reference is not null and failure_code is null)
    or (state in ('failed', 'reconciliation_required') and claimed_at is not null and completed_at is not null and provider_message_reference is null and failure_code is not null)
    or (state = 'skipped' and completed_at is not null and provider_message_reference is null)
  )
);

create unique index newsletter_deliveries_provider_message_unique
  on public.newsletter_deliveries (provider_message_reference)
  where provider_message_reference is not null;
create index newsletter_deliveries_claim_idx
  on public.newsletter_deliveries (edition_id, state, created_at);

create table public.newsletter_provider_events (
  id bigint generated always as identity primary key,
  provider_event_id text not null unique,
  event_type public.newsletter_provider_event_type not null,
  provider_message_reference text not null,
  delivery_id uuid references public.newsletter_deliveries (id) on delete set null,
  subscriber_id uuid references public.newsletter_subscribers (id) on delete set null,
  payload_hash text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default pg_catalog.clock_timestamp(),
  retention_until timestamptz,
  constraint newsletter_provider_events_identifiers_check check (
    pg_catalog.char_length(provider_event_id) between 1 and 300
    and provider_event_id !~ '[[:cntrl:]]'
    and pg_catalog.char_length(provider_message_reference) between 1 and 300
    and provider_message_reference !~ '[[:cntrl:]]'
    and payload_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint newsletter_provider_events_retention_check check (
    retention_until is null or retention_until > received_at
  )
);

create index newsletter_provider_events_message_idx
  on public.newsletter_provider_events (provider_message_reference, occurred_at desc);
create index newsletter_provider_events_retention_idx
  on public.newsletter_provider_events (retention_until)
  where retention_until is not null;

alter table public.newsletter_editions enable row level security;
alter table public.newsletter_deliveries enable row level security;
alter table public.newsletter_provider_events enable row level security;

revoke all on table public.newsletter_editions from public, anon, authenticated, service_role;
revoke all on table public.newsletter_deliveries from public, anon, authenticated, service_role;
revoke all on table public.newsletter_provider_events from public, anon, authenticated, service_role;
revoke all on sequence public.newsletter_provider_events_id_seq from public, anon, authenticated, service_role;

create function public.protect_newsletter_edition_snapshot()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  if (old.state <> 'draft' or new.state <> 'draft') and (
    new.writing_article_id is distinct from old.writing_article_id
    or new.article_title is distinct from old.article_title
    or new.article_excerpt is distinct from old.article_excerpt
    or new.canonical_url is distinct from old.canonical_url
    or new.subject is distinct from old.subject
    or new.preheader is distinct from old.preheader
    or new.introduction is distinct from old.introduction
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  ) then
    raise exception using message = 'NEWSLETTER_EDITION_IMMUTABLE', errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger protect_newsletter_edition_snapshot_before_update
before update on public.newsletter_editions
for each row execute function public.protect_newsletter_edition_snapshot();

create function public.create_newsletter_edition(
  p_writing_article_id uuid,
  p_subject text,
  p_preheader text,
  p_introduction text,
  p_site_origin text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_actor uuid := public.assert_bts_admin(true);
  v_article public.writing_articles%rowtype;
  v_id uuid;
begin
  if p_writing_article_id is null or p_subject is null or p_preheader is null
    or p_introduction is null or p_site_origin is null
    or pg_catalog.char_length(p_subject) not between 3 and 120
    or pg_catalog.char_length(p_preheader) > 160
    or pg_catalog.char_length(p_introduction) > 600
    or p_subject ~ '[[:cntrl:]]' or p_preheader ~ '[[:cntrl:]]' or p_introduction ~ '[[:cntrl:]]'
    or p_site_origin !~ '^(https://[A-Za-z0-9.-]+(:[0-9]+)?|http://localhost(:[0-9]+)?)$'
  then raise exception using message = 'NEWSLETTER_INVALID_INPUT', errcode = 'P0001';
  end if;

  select * into v_article from public.writing_articles as article
  where article.id = p_writing_article_id
    and article.status = 'published'
    and article.slug is not null
    and article.published_at is not null;
  if not found then raise exception using message = 'NEWSLETTER_WRITING_NOT_PUBLISHED', errcode = 'P0001'; end if;

  insert into public.newsletter_editions (
    writing_article_id, article_title, article_excerpt, canonical_url,
    subject, preheader, introduction, created_by
  ) values (
    v_article.id, v_article.title, v_article.excerpt,
    p_site_origin || '/writing/' || v_article.slug,
    p_subject, p_preheader, p_introduction, v_actor
  ) returning id into v_id;
  return v_id;
end;
$$;

create function public.list_newsletter_writing_candidates(p_limit integer default 100)
returns table (id uuid, title text, excerpt text, slug text, published_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform public.assert_bts_admin(true);
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception using message = 'NEWSLETTER_INVALID_INPUT', errcode = 'P0001';
  end if;
  return query select article.id, article.title, article.excerpt, article.slug, article.published_at
  from public.writing_articles as article
  where article.status = 'published' and article.slug is not null and article.published_at is not null
  order by article.published_at desc limit p_limit;
end;
$$;

create function public.list_newsletter_editions(p_limit integer default 50)
returns table (
  id uuid, writing_article_id uuid, article_title text, article_excerpt text,
  canonical_url text, subject text, preheader text, introduction text,
  state public.newsletter_edition_state, version bigint, created_at timestamptz,
  send_started_at timestamptz, sent_at timestamptz, recipient_count bigint,
  sent_count bigint, failed_count bigint, reconciliation_count bigint
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform public.assert_bts_admin(true);
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception using message = 'NEWSLETTER_INVALID_INPUT', errcode = 'P0001';
  end if;
  return query
  select edition.id, edition.writing_article_id, edition.article_title, edition.article_excerpt,
    edition.canonical_url, edition.subject, edition.preheader, edition.introduction,
    edition.state, edition.version, edition.created_at, edition.send_started_at, edition.sent_at,
    pg_catalog.count(delivery.id)::bigint,
    pg_catalog.count(delivery.id) filter (where delivery.state = 'sent')::bigint,
    pg_catalog.count(delivery.id) filter (where delivery.state = 'failed')::bigint,
    pg_catalog.count(delivery.id) filter (where delivery.state = 'reconciliation_required')::bigint
  from public.newsletter_editions as edition
  left join public.newsletter_deliveries as delivery on delivery.edition_id = edition.id
  group by edition.id order by edition.created_at desc limit p_limit;
end;
$$;

create function public.get_newsletter_edition(p_id uuid)
returns table (
  id uuid, writing_article_id uuid, article_title text, article_excerpt text,
  canonical_url text, subject text, preheader text, introduction text,
  state public.newsletter_edition_state, version bigint, created_at timestamptz,
  send_started_at timestamptz, sent_at timestamptz, recipient_count bigint,
  sent_count bigint, failed_count bigint, reconciliation_count bigint
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform public.assert_bts_admin(true);
  if p_id is null then raise exception using message = 'NEWSLETTER_INVALID_INPUT', errcode = 'P0001'; end if;
  return query
  select edition.id, edition.writing_article_id, edition.article_title, edition.article_excerpt,
    edition.canonical_url, edition.subject, edition.preheader, edition.introduction,
    edition.state, edition.version, edition.created_at, edition.send_started_at, edition.sent_at,
    pg_catalog.count(delivery.id)::bigint,
    pg_catalog.count(delivery.id) filter (where delivery.state = 'sent')::bigint,
    pg_catalog.count(delivery.id) filter (where delivery.state = 'failed')::bigint,
    pg_catalog.count(delivery.id) filter (where delivery.state = 'reconciliation_required')::bigint
  from public.newsletter_editions as edition
  left join public.newsletter_deliveries as delivery on delivery.edition_id = edition.id
  where edition.id = p_id group by edition.id;
end;
$$;

create function public.get_newsletter_operational_summary()
returns table (pending bigint, confirmed bigint, unsubscribed bigint, suppressed bigint)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform public.assert_bts_admin(true);
  return query select
    pg_catalog.count(*) filter (where subscriber.status = 'pending')::bigint,
    pg_catalog.count(*) filter (where subscriber.status = 'confirmed')::bigint,
    pg_catalog.count(*) filter (where subscriber.status = 'unsubscribed')::bigint,
    pg_catalog.count(*) filter (where subscriber.status = 'suppressed')::bigint
  from public.newsletter_subscribers as subscriber;
end;
$$;

create function public.begin_newsletter_send(p_edition_id uuid, p_expected_version bigint)
returns table (version bigint, recipient_count bigint)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_state public.newsletter_edition_state;
  v_version bigint;
  v_count bigint;
begin
  perform public.assert_bts_admin(true);
  if p_edition_id is null or p_expected_version is null or p_expected_version < 1 then
    raise exception using message = 'NEWSLETTER_INVALID_INPUT', errcode = 'P0001';
  end if;
  select edition.state, edition.version into v_state, v_version
  from public.newsletter_editions as edition where edition.id = p_edition_id for update;
  if not found or v_version <> p_expected_version then
    raise exception using message = 'NEWSLETTER_STALE_OR_MISSING', errcode = 'P0001';
  end if;
  if v_state not in ('draft', 'sending') then
    raise exception using message = 'NEWSLETTER_SEND_NOT_ALLOWED', errcode = 'P0001';
  end if;
  if v_state = 'draft' then
    insert into public.newsletter_deliveries (edition_id, subscriber_id)
    select p_edition_id, subscriber.id from public.newsletter_subscribers as subscriber
    where subscriber.status = 'confirmed' and subscriber.email is not null and subscriber.unsubscribe_nonce is not null
    on conflict (edition_id, subscriber_id) do nothing;
    get diagnostics v_count = row_count;
    if v_count = 0 then raise exception using message = 'NEWSLETTER_NO_ELIGIBLE_RECIPIENTS', errcode = 'P0001'; end if;
  end if;
  update public.newsletter_editions as edition set
    state = 'sending', send_started_at = pg_catalog.coalesce(edition.send_started_at, pg_catalog.clock_timestamp()),
    version = edition.version + 1
  where edition.id = p_edition_id returning edition.version into v_version;
  select pg_catalog.count(*) into v_count from public.newsletter_deliveries as delivery
  where delivery.edition_id = p_edition_id;
  return query select v_version, v_count;
end;
$$;

create function public.claim_newsletter_delivery(p_edition_id uuid)
returns table (
  delivery_id uuid, subscriber_id uuid, email text, unsubscribe_nonce uuid,
  subject text, preheader text, introduction text, article_title text,
  article_excerpt text, canonical_url text
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_delivery_id uuid;
  v_subscriber_id uuid;
  v_email text;
  v_nonce uuid;
begin
  perform public.assert_bts_admin(true);
  if p_edition_id is null or not exists (
    select 1 from public.newsletter_editions as edition where edition.id = p_edition_id and edition.state = 'sending'
  ) then raise exception using message = 'NEWSLETTER_SEND_NOT_ALLOWED', errcode = 'P0001'; end if;

  loop
    select delivery.id, delivery.subscriber_id into v_delivery_id, v_subscriber_id
    from public.newsletter_deliveries as delivery
    where delivery.edition_id = p_edition_id and delivery.state = 'pending'
    order by delivery.created_at, delivery.id for update skip locked limit 1;
    if not found then return; end if;
    select subscriber.email, subscriber.unsubscribe_nonce into v_email, v_nonce
    from public.newsletter_subscribers as subscriber
    where subscriber.id = v_subscriber_id and subscriber.status = 'confirmed'
      and subscriber.email is not null and subscriber.unsubscribe_nonce is not null;
    if found then
      update public.newsletter_deliveries as delivery set state = 'sending', claimed_at = pg_catalog.clock_timestamp()
      where delivery.id = v_delivery_id;
      return query select v_delivery_id, v_subscriber_id, v_email, v_nonce,
        edition.subject, edition.preheader, edition.introduction, edition.article_title,
        edition.article_excerpt, edition.canonical_url
      from public.newsletter_editions as edition where edition.id = p_edition_id;
      return;
    end if;
    update public.newsletter_deliveries as delivery set
      state = 'skipped', completed_at = pg_catalog.clock_timestamp(), failure_code = 'subscriber_ineligible'
    where delivery.id = v_delivery_id;
  end loop;
end;
$$;

create function public.recheck_newsletter_delivery_eligibility(p_delivery_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare v_eligible boolean;
begin
  perform public.assert_bts_admin(true);
  select subscriber.status = 'confirmed' and subscriber.email is not null and subscriber.unsubscribe_nonce is not null
    into v_eligible
  from public.newsletter_deliveries as delivery
  join public.newsletter_subscribers as subscriber on subscriber.id = delivery.subscriber_id
  where delivery.id = p_delivery_id and delivery.state = 'sending';
  return pg_catalog.coalesce(v_eligible, false);
end;
$$;

create function public.complete_newsletter_delivery(
  p_delivery_id uuid,
  p_outcome public.newsletter_delivery_state,
  p_provider_message_reference text,
  p_failure_code text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform public.assert_bts_admin(true);
  if p_delivery_id is null or p_outcome not in ('sent', 'failed', 'skipped', 'reconciliation_required')
    or (p_outcome = 'sent' and (p_provider_message_reference is null or p_failure_code is not null))
    or (p_outcome in ('failed', 'reconciliation_required') and (p_provider_message_reference is not null or p_failure_code is null))
    or (p_provider_message_reference is not null and (pg_catalog.char_length(p_provider_message_reference) not between 1 and 300 or p_provider_message_reference ~ '[[:cntrl:]]'))
    or (p_failure_code is not null and (pg_catalog.char_length(p_failure_code) not between 1 and 80 or p_failure_code !~ '^[a-z0-9_]+$'))
  then raise exception using message = 'NEWSLETTER_INVALID_INPUT', errcode = 'P0001'; end if;
  update public.newsletter_deliveries as delivery set
    state = p_outcome, provider_message_reference = p_provider_message_reference,
    failure_code = p_failure_code, completed_at = pg_catalog.clock_timestamp()
  where delivery.id = p_delivery_id and delivery.state = 'sending';
  return found;
end;
$$;

create function public.finish_newsletter_send(p_edition_id uuid)
returns public.newsletter_edition_state
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare v_state public.newsletter_edition_state;
begin
  perform public.assert_bts_admin(true);
  select edition.state into v_state from public.newsletter_editions as edition
  where edition.id = p_edition_id for update;
  if not found or v_state <> 'sending' then return v_state; end if;
  if exists (select 1 from public.newsletter_deliveries as delivery where delivery.edition_id = p_edition_id and delivery.state in ('pending', 'sending')) then
    return 'sending';
  end if;
  if exists (select 1 from public.newsletter_deliveries as delivery where delivery.edition_id = p_edition_id and delivery.state in ('failed', 'reconciliation_required')) then
    v_state := 'failed';
  else v_state := 'sent';
  end if;
  update public.newsletter_editions as edition set state = v_state,
    sent_at = case when v_state = 'sent' then pg_catalog.clock_timestamp() else null end,
    version = edition.version + 1 where edition.id = p_edition_id;
  return v_state;
end;
$$;

create function public.lookup_newsletter_subscriber(p_email_hash text)
returns table (email text, status public.newsletter_subscription_status, requested_at timestamptz, confirmed_at timestamptz, updated_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform public.assert_bts_admin(true);
  if p_email_hash is null or p_email_hash !~ '^[0-9a-f]{64}$' then
    raise exception using message = 'NEWSLETTER_INVALID_INPUT', errcode = 'P0001';
  end if;
  return query select subscriber.email, subscriber.status, subscriber.requested_at, subscriber.confirmed_at, subscriber.updated_at
  from public.newsletter_subscribers as subscriber where subscriber.email_hash = p_email_hash;
end;
$$;

create function public.suppress_newsletter_subscriber(p_email_hash text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_id uuid;
  v_consent_version text;
begin
  perform public.assert_bts_admin(true);
  if p_email_hash is null or p_email_hash !~ '^[0-9a-f]{64}$' then
    raise exception using message = 'NEWSLETTER_INVALID_INPUT', errcode = 'P0001';
  end if;
  select subscriber.id, subscriber.consent_version into v_id, v_consent_version
  from public.newsletter_subscribers as subscriber
  where subscriber.email_hash = p_email_hash and subscriber.status = 'confirmed' for update;
  if not found then return 'not_eligible'; end if;
  update public.newsletter_subscribers as subscriber set email = null, status = 'suppressed',
    confirmation_token_hash = null, confirmation_expires_at = null,
    suppressed_at = pg_catalog.clock_timestamp(), updated_at = pg_catalog.clock_timestamp()
  where subscriber.id = v_id;
  insert into public.newsletter_subscription_events (subscriber_id, email_hash, event_type, consent_version)
  values (v_id, p_email_hash, 'suppressed', v_consent_version);
  return 'suppressed';
end;
$$;

create function public.ingest_newsletter_provider_event(
  p_provider_event_id text,
  p_event_type public.newsletter_provider_event_type,
  p_provider_message_reference text,
  p_payload_hash text,
  p_occurred_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_delivery_id uuid;
  v_subscriber_id uuid;
  v_email_hash text;
  v_consent_version text;
begin
  if p_provider_event_id is null or p_event_type is null or p_provider_message_reference is null
    or p_payload_hash is null or p_occurred_at is null
    or pg_catalog.char_length(p_provider_event_id) not between 1 and 300
    or pg_catalog.char_length(p_provider_message_reference) not between 1 and 300
    or p_provider_event_id ~ '[[:cntrl:]]' or p_provider_message_reference ~ '[[:cntrl:]]'
    or p_payload_hash !~ '^[0-9a-f]{64}$'
  then raise exception using message = 'NEWSLETTER_INVALID_INPUT', errcode = 'P0001'; end if;

  if exists (select 1 from public.newsletter_provider_events as event where event.provider_event_id = p_provider_event_id) then
    return 'replay';
  end if;
  select delivery.id, delivery.subscriber_id into v_delivery_id, v_subscriber_id
  from public.newsletter_deliveries as delivery
  where delivery.provider_message_reference = p_provider_message_reference;
  insert into public.newsletter_provider_events (
    provider_event_id, event_type, provider_message_reference, delivery_id,
    subscriber_id, payload_hash, occurred_at, retention_until
  ) values (
    p_provider_event_id, p_event_type, p_provider_message_reference, v_delivery_id,
    v_subscriber_id, p_payload_hash, p_occurred_at, pg_catalog.clock_timestamp() + interval '30 days'
  ) on conflict (provider_event_id) do nothing;
  if not found then return 'replay'; end if;

  if v_subscriber_id is not null and p_event_type in ('hard_bounce', 'complaint', 'unsubscribe') then
    select subscriber.email_hash, subscriber.consent_version into v_email_hash, v_consent_version
    from public.newsletter_subscribers as subscriber
    where subscriber.id = v_subscriber_id and subscriber.status = 'confirmed' for update;
    if found then
      update public.newsletter_subscribers as subscriber set email = null, status = 'suppressed',
        confirmation_token_hash = null, confirmation_expires_at = null,
        suppressed_at = pg_catalog.clock_timestamp(), updated_at = pg_catalog.clock_timestamp()
      where subscriber.id = v_subscriber_id;
      insert into public.newsletter_subscription_events (subscriber_id, email_hash, event_type, consent_version, occurred_at)
      values (v_subscriber_id, v_email_hash, 'suppressed', v_consent_version, pg_catalog.clock_timestamp());
    end if;
  end if;
  return case when v_delivery_id is null then 'unmatched' else 'recorded' end;
end;
$$;

create function public.cleanup_newsletter_provider_events()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare v_deleted bigint;
begin
  delete from public.newsletter_provider_events as event
  where event.retention_until is not null and event.retention_until < pg_catalog.clock_timestamp();
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.protect_newsletter_edition_snapshot() from public, anon, authenticated, service_role;
revoke all on function public.create_newsletter_edition(uuid, text, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.list_newsletter_writing_candidates(integer) from public, anon, authenticated, service_role;
revoke all on function public.list_newsletter_editions(integer) from public, anon, authenticated, service_role;
revoke all on function public.get_newsletter_edition(uuid) from public, anon, authenticated, service_role;
revoke all on function public.get_newsletter_operational_summary() from public, anon, authenticated, service_role;
revoke all on function public.begin_newsletter_send(uuid, bigint) from public, anon, authenticated, service_role;
revoke all on function public.claim_newsletter_delivery(uuid) from public, anon, authenticated, service_role;
revoke all on function public.recheck_newsletter_delivery_eligibility(uuid) from public, anon, authenticated, service_role;
revoke all on function public.complete_newsletter_delivery(uuid, public.newsletter_delivery_state, text, text) from public, anon, authenticated, service_role;
revoke all on function public.finish_newsletter_send(uuid) from public, anon, authenticated, service_role;
revoke all on function public.lookup_newsletter_subscriber(text) from public, anon, authenticated, service_role;
revoke all on function public.suppress_newsletter_subscriber(text) from public, anon, authenticated, service_role;
revoke all on function public.ingest_newsletter_provider_event(text, public.newsletter_provider_event_type, text, text, timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.cleanup_newsletter_provider_events() from public, anon, authenticated, service_role;

grant execute on function public.create_newsletter_edition(uuid, text, text, text, text) to authenticated;
grant execute on function public.list_newsletter_writing_candidates(integer) to authenticated;
grant execute on function public.list_newsletter_editions(integer) to authenticated;
grant execute on function public.get_newsletter_edition(uuid) to authenticated;
grant execute on function public.get_newsletter_operational_summary() to authenticated;
grant execute on function public.begin_newsletter_send(uuid, bigint) to authenticated;
grant execute on function public.claim_newsletter_delivery(uuid) to authenticated;
grant execute on function public.recheck_newsletter_delivery_eligibility(uuid) to authenticated;
grant execute on function public.complete_newsletter_delivery(uuid, public.newsletter_delivery_state, text, text) to authenticated;
grant execute on function public.finish_newsletter_send(uuid) to authenticated;
grant execute on function public.lookup_newsletter_subscriber(text) to authenticated;
grant execute on function public.suppress_newsletter_subscriber(text) to authenticated;
grant execute on function public.ingest_newsletter_provider_event(text, public.newsletter_provider_event_type, text, text, timestamptz) to service_role;
grant execute on function public.cleanup_newsletter_provider_events() to service_role;

notify pgrst, 'reload schema';
