create type public.alignment_session_status as enum ('active', 'completed', 'withdrawn');
create type public.alignment_participant_role as enum ('initiator', 'invitee');
create type public.alignment_participant_status as enum ('invited', 'joined', 'in_progress', 'completed', 'withdrawn');
create type public.alignment_invite_status as enum ('active', 'accepted', 'completed', 'revoked');
create type public.alignment_agreement_status as enum ('draft', 'awaiting_acknowledgement', 'finalized');
create type public.alignment_importance as enum ('low', 'medium', 'high');

create table public.alignment_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  module_id text not null,
  initiator_user_id uuid not null references auth.users (id) on delete restrict,
  status public.alignment_session_status not null default 'active',
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint alignment_sessions_module_check check (module_id in ('partner', 'friendship', 'founder')),
  constraint alignment_sessions_updated_check check (updated_at >= created_at)
);

create table public.alignment_rounds (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references public.alignment_sessions (id) on delete cascade,
  round_number integer not null,
  module_version text not null,
  question_set_version text not null,
  interpretation_version text not null,
  shared_result jsonb,
  shared_result_unlocked_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  completed_at timestamptz,
  constraint alignment_rounds_number_check check (round_number between 1 and 1000),
  constraint alignment_rounds_versions_check check (
    pg_catalog.char_length(module_version) between 3 and 80
    and pg_catalog.char_length(question_set_version) between 3 and 80
    and pg_catalog.char_length(interpretation_version) between 3 and 80
  ),
  constraint alignment_rounds_result_check check (
    (shared_result is null and shared_result_unlocked_at is null and completed_at is null)
    or (
      shared_result is not null
      and pg_catalog.jsonb_typeof(shared_result) = 'object'
      and shared_result_unlocked_at is not null
      and completed_at is not null
    )
  ),
  unique (session_id, round_number)
);

create table public.alignment_participants (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references public.alignment_sessions (id) on delete cascade,
  role public.alignment_participant_role not null,
  user_id uuid references auth.users (id) on delete set null,
  capability_hash text unique,
  display_name text,
  status public.alignment_participant_status not null,
  consent_version text,
  consented_at timestamptz,
  joined_at timestamptz,
  completed_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint alignment_participants_two_person_unique unique (session_id, role),
  constraint alignment_participants_identity_check check (
    (role = 'initiator' and user_id is not null and capability_hash is null)
    or (role = 'invitee' and user_id is null)
  ),
  constraint alignment_participants_capability_check check (
    capability_hash is null
    or (role = 'invitee' and pg_catalog.char_length(capability_hash) = 64 and capability_hash ~ '^[0-9a-f]{64}$')
  ),
  constraint alignment_participants_name_check check (
    display_name is null
    or (
      pg_catalog.char_length(display_name) between 2 and 40
      and display_name = pg_catalog.btrim(display_name)
      and pg_catalog.strpos(display_name, pg_catalog.chr(10)) = 0
      and pg_catalog.strpos(display_name, pg_catalog.chr(13)) = 0
    )
  ),
  constraint alignment_participants_consent_check check (
    (consent_version is null and consented_at is null)
    or (role = 'invitee' and consent_version is not null and consented_at is not null)
  ),
  constraint alignment_participants_lifecycle_check check (
    (status = 'invited' and joined_at is null and completed_at is null and withdrawn_at is null)
    or (status in ('joined', 'in_progress') and joined_at is not null and completed_at is null and withdrawn_at is null)
    or (status = 'completed' and joined_at is not null and completed_at is not null and withdrawn_at is null)
    or (status = 'withdrawn' and withdrawn_at is not null)
  ),
  constraint alignment_participants_updated_check check (updated_at >= created_at)
);

create table public.alignment_invites (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null unique references public.alignment_sessions (id) on delete cascade,
  round_id uuid not null references public.alignment_rounds (id) on delete cascade,
  token_hash text not null unique,
  status public.alignment_invite_status not null default 'active',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint alignment_invites_hash_check check (pg_catalog.char_length(token_hash) = 64 and token_hash ~ '^[0-9a-f]{64}$'),
  constraint alignment_invites_expiry_check check (expires_at > created_at and expires_at <= created_at + interval '7 days 5 minutes'),
  constraint alignment_invites_lifecycle_check check (
    (status = 'active' and accepted_at is null and revoked_at is null)
    or (status in ('accepted', 'completed') and accepted_at is not null and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null)
  )
);

