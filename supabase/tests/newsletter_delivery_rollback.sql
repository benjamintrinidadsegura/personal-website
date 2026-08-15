do $$
declare
  v_run uuid := gen_random_uuid();
  v_suffix text;
  v_admin uuid;
  v_non_admin uuid := gen_random_uuid();
  v_article uuid := gen_random_uuid();
  v_draft uuid := gen_random_uuid();
  v_confirmed_1 uuid := gen_random_uuid();
  v_confirmed_2 uuid := gen_random_uuid();
  v_confirmed_3 uuid := gen_random_uuid();
  v_confirmed_4 uuid := gen_random_uuid();
  v_pending uuid := gen_random_uuid();
  v_unsubscribed uuid := gen_random_uuid();
  v_suppressed uuid := gen_random_uuid();
  v_email_1 text;
  v_email_2 text;
  v_email_3 text;
  v_email_4 text;
  v_edition_sent uuid;
  v_edition_failed uuid;
  v_claim record;
  v_lookup record;
  v_result text;
  v_count bigint;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('bts-engineering-newsletter-verification', 0));

  if exists (
    select 1 from public.writing_articles
    where slug like 'bts-engineering-%' or slug like 'codex-newsletter-rollback-%'
  ) or exists (
    select 1 from public.newsletter_subscribers
    where email like 'bts-engineering-%@example.invalid' or email like 'rollback-newsletter-%@example.invalid'
  ) then
    raise exception 'BTS_ENGINEERING_PREEXISTING_RESIDUE';
  end if;

  v_suffix := pg_catalog.replace(v_run::text, '-', '');
  v_email_1 := 'bts-engineering-' || v_suffix || '-1@example.invalid';
  v_email_2 := 'bts-engineering-' || v_suffix || '-2@example.invalid';
  v_email_3 := 'bts-engineering-' || v_suffix || '-3@example.invalid';
  v_email_4 := 'bts-engineering-' || v_suffix || '-4@example.invalid';

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
    pg_catalog.json_build_object('sub', v_non_admin, 'aal', 'aal2', 'role', 'authenticated')::text,
    true
  );
  begin
    perform public.list_newsletter_editions(1);
    raise exception 'VERIFY_NON_ADMIN_ACCEPTED';
  exception when raise_exception then
    if sqlerrm = 'VERIFY_NON_ADMIN_ACCEPTED' or pg_catalog.strpos(sqlerrm, 'BTS_ADMIN_UNAUTHORIZED') = 0 then raise; end if;
  end;

  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object('sub', v_admin, 'aal', 'aal2', 'role', 'authenticated')::text,
    true
  );

  insert into public.writing_articles (
    id, author_id, slug, title, deck, excerpt, body, content_type, topics,
    status, published_at, created_at, updated_at
  ) values (
    v_article, v_admin, 'bts-engineering-newsletter-' || v_suffix,
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
    (v_confirmed_1, v_email_1, pg_catalog.md5(v_email_1) || pg_catalog.md5('bts-' || v_email_1), 'confirmed', 'newsletter-consent-v1', v_now - interval '1 second', gen_random_uuid(), v_now - interval '2 seconds', v_now - interval '1 second', v_now),
    (v_confirmed_2, v_email_2, pg_catalog.md5(v_email_2) || pg_catalog.md5('bts-' || v_email_2), 'confirmed', 'newsletter-consent-v1', v_now - interval '1 second', gen_random_uuid(), v_now - interval '2 seconds', v_now - interval '1 second', v_now),
    (v_confirmed_3, v_email_3, pg_catalog.md5(v_email_3) || pg_catalog.md5('bts-' || v_email_3), 'confirmed', 'newsletter-consent-v1', v_now - interval '1 second', gen_random_uuid(), v_now - interval '2 seconds', v_now - interval '1 second', v_now),
    (v_confirmed_4, v_email_4, pg_catalog.md5(v_email_4) || pg_catalog.md5('bts-' || v_email_4), 'confirmed', 'newsletter-consent-v1', v_now - interval '1 second', gen_random_uuid(), v_now - interval '2 seconds', v_now - interval '1 second', v_now);
  insert into public.newsletter_subscribers (
    id, email, email_hash, status, consent_version, confirmation_token_hash,
    confirmation_expires_at, requested_at, updated_at
  ) values (
    v_pending, 'bts-engineering-' || v_suffix || '-pending@example.invalid',
    pg_catalog.md5(v_pending::text) || pg_catalog.md5('bts-' || v_pending::text), 'pending',
    'newsletter-consent-v1', pg_catalog.md5('token-' || v_pending::text) || pg_catalog.md5(v_pending::text || '-token'),
    v_now + interval '1 hour', v_now - interval '1 second', v_now
  );
  insert into public.newsletter_subscribers (
    id, email, email_hash, status, consent_version, confirmation_used_at,
    unsubscribe_nonce, requested_at, confirmed_at, unsubscribed_at, updated_at
  ) values (
    v_unsubscribed, null, pg_catalog.md5(v_unsubscribed::text) || pg_catalog.md5('bts-' || v_unsubscribed::text), 'unsubscribed', 'newsletter-consent-v1',
    v_now - interval '2 seconds', gen_random_uuid(), v_now - interval '3 seconds',
    v_now - interval '2 seconds', v_now - interval '1 second', v_now
  );
  insert into public.newsletter_subscribers (
    id, email, email_hash, status, consent_version, confirmation_used_at,
    unsubscribe_nonce, requested_at, confirmed_at, suppressed_at, updated_at
  ) values (
    v_suppressed, null, pg_catalog.md5(v_suppressed::text) || pg_catalog.md5('bts-' || v_suppressed::text), 'suppressed', 'newsletter-consent-v1',
    v_now - interval '2 seconds', gen_random_uuid(), v_now - interval '3 seconds',
    v_now - interval '2 seconds', v_now - interval '1 second', v_now
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
    if not public.recheck_newsletter_delivery_eligibility(v_claim.delivery_id) then raise exception 'VERIFY_CONFIRMED_RECHECK_FAILED'; end if;
    if not public.complete_newsletter_delivery(v_claim.delivery_id, 'sent', 'dev-message-' || v_run::text || '-' || v_claim.subscriber_id::text, null)
    then raise exception 'VERIFY_ACCEPT_COMPLETE_FAILED'; end if;
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

  v_edition_failed := public.create_newsletter_edition(v_article, 'Rollback-only failure edition', '', '', 'https://bts.online');
  perform public.begin_newsletter_send(v_edition_failed, 1);
  select * into v_lookup from public.lookup_newsletter_subscriber(pg_catalog.md5(v_email_4) || pg_catalog.md5('bts-' || v_email_4));
  if not found or v_lookup.email <> v_email_4 or v_lookup.status <> 'confirmed' then raise exception 'VERIFY_EXACT_LOOKUP_FAILED'; end if;
  if public.suppress_newsletter_subscriber(pg_catalog.md5(v_email_4) || pg_catalog.md5('bts-' || v_email_4)) <> 'suppressed'
  then raise exception 'VERIFY_MANUAL_SUPPRESSION_FAILED'; end if;
  if public.suppress_newsletter_subscriber(pg_catalog.md5(v_pending::text) || pg_catalog.md5('bts-' || v_pending::text)) <> 'not_eligible'
  then raise exception 'VERIFY_PENDING_SUPPRESSION_RESULT'; end if;
  if (select status from public.newsletter_subscribers where id = v_pending) <> 'pending' then raise exception 'VERIFY_PENDING_CONSENT_MANUFACTURED'; end if;
  select * into v_lookup from public.lookup_newsletter_subscriber(pg_catalog.md5(v_email_4) || pg_catalog.md5('bts-' || v_email_4));
  if not found or v_lookup.email is not null or v_lookup.status <> 'suppressed' then raise exception 'VERIFY_SUPPRESSION_SCRUB_FAILED'; end if;

  loop
    select * into v_claim from public.claim_newsletter_delivery(v_edition_failed);
    exit when not found;
    if v_claim.subscriber_id = v_confirmed_1 then
      perform public.complete_newsletter_delivery(v_claim.delivery_id, 'reconciliation_required', null, 'timeout_or_network');
    elsif v_claim.subscriber_id = v_confirmed_2 then
      perform public.complete_newsletter_delivery(v_claim.delivery_id, 'failed', null, 'provider_http_400');
    else
      perform public.complete_newsletter_delivery(v_claim.delivery_id, 'sent', 'dev-second-' || v_run::text || '-' || v_claim.subscriber_id::text, null);
    end if;
  end loop;
  if public.finish_newsletter_send(v_edition_failed) <> 'failed' then raise exception 'VERIFY_FAILED_FINALIZATION_FAILED'; end if;
  if not exists (
    select 1 from public.newsletter_deliveries where edition_id = v_edition_failed and state = 'skipped' and subscriber_id = v_confirmed_4
  ) then raise exception 'VERIFY_AROUND_SEND_SUPPRESSION_NOT_SKIPPED'; end if;

  v_result := public.ingest_newsletter_provider_event(
    'bts-engineering-' || v_run::text || '-hard-bounce', 'hard_bounce',
    'dev-message-' || v_run::text || '-' || v_confirmed_1::text,
    pg_catalog.md5('a-' || v_run::text) || pg_catalog.md5(v_run::text || '-a'), pg_catalog.clock_timestamp()
  );
  if v_result <> 'recorded' then raise exception 'VERIFY_HARD_BOUNCE_EVENT_%', v_result; end if;
  if public.ingest_newsletter_provider_event(
    'bts-engineering-' || v_run::text || '-hard-bounce', 'hard_bounce',
    'dev-message-' || v_run::text || '-' || v_confirmed_1::text,
    pg_catalog.md5('a-' || v_run::text) || pg_catalog.md5(v_run::text || '-a'), pg_catalog.clock_timestamp()
  ) <> 'replay' then raise exception 'VERIFY_WEBHOOK_REPLAY_FAILED'; end if;
  if public.ingest_newsletter_provider_event(
    'bts-engineering-' || v_run::text || '-complaint', 'complaint',
    'dev-message-' || v_run::text || '-' || v_confirmed_2::text,
    pg_catalog.md5('b-' || v_run::text) || pg_catalog.md5(v_run::text || '-b'), pg_catalog.clock_timestamp()
  ) <> 'recorded' then raise exception 'VERIFY_COMPLAINT_EVENT_FAILED'; end if;
  if public.ingest_newsletter_provider_event(
    'bts-engineering-' || v_run::text || '-unsubscribe', 'unsubscribe',
    'dev-message-' || v_run::text || '-' || v_confirmed_3::text,
    pg_catalog.md5('c-' || v_run::text) || pg_catalog.md5(v_run::text || '-c'), pg_catalog.clock_timestamp()
  ) <> 'recorded' then raise exception 'VERIFY_UNSUBSCRIBE_EVENT_FAILED'; end if;
  if public.ingest_newsletter_provider_event(
    'bts-engineering-' || v_run::text || '-late-delivered', 'delivered',
    'dev-message-' || v_run::text || '-' || v_confirmed_1::text,
    pg_catalog.md5('d-' || v_run::text) || pg_catalog.md5(v_run::text || '-d'), pg_catalog.clock_timestamp() + interval '1 minute'
  ) <> 'recorded' then raise exception 'VERIFY_LATE_DELIVERED_EVENT_FAILED'; end if;
  if exists (
    select 1 from public.newsletter_subscribers
    where id in (v_confirmed_1, v_confirmed_2, v_confirmed_3)
      and (status <> 'suppressed' or email is not null)
  ) then raise exception 'VERIFY_PROVIDER_SUPPRESSION_OR_ORDERING_FAILED'; end if;
  if exists (select 1 from public.newsletter_provider_events where retention_until is null)
  then raise exception 'VERIFY_PROVIDER_RETENTION_UNBOUNDED'; end if;
  raise exception 'BTS_VERIFICATION_PASSED_ROLLED_BACK: NEWSLETTER_DELIVERY_ROLLBACK_VERIFIED';
end;
$$;
