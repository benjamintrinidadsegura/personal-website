def verify(sql, request, passed, admin, visitor, legacy, moderate, expect_error, submission):
    feed_args = dict(p_query='', p_page=1, p_size=24, p_popular=False, p_counts=True)
    endpoint = '/rpc/get_public_echo_feed_with_countries'
    create = '/rpc/submit_echo_with_public_country'
    withdraw = '/rpc/withdraw_echo_public_country'
    assert sql("select relrowsecurity from pg_class where oid='public.echo_public_countries'::regclass") == 't'
    assert sql("""select not has_table_privilege('anon','public.echo_public_countries','SELECT')
      and not has_table_privilege('authenticated','public.echo_public_countries','SELECT')
      and not has_table_privilege('service_role','public.echo_public_countries','SELECT')
      and has_column_privilege('service_role','public.echo_public_countries','country_code','INSERT')""") == 't'
    assert request(endpoint, 'anon', feed_args)[0] >= 400
    assert request(endpoint, 'authenticated', feed_args, sub=visitor)[0] >= 400
    args = {**submission('public-country'), 'p_public_country_code':'ES', 'p_aggregate':False}
    assert request(create, 'anon', args)[0] >= 400
    status, echo = request(create, data=args)
    assert status == 200 and isinstance(echo, str)
    assert sql(f"select status || ':' || coalesce(country_code,'-') from public.echoes where id='{echo}'") == 'pending:-'
    assert request(create, data={**submission('public-invalid'), 'p_public_country_code':'ZZ', 'p_aggregate':False})[0] >= 400
    assert sql("select count(*) from public.echo_public_countries") == '1'
    def read_feed(**patch):
        status, response = request(endpoint, data={**feed_args, **patch})
        assert status == 200
        return {row['id']: row for row in response['echoes']}
    assert echo not in read_feed()
    assert legacy in read_feed() and 'public_country_code' not in read_feed()[legacy]
    assert request('/rpc/moderate_echo','authenticated',dict(p_echo_id=echo,p_action='approve',p_expected_status='pending',p_reason=None),sub=admin,aal='aal2')[0] == 200
    assert read_feed()[echo]['public_country_code'] == 'ES'
    assert read_feed(p_query=sql(f"select display_name from public.echoes where id='{echo}'"), p_popular=True, p_size=1)[echo]['public_country_code'] == 'ES'
    args = dict(p_echo_id=echo)
    expect_error(request(withdraw,'authenticated',args,sub=visitor,aal='aal2'),'ECHOWALL_ADMIN_UNAUTHORIZED')
    expect_error(request(withdraw,'authenticated',args,sub=admin,aal='aal1'),'ECHOWALL_ADMIN_MFA_REQUIRED')
    assert request(withdraw,'authenticated',args,sub=admin,aal='aal2') == [200, True]
    assert 'public_country_code' not in read_feed()[echo]
    passed('Public-country grant isolation, published-only projection, search/sort ordering, legacy exclusion and MFA withdrawal')
    for key, aggregate in [('public-delete', True), ('public-demo', False)]:
        status, echo = request(create, data={**submission(key), 'p_display_name':'Demo Deniz', 'p_public_country_code':'DE', 'p_aggregate':aggregate})
        assert status == 200
        if key == 'public-delete':
            assert sql(f"select country_code from public.echoes where id='{echo}'") == 'DE'
            assert request('/rpc/moderate_echo','authenticated',dict(p_echo_id=echo,p_action='delete',p_expected_status='pending',p_reason='Local fixture removal'),sub=admin,aal='aal2')[0] == 200
            assert sql(f"select count(*) from public.echo_public_countries where echo_id='{echo}'") == '0'
        else:
            assert request('/rpc/moderate_echo','authenticated',dict(p_echo_id=echo,p_action='approve',p_expected_status='pending',p_reason=None),sub=admin,aal='aal2')[0] == 200
    passed('Separate aggregate opt-in and irreversible display-metadata removal on soft deletion')