create table public.alignment_answers (
  round_id uuid not null references public.alignment_rounds (id) on delete cascade,
  participant_id uuid not null references public.alignment_participants (id) on delete cascade,
  question_id text not null,
  answer_value smallint not null,
  importance public.alignment_importance not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key (round_id, participant_id, question_id),
  constraint alignment_answers_question_check check (pg_catalog.char_length(question_id) between 3 and 100 and question_id ~ '^[a-z0-9-]+$'),
  constraint alignment_answers_value_check check (answer_value between 1 and 5),
  constraint alignment_answers_updated_check check (updated_at >= created_at)
);

create table public.alignment_agreement_sets (
  id uuid primary key default extensions.gen_random_uuid(),
  round_id uuid not null unique references public.alignment_rounds (id) on delete cascade,
  revision integer not null default 1,
  status public.alignment_agreement_status not null default 'draft',
  updated_by_participant_id uuid not null references public.alignment_participants (id) on delete restrict,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  finalized_at timestamptz,
  constraint alignment_agreement_sets_revision_check check (revision between 1 and 10000),
  constraint alignment_agreement_sets_lifecycle_check check (
    (status <> 'finalized' and finalized_at is null)
    or (status = 'finalized' and finalized_at is not null)
  )
);

create table public.alignment_agreement_items (
  agreement_set_id uuid not null references public.alignment_agreement_sets (id) on delete cascade,
  position smallint not null,
  body text not null,
  proposed_by_participant_id uuid not null references public.alignment_participants (id) on delete restrict,
  primary key (agreement_set_id, position),
  constraint alignment_agreement_items_position_check check (position between 1 and 5),
  constraint alignment_agreement_items_body_check check (
    pg_catalog.char_length(body) between 3 and 240
    and body = pg_catalog.btrim(body)
    and pg_catalog.strpos(body, pg_catalog.chr(10)) = 0
    and pg_catalog.strpos(body, pg_catalog.chr(13)) = 0
  )
);

create table public.alignment_agreement_acknowledgements (
  agreement_set_id uuid not null references public.alignment_agreement_sets (id) on delete cascade,
  participant_id uuid not null references public.alignment_participants (id) on delete cascade,
  revision integer not null,
  acknowledged_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key (agreement_set_id, participant_id),
  constraint alignment_agreement_ack_revision_check check (revision between 1 and 10000)
);

create index alignment_sessions_initiator_updated_idx on public.alignment_sessions (initiator_user_id, updated_at desc, id desc);
create index alignment_rounds_session_created_idx on public.alignment_rounds (session_id, created_at desc, id desc);
create index alignment_participants_session_status_idx on public.alignment_participants (session_id, status, id);
create index alignment_answers_participant_round_idx on public.alignment_answers (participant_id, round_id, question_id);
create index alignment_invites_expiry_idx on public.alignment_invites (status, expires_at) where status = 'active';

alter table public.alignment_sessions enable row level security;
alter table public.alignment_rounds enable row level security;
alter table public.alignment_participants enable row level security;
alter table public.alignment_invites enable row level security;
alter table public.alignment_answers enable row level security;
alter table public.alignment_agreement_sets enable row level security;
alter table public.alignment_agreement_items enable row level security;
alter table public.alignment_agreement_acknowledgements enable row level security;

alter table public.alignment_sessions force row level security;
alter table public.alignment_rounds force row level security;
alter table public.alignment_participants force row level security;
alter table public.alignment_invites force row level security;
alter table public.alignment_answers force row level security;
alter table public.alignment_agreement_sets force row level security;
alter table public.alignment_agreement_items force row level security;
alter table public.alignment_agreement_acknowledgements force row level security;

revoke all on table public.alignment_sessions, public.alignment_rounds, public.alignment_participants,
  public.alignment_invites, public.alignment_answers, public.alignment_agreement_sets,
  public.alignment_agreement_items, public.alignment_agreement_acknowledgements
  from public, anon, authenticated, service_role;

create function public.create_alignment_session(
  p_actor_user_id uuid,
  p_module_id text,
  p_module_version text,
  p_question_set_version text,
  p_interpretation_version text,
  p_invite_token_hash text,
  p_expires_at timestamptz
) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_session_id uuid;
  v_round_id uuid;
