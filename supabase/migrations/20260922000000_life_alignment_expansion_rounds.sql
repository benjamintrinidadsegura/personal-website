alter table public.alignment_sessions drop constraint alignment_sessions_module_check;
alter table public.alignment_sessions add constraint alignment_sessions_module_check
  check (module_id in ('partner', 'friendship', 'founder', 'family', 'team'));

create or replace function public.create_alignment_session(
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
  if p_module_id not in ('partner', 'friendship', 'founder', 'family', 'team')
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

create function public.start_alignment_round(
  p_actor_user_id uuid,
  p_capability_hash text,
  p_session_id uuid,
  p_module_version text,
  p_question_set_version text,
  p_interpretation_version text
) returns integer
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_session public.alignment_sessions%rowtype;
  v_previous public.alignment_rounds%rowtype;
  v_next_number integer;
begin
  select session.* into v_session from public.alignment_sessions as session
  where session.id = p_session_id and session.status <> 'withdrawn' and exists (
    select 1 from public.alignment_participants as participant
    where participant.session_id = session.id and participant.status <> 'withdrawn' and (
      (participant.role = 'initiator' and p_actor_user_id is not null and participant.user_id = p_actor_user_id)
      or (participant.role = 'invitee' and p_capability_hash is not null and participant.capability_hash = p_capability_hash)
    )
  ) for update;
  if not found then raise exception using message = 'ALIGNMENT_UNAUTHORIZED_SESSION', errcode = 'P0001'; end if;
  select * into v_previous from public.alignment_rounds where session_id = p_session_id order by round_number desc limit 1 for update;
  if not found or v_previous.shared_result is null or v_previous.completed_at is null
    or exists (select 1 from public.alignment_participants where session_id = p_session_id and status <> 'completed')
  then raise exception using message = 'ALIGNMENT_INVALID_TRANSITION', errcode = 'P0001'; end if;
  v_next_number := v_previous.round_number + 1;
  if v_next_number > 1000 then raise exception using message = 'ALIGNMENT_INVALID_TRANSITION', errcode = 'P0001'; end if;
  insert into public.alignment_rounds (session_id, round_number, module_version, question_set_version, interpretation_version)
  values (p_session_id, v_next_number, p_module_version, p_question_set_version, p_interpretation_version);
  update public.alignment_participants set status = 'joined', completed_at = null, updated_at = pg_catalog.clock_timestamp()
  where session_id = p_session_id and status = 'completed';
  update public.alignment_sessions set status = 'active', updated_at = pg_catalog.clock_timestamp() where id = p_session_id;
  return v_next_number;
end;
$$;

create function public.get_alignment_round_history(
  p_actor_user_id uuid,
  p_capability_hash text,
  p_session_id uuid,
  p_limit integer default 20
) returns table (round_number integer, completed_at timestamptz, shared_result jsonb, agreement_status text)
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
  select round.round_number, round.completed_at, round.shared_result,
    coalesce(replace(agreement.status::text, '_', '-'), 'none')
  from public.alignment_rounds as round
  left join public.alignment_agreement_sets as agreement on agreement.round_id = round.id
  where round.session_id = p_session_id and round.shared_result is not null and round.completed_at is not null
    and exists (
      select 1 from public.alignment_participants as participant
      where participant.session_id = p_session_id and participant.status <> 'withdrawn' and (
        (participant.role = 'initiator' and p_actor_user_id is not null and participant.user_id = p_actor_user_id)
        or (participant.role = 'invitee' and p_capability_hash is not null and participant.capability_hash = p_capability_hash)
      )
    )
  order by round.round_number desc
  limit least(greatest(coalesce(p_limit, 20), 1), 20)
$$;

create or replace function public.acknowledge_alignment_agreement(
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
  where round.session_id = p_session_id
    and round.round_number = (select max(current_round.round_number) from public.alignment_rounds as current_round where current_round.session_id = p_session_id)
  for update of agreement;
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

create or replace function public.delete_alignment_participation(p_capability_hash text, p_session_id uuid) returns void
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
  if exists (select 1 from public.alignment_rounds where session_id = p_session_id and shared_result is not null) then
    raise exception using message = 'ALIGNMENT_FINALIZED_DELETION_POLICY_REQUIRED', errcode = 'P0001';
  end if;
  select * into v_round from public.alignment_rounds where session_id = p_session_id order by round_number desc limit 1 for update;
  delete from public.alignment_answers where round_id = v_round.id and participant_id = v_participant.id;
  update public.alignment_participants set capability_hash = null, display_name = null, status = 'withdrawn', consent_version = null,
    consented_at = null, completed_at = null, withdrawn_at = pg_catalog.clock_timestamp(), updated_at = pg_catalog.clock_timestamp()
  where id = v_participant.id;
  update public.alignment_sessions set status = 'withdrawn', updated_at = pg_catalog.clock_timestamp() where id = p_session_id;
end;
$$;

revoke all on function public.start_alignment_round(uuid, text, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.get_alignment_round_history(uuid, text, uuid, integer) from public, anon, authenticated;
revoke all on function public.create_alignment_session(uuid, text, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.delete_alignment_participation(text, uuid) from public, anon, authenticated;
revoke all on function public.acknowledge_alignment_agreement(uuid, text, uuid, integer) from public, anon, authenticated;
grant execute on function public.start_alignment_round(uuid, text, uuid, text, text, text) to service_role;
grant execute on function public.get_alignment_round_history(uuid, text, uuid, integer) to service_role;
grant execute on function public.create_alignment_session(uuid, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.delete_alignment_participation(text, uuid) to service_role;
grant execute on function public.acknowledge_alignment_agreement(uuid, text, uuid, integer) to service_role;
