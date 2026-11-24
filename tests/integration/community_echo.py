"""Additional Community EchoWall integration assertions for the disposable Postgres harness."""
from concurrent.futures import ThreadPoolExecutor


def verify(sql, request, passed, admin, visitor, synthetic_parent, rejected, moderate, expect_error):
    assert sql("select count(*) from pg_class where oid in ('public.echo_founder_replies'::regclass,'public.echo_reactions'::regclass,'public.echo_reaction_limits'::regclass) and relrowsecurity") == "3"
    assert sql("""select count(*) from
      (values ('anon'),('authenticated'),('service_role')) as r(role),
      (values ('public.echo_founder_replies'),('public.echo_reactions'),('public.echo_reaction_limits')) as t(tab)
      where has_table_privilege(r.role,t.tab,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')""") == "0"
    feed_args = dict(p_query='', p_page=1, p_size=12, p_popular=False, p_counts=True, p_actor=None)
    def feed(**overrides):
        status, result = request('/rpc/get_public_echo_feed', data={**feed_args, **overrides})
        assert status == 200 and isinstance(result['echoes'], list)
        return result

    def reply(body, role='authenticated', identity=admin, aal='aal2', parent=synthetic_parent):
        return request('/rpc/save_echo_founder_reply', role, {'p_echo_id': parent, 'p_body': body}, sub=identity, aal=aal)

    assert request('/rpc/get_public_echo_feed', 'anon', feed_args)[0] >= 400
    assert request('/rpc/get_public_echo_feed', 'authenticated', feed_args, sub=admin, aal='aal2')[0] >= 400
    assert reply('Unprivileged', role='anon')[0] >= 400
    assert reply('Unprivileged', role='service_role')[0] >= 400
    expect_error(reply('Unprivileged', identity=visitor), 'ECHOWALL_ADMIN_UNAUTHORIZED')
    expect_error(reply('Unprivileged', aal='aal1'), 'ECHOWALL_ADMIN_MFA_REQUIRED')
    sql("update public.admin_users set is_active=false")
    expect_error(reply('Disabled'), 'ECHOWALL_ADMIN_UNAUTHORIZED')
    sql("update public.admin_users set is_active=true")
    assert reply('Rejected parent', parent=rejected) == [200, False]
    assert reply('Founder response visible here.') == [200, True]
    assert reply('Updated response for this contribution.') == [200, True]
    assert request('/rpc/read_echo_founder_reply','authenticated',{'p_echo_id':synthetic_parent},sub=admin,aal='aal2') == [200,'Updated response for this contribution.']
    assert request('/rpc/read_echo_founder_reply','authenticated',{'p_echo_id':synthetic_parent},sub=visitor,aal='aal2')[0] >= 400
    assert moderate('hide','approved')[0] == 200
    assert all(row['id'] != synthetic_parent for row in feed()['echoes'])
    assert moderate('restore','hidden')[0] == 200
    assert next(row for row in feed()['echoes'] if row['id'] == synthetic_parent)['reply'] == 'Updated response for this contribution.'
    assert reply(None) == [200, True]
    assert next(row for row in feed()['echoes'] if row['id'] == synthetic_parent)['reply'] is None
    assert sql("select count(*) from public.echo_moderation_events where action like 'founder_reply_%' and reason is null") == "3"
    passed('Separate RLS/grants, Founder create/edit/remove audit, hidden/rejected/MFA/disabled-admin boundaries')

    def reaction(actor=0, network=0, liked=True, parent=synthetic_parent, role='service_role'):
        return request('/rpc/set_echo_reaction', role,
          dict(p_echo_id=parent, p_actor=f'{actor:064x}', p_network=f'{network:064x}', p_liked=liked))

    assert reaction(role='anon')[0] >= 400
    assert reaction(role='authenticated')[0] >= 400
    assert reaction(parent=rejected)[1]['status'] == 'unavailable'
    with ThreadPoolExecutor(max_workers=8) as pool:
        result = list(pool.map(lambda _: reaction(), range(8)))
    assert all(status == 200 and value['likes'] == 1 for status,value in result), 'Duplicate concurrent reaction'
    with ThreadPoolExecutor(max_workers=8) as pool:
        result = list(pool.map(lambda i: reaction(actor=i + 1), range(8)))
    assert sorted(value['likes'] for status,value in result) == list(range(2, 10))
    assert reaction(liked=False)[1] == {'status':'ok','liked':False,'likes':8}
    assert reaction(liked=False)[1]['likes'] == 8
    for _ in range(12):
        assert reaction(liked=False)[1]['status'] == 'ok'
    assert reaction(liked=False)[1]['status'] == 'rate_limited'
    assert feed(p_popular=True)['echoes'][0]['id'] == synthetic_parent
    assert next(r for r in feed(p_actor='1'.zfill(64))['echoes'] if r['id'] == synthetic_parent)['liked']
    assert not next(r for r in feed(p_actor='0'.zfill(64))['echoes'] if r['id'] == synthetic_parent)['liked']
    assert all(r['likes'] is None and not r['liked'] for r in feed(p_counts=False, p_popular=True)['echoes'])
    passed('Real RPC: concurrent same/different identities, unique counts, unlike, rate limiting, published-only sorting')

    # This database is the dedicated disposable fixture backend. No fixture mutates another environment.
    sql("""insert into public.echoes(display_name,message,category,status,approved_at,deletion_token_hash)
      select case when i=26 then 'qa: excluded markup' else 'Demo reader ' || lpad(i::text,2,'0') end,
        'Synthetic local gallery contribution, only present in the isolated test database.',
        'thought','approved', now()-i*interval '1 minute', 'community-review-'||i
      from generate_series(1,26) as v(i)""")
    assert feed(p_query='demo reader')['matched'] == 25
    assert len(feed(p_query='demo reader',p_page=3)['echoes']) == 1
    assert len(feed(p_query='demo reader',p_size=999)['echoes']) == 24
    assert feed(p_query='READER 25')['matched'] == 1
    assert feed(p_query='qa: excluded')['matched'] == 0
    assert feed(p_query='%')['matched'] == 0
    assert feed(p_query='not-present')['matched'] == 0
    ids = set(r['id'] for r in (feed(p_query='demo reader',p_page=1)['echoes']))
    assert not ids.intersection(r['id'] for r in feed(p_query='demo reader',p_page=2)['echoes'])
    assert reply('Thank you for bringing a new perspective to this local demonstration.') == [200, True]
    sql("""update public.echoes set display_name='Demo Alex',
      message='Finding thoughtful people and new ideas in the same place makes all the difference.',
      approved_at=now()+interval '1 second'
      where deletion_token_hash in (select deletion_token_hash from public.echoes
        where exists (select 1 from public.echo_founder_replies f where f.echo_id=echoes.id))""")
    sql("""update public.echoes set display_name='Demo Sofia',
      message='Me encanta descubrir nuevas historias y perspectivas en esta comunidad.'
      where deletion_token_hash='community-review-1'""")
    passed('Published count, literal cross-page name search, stable page order, synthetic-content guard, bounded page size')
    if moderate('hide','approved')[0] != 200: raise AssertionError('Could not establish hidden eligibility')
    assert reaction(network=1)[1]['status'] == 'unavailable'
    assert moderate('restore','hidden')[0] == 200
    passed('Hidden echoes cannot react and restore reinstates the existing visibility rules')

    sql("""begin;
      insert into public.echoes(display_name,message,status,approved_at,deletion_token_hash)
        values ('Demo deletion','Local cascade dependency check','approved',now(),'community-cascade-temporary');
      insert into public.echo_founder_replies(echo_id,body) select id,'Local child' from public.echoes where deletion_token_hash='community-cascade-temporary';
      insert into public.echo_reactions(echo_id,actor_key) select id,decode(repeat('29',32),'hex') from public.echoes where deletion_token_hash='community-cascade-temporary';
      delete from public.echoes where deletion_token_hash='community-cascade-temporary';
      do $$ begin
        if exists(select from public.echo_founder_replies where body='Local child') or exists(select from public.echo_reactions where actor_key=decode(repeat('29',32),'hex'))
        then raise exception 'Unexpected leftover local only rows'; end if;
      end $$;
      rollback;""")
    passed('Synthetic hard-delete cascade removes dependent replies and likes')
