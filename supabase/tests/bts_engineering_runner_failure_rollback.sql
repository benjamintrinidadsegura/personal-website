do $$
declare
  v_admin uuid;
  v_suffix text := pg_catalog.replace(gen_random_uuid()::text, '-', '');
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('bts-engineering-failure-verification', 0));

  if exists (
    select 1 from public.writing_articles
    where slug like 'bts-engineering-%' or slug like 'codex-newsletter-rollback-%'
  ) then
    raise exception 'BTS_ENGINEERING_PREEXISTING_RESIDUE';
  end if;

  select user_id into v_admin from public.admin_users
  where role = 'admin' and is_active = true order by created_at limit 1;
  if v_admin is null then raise exception 'VERIFY_NO_ACTIVE_ADMIN'; end if;

  insert into public.writing_articles (
    id, author_id, slug, title, deck, excerpt, body, content_type, topics,
    status, published_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_admin, 'bts-engineering-failure-' || v_suffix,
    'Expected rollback fixture', '',
    'This disposable row must be rolled back after the expected assertion failure.',
    'This disposable body exists only to prove connection-close rollback behavior.',
    'essay', array['Ideas'], 'published', pg_catalog.clock_timestamp(),
    pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  );

  raise exception 'BTS_EXPECTED_ASSERTION_FAILURE';
end;
$$;
