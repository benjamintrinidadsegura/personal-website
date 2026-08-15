begin;

do $$
declare
  v_admin uuid;
  v_article uuid := '11111111-1111-4111-8111-111111111111';
  v_draft uuid := '11111111-1111-4111-8111-111111111112';
  v_confirmed_1 uuid := '22222222-2222-4222-8222-222222222201';
  v_confirmed_2 uuid := '22222222-2222-4222-8222-222222222202';
  v_confirmed_3 uuid := '22222222-2222-4222-8222-222222222203';
  v_confirmed_4 uuid := '22222222-2222-4222-8222-222222222204';
  v_pending uuid := '22222222-2222-4222-8222-222222222205';
  v_unsubscribed uuid := '22222222-2222-4222-8222-222222222206';
  v_suppressed uuid := '22222222-2222-4222-8222-222222222207';
  v_edition_sent uuid;
  v_edition_failed uuid;
  v_claim record;
  v_lookup record;
  v_result text;
  v_count bigint;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  select user_id into v_admin from public.admin_users
  where role = 'admin' and is_active = true order by created_at limit 1;
  if v_admin is null then raise exception 'VERIFY_NO_ACTIVE_ADMIN'; end if;
  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object('sub', v_admin, 'aal', 'aal2', 'role', 'authenticated')::text,
    true
  );

  if pg_catalog.has_table_privilege('anon', 'public.newsletter_editions', 'select')
    or pg_catalog.has_table_privilege('authenticated', 'public.newsletter_editions', 'select')
    or pg_catalog.has_table_privilege('service_role', 'public.newsletter_editions', 'select')
    or pg_catalog.has_table_privilege('anon', 'public.newsletter_deliveries', 'select')
    or pg_catalog.has_table_privilege('authenticated', 'public.newsletter_provider_events', 'select')
  then raise exception 'VERIFY_TABLE_PRIVILEGE_LEAK'; end if;
  if pg_catalog.has_function_privilege('authenticated', 'public.ingest_newsletter_provider_event(text,public.newsletter_provider_event_type,text,text,timestamptz)', 'execute')
    or not pg_catalog.has_function_privilege('service_role', 'public.ingest_newsletter_provider_event(text,public.newsletter_provider_event_type,text,text,timestamptz)', 'execute')
  then raise exception 'VERIFY_WEBHOOK_PRIVILEGE_BOUNDARY'; end if;

  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object('sub', v_admin, 'aal', 'aal1', 'role', 'authenticated')::text,
    true
  );
  begin
    perform public.list_newsletter_editions(1);
    raise exception 'VERIFY_AAL1_ACCEPTED';
  exception when raise_exception then
    if sqlerrm = 'VERIFY_AAL1_ACCEPTED' or pg_catalog.strpos(sqlerrm, 'BTS_ADMIN_MFA_REQUIRED') = 0 then raise; end if;
  end;
  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object('sub', v_admin, 'aal', 'aal2', 'role', 'authenticated')::text,
    true
  );

  update public.admin_users set is_active = false where user_id = v_admin;
  begin
    perform public.list_newsletter_editions(1);
    raise exception 'VERIFY_REVOKED_ADMIN_ACCEPTED';
  exception when raise_exception then
    if sqlerrm = 'VERIFY_REVOKED_ADMIN_ACCEPTED' or pg_catalog.strpos(sqlerrm, 'BTS_ADMIN_UNAUTHORIZED') = 0 then raise; end if;
  end;
  update public.admin_users set is_active = true where user_id = v_admin;

  insert into public.writing_articles (
    id, author_id, slug, title, deck, excerpt, body, content_type, topics,
    status, published_at, created_at, updated_at
  ) values (
    v_article, v_admin, 'codex-newsletter-rollback-20260819',
    'Rollback-only published Writing', '',
    'A stable excerpt used only inside a rolled-back DEV transaction.',
    'This is sufficient body text for a disposable published Writing fixture.',
    'essay', array['Ideas'], 'published', pg_catalog.clock_timestamp(),
    pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  );
  insert into public.writing_articles (id, author_id, title, excerpt, body, content_type, topics, status)
  values (v_draft, v_admin, 'Rollback-only draft', 'A draft excerpt that must remain ineligible.', 'A draft body that must never produce a newsletter edition.', 'essay', array['Ideas'], 'draft');

  begin
    perform public.create_newsletter_edition(v_draft, 'Draft must fail', '', '', 'https://bts.online');
    raise exception 'VERIFY_DRAFT_ACCEPTED';
  exception when raise_exception then
    if sqlerrm = 'VERIFY_DRAFT_ACCEPTED' or pg_catalog.strpos(sqlerrm, 'NEWSLETTER_WRITING_NOT_PUBLISHED') = 0 then raise; end if;
  end;

  insert into public.newsletter_subscribers (
    id, email, email_hash, status, consent_version, confirmation_used_at,
    unsubscribe_nonce, requested_at, confirmed_at, updated_at
  ) values
    (v_confirmed_1, 'rollback-newsletter-1@example.invalid', repeat('1', 64), 'confirmed', 'newsletter-consent-v1', v_now - interval '1 second', '33333333-3333-4333-8333-333333333301', v_now - interval '2 seconds', v_now - interval '1 second', v_now),
    (v_confirmed_2, 'rollback-newsletter-2@example.invalid', repeat('2', 64), 'confirmed', 'newsletter-consent-v1', v_now - interval '1 second', '33333333-3333-4333-8333-333333333302', v_now - interval '2 seconds', v_now - interval '1 second', v_now),
    (v_confirmed_3, 'rollback-newsletter-3@example.invalid', repeat('3', 64), 'confirmed', 'newsletter-consent-v1', v_now - interval '1 second', '33333333-3333-4333-8333-333333333303', v_now - interval '2 seconds', v_now - interval '1 second', v_now),
    (v_confirmed_4, 'rollback-newsletter-4@example.invalid', repeat('4', 64), 'confirmed', 'newsletter-consent-v1', v_now - interval '1 second', '33333333-3333-4333-8333-333333333304', v_now - interval '2 seconds', v_now - interval '1 second', v_now);
  insert into public.newsletter_subscribers (
    id, email, email_hash, status, consent_version, confirmation_token_hash,
    confirmation_expires_at, requested_at, updated_at
  ) values (
    v_pending, 'rollback-newsletter-pending@example.invalid', repeat('5', 64), 'pending',
    'newsletter-consent-v1', repeat('a', 64), v_now + interval '1 hour',
    v_now - interval '1 second', v_now
  );
  insert into public.newsletter_subscribers (
    id, email, email_hash, status, consent_version, confirmation_used_at,
    unsubscribe_nonce, requested_at, confirmed_at, unsubscribed_at, updated_at
  ) values (
    v_unsubscribed, null, repeat('6', 64), 'unsubscribed', 'newsletter-consent-v1',
    v_now - interval '2 seconds', '33333333-3333-4333-8333-333333333306',
    v_now - interval '3 seconds', v_now - interval '2 seconds', v_now - interval '1 second', v_now
  );
  insert into public.newsletter_subscribers (
    id, email, email_hash, status, consent_version, confirmation_used_at,
    unsubscribe_nonce, requested_at, confirmed_at, suppressed_at, updated_at
  ) values (
    v_suppressed, null, repeat('7', 64), 'suppressed', 'newsletter-consent-v1',
    v_now - interval '2 seconds', '33333333-3333-4333-8333-333333333307',
    v_now - interval '3 seconds', v_now - interval '2 seconds', v_now - interval '1 second', v_now
  );

  v_edition_sent := public.create_newsletter_edition(
    v_article, 'Rollback-only edition', 'No remote images or tracking.',
    'A short plain-text introduction.', 'https://bts.online'
  );
  update public.writing_articles set
    title = 'Later Writing title', excerpt = 'Later Writing excerpt that must not alter the edition.',
    updated_at = pg_catalog.clock_timestamp()
  where id = v_article;
  if not exists (
    select 1 from public.newsletter_editions where id = v_edition_sent
      and article_title = 'Rollback-only published Writing'
      and article_excerpt = 'A stable excerpt used only inside a rolled-back DEV transaction.'
  ) then raise exception 'VERIFY_SNAPSHOT_CHANGED'; end if;

  perform public.begin_newsletter_send(v_edition_sent, 1);
  begin
    perform public.begin_newsletter_send(v_edition_sent, 1);
    raise exception 'VERIFY_STALE_VERSION_ACCEPTED';
  exception when raise_exception then
    if sqlerrm = 'VERIFY_STALE_VERSION_ACCEPTED' or pg_catalog.strpos(sqlerrm, 'NEWSLETTER_STALE_OR_MISSING') = 0 then raise; end if;
  end;
  select pg_catalog.count(*) into v_count from public.newsletter_deliveries where edition_id = v_edition_sent;
  if v_count <> 4 then raise exception 'VERIFY_ELIGIBILITY_FILTER_COUNT_%', v_count; end if;

  loop
    select * into v_claim from public.claim_newsletter_delivery(v_edition_sent);
    exit when not found;
    if not public.recheck_newsletter_delivery_eligibility(v_claim.delivery_id) then
      raise exception 'VERIFY_CONFIRMED_RECHECK_FAILED';
    end if;
    if not public.complete_newsletter_delivery(
      v_claim.delivery_id, 'sent', 'dev-message-' || v_claim.subscriber_id::text, null
    ) then raise exception 'VERIFY_ACCEPT_COMPLETE_FAILED'; end if;
  end loop;
  if public.finish_newsletter_send(v_edition_sent) <> 'sent' then raise exception 'VERIFY_SENT_FINALIZATION_FAILED'; end if;
  begin
    update public.newsletter_editions set subject = 'Mutated after send' where id = v_edition_sent;
    raise exception 'VERIFY_IMMUTABLE_UPDATE_ACCEPTED';
  exception when raise_exception then
    if sqlerrm = 'VERIFY_IMMUTABLE_UPDATE_ACCEPTED' or pg_catalog.strpos(sqlerrm, 'NEWSLETTER_EDITION_IMMUTABLE') = 0 then raise; end if;
  end;
  if public.complete_newsletter_delivery(
    (select id from public.newsletter_deliveries where edition_id = v_edition_sent limit 1),
    'sent', 'duplicate-message', null
  ) then raise exception 'VERIFY_COMPLETED_DELIVERY_REOPENED'; end if;

  v_edition_failed := public.create_newsletter_edition(
    v_article, 'Rollback-only failure edition', '', '', 'https://bts.online'
  );
  perform public.begin_newsletter_send(v_edition_failed, 1);
  select * into v_lookup from public.lookup_newsletter_subscriber(repeat('4', 64));
  if not found or v_lookup.email <> 'rollback-newsletter-4@example.invalid' or v_lookup.status <> 'confirmed' then
    raise exception 'VERIFY_EXACT_LOOKUP_FAILED';
  end if;
  if public.suppress_newsletter_subscriber(repeat('4', 64)) <> 'suppressed' then raise exception 'VERIFY_MANUAL_SUPPRESSION_FAILED'; end if;
  if public.suppress_newsletter_subscriber(repeat('5', 64)) <> 'not_eligible' then raise exception 'VERIFY_PENDING_SUPPRESSION_RESULT'; end if;
  if (select status from public.newsletter_subscribers where id = v_pending) <> 'pending' then raise exception 'VERIFY_PENDING_CONSENT_MANUFACTURED'; end if;
  select * into v_lookup from public.lookup_newsletter_subscriber(repeat('4', 64));
  if not found or v_lookup.email is not null or v_lookup.status <> 'suppressed' then raise exception 'VERIFY_SUPPRESSION_SCRUB_FAILED'; end if;

  loop
    select * into v_claim from public.claim_newsletter_delivery(v_edition_failed);
    exit when not found;
    if v_claim.subscriber_id = v_confirmed_1 then
      perform public.complete_newsletter_delivery(v_claim.delivery_id, 'reconciliation_required', null, 'timeout_or_network');
    elsif v_claim.subscriber_id = v_confirmed_2 then
      perform public.complete_newsletter_delivery(v_claim.delivery_id, 'failed', null, 'provider_http_400');
    else
      perform public.complete_newsletter_delivery(v_claim.delivery_id, 'sent', 'dev-second-' || v_claim.subscriber_id::text, null);
    end if;
  end loop;
  if public.finish_newsletter_send(v_edition_failed) <> 'failed' then raise exception 'VERIFY_FAILED_FINALIZATION_FAILED'; end if;
  if not exists (
    select 1 from public.newsletter_deliveries where edition_id = v_edition_failed and state = 'skipped' and subscriber_id = v_confirmed_4
  ) then raise exception 'VERIFY_AROUND_SEND_SUPPRESSION_NOT_SKIPPED'; end if;

  v_result := public.ingest_newsletter_provider_event(
    'dev-event-hard-bounce', 'hard_bounce', 'dev-message-' || v_confirmed_1::text,
    repeat('a', 64), pg_catalog.clock_timestamp()
  );
  if v_result <> 'recorded' then raise exception 'VERIFY_HARD_BOUNCE_EVENT_%', v_result; end if;
  if public.ingest_newsletter_provider_event(
    'dev-event-hard-bounce', 'hard_bounce', 'dev-message-' || v_confirmed_1::text,
    repeat('a', 64), pg_catalog.clock_timestamp()
  ) <> 'replay' then raise exception 'VERIFY_WEBHOOK_REPLAY_FAILED'; end if;
  if public.ingest_newsletter_provider_event(
    'dev-event-complaint', 'complaint', 'dev-message-' || v_confirmed_2::text,
    repeat('b', 64), pg_catalog.clock_timestamp()
  ) <> 'recorded' then raise exception 'VERIFY_COMPLAINT_EVENT_FAILED'; end if;
  if public.ingest_newsletter_provider_event(
    'dev-event-unsubscribe', 'unsubscribe', 'dev-message-' || v_confirmed_3::text,
    repeat('c', 64), pg_catalog.clock_timestamp()
  ) <> 'recorded' then raise exception 'VERIFY_UNSUBSCRIBE_EVENT_FAILED'; end if;
  if public.ingest_newsletter_provider_event(
    'dev-event-late-delivered', 'delivered', 'dev-message-' || v_confirmed_1::text,
    repeat('d', 64), pg_catalog.clock_timestamp() + interval '1 minute'
  ) <> 'recorded' then raise exception 'VERIFY_LATE_DELIVERED_EVENT_FAILED'; end if;
  if exists (
    select 1 from public.newsletter_subscribers
    where id in (v_confirmed_1, v_confirmed_2, v_confirmed_3)
      and (status <> 'suppressed' or email is not null)
  ) then raise exception 'VERIFY_PROVIDER_SUPPRESSION_OR_ORDERING_FAILED'; end if;
  if exists (select 1 from public.newsletter_provider_events where retention_until is null) then
    raise exception 'VERIFY_PROVIDER_RETENTION_UNBOUNDED';
  end if;
end;
$$;

select 'NEWSLETTER_DELIVERY_ROLLBACK_VERIFIED' as result;

rollback;
