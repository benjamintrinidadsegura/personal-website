"""Synthetic EchoWall integration only. No linked Supabase CLI or remote credentials.

Requires existing postgres:17-alpine and postgrest/postgrest:v14.18 Docker images,
Node, and repository dependencies. No image pulls. All resources are uniquely
named/labeled, networking is internal, containers publish no ports, and the
host-side API proxy binds loopback only.
Use --serve for bounded manual browser QA; Ctrl-C always removes owned resources.
"""
from pathlib import Path
import ipaddress
import argparse, base64, hashlib, hmac, http.server, json, os, secrets
import subprocess, threading, time, urllib.request, urllib.error, uuid, sys

ROOT = Path(__file__).resolve().parents[1]
# Next loads env files itself: refuse them even after scrubbing inherited vars.
if any(p.name != '.env.example' for p in ROOT.glob('.env*')):
    raise RuntimeError('Local test requires a checkout without private environment files')
parser = argparse.ArgumentParser()
parser.add_argument('--evidence', required=True, type=Path)
parser.add_argument('--serve', action='store_true')
parser.add_argument('--community', action='store_true', help='Verify additive Community EchoWall functionality')
parser.add_argument('--subnet', help='Optional unused RFC1918 IPv4 /24 through /28 for the internal test network')
args = parser.parse_args()
if args.subnet:
    subnet = ipaddress.ip_network(args.subnet)
    private_ranges = tuple(map(ipaddress.ip_network, ('10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16')))
    if subnet.version != 4 or not 24 <= subnet.prefixlen <= 28 or not any(subnet.subnet_of(area) for area in private_ranges):
        parser.error('--subnet must be an unused RFC1918 IPv4 /24 through /28')
args.evidence.mkdir(parents=True, exist_ok=True)
name = 'btshq-echo-test-' + uuid.uuid4().hex[:10]
db, rest, bridge, network = name+'-db', name+'-rest', name+'-bridge', name+'-net'
owned = []
def docker(*argv, text=None):
    p = subprocess.run(['docker', *argv], input=text, encoding='utf-8', capture_output=True)
    if p.returncode: raise RuntimeError('Local Docker operation failed: '+str(argv[0])+' (details withheld)')
    return p.stdout.strip()
def sql(statement):
    return docker('exec','-i',db,'psql','-X','-U','postgres','-qAt','-v','ON_ERROR_STOP=1',text=statement)
def token(role, **claims):
    enc=lambda b:base64.urlsafe_b64encode(b).rstrip(b'=')
    body=b'.'.join([enc(b'{"alg":"HS256","typ":"JWT"}'),enc(json.dumps({'role':role,'exp':int(time.time())+7200,**claims}).encode())])
    return (body+b'.'+enc(hmac.new(jwt_secret.encode(),body,hashlib.sha256).digest())).decode()
def request(path, role='service_role', data=None, **claims):
    body=None if data is None else json.dumps(data).encode()
    return internal_request(path,'GET' if body is None else 'POST',{'Authorization':'Bearer '+token(role,**claims),'Content-Type':'application/json'},body)
def internal_request(path,method,headers,body):
    # Docker exec is the sole bridge into the internal network. No container
    # publishes ports or receives an external route. Credentials use stdin only.
    payload=json.dumps({'url':'http://'+rest+':3000'+path,'method':method,'headers':headers,'body':None if body is None else body.decode()})
    program="const q=JSON.parse(require('fs').readFileSync(0,'utf8'));fetch(q.url,{method:q.method,headers:q.headers,body:q.body,signal:AbortSignal.timeout(5000)}).then(async r=>console.log(JSON.stringify([r.status,await r.json()]))).catch(()=>process.exit(1))"
    return json.loads(docker('exec','-i',bridge,'node','-e',program,text=payload))
def expect_error(result, code):
    assert result[0]>=400 and result[1].get('message')==code, 'Unexpected local error classification'
def submission(n, **overrides):
    return dict(p_display_name='Local reader',p_message='An isolated database contribution.',p_category=None,p_email=None,
      p_network_hash='net-'+n,p_email_hash=None,p_message_hash='msg-'+n,p_form_token_hash='form-'+n,p_deletion_token_hash='delete-'+n,**overrides)