begin
  if p_actor_user_id is null or not exists (select 1 from auth.users where id = p_actor_user_id) then
    raise exception using message = 'ALIGNMENT_UNAUTHORIZED_SESSION', errcode = 'P0001';
  end if;
  if p_module_id not in ('partner', 'friendship', 'founder')
    or pg_catalog.char_length(p_invite_token_hash) <> 64
    or p_invite_token_hash !~ '^[0-9a-f]{64}$'
    or p_expires_at <= pg_catalog.clock_timestamp()
    or p_expires_at > pg_catalog.clock_timestamp() + interval '7 days 5 minutes'
  then raise exception using message = 'ALIGNMENT_INVALID_INPUT', errcode = 'P0001'; end if;
  if (select count(*) from public.alignment_sessions where initiator_user_id = p_actor_user_id and created_at > pg_catalog.clock_timestamp() - interval '1 hour') >= 10 then
    raise exception using message = 'ALIGNMENT_RATE_LIMITED', errcode = 'P0001';
  end if;

  insert into public.alignment_sessions (module_id, initiator_user_id)
  values (p_module_id, p_actor_user_id) returning id into v_session_id;
  insert into public.alignment_rounds (session_id, round_number, module_version, question_set_version, interpretation_version)
  values (v_session_id, 1, p_module_version, p_question_set_version, p_interpretation_version) returning id into v_round_id;
  insert into public.alignment_participants (session_id, role, user_id, display_name, status, joined_at)
  values (v_session_id, 'initiator', p_actor_user_id, 'Initiator', 'joined', pg_catalog.clock_timestamp());
  insert into public.alignment_participants (session_id, role, status)
  values (v_session_id, 'invitee', 'invited');
  insert into public.alignment_invites (session_id, round_id, token_hash, expires_at)
  values (v_session_id, v_round_id, p_invite_token_hash, p_expires_at);
  return v_session_id;
end;
$$;

create function public.get_alignment_invite_landing(p_token_hash text)
returns table (module_id text, inviter_display_name text, expires_at timestamptz, invite_status text)
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
  select
    case when invite.status = 'active' and invite.expires_at > pg_catalog.clock_timestamp() then session.module_id else null end,
    case when invite.status = 'active' and invite.expires_at > pg_catalog.clock_timestamp() then coalesce(profile.display_name, 'BTS Account') else null end,
    case when invite.status = 'active' and invite.expires_at > pg_catalog.clock_timestamp() then invite.expires_at else null end,
    case
      when invite.status = 'revoked' then 'revoked'
      when invite.status <> 'active' then 'accepted'
      when invite.expires_at <= pg_catalog.clock_timestamp() then 'expired'
      else 'valid'
    end
  from public.alignment_invites as invite
  join public.alignment_sessions as session on session.id = invite.session_id
  left join public.bts_account_profiles as profile on profile.user_id = session.initiator_user_id and profile.deleted_at is null
  where invite.token_hash = p_token_hash
  limit 1
$$;

create function public.join_alignment_invite(
  p_token_hash text,
  p_capability_hash text,
  p_display_name text,
  p_consent_version text
) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_invite public.alignment_invites%rowtype;
  v_participant public.alignment_participants%rowtype;
begin
  select * into v_invite from public.alignment_invites where token_hash = p_token_hash for update;
  if not found then raise exception using message = 'ALIGNMENT_INVALID_INVITE', errcode = 'P0001'; end if;
  if v_invite.status = 'revoked' then raise exception using message = 'ALIGNMENT_REVOKED_INVITE', errcode = 'P0001'; end if;
  if v_invite.status <> 'active' then raise exception using message = 'ALIGNMENT_PARTICIPANT_ALREADY_JOINED', errcode = 'P0001'; end if;
  if v_invite.expires_at <= pg_catalog.clock_timestamp() then raise exception using message = 'ALIGNMENT_EXPIRED_INVITE', errcode = 'P0001'; end if;
  if pg_catalog.char_length(p_capability_hash) <> 64 or p_capability_hash !~ '^[0-9a-f]{64}$'
    or pg_catalog.char_length(p_display_name) not between 2 and 40
    or p_display_name <> pg_catalog.btrim(p_display_name)
    or p_consent_version <> 'relationship-participation-v1.1'
  then raise exception using message = 'ALIGNMENT_INVALID_INPUT', errcode = 'P0001'; end if;

  select * into v_participant from public.alignment_participants
  where session_id = v_invite.session_id and role = 'invitee' for update;
  if v_participant.status <> 'invited' then raise exception using message = 'ALIGNMENT_PARTICIPANT_ALREADY_JOINED', errcode = 'P0001'; end if;
  update public.alignment_participants set capability_hash = p_capability_hash, display_name = p_display_name,
    status = 'joined', consent_version = p_consent_version, consented_at = pg_catalog.clock_timestamp(),
    joined_at = pg_catalog.clock_timestamp(), updated_at = pg_catalog.clock_timestamp()
  where id = v_participant.id;
  update public.alignment_invites set status = 'accepted', accepted_at = pg_catalog.clock_timestamp() where id = v_invite.id;
  return v_invite.session_id;
