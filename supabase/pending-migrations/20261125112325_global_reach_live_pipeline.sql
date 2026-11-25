-- Fresh install proposal ONLY. Supersedes the uninstalled 20261124184400 proposal.
-- Independent from EchoWall; no existing tables, policies or functions changed.
begin;
create table public.reach_daily_country_views (
 utc_day date not null, country_code text not null check (country_code in ('AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW')),
 page_views bigint not null check(page_views > 0), primary key(utc_day,country_code)
);
create table public.reach_seen_events (
 event_id uuid primary key, issued_at timestamptz not null
);
create index reach_seen_expiry on public.reach_seen_events(issued_at);
create table public.reach_collection_state (
 singleton boolean primary key default true check(singleton), started_at timestamptz,
 published_until date, refreshed_at timestamptz
);
insert into public.reach_collection_state(singleton) values(true);
alter table public.reach_daily_country_views enable row level security;
alter table public.reach_seen_events enable row level security;
alter table public.reach_collection_state enable row level security;
revoke all on table public.reach_daily_country_views,public.reach_seen_events,public.reach_collection_state from public,anon,authenticated,service_role;

create function public.record_reach_pageview(p_country text,p_event_id uuid,p_issued_at timestamptz)
returns void language plpgsql security definer set search_path=pg_catalog as $$
begin
 if p_country is null or p_country not in ('AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW')
   or p_event_id is null or p_issued_at is null
   or p_issued_at > statement_timestamp()+interval '1 minute'
   or p_issued_at <= statement_timestamp()-interval '24 hours'
   or (p_issued_at at time zone 'UTC')::date <> (statement_timestamp() at time zone 'UTC')::date
 then raise exception 'REACH_INVALID_EVENT'; end if;
 insert into public.reach_seen_events values(p_event_id,p_issued_at) on conflict do nothing;
 if not found then return; end if;
 insert into public.reach_daily_country_views as c values((p_issued_at at time zone 'UTC')::date,p_country,1)
 on conflict(utc_day,country_code) do update set page_views=c.page_views+1;
 update public.reach_collection_state set started_at=coalesce(started_at,statement_timestamp()) where singleton;
end;
$$;
revoke all on function public.record_reach_pageview(text,uuid,timestamptz) from public,anon,authenticated,service_role;
grant execute on function public.record_reach_pageview(text,uuid,timestamptz) to service_role;

-- Called once daily by existing Vercel scheduling. Repeat calls do not recount anything.
create function public.maintain_reach_aggregates()
returns void language plpgsql security definer set search_path=pg_catalog as $$
begin
 delete from public.reach_seen_events where issued_at <= statement_timestamp()-interval '24 hours';
 delete from public.reach_daily_country_views where utc_day < (statement_timestamp() at time zone 'UTC')::date and page_views < 5;
 update public.reach_collection_state set published_until=(statement_timestamp() at time zone 'UTC')::date,
 refreshed_at=statement_timestamp() where singleton;
end;
$$;
revoke all on function public.maintain_reach_aggregates() from public,anon,authenticated,service_role;
grant execute on function public.maintain_reach_aggregates() to service_role;

create function public.read_public_reach_periods()
returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 with boundary as (
  select (started_at at time zone 'UTC')::date as start_day,published_until as close_day,refreshed_at
  from public.reach_collection_state where singleton
 ), eligible as materialized (
  select d.utc_day,d.country_code,d.page_views from public.reach_daily_country_views d cross join boundary b
  where d.utc_day < b.close_day and d.page_views >= 5
 ), countries as (
  select country_code,sum(page_views) as all_views,
  sum(page_views) filter(where utc_day >= b.close_day-30) as recent_views
  from eligible cross join boundary b group by country_code
 ), trend as (
  select utc_day,sum(page_views) as views from eligible cross join boundary b
  where utc_day >= b.close_day-365 group by utc_day
 ) select jsonb_build_object(
 'sinceStart',b.start_day,'recentStart',greatest(b.start_day,b.close_day-30),'end',b.close_day,
 'updated',to_char(b.refreshed_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'since',coalesce((select jsonb_agg(jsonb_build_object('countryCode',country_code,'pageViews',all_views)) from countries),'[]'::jsonb),
 'recent',coalesce((select jsonb_agg(jsonb_build_object('countryCode',country_code,'pageViews',recent_views)) from countries where recent_views is not null),'[]'::jsonb),
 'daily',coalesce((select jsonb_agg(jsonb_build_object('day',utc_day,'pageViews',views)) from trend),'[]'::jsonb)
 ) from boundary b;
$$;
revoke all on function public.read_public_reach_periods() from public,anon,authenticated,service_role;
grant execute on function public.read_public_reach_periods() to service_role;
commit;