checks=[]
def passed(label): checks.append({'case':label,'result':'PASS'})
jwt_secret=secrets.token_hex(32)
db_password=secrets.token_hex(24)
api=''
proxy=None
next_process=None
try:
    images={image:docker('image','inspect',image,'--format','{{.Id}}') for image in ['postgres:17-alpine','postgrest/postgrest:v14.18','node:24-alpine']}
    docker('network','create','--internal','--label','btshq.disposable=echowall',*(['--subnet', str(subnet)] if args.subnet else []),network); owned.append(('network',network))
    docker('run','--detach','--pull=never','--name',db,'--label','btshq.disposable=echowall','--network',network,
      '--tmpfs','/var/lib/postgresql/data:rw,size=256m','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17-alpine'); owned.append(('container',db))
    for _ in range(40):
        if subprocess.run(['docker','exec',db,'pg_isready','-U','postgres'],capture_output=True).returncode==0 and 'init process complete' in docker('logs',db): break
        time.sleep(.25)
    else: raise RuntimeError('Local database readiness timeout')
    sql("""create schema extensions; create schema auth;
      create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
      create role authenticator login noinherit password '"""+db_password+"""';
      grant anon, authenticated, service_role to authenticator;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claims',true)::jsonb->>'sub','')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
      grant usage on schema auth to authenticated;
      grant execute on function auth.uid(),auth.jwt() to authenticated;""")
    migrations=['20260721_001_echowall_foundation.sql','20260722_002_grant_echowall_service_role.sql','20260723000000_echowall_admin_moderation.sql','20260723010000_echowall_deleted_recovery.sql','20260929000000_harden_service_role_table_privileges.sql']
    for migration in migrations: sql((ROOT/'supabase/migrations'/migration).read_text(encoding='utf-8'))
    if args.community:
        # Simulate the broad hosted defaults to verify explicit revocation.
        sql("""alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
          alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;""")
        sql((ROOT/'supabase/pending-migrations/20261124102340_echowall_community_experience.sql').read_text(encoding='utf-8'))
    passed('Existing EchoWall migration chain applies before country migration')
    docker('run','--detach','--pull=never','--name',bridge,'--label','btshq.disposable=echowall','--network',network,'node:24-alpine','node','-e','setInterval(()=>{},60000)');owned.append(('container',bridge))
    docker('run','--detach','--pull=never','--name',rest,'--label','btshq.disposable=echowall','--network',network,
      '-e','PGRST_DB_URI=postgres://authenticator:'+db_password+'@'+db+':5432/postgres',
      '-e','PGRST_DB_SCHEMAS=public','-e','PGRST_DB_ANON_ROLE=anon','-e','PGRST_JWT_SECRET='+jwt_secret,
      'postgrest/postgrest:v14.18'); owned.append(('container',rest))
    for _ in range(40):
        try:
            if request('/')[0]==200: break
        except (OSError, ValueError): pass
        time.sleep(.25)
    else: raise RuntimeError('Local REST readiness timeout')
    # Supabase SDK expects /rest/v1; this loopback proxy only strips that prefix.
    # It cannot contact any remote origin. No request bodies or headers are logged.
    class Proxy(http.server.BaseHTTPRequestHandler):
        def do_GET(self): self.forward()
        def do_POST(self): self.forward()
        def log_message(self,*a): pass
        def forward(self):
            failure=args.evidence/'local-failure-mode.txt'
            if failure.exists() and failure.read_text().strip()=='unavailable':
                self.send_error(503); return
            path=self.path.removeprefix('/rest/v1')
            if not self.path.startswith('/rest/v1/'):
                self.send_error(404); return
            body=self.rfile.read(int(self.headers.get('Content-Length',0))) if self.command=='POST' else None
            try: status,data=internal_request(path,self.command,{k:v for k,v in self.headers.items() if k.lower() in ['authorization','content-type','prefer','accept']},body)
            except (OSError,RuntimeError):
                with (args.evidence/'local-api-events.jsonl').open('a') as events: events.write(json.dumps({'method':self.command,'operation':'rpc' if '/rpc/' in path else 'read','status':503,'bridge':'unavailable'})+'\n')
                self.send_error(503); return
            with (args.evidence/'local-api-events.jsonl').open('a') as events: events.write(json.dumps({'method':self.command,'operation':'rpc' if '/rpc/' in path else 'read','status':status})+'\n')
            content=json.dumps(data).encode(); self.send_response(status)
            self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(content)));self.end_headers();self.wfile.write(content)
    proxy=http.server.ThreadingHTTPServer(('127.0.0.1',0),Proxy)
    threading.Thread(target=proxy.serve_forever,daemon=True).start()
    proxy_url='http://127.0.0.1:'+str(proxy.server_port)
    assert request('/echoes?select=id','anon')[0]>=400
    assert request('/echoes?select=id','authenticated')[0]>=400
    assert request('/rpc/submit_echo','anon',submission('denied'))[0]>=400
    assert request('/rpc/submit_echo','authenticated',submission('denied'))[0]>=400
    assert request('/rpc/get_admin_context','anon',{})[0]>=400
    for role in ['anon','authenticated']:
        for method in ['POST','PATCH','DELETE']:
            body=b'{}' if method!='DELETE' else None
            assert internal_request('/echoes',method,{'Authorization':'Bearer '+token(role),'Content-Type':'application/json'},body)[0]>=400
    passed('anon/authenticated cannot read tables or bypass server submission')
    before=request('/rpc/submit_echo',data=submission('legacy'))
    assert before[0]==200
    assert sql("select count(*) from public.echoes where status='pending' and approved_at is null;")=='1'
    passed('Legacy submission inserts pending without a country schema')
    assert request('/echoes?select=id,country_code')[0]>=400
    sql((ROOT/'supabase/pending-migrations/20261111190134_echowall_voluntary_country.sql').read_text(encoding='utf-8'))
    sql("notify pgrst, 'reload schema';")
    for _ in range(30):
        if request('/echoes?select=id,country_code')[0]==200: break
        time.sleep(.2)
    status,chosen=request('/rpc/submit_echo_with_country',data={**submission('country'),'p_email':'local@example.test','p_country_code':'DE','p_include_in_community_map':True})
    assert status==200
    assert request('/echoes?select=id&status=eq.approved&approved_at=not.is.null')[1]==[]
    for code in ['XX','de','DE/secret']:
        status,_=request('/rpc/submit_echo_with_country',data={**submission('invalid'),'p_country_code':code,'p_include_in_community_map':True})
        assert status>=400
    assert sql("select count(*) from public.echo_rate_limits where form_token_hash='form-invalid';")=='0'
    assert request('/rpc/submit_echo_with_country',data={**submission('invalid'),'p_country_code':None,'p_include_in_community_map':True})[0]>=400
    assert request('/rpc/submit_echo_with_country',data={**submission('invalid'),'p_country_code':None,'p_include_in_community_map':False})[0]==200
    passed('Optional country allowlist, omitted country, rollback and pending-only submission')
    expect_error(request('/rpc/submit_echo',data=submission('legacy')),'ECHOWALL_TOKEN_REPLAY')
    dupe=submission('dupe');dupe['p_network_hash']='net-legacy';dupe['p_message_hash']='msg-legacy'
    expect_error(request('/rpc/submit_echo',data=dupe),'ECHOWALL_DUPLICATE')
    for i in range(3):
        row=submission('burst-'+str(i));row['p_network_hash']='burst'; assert request('/rpc/submit_echo',data=row)[0]==200
    row=submission('burst-4');row['p_network_hash']='burst'
    expect_error(request('/rpc/submit_echo',data=row),'ECHOWALL_RATE_15')
    sql("update public.echo_rate_limits set created_at=now()-interval '1 hour' where network_hash='burst';")
    for i in range(7):
        row=submission('day-'+str(i));row['p_network_hash']='burst';assert request('/rpc/submit_echo',data=row)[0]==200
        sql("update public.echo_rate_limits set created_at=now()-interval '1 hour' where network_hash='burst';")
    expect_error(request('/rpc/submit_echo',data=row),'ECHOWALL_TOKEN_REPLAY')
    row=submission('day-over');row['p_network_hash']='burst';expect_error(request('/rpc/submit_echo',data=row),'ECHOWALL_RATE_24')
    passed('Replay, duplicate, 15-minute and 24-hour rate limits are enforced by real RPC')
    admin='00000000-0000-4000-8000-000000000001'
    visitor='00000000-0000-4000-8000-000000000002'
    sql("insert into auth.users(id) values ('"+admin+"'),('"+visitor+"'); insert into public.admin_users(user_id) values ('"+admin+"');")
    def moderate(action, current, identity=admin, aal='aal2', **claims):
        return request('/rpc/moderate_echo','authenticated',{'p_echo_id':chosen,'p_action':action,'p_expected_status':current,'p_reason':'Local moderation verification'},sub=identity,aal=aal,**claims)
    expect_error(moderate('approve','pending',visitor,user_metadata={'role':'admin'}),'ECHOWALL_ADMIN_UNAUTHORIZED')
    expect_error(moderate('approve','pending',aal='aal1'),'ECHOWALL_ADMIN_MFA_REQUIRED')
    sql("update public.admin_users set is_active=false;")
    expect_error(moderate('approve','pending'),'ECHOWALL_ADMIN_UNAUTHORIZED')
    sql("update public.admin_users set is_active=true;")
    assert moderate('approve','pending')[0]==200
    expect_error(moderate('hide','pending'),'ECHOWALL_ADMIN_STALE')
    assert len(request('/echoes?select=id&status=eq.approved&approved_at=not.is.null')[1])==1
    assert request('/rpc/get_echo_private_contact','authenticated',{'p_echo_id':chosen},sub=visitor,aal='aal2')[0]>=400
    assert len(request('/rpc/get_echo_private_contact','authenticated',{'p_echo_id':chosen},sub=admin,aal='aal2')[1])==1
    assert moderate('hide','approved')[0]==200
    assert request('/echoes?select=id&status=eq.approved&approved_at=not.is.null')[1]==[]
    assert moderate('restore','hidden')[0]==200
    assert moderate('delete','approved')[0]==200
    assert request('/echoes?select=id&status=eq.approved&approved_at=not.is.null')[1]==[]
    assert sql("select count(*) from public.echo_contacts;")=='0'
    assert moderate('restore_deleted','deleted')[0]==200
    assert sql("select count(*) from public.echoes where status='hidden' and approved_at is null;")=='1'
    assert moderate('approve','hidden')[0]>=400
    assert moderate('restore','hidden')[0]==200
    passed('Admin DB allowlist, editable-claim denial, MFA, revocation, stale-status lock, hide/delete/recovery')
    # Country totals are derived solely from eligible public projections, not a new CMS or analytics table.
    assert sql("select count(*) from public.echoes where status='approved' and approved_at is not null and include_in_community_map and country_code='DE';")=='1'
    for n in ['country-two','country-three']:
        status,other=request('/rpc/submit_echo_with_country',data={**submission(n),'p_country_code':'DE','p_include_in_community_map':True})
        assert status==200
        assert request('/rpc/moderate_echo','authenticated',{'p_echo_id':other,'p_action':'approve','p_expected_status':'pending','p_reason':None},sub=admin,aal='aal2')[0]==200
    assert sql("select count(*) from public.echoes where status='approved' and approved_at is not null and include_in_community_map and country_code='DE';")=='3'
    assert moderate('hide','approved')[0]==200
    assert sql("select count(*) from public.echoes where status='approved' and approved_at is not null and include_in_community_map and country_code='DE';")=='2'
    assert moderate('restore','hidden')[0]==200
    # A rejected contribution never enters the public projection or country total.
    rejected=request('/rpc/submit_echo',data=submission('rejected'))[1]
    assert request('/rpc/moderate_echo','authenticated',{'p_echo_id':rejected,'p_action':'reject','p_expected_status':'pending','p_reason':'Local rejection case'},sub=admin,aal='aal2')[0]==200
    assert sql("select count(*) from public.echoes where status='rejected';")=='1'
    passed('Eligible country cohort reaches three; hiding removes eligibility; rejected state remains private')
    assert request('/echo_contacts?select=*','authenticated')[0]>=400
    assert request('/echo_rate_limits?select=*','anon')[0]>=400
    assert request('/echo_moderation_events?select=*','authenticated')[0]>=400
    assert sql("select count(*) from pg_class where oid in ('public.echoes'::regclass,'public.echo_contacts'::regclass,'public.echo_rate_limits'::regclass,'public.echo_moderation_events'::regclass,'public.admin_users'::regclass) and relrowsecurity;")=='5'
    passed('All five EchoWall tables RLS-enabled; contacts, rates and audit rows private')
    # Local child HTTP must stay on loopback, not inherit a machine's corporate
    # outbound proxy. Containers themselves have no external network route.
    env={k:v for k,v in os.environ.items() if not any(s in k.upper() for s in ['SUPABASE','DATABASE_URL','ECHOWALL','VERCEL','RESEND','SMTP','PROXY'])}
    env['NO_PROXY']='127.0.0.1,localhost'
    env.update(ECHO_DISPOSABLE_TEST='true',ECHO_LOCAL_URL=proxy_url,ECHO_LOCAL_SERVICE_KEY=token('service_role'),ECHO_LOCAL_ADMIN_KEY=token('authenticated',sub=admin,aal='aal2'))
    result=subprocess.run(['node','--import','tsx',str(ROOT/'tests/integration/echowall-submission.ts')],cwd=ROOT,env=env,capture_output=True,encoding='utf-8')
    if result.returncode: raise RuntimeError('Application/database bridge failed: '+result.stderr[:1000])
    application_result=json.loads(result.stdout.strip().splitlines()[-1])
    passed('Application validation → Supabase SDK → actual PostgREST → actual PostgreSQL')
    if args.community:
        sys.path.insert(0,str(ROOT/'tests/integration'))
        sys.dont_write_bytecode = True
        import community_echo
        community_echo.verify(sql,request,passed,admin,visitor,chosen,rejected,moderate,expect_error)
        sql((ROOT/'supabase/pending-migrations/20261124120808_echowall_public_country_display.sql').read_text(encoding='utf-8'))
        sql("notify pgrst, 'reload schema';")
        for _ in range(30):
            status, _ = request('/rpc/get_public_echo_feed_with_countries',data={'p_query':'','p_page':1,'p_size':1,'p_popular':False,'p_counts':False})
            if status == 200: break
            time.sleep(.2)
        else: raise RuntimeError('Public-country schema discovery failed')
        import echo_country_display
        echo_country_display.verify(sql,request,passed,admin,visitor,chosen,moderate,expect_error,submission)
    # Aggregate evidence only: no row IDs, raw answers, JWTs or form/deletion references.
    evidence={'result':'PASS','checks':checks,'application':application_result,'postgres':sql('show server_version;'),'images':images,'postgrestImage':'postgrest/postgrest:v14.18',
      'network':'internal; no published container ports; host proxy loopback only','data':'synthetic only','productionAccess':False,'countryFlag':'OFF outside isolated tests',
      'authScope':'Local verified JWT claims + DB admin registry; real GoTrue/MFA login UI not simulated','migrationAppliedRemotely':False}
    (args.evidence/'database-lifecycle.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
    print(json.dumps({'result':'PASS','checks':len(checks),'applicationBridge':'PASS'}),flush=True)
    if args.serve:
        (args.evidence/'local-runtime.json').write_text(json.dumps({'databaseContainer':db,'network':network,'label':'btshq.disposable=echowall','app':'http://localhost:3298','syntheticOnly':True}),encoding='utf-8')
        # The application has only synthetic local configuration. No .env file is written.
        # No external Auth/SMTP/webhook service is started by this harness.
        env.update(SITE_URL='http://localhost:3298',SUPABASE_URL=proxy_url,SUPABASE_SECRET_KEY=token('service_role'),
          ECHOWALL_FORM_TOKEN_SECRET='local-form-only',ECHOWALL_IP_HASH_SECRET='local-hash-only',ECHOWALL_COUNTRY_CONTEXT_ENABLED='false',VERCEL_ENV='preview')
        if args.community:
            env.pop('VERCEL_ENV', None)
            env.update(BTS_COMMUNITY_LOCAL_REVIEW='1',ECHOWALL_PUBLIC_COUNTRY_ENABLED='true',ECHOWALL_REACTIONS_ENABLED='true',ECHOWALL_REACTION_SECRET=secrets.token_hex(32))
        log=(args.evidence/'local-server.log').open('w',encoding='utf-8')
        next_process=subprocess.Popen(['node',str(ROOT/'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3298'],cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT)
        print('LOCAL_BROWSER_READY http://localhost:3298/echowall (country OFF)',flush=True)
        # Bounded lifetime; never leave a local test service indefinitely.
        deadline=time.monotonic()+1800
        while time.monotonic()<deadline and next_process.poll() is None:
            if (args.evidence/'local-stop.txt').exists(): break
            time.sleep(1)
finally:
    if next_process and next_process.poll() is None: next_process.terminate(); next_process.wait(timeout=15)
    if proxy: proxy.shutdown()
    for kind, resource in reversed(owned):
        if kind=='container': docker('stop',resource);docker('rm',resource)
        else: docker('network','rm',resource)
    (args.evidence/'local-cleanup.json').write_text(json.dumps({'ownedResourcesRemoved':len(owned),'productionTouched':False,'result':'PASS'}),encoding='utf-8')
