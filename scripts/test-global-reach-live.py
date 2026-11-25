"""Local cached PostgreSQL 17.12 only; no network, credentials or Production access."""
import argparse,json,subprocess,time,uuid
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--evidence',required=True,type=Path);OUT=p.parse_args().evidence
name='btshq-reach-'+uuid.uuid4().hex[:10];checks=[];created=False
def call(args,body=None):
 r=subprocess.run(args,input=body,encoding='utf-8',capture_output=True,timeout=45)
 return r
def sql(body,success=True):
 r=call(['docker','exec','-i',name,'psql','-h','/tmp','-X','-U','postgres','-qAt','-v','ON_ERROR_STOP=1'],body)
 if success and r.returncode: raise RuntimeError(r.stderr)
 return r
def q(body):return sql(body).stdout.strip()
def ok(label,condition):
 assert condition,label
 checks.append({'case':label,'status':'PASS'})
def role(r,body):return q('set role '+r+';'+body)
try:
 r=call(['docker','run','-d','--pull=never','--network','none','--name',name,'--user','100:101','--entrypoint','/bin/sh',
 'public.ecr.aws/supabase/postgres:17.12.0.000','-c','initdb -D /tmp/reach-db --auth=trust -U postgres >/dev/null && exec postgres -D /tmp/reach-db -c listen_addresses= -c unix_socket_directories=/tmp'])
 assert r.returncode==0,r.stderr;created=True
 for _ in range(80):
  if sql('select 1;',False).returncode==0:break
  time.sleep(.2)
 else:raise RuntimeError('Readiness timeout')
 q('create role anon;create role authenticated;create role service_role bypassrls;alter default privileges in schema public grant all on tables to anon,authenticated,service_role;alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;')
 q((ROOT/'supabase/pending-migrations/20261125112325_global_reach_live_pipeline.sql').read_text(encoding='utf-8'))
 ok('All three aggregate/replay/state tables have RLS',q("select count(*) from pg_class where relnamespace='public'::regnamespace and relname in ('reach_daily_country_views','reach_seen_events','reach_collection_state') and relrowsecurity;")=='3')
 for r in ['anon','authenticated','service_role']:
  for t in ['reach_daily_country_views','reach_seen_events','reach_collection_state']:
   ok(r+' denied direct read '+t,sql('set role '+r+';select * from public.'+t+';',False).returncode!=0)
 for r in ['anon','authenticated']:
  for body in ["select public.record_reach_pageview('DE',gen_random_uuid(),now());","select public.maintain_reach_aggregates();","select public.read_public_reach_periods();"]:
   ok(r+' denied RPC '+body.split('(')[0],sql('set role '+r+';'+body,False).returncode!=0)
 ok('No PUBLIC execute grants',q("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace cross join lateral aclexplode(coalesce(proacl,acldefault('f',proowner))) a where n.nspname='public' and proname like '%reach%' and a.grantee=0;")=='0')
 event=str(uuid.uuid4())
 def write(_):return role('service_role',f"select public.record_reach_pageview('DE','{event}',statement_timestamp());")
 with ThreadPoolExecutor(max_workers=5) as pool:list(pool.map(write,range(10)))
 ok('Ten concurrent retries increment once',q('select sum(page_views) from public.reach_daily_country_views;')=='1')
 role('service_role',f"select public.record_reach_pageview('FR','{event}',statement_timestamp());")
 ok('Replay cannot move one event into a second country',q('select count(*) from public.reach_daily_country_views;')=='1')
 for country,issued in [("XX","statement_timestamp()"),("EU","statement_timestamp()"),("DE","statement_timestamp()-interval '25 hours'"),("DE","statement_timestamp()+interval '2 minutes'"),("DE","(statement_timestamp() at time zone 'UTC')::date-interval '1 minute'")]:
  ok('Reject invalid country/time '+country+issued,sql(f"set role service_role;select public.record_reach_pageview('{country}',gen_random_uuid(),{issued});",False).returncode!=0)
 role('service_role','select public.maintain_reach_aggregates();')
 data=json.loads(role('service_role','select public.read_public_reach_periods();'))
 ok('Current UTC day stays unpublished',data['since']==[] and data['daily']==[])
 # Historical fixtures are local-only and explicitly bypass collection for projection tests.
 q("update public.reach_collection_state set started_at=statement_timestamp()-interval '40 days';insert into public.reach_daily_country_views values ((now() at time zone 'UTC')::date-1,'DE',5),((now() at time zone 'UTC')::date-1,'FR',4),((now() at time zone 'UTC')::date-35,'DE',6);")
 role('service_role','select public.maintain_reach_aggregates();')
 data=json.loads(role('service_role','select public.read_public_reach_periods();'))
 ok('Country-day cells below five contribute to no period or daily total',data['since']==[{'countryCode':'DE','pageViews':11}] and data['recent']==[{'countryCode':'DE','pageViews':5}] and sum(x['pageViews'] for x in data['daily'])==11)
 ok('Closed low-volume cells physically removed',q("select count(*) from public.reach_daily_country_views where country_code='FR';")=='0')
 before=q('select md5(jsonb_agg(to_jsonb(d) order by utc_day,country_code)::text) from public.reach_daily_country_views d;')
 q("insert into public.reach_seen_events values(gen_random_uuid(),statement_timestamp()-interval '25 hours');")
 role('service_role','select public.maintain_reach_aggregates();')
 ok('Expired event removed; active event preserved',q('select count(*) from public.reach_seen_events;')=='1')
 role('service_role','select public.maintain_reach_aggregates();')
 ok('Repeated maintenance never alters or recounts stored totals',q('select md5(jsonb_agg(to_jsonb(d) order by utc_day,country_code)::text) from public.reach_daily_country_views d;')==before)
 ok('First measurement day stored; actual publication timestamp supplied',bool(data['sinceStart']) and bool(data['updated']))
 ok('No EchoWall objects created or changed',q("select count(*) from pg_class where relnamespace='public'::regnamespace and relname like 'echo%';")=='0')
 result={'status':'PASS','postgres':q('show server_version;'),'checks':checks,'scope':'network-none cached local PG17.12; synthetic fixtures only; no hosted consent, geolocation or scheduler proof'}
 OUT.mkdir(parents=True,exist_ok=True);(OUT/'sql-results.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'status':'PASS','checks':len(checks)}))
finally:
 if created:assert call(['docker','rm','-f','-v',name]).returncode==0
