create type public.feedback_contact_method as enum (
  'email',
  'linkedin',
  'instagram',
  'whatsapp',
  'phone',
  'other'
);

alter table public.private_feedback
  add column contact_method public.feedback_contact_method,
  add column contact_value text,
  add constraint private_feedback_contact_pair_check
    check (
      (contact_method is null and contact_value is null)
      or (contact_method is not null and contact_value is not null)
    ),
  add constraint private_feedback_contact_value_check
    check (
      contact_value is null
      or (
        contact_value = pg_catalog.btrim(contact_value)
        and pg_catalog.char_length(contact_value) between 1 and 240
      )
    );

create or replace function public.submit_private_feedback(
  p_message text,
  p_name text,
  p_contact_method public.feedback_contact_method,
  p_contact_value text,
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
    or ((p_contact_method is null) <> (p_contact_value is null))
    or (
      p_contact_value is not null
      and (
        p_contact_value <> pg_catalog.btrim(p_contact_value)
        or pg_catalog.char_length(p_contact_value) not between 1 and 240
        or p_contact_value ~ '[[:cntrl:]]'
        or exists (
          select 1
          from pg_catalog.unnest(array[
            1564, 8206, 8207, 8234, 8235, 8236, 8237, 8238,
            8294, 8295, 8296, 8297
          ]) as unsafe(code_point)
          where pg_catalog.strpos(
            p_contact_value,
            pg_catalog.chr(unsafe.code_point)
          ) > 0
        )
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
    contact_method,
    contact_value,
    source_context
  ) values (
    p_message,
    nullif(p_name, ''),
    p_contact_method,
    p_contact_value,
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

drop function public.list_private_feedback(text, integer);

create function public.list_private_feedback(
  p_filter text default 'active',
  p_limit integer default 50
)
returns table (
  id uuid,
  name text,
  contact_method public.feedback_contact_method,
  contact_value text,
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
    feedback.contact_method,
    feedback.contact_value,
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

drop function public.get_private_feedback(uuid);

create function public.get_private_feedback(p_feedback_id uuid)
returns table (
  id uuid,
  name text,
  contact_method public.feedback_contact_method,
  contact_value text,
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
    feedback.contact_method,
    feedback.contact_value,
    feedback.message,
    feedback.source_context,
    feedback.status,
    feedback.created_at,
    feedback.updated_at
  from public.private_feedback as feedback
  where feedback.id = p_feedback_id;
end;
$$;

revoke all on function public.submit_private_feedback(
  text,
  text,
  public.feedback_contact_method,
  text,
  public.feedback_source_context,
  text,
  text
) from public, anon, authenticated, service_role;
revoke all on function public.list_private_feedback(text, integer)
  from public, anon, authenticated, service_role;
revoke all on function public.get_private_feedback(uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.submit_private_feedback(
  text,
  text,
  public.feedback_contact_method,
  text,
  public.feedback_source_context,
  text,
  text
) to service_role;
grant execute on function public.list_private_feedback(text, integer) to authenticated;
grant execute on function public.get_private_feedback(uuid) to authenticated;