end;
$$;

create function public.save_alignment_answers(
  p_actor_user_id uuid,
  p_capability_hash text,
  p_session_id uuid,
  p_answers jsonb,
  p_complete boolean
) returns text
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_participant public.alignment_participants%rowtype;
  v_round_id uuid;
  v_answer record;
  v_both_complete boolean;
begin
  select participant.* into v_participant from public.alignment_participants as participant
  where participant.session_id = p_session_id and (
    (participant.role = 'initiator' and p_actor_user_id is not null and participant.user_id = p_actor_user_id)
    or (participant.role = 'invitee' and p_capability_hash is not null and participant.capability_hash = p_capability_hash)
  ) for update;
  if not found or v_participant.status in ('invited', 'withdrawn') then
    raise exception using message = 'ALIGNMENT_UNAUTHORIZED_SESSION', errcode = 'P0001';
  end if;
  if pg_catalog.jsonb_typeof(p_answers) <> 'object' or pg_catalog.jsonb_object_length(p_answers) > 80 then
    raise exception using message = 'ALIGNMENT_INVALID_INPUT', errcode = 'P0001';
  end if;
  select id into v_round_id from public.alignment_rounds where session_id = p_session_id order by round_number desc limit 1 for update;
  for v_answer in select key, value from pg_catalog.jsonb_each(p_answers)
  loop
    if v_answer.key !~ '^[a-z0-9-]{3,100}$'
      or pg_catalog.jsonb_typeof(v_answer.value) <> 'object'
      or (v_answer.value->>'value') !~ '^[1-5]$'
      or (v_answer.value->>'importance') not in ('low', 'medium', 'high')
    then raise exception using message = 'ALIGNMENT_INVALID_INPUT', errcode = 'P0001'; end if;
    insert into public.alignment_answers (round_id, participant_id, question_id, answer_value, importance)
    values (v_round_id, v_participant.id, v_answer.key, (v_answer.value->>'value')::smallint, (v_answer.value->>'importance')::public.alignment_importance)
    on conflict (round_id, participant_id, question_id) do update set answer_value = excluded.answer_value,
      importance = excluded.importance, updated_at = pg_catalog.clock_timestamp();
  end loop;
  update public.alignment_participants set status = case when p_complete then 'completed'::public.alignment_participant_status else 'in_progress'::public.alignment_participant_status end,
    completed_at = case when p_complete then pg_catalog.clock_timestamp() else null end,
    updated_at = pg_catalog.clock_timestamp() where id = v_participant.id;
  select pg_catalog.bool_and(status = 'completed') into v_both_complete from public.alignment_participants where session_id = p_session_id;
  return case when v_both_complete then 'ready_for_result' else 'saved' end;
end;
$$;

create function public.get_alignment_round_answers_for_result(p_session_id uuid)
returns table (role text, question_id text, answer_value smallint, importance text)
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
  select participant.role::text, answer.question_id, answer.answer_value, answer.importance::text
  from public.alignment_rounds as round
  join public.alignment_participants as participant on participant.session_id = round.session_id
  join public.alignment_answers as answer on answer.round_id = round.id and answer.participant_id = participant.id
  where round.session_id = p_session_id
    and round.round_number = (select max(current_round.round_number) from public.alignment_rounds as current_round where current_round.session_id = p_session_id)
    and not exists (select 1 from public.alignment_participants as incomplete where incomplete.session_id = p_session_id and incomplete.status <> 'completed')
  order by participant.role, answer.question_id
$$;

