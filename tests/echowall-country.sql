-- Run on an isolated PostgreSQL 17 database after the EchoWall foundation and country migrations.
begin;
do $$
begin
  if has_table_privilege('anon', 'public.echoes', 'SELECT')
     or has_table_privilege('authenticated', 'public.echoes', 'SELECT')
     or has_function_privilege('anon', 'public.submit_echo_with_country(text,text,public.echo_category,text,text,text,text,text,text,text,boolean)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.submit_echo_with_country(text,text,public.echo_category,text,text,text,text,text,text,text,boolean)', 'EXECUTE') then
    raise exception 'EchoWall country permissions are too broad';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.echoes'::regclass) then
    raise exception 'EchoWall RLS was disabled';
  end if;
end;
$$;

set local role service_role;
do $$
declare
  chosen uuid;
  old_client uuid;
begin
  chosen := public.submit_echo_with_country(
    'Synthetic test A', 'A synthetic message for the isolated test.', null, null, 'network-a', null,
    'message-a', 'token-a', 'deletion-a', 'DE', true
  );
  old_client := public.submit_echo(
    'Synthetic test B', 'Another synthetic message for the isolated test.', null, null, 'network-b', null,
    'message-b', 'token-b', 'deletion-b'
  );
  if not exists (select 1 from public.echoes where id = chosen and status = 'pending'
      and approved_at is null and country_code = 'DE' and include_in_community_map) then
    raise exception 'Country declaration bypassed moderation or lost opt-in';
  end if;
  if not exists (select 1 from public.echoes where id = old_client and status = 'pending'
      and country_code is null and not include_in_community_map) then
    raise exception 'Legacy RPC no longer supports omission';
  end if;

  begin
    perform public.submit_echo_with_country(
      'Synthetic test C', 'A message in an invalid country test.', null, null, 'network-c', null,
      'message-c', 'token-c', 'deletion-c', 'XX', false
    );
    raise exception 'Invalid country should have failed';
  exception when check_violation then null;
  end;
  begin
    perform public.submit_echo_with_country(
      'Synthetic test C', 'A message with an invalid opt-in.', null, null, 'network-c', null,
      'message-c', 'token-c', 'deletion-c', null, true
    );
    raise exception 'Map opt-in requires a country';
  exception when check_violation then null;
  end;
  -- Reusing the synthetic token succeeds after both rollbacks, proving no rate-limit entry leaked.
  perform public.submit_echo_with_country(
    'Synthetic test C', 'A corrected message in the isolated test.', null, null, 'network-c', null,
    'message-c', 'token-c', 'deletion-c', 'GR', false
  );

  begin
    perform public.submit_echo_with_country(
      'Synthetic test D', 'A replay attempt in the isolated test.', null, null, 'network-c', null,
      'message-d', 'token-c', 'deletion-d', 'GR', false
    );
    raise exception 'Replay should have failed';
  exception when raise_exception then
    if sqlerrm <> 'ECHOWALL_TOKEN_REPLAY' then raise; end if;
  end;
end;
$$;
rollback;
