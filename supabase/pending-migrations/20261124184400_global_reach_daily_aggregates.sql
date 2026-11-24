begin;

create table public.reach_daily_country_views (
  utc_day date not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$' and country_code not in ('XX', 'ZZ')),
  page_views integer not null check (page_views between 1 and 25000),
  primary key (utc_day, country_code)
);
alter table public.reach_daily_country_views enable row level security;
revoke all on table public.reach_daily_country_views from public, anon, authenticated, service_role;

-- Receives only a country chosen by the trusted application. No paths or identifiers are stored.
create function public.record_reach_pageview(p_country text)
returns void
language sql
security definer
set search_path = pg_catalog
as $$
  insert into public.reach_daily_country_views as counters (utc_day, country_code, page_views)
  select (statement_timestamp() at time zone 'UTC')::date, p_country, 1
  where p_country ~ '^[A-Z]{2}$' and p_country not in ('XX', 'ZZ')
  on conflict (utc_day, country_code) do update
  set page_views = counters.page_views + 1
  where counters.page_views < 25000;
$$;
revoke all on function public.record_reach_pageview(text) from public, anon, authenticated, service_role;
grant execute on function public.record_reach_pageview(text) to service_role;

-- One DB snapshot for both windows. Small country-day cells contribute to neither total.
create function public.read_public_reach_periods()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog
as $$
  with eligible as (
    select utc_day, country_code, page_views
    from public.reach_daily_country_views
    where utc_day < (statement_timestamp() at time zone 'UTC')::date and page_views >= 5
  ), boundary as (
    select (statement_timestamp() at time zone 'UTC')::date as close_day, min(utc_day) as start_day
    from eligible
  ), countries as (
    select country_code, sum(page_views) as all_views,
      sum(page_views) filter (where utc_day >= boundary.close_day - 30) as recent_views
    from eligible cross join boundary
    group by country_code
  ), trend as (
    select utc_day, sum(page_views) as views
    from eligible cross join boundary
    where utc_day >= boundary.close_day - 365
    group by utc_day
  )
  select jsonb_build_object(
    'sinceStart', boundary.start_day,
    'recentStart', greatest(boundary.start_day, boundary.close_day - 30),
    'end', boundary.close_day,
    'since', coalesce((select jsonb_agg(jsonb_build_object('countryCode', country_code, 'pageViews', all_views)) from countries), '[]'::jsonb),
    'recent', coalesce((select jsonb_agg(jsonb_build_object('countryCode', country_code, 'pageViews', recent_views)) from countries where recent_views is not null), '[]'::jsonb),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('day', utc_day, 'pageViews', views)) from trend), '[]'::jsonb)
  ) from boundary;
$$;
revoke all on function public.read_public_reach_periods() from public, anon, authenticated, service_role;
grant execute on function public.read_public_reach_periods() to service_role;

commit;