create function public.store_alignment_shared_result(
  p_session_id uuid,
  p_module_version text,
  p_question_set_version text,
  p_interpretation_version text,
  p_result jsonb
) returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare v_round public.alignment_rounds%rowtype;
begin
  select * into v_round from public.alignment_rounds where session_id = p_session_id order by round_number desc limit 1 for update;
  if not found or v_round.shared_result is not null or pg_catalog.jsonb_typeof(p_result) <> 'object'
    or v_round.module_version <> p_module_version or v_round.question_set_version <> p_question_set_version
    or v_round.interpretation_version <> p_interpretation_version
    or exists (select 1 from public.alignment_participants where session_id = p_session_id and status <> 'completed')
  then raise exception using message = 'ALIGNMENT_RESULT_NOT_UNLOCKED', errcode = 'P0001'; end if;
  update public.alignment_rounds set shared_result = p_result, shared_result_unlocked_at = pg_catalog.clock_timestamp(), completed_at = pg_catalog.clock_timestamp() where id = v_round.id;
  update public.alignment_sessions set status = 'completed', updated_at = pg_catalog.clock_timestamp() where id = p_session_id;
  update public.alignment_invites set status = 'completed' where session_id = p_session_id and status = 'accepted';
end;
$$;

create function public.get_alignment_session_view(p_actor_user_id uuid, p_capability_hash text, p_session_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_viewer public.alignment_participants%rowtype;
  v_counterpart public.alignment_participants%rowtype;
  v_session public.alignment_sessions%rowtype;
  v_round public.alignment_rounds%rowtype;
  v_invite public.alignment_invites%rowtype;
  v_agreement public.alignment_agreement_sets%rowtype;
begin
  select participant.* into v_viewer from public.alignment_participants as participant
  where participant.session_id = p_session_id and participant.status <> 'withdrawn' and (
    (participant.role = 'initiator' and p_actor_user_id is not null and participant.user_id = p_actor_user_id)
    or (participant.role = 'invitee' and p_capability_hash is not null and participant.capability_hash = p_capability_hash)
  ) limit 1;
  if not found then return null; end if;
  select * into v_counterpart from public.alignment_participants where session_id = p_session_id and id <> v_viewer.id limit 1;
  select * into v_session from public.alignment_sessions where id = p_session_id;
  select * into v_round from public.alignment_rounds where session_id = p_session_id order by round_number desc limit 1;
  select * into v_invite from public.alignment_invites where session_id = p_session_id;
  select * into v_agreement from public.alignment_agreement_sets where round_id = v_round.id;
  return pg_catalog.jsonb_build_object(
    'sessionId', v_session.id, 'moduleId', v_session.module_id, 'roundNumber', v_round.round_number,
    'viewerRole', v_viewer.role, 'sessionStatus', v_session.status,
    'inviteStatus', case when v_invite.status = 'active' and v_invite.expires_at <= pg_catalog.clock_timestamp() then 'expired' else v_invite.status::text end,
    'inviteExpiresAt', v_invite.expires_at, 'ownStatus', replace(v_viewer.status::text, '_', '-'),
    'counterpartStatus', replace(v_counterpart.status::text, '_', '-'),
    'sharedResultAvailable', v_round.shared_result is not null,
    'ownAnswers', coalesce((select pg_catalog.jsonb_object_agg(answer.question_id, pg_catalog.jsonb_build_object('value', answer.answer_value, 'importance', answer.importance::text)) from public.alignment_answers as answer where answer.round_id = v_round.id and answer.participant_id = v_viewer.id), '{}'::jsonb),
    'sharedResult', v_round.shared_result,
    'agreement', case when v_agreement.id is null or v_round.shared_result is null then null else pg_catalog.jsonb_build_object(
      'id', v_agreement.id, 'revision', v_agreement.revision, 'status', replace(v_agreement.status::text, '_', '-'),
      'items', coalesce((select pg_catalog.jsonb_agg(item.body order by item.position) from public.alignment_agreement_items as item where item.agreement_set_id = v_agreement.id), '[]'::jsonb),
      'acknowledgedByViewer', exists (select 1 from public.alignment_agreement_acknowledgements where agreement_set_id = v_agreement.id and participant_id = v_viewer.id and revision = v_agreement.revision),
      'acknowledgedByCounterpart', exists (select 1 from public.alignment_agreement_acknowledgements where agreement_set_id = v_agreement.id and participant_id = v_counterpart.id and revision = v_agreement.revision),
      'updatedAt', v_agreement.updated_at
    ) end
  );
end;
$$;

create function public.revoke_alignment_invite(p_actor_user_id uuid, p_session_id uuid) returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  update public.alignment_invites as invite set status = 'revoked', revoked_at = pg_catalog.clock_timestamp()
  from public.alignment_sessions as session
  where invite.session_id = p_session_id and session.id = invite.session_id and session.initiator_user_id = p_actor_user_id and invite.status = 'active';
  if not found then raise exception using message = 'ALIGNMENT_INVALID_TRANSITION', errcode = 'P0001'; end if;
end;
$$;

create function public.save_alignment_agreement(
  p_actor_user_id uuid, p_capability_hash text, p_session_id uuid, p_expected_revision integer, p_items jsonb
) returns integer
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_participant public.alignment_participants%rowtype;
  v_round public.alignment_rounds%rowtype;
  v_set public.alignment_agreement_sets%rowtype;
  v_item record;
  v_revision integer;
begin
  select participant.* into v_participant from public.alignment_participants as participant where participant.session_id = p_session_id and participant.status = 'completed' and (
    (participant.role = 'initiator' and p_actor_user_id is not null and participant.user_id = p_actor_user_id)
    or (participant.role = 'invitee' and p_capability_hash is not null and participant.capability_hash = p_capability_hash)
  );
  if not found then raise exception using message = 'ALIGNMENT_UNAUTHORIZED_SESSION', errcode = 'P0001'; end if;
  if pg_catalog.jsonb_typeof(p_items) <> 'array' or pg_catalog.jsonb_array_length(p_items) not between 1 and 5 then raise exception using message = 'ALIGNMENT_INVALID_INPUT', errcode = 'P0001'; end if;
  select * into v_round from public.alignment_rounds where session_id = p_session_id and shared_result is not null order by round_number desc limit 1;
  if not found then raise exception using message = 'ALIGNMENT_RESULT_NOT_UNLOCKED', errcode = 'P0001'; end if;
  select * into v_set from public.alignment_agreement_sets where round_id = v_round.id for update;
  if found and v_set.revision <> p_expected_revision then raise exception using message = 'ALIGNMENT_AGREEMENT_CONFLICT', errcode = 'P0001'; end if;
  if found then
    v_revision := v_set.revision + 1;
    update public.alignment_agreement_sets set revision = v_revision, status = 'draft', updated_by_participant_id = v_participant.id,
      updated_at = pg_catalog.clock_timestamp(), finalized_at = null where id = v_set.id;
    delete from public.alignment_agreement_acknowledgements where agreement_set_id = v_set.id;
    delete from public.alignment_agreement_items where agreement_set_id = v_set.id;
  else
    if p_expected_revision <> 0 then raise exception using message = 'ALIGNMENT_AGREEMENT_CONFLICT', errcode = 'P0001'; end if;
    insert into public.alignment_agreement_sets (round_id, updated_by_participant_id) values (v_round.id, v_participant.id) returning * into v_set;
    v_revision := 1;
  end if;
  for v_item in select ordinality, value #>> '{}' as body from pg_catalog.jsonb_array_elements(p_items) with ordinality
  loop
    if pg_catalog.char_length(v_item.body) not between 3 and 240 or v_item.body <> pg_catalog.btrim(v_item.body)
    then raise exception using message = 'ALIGNMENT_INVALID_INPUT', errcode = 'P0001'; end if;
    insert into public.alignment_agreement_items (agreement_set_id, position, body, proposed_by_participant_id)
    values (v_set.id, v_item.ordinality, v_item.body, v_participant.id);
  end loop;
  return v_revision;
end;
$$;

create function public.acknowledge_alignment_agreement(
  p_actor_user_id uuid, p_capability_hash text, p_session_id uuid, p_expected_revision integer
) returns text
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_participant public.alignment_participants%rowtype;
  v_set public.alignment_agreement_sets%rowtype;
  v_ack_count integer;
begin
  select participant.* into v_participant from public.alignment_participants as participant where participant.session_id = p_session_id and participant.status = 'completed' and (
    (participant.role = 'initiator' and p_actor_user_id is not null and participant.user_id = p_actor_user_id)
    or (participant.role = 'invitee' and p_capability_hash is not null and participant.capability_hash = p_capability_hash)
  );
  if not found then raise exception using message = 'ALIGNMENT_UNAUTHORIZED_SESSION', errcode = 'P0001'; end if;
  select agreement.* into v_set from public.alignment_agreement_sets as agreement
  join public.alignment_rounds as round on round.id = agreement.round_id
  where round.session_id = p_session_id for update;
  if not found or v_set.revision <> p_expected_revision then raise exception using message = 'ALIGNMENT_AGREEMENT_CONFLICT', errcode = 'P0001'; end if;
  insert into public.alignment_agreement_acknowledgements (agreement_set_id, participant_id, revision)
  values (v_set.id, v_participant.id, v_set.revision)
  on conflict (agreement_set_id, participant_id) do update set revision = excluded.revision, acknowledged_at = pg_catalog.clock_timestamp();
  select count(*) into v_ack_count from public.alignment_agreement_acknowledgements where agreement_set_id = v_set.id and revision = v_set.revision;
  update public.alignment_agreement_sets set status = case when v_ack_count = 2 then 'finalized'::public.alignment_agreement_status else 'awaiting_acknowledgement'::public.alignment_agreement_status end,
    finalized_at = case when v_ack_count = 2 then pg_catalog.clock_timestamp() else null end, updated_at = pg_catalog.clock_timestamp()
  where id = v_set.id;
  return case when v_ack_count = 2 then 'finalized' else 'awaiting_acknowledgement' end;
end;
$$;

create function public.delete_alignment_participation(p_capability_hash text, p_session_id uuid) returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_participant public.alignment_participants%rowtype;
  v_round public.alignment_rounds%rowtype;
begin
  select * into v_participant from public.alignment_participants where session_id = p_session_id and role = 'invitee' and capability_hash = p_capability_hash for update;
  if not found then raise exception using message = 'ALIGNMENT_UNAUTHORIZED_SESSION', errcode = 'P0001'; end if;
  select * into v_round from public.alignment_rounds where session_id = p_session_id order by round_number desc limit 1 for update;
  if v_round.shared_result is not null then raise exception using message = 'ALIGNMENT_FINALIZED_DELETION_POLICY_REQUIRED', errcode = 'P0001'; end if;
  delete from public.alignment_answers where round_id = v_round.id and participant_id = v_participant.id;
  update public.alignment_participants set capability_hash = null, display_name = null, status = 'withdrawn', consent_version = null,
    consented_at = null, completed_at = null, withdrawn_at = pg_catalog.clock_timestamp(), updated_at = pg_catalog.clock_timestamp()
  where id = v_participant.id;
end;
$$;

revoke all on function public.create_alignment_session(uuid, text, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.get_alignment_invite_landing(text) from public, anon, authenticated;
revoke all on function public.join_alignment_invite(text, text, text, text) from public, anon, authenticated;
revoke all on function public.save_alignment_answers(uuid, text, uuid, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.get_alignment_round_answers_for_result(uuid) from public, anon, authenticated;
revoke all on function public.store_alignment_shared_result(uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.get_alignment_session_view(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.revoke_alignment_invite(uuid, uuid) from public, anon, authenticated;
revoke all on function public.save_alignment_agreement(uuid, text, uuid, integer, jsonb) from public, anon, authenticated;
revoke all on function public.acknowledge_alignment_agreement(uuid, text, uuid, integer) from public, anon, authenticated;
revoke all on function public.delete_alignment_participation(text, uuid) from public, anon, authenticated;

grant execute on function public.create_alignment_session(uuid, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.get_alignment_invite_landing(text) to service_role;
grant execute on function public.join_alignment_invite(text, text, text, text) to service_role;
grant execute on function public.save_alignment_answers(uuid, text, uuid, jsonb, boolean) to service_role;
grant execute on function public.get_alignment_round_answers_for_result(uuid) to service_role;
grant execute on function public.store_alignment_shared_result(uuid, text, text, text, jsonb) to service_role;
grant execute on function public.get_alignment_session_view(uuid, text, uuid) to service_role;
grant execute on function public.revoke_alignment_invite(uuid, uuid) to service_role;
grant execute on function public.save_alignment_agreement(uuid, text, uuid, integer, jsonb) to service_role;
grant execute on function public.acknowledge_alignment_agreement(uuid, text, uuid, integer) to service_role;
grant execute on function public.delete_alignment_participation(text, uuid) to service_role;

create function public.list_alignment_sessions(p_actor_user_id uuid)
returns table (
  session_id uuid,
  module_id text,
  session_status text,
  invite_status text,
  invite_expires_at timestamptz,
  own_status text,
  counterpart_status text,
  shared_result_available boolean,
  agreement_status text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
  select
    session.id,
    session.module_id,
    session.status::text,
    case
      when invite.status = 'active' and invite.expires_at <= pg_catalog.clock_timestamp() then 'expired'
      else invite.status::text
    end,
    invite.expires_at,
    replace(initiator.status::text, '_', '-'),
    replace(invitee.status::text, '_', '-'),
    round.shared_result is not null,
    coalesce(replace(agreement.status::text, '_', '-'), 'none'),
    session.updated_at
  from public.alignment_sessions as session
  join public.alignment_participants as initiator on initiator.session_id = session.id and initiator.role = 'initiator'
  join public.alignment_participants as invitee on invitee.session_id = session.id and invitee.role = 'invitee'
  join public.alignment_invites as invite on invite.session_id = session.id
  join lateral (
    select current_round.* from public.alignment_rounds as current_round
    where current_round.session_id = session.id order by current_round.round_number desc limit 1
  ) as round on true
  left join public.alignment_agreement_sets as agreement on agreement.round_id = round.id
  where p_actor_user_id is not null and session.initiator_user_id = p_actor_user_id
  order by session.updated_at desc, session.id
$$;


revoke all on function public.list_alignment_sessions(uuid) from public, anon, authenticated;
grant execute on function public.list_alignment_sessions(uuid) to service_role;

create table public.alignment_rate_limits (
  id bigint generated always as identity primary key,
  action text not null,
  authority_hash text not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  expires_at timestamptz not null,
  constraint alignment_rate_limits_action_check check (action in (
    'invite-validate', 'create-session', 'join', 'save-answers', 'revoke', 'agreement', 'delete-participation'
  )),
  constraint alignment_rate_limits_hash_check check (
    pg_catalog.char_length(authority_hash) = 64 and authority_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint alignment_rate_limits_expiry_check check (
    expires_at > created_at and expires_at <= created_at + interval '25 hours'
  )
);

create index alignment_rate_limits_authority_created_idx
  on public.alignment_rate_limits (action, authority_hash, created_at desc);
create index alignment_rate_limits_expires_idx
  on public.alignment_rate_limits (expires_at);

alter table public.alignment_rate_limits enable row level security;
alter table public.alignment_rate_limits force row level security;
revoke all on table public.alignment_rate_limits from public, anon, authenticated, service_role;
revoke all on sequence public.alignment_rate_limits_id_seq from public, anon, authenticated, service_role;

create function public.consume_alignment_rate_limit(
  p_action text,
  p_authority_hash text,
  p_short_limit integer,
  p_daily_limit integer
) returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if p_action not in (
      'invite-validate', 'create-session', 'join', 'save-answers', 'revoke', 'agreement', 'delete-participation'
    )
    or p_authority_hash is null
    or pg_catalog.char_length(p_authority_hash) <> 64
    or p_authority_hash !~ '^[0-9a-f]{64}$'
    or p_short_limit not between 1 and 100
    or p_daily_limit not between p_short_limit and 1000
  then
    raise exception using message = 'ALIGNMENT_INVALID_INPUT', errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_action || ':' || p_authority_hash, 0)
  );

  if (
    select count(*) from public.alignment_rate_limits
    where action = p_action and authority_hash = p_authority_hash
      and created_at > v_now - interval '15 minutes'
  ) >= p_short_limit or (
    select count(*) from public.alignment_rate_limits
    where action = p_action and authority_hash = p_authority_hash
      and created_at > v_now - interval '24 hours'
  ) >= p_daily_limit then
    raise exception using message = 'ALIGNMENT_RATE_LIMITED', errcode = 'P0001';
  end if;

  insert into public.alignment_rate_limits (action, authority_hash, expires_at)
  values (p_action, p_authority_hash, v_now + interval '25 hours');
end;
$$;

revoke all on function public.consume_alignment_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_alignment_rate_limit(text, text, integer, integer) to service_role;
