create or replace function public.save_alignment_answers(
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
  if pg_catalog.jsonb_typeof(p_answers) <> 'object' then
    raise exception using message = 'ALIGNMENT_INVALID_INPUT', errcode = 'P0001';
  end if;
  if (select count(*) from pg_catalog.jsonb_each(p_answers)) > 80 then
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

revoke all on function public.save_alignment_answers(uuid, text, uuid, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.save_alignment_answers(uuid, text, uuid, jsonb, boolean) to service_role;
