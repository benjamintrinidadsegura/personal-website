-- LOCAL PROPOSAL. Remote installation requires the exact consolidated approval.
-- Aggregate-only content metrics; no visitor/session/path/answer/result/IP fields.
begin;
create table public.insights_daily_counts (
 utc_day date not null,
 event_name text not null check (event_name in ('article_view','tool_view','tool_start','tool_complete','interview_view','project_view','community_view','public_content_open')),
 content_id text not null check (length(content_id) between 1 and 80),
 event_count bigint not null check (event_count > 0),
 primary key(utc_day,event_name,content_id)
);
-- This table intentionally cannot link its random identifiers to content/actions.
create table public.insights_seen_events (event_id uuid primary key, issued_at timestamptz not null);
create index insights_seen_expiry on public.insights_seen_events(issued_at);
create table public.insights_state (
 singleton boolean primary key default true check(singleton),
 started_at timestamptz, last_event_at timestamptz, maintained_at timestamptz
);
insert into public.insights_state(singleton) values(true);
alter table public.insights_daily_counts enable row level security;
alter table public.insights_seen_events enable row level security;
alter table public.insights_state enable row level security;
revoke all on table public.insights_daily_counts,public.insights_seen_events,public.insights_state from public,anon,authenticated,service_role;

create function public.record_insight_event(p_name text,p_content_id text,p_event_id uuid,p_issued_at timestamptz)
returns void language plpgsql security definer set search_path=pg_catalog as $$
begin
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

create function public.maintain_insights_aggregates()
returns void language plpgsql security definer set search_path=pg_catalog as $$
begin
 -- Only short-lived deduplication identifiers expire; aggregate counts remain.
 delete from public.insights_seen_events where issued_at <= statement_timestamp()-interval '24 hours';
 update public.insights_state set maintained_at=statement_timestamp() where singleton;
end;
$$;
revoke all on function public.maintain_insights_aggregates() from public,anon,authenticated,service_role;
grant execute on function public.maintain_insights_aggregates() to service_role;

create function public.read_founder_insights(p_period text default '7d')
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare first_day date; end_day date := (statement_timestamp() at time zone 'UTC')::date+1; result jsonb;
begin
 if coalesce(auth.jwt()->>'role','') <> 'authenticated' or coalesce(auth.jwt()->>'aal','') <> 'aal2'
  or auth.uid() is null or not exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.role='admin' and a.is_active)
 then raise exception using message='INSIGHTS_ADMIN_AAL2_REQUIRED',errcode='42501'; end if;
 if p_period not in ('7d','30d','all') or p_period is null then raise exception using message='INVALID_INSIGHTS_PERIOD',errcode='22023'; end if;
 select case p_period when '7d' then end_day-7 when '30d' then end_day-30
  else coalesce((started_at at time zone 'UTC')::date,end_day-1) end into first_day from public.insights_state where singleton;
 select jsonb_build_object(
  'startedAt',s.started_at,'lastEventAt',s.last_event_at,'maintainedAt',s.maintained_at,
  'asOf',statement_timestamp(),'periodStart',first_day::text||'T00:00:00Z','periodEnd',end_day::text||'T00:00:00Z',
  'metrics',coalesce((select jsonb_agg(jsonb_build_object('name',q.event_name,'contentId',q.content_id,'count',q.total) order by q.event_name,q.content_id)
   from (select event_name,content_id,sum(event_count) as total from public.insights_daily_counts where utc_day>=first_day and utc_day<end_day group by event_name,content_id) q),'[]'::jsonb),
  'daily',coalesce((select jsonb_agg(jsonb_build_object('day',q.utc_day,'count',q.total) order by q.utc_day)
   from (select utc_day,sum(event_count) as total from public.insights_daily_counts where utc_day>=greatest(first_day,end_day-90) and utc_day<end_day group by utc_day) q),'[]'::jsonb)
 ) into result from public.insights_state s where singleton;
 return result;
end;
$$;
revoke all on function public.read_founder_insights(text) from public,anon,authenticated,service_role;
grant execute on function public.read_founder_insights(text) to authenticated;
commit;
