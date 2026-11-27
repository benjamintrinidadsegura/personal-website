-- LOCAL ONLY. Conditional legal/technical approval and exact hash required before remote use.
-- No SDK, visitor profile, raw URL/IP or browser identifier. Keep existing aggregates.
begin;
create table public.public_view_source_state (
 singleton boolean primary key default true check(singleton),
 active_source text not null default 'legacy' check(active_source in ('legacy','server-document')),
 cutover_at timestamptz
);
insert into public.public_view_source_state(singleton) values(true);
alter table public.public_view_source_state enable row level security;
revoke all on table public.public_view_source_state from public,anon,authenticated,service_role;

create function public.activate_server_document_source()
returns timestamptz language plpgsql security definer set search_path=pg_catalog as $$
declare stamp timestamptz;
begin
 update public.public_view_source_state set active_source='server-document',cutover_at=coalesce(cutover_at,statement_timestamp()) where singleton returning cutover_at into stamp;
 return stamp;
end;
$$;
revoke all on function public.activate_server_document_source() from public,anon,authenticated,service_role;
grant execute on function public.activate_server_document_source() to service_role;

create or replace function public.record_reach_pageview(p_country text,p_event_id uuid,p_issued_at timestamptz)
returns void language plpgsql security definer set search_path=pg_catalog as $$
begin
 perform 1 from public.public_view_source_state where singleton and active_source='legacy' for share;
 if not found then return; end if;
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

create or replace function public.record_insight_event(p_name text,p_content_id text,p_event_id uuid,p_issued_at timestamptz)
returns void language plpgsql security definer set search_path=pg_catalog as $$
begin
 perform 1 from public.public_view_source_state where singleton for share;
 if p_name not in ('tool_start','tool_complete') and not exists(select 1 from public.public_view_source_state where singleton and active_source='legacy') then return; end if;
 if p_name is null or p_content_id is null or p_event_id is null or p_issued_at is null
  or p_issued_at > statement_timestamp()+interval '1 minute'
  or p_issued_at <= statement_timestamp()-interval '24 hours'
  or (p_issued_at at time zone 'UTC')::date <> (statement_timestamp() at time zone 'UTC')::date
  or not (
   (p_name='article_view' and p_content_id ~ '^article:[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$') or
   (p_name in ('tool_view','tool_start','tool_complete') and p_content_id ~ '^tool:[0-9a-f]{32}$') or
   (p_name='interview_view' and p_content_id ~ '^interview:[0-9a-f]{32}$') or
   (p_name='project_view' and p_content_id ~ '^project:[0-9a-f]{32}$') or
   (p_name='community_view' and p_content_id='community:overview') or
   (p_name='public_content_open' and p_content_id in ('community:connection-map','community:echowall','community:global-reach'))
  ) then raise exception using message='INVALID_INSIGHT_EVENT',errcode='P0001'; end if;
 insert into public.insights_seen_events values(p_event_id,p_issued_at) on conflict do nothing;
 if not found then return; end if;
 insert into public.insights_daily_counts values((p_issued_at at time zone 'UTC')::date,p_name,p_content_id,1)
 on conflict(utc_day,event_name,content_id) do update set event_count=public.insights_daily_counts.event_count+1;
 update public.insights_state set started_at=coalesce(started_at,statement_timestamp()),last_event_at=statement_timestamp() where singleton;
end;
$$;
revoke all on function public.record_insight_event(text,text,uuid,timestamptz) from public,anon,authenticated,service_role;
grant execute on function public.record_insight_event(text,text,uuid,timestamptz) to service_role;

create function public.record_server_public_document(p_name text,p_content_id text,p_country text,p_event_id uuid,p_issued_at timestamptz)
returns text language plpgsql security definer set search_path=pg_catalog as $$
begin
 perform 1 from public.public_view_source_state where singleton and active_source='server-document' for share;
 if not found then return 'inactive'; end if;
 if p_event_id is null or p_issued_at is null or p_content_id is null
  or p_issued_at <= statement_timestamp()-interval '24 hours'
  or p_issued_at > statement_timestamp()+interval '1 minute'
  or (p_country is not null and p_country not in ('AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW'))
  or not coalesce((
   (p_name is null and p_content_id in ('public:home','public:about','public:people','public:writing','public:projects')) or
   (p_name='article_view' and p_content_id ~ '^article:[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$') or
   (p_name='tool_view' and p_content_id ~ '^tool:[0-9a-f]{32}$') or
   (p_name='interview_view' and p_content_id ~ '^interview:[0-9a-f]{32}$') or
   (p_name='project_view' and p_content_id ~ '^project:[0-9a-f]{32}$') or
   (p_name='community_view' and p_content_id='community:overview') or
   (p_name='public_content_open' and p_content_id in ('community:connection-map','community:echowall'))
  ),false) then raise exception using message='INVALID_SERVER_DOCUMENT',errcode='P0001'; end if;
 if p_name is null and p_country is null then return 'inactive'; end if;
 insert into public.insights_seen_events values(p_event_id,p_issued_at) on conflict do nothing;
 if not found then return 'duplicate'; end if;
 if p_name is not null then
  insert into public.insights_daily_counts values((p_issued_at at time zone 'UTC')::date,p_name,p_content_id,1)
  on conflict(utc_day,event_name,content_id) do update set event_count=public.insights_daily_counts.event_count+1;
  update public.insights_state set started_at=coalesce(started_at,statement_timestamp()),last_event_at=statement_timestamp() where singleton;
 end if;
 if p_country is not null then
  insert into public.reach_daily_country_views values((p_issued_at at time zone 'UTC')::date,p_country,1)
  on conflict(utc_day,country_code) do update set page_views=public.reach_daily_country_views.page_views+1;
  update public.reach_collection_state set started_at=coalesce(started_at,statement_timestamp()) where singleton;
 end if;
 return 'recorded';
end;
$$;
revoke all on function public.record_server_public_document(text,text,text,uuid,timestamptz) from public,anon,authenticated,service_role;
grant execute on function public.record_server_public_document(text,text,text,uuid,timestamptz) to service_role;
commit;
