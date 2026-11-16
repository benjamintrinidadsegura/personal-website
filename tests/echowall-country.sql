-- ISOLATED TEST ONLY: PostgreSQL 17 with the EchoWall foundation, admin, recovery and pending country migrations.
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
reset role;

-- Local auth test harness supplies auth.uid()/auth.jwt(); no real accounts are used.
insert into auth.users (id) values ('00000000-0000-4000-8000-000000000001');
insert into public.admin_users (user_id) values ('00000000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"aal":"aal2"}', true);
set local role authenticated;
do $$
declare
  target uuid;
begin
  -- A privileged fixture row is located through the existing authorized moderation RPC.
  select id into target from public.list_echoes_for_moderation('pending', 50)
    where display_name = 'Synthetic test A';
  if target is null then raise exception 'Missing synthetic moderation fixture'; end if;
  perform public.moderate_echo(target, 'approve', 'pending');
  perform public.moderate_echo(target, 'hide', 'approved', 'Isolated privacy test');
  perform public.moderate_echo(target, 'delete', 'hidden', 'Isolated deletion test');
  perform public.moderate_echo(target, 'restore_deleted', 'deleted', 'Isolated recovery test');
end;
$$;
reset role;
do $$
begin
  if not exists (select 1 from public.echoes where display_name = 'Synthetic test A'
    and status = 'hidden' and approved_at is null and country_code = 'DE') then
    raise exception 'Deleted recovery must remain non-public and require deliberate republication';
  end if;
end;
$$;
set local role anon;
do $$
begin
  begin
    perform country_code from public.echoes;
    raise exception 'Anon read should be denied';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.submit_echo_with_country('Synthetic', 'A synthetic denied request.', null, null,
      'denied-network', null, 'denied-message', 'denied-token', 'denied-deletion', 'DE', true);
    raise exception 'Anon country RPC should be denied';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
