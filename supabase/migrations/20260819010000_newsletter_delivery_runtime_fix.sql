create or replace function public.begin_newsletter_send(p_edition_id uuid, p_expected_version bigint)
returns table (version bigint, recipient_count bigint)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_state public.newsletter_edition_state;
  v_version bigint;
  v_count bigint;
begin
  perform public.assert_bts_admin(true);
  if p_edition_id is null or p_expected_version is null or p_expected_version < 1 then
    raise exception using message = 'NEWSLETTER_INVALID_INPUT', errcode = 'P0001';
  end if;
  select edition.state, edition.version into v_state, v_version
  from public.newsletter_editions as edition where edition.id = p_edition_id for update;
  if not found or v_version <> p_expected_version then
    raise exception using message = 'NEWSLETTER_STALE_OR_MISSING', errcode = 'P0001';
  end if;
  if v_state not in ('draft', 'sending') then
    raise exception using message = 'NEWSLETTER_SEND_NOT_ALLOWED', errcode = 'P0001';
  end if;
  if v_state = 'draft' then
    insert into public.newsletter_deliveries (edition_id, subscriber_id)
    select p_edition_id, subscriber.id from public.newsletter_subscribers as subscriber
    where subscriber.status = 'confirmed' and subscriber.email is not null and subscriber.unsubscribe_nonce is not null
    on conflict (edition_id, subscriber_id) do nothing;
    get diagnostics v_count = row_count;
    if v_count = 0 then raise exception using message = 'NEWSLETTER_NO_ELIGIBLE_RECIPIENTS', errcode = 'P0001'; end if;
  end if;
  update public.newsletter_editions as edition set
    state = 'sending', send_started_at = coalesce(edition.send_started_at, pg_catalog.clock_timestamp()),
    version = edition.version + 1
  where edition.id = p_edition_id returning edition.version into v_version;
  select pg_catalog.count(*) into v_count from public.newsletter_deliveries as delivery
  where delivery.edition_id = p_edition_id;
  return query select v_version, v_count;
end;
$$;

create or replace function public.recheck_newsletter_delivery_eligibility(p_delivery_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare v_eligible boolean;
begin
  perform public.assert_bts_admin(true);
  select subscriber.status = 'confirmed' and subscriber.email is not null and subscriber.unsubscribe_nonce is not null
    into v_eligible
  from public.newsletter_deliveries as delivery
  join public.newsletter_subscribers as subscriber on subscriber.id = delivery.subscriber_id
  where delivery.id = p_delivery_id and delivery.state = 'sending';
  return coalesce(v_eligible, false);
end;
$$;

revoke all on function public.begin_newsletter_send(uuid, bigint)
  from public, anon, authenticated, service_role;
revoke all on function public.recheck_newsletter_delivery_eligibility(uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.begin_newsletter_send(uuid, bigint) to authenticated;
grant execute on function public.recheck_newsletter_delivery_eligibility(uuid) to authenticated;

notify pgrst, 'reload schema';
