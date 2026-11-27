/** One disposable local integration: real browser -> adapter -> PostgREST14/PG17.
 * Run with node --import tsx. All credentials and data are synthetic, local only.
 * No hosted requests, downloads, Production credentials or remote mutations.
 */
import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import * as cryptoModule from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { compileFunction } from "node:vm";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = resolve(dirname(fileURLToPath(import.meta.url)), ".."), out = resolve(process.argv[2] ?? resolve(root, "../evidence"));
const require = createRequire(import.meta.url), { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const prefix = "btshq-server-doc-" + randomUUID().slice(0, 8), pg = prefix + "-pg", rest = prefix + "-rest", network = prefix + "-net";
const temp = mkdtempSync(resolve(tmpdir(), prefix)), containers = [], checks = [], servers = [], children = [];
let browser, networkCreated = false;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const docker = (args, input) => execFileSync("docker", args, { input, encoding: "utf8", timeout: 60000, stdio: ["pipe", "pipe", "pipe"] }).trim();
const sql = (text) => docker(["exec", "-i", pg, "psql", "-h", "/tmp", "-X", "-U", "postgres", "-qAt", "-v", "ON_ERROR_STOP=1"], text);
const ok = (label, condition) => { assert.ok(condition, label); checks.push({ case: label, status: "PASS" }); console.log("PASS: " + label); };
function load(path, dependencies, globals = {}) {
  const code = ts.transpileModule(readFileSync(resolve(root, path), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  compileFunction(code, ["require", "exports", ...Object.keys(globals)], { filename: path })(
    (name) => { assert.ok(Object.hasOwn(dependencies, name), "Unlisted dependency: " + name); return dependencies[name]; }, exports, ...Object.values(globals));
  return exports;
}
const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(SUPABASE_|NEXT_PUBLIC_SUPABASE_|CRON_SECRET|OPENAI_API_KEY|BTS_PUBLIC_ANALYTICS|BTS_INSIGHTS_|BTS_REACH_)/u.test(key)));
Object.assign(environment, { SITE_URL: "https://btshq.online", VERCEL: "1", VERCEL_ENV: "production", NODE_ENV: "production", BTS_INSIGHTS_MODE: "collect", BTS_REACH_ENABLED: "true", BTS_PUBLIC_VIEW_SOURCE: "server-document", NEXT_TELEMETRY_DISABLED: "1" });
try {
  mkdirSync(out, { recursive: true });
  docker(["network", "create", "--subnet", "10.253.26.0/28", network]); networkCreated = true;
  docker(["run", "-d", "--pull=never", "--network", network, "--name", pg, "--user", "100:101", "--entrypoint", "/bin/sh", "public.ecr.aws/supabase/postgres:17.12.0.000", "-c", "initdb -D /tmp/insights-db --auth=trust -U postgres >/dev/null && printf 'host postgres authenticator 10.253.26.0/28 trust\n' >> /tmp/insights-db/pg_hba.conf && exec postgres -D /tmp/insights-db -c listen_addresses='*' -c unix_socket_directories=/tmp"]); containers.push(pg);
  for (let i = 0; ; i++) { try { sql("select 1;"); break; } catch { if (i > 100) throw new Error("Local PG not ready"); await sleep(200); } }
  sql(`create role anon;create role authenticated;create role service_role bypassrls;create role authenticator login noinherit;grant anon,authenticated,service_role to authenticator;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
    create schema auth;create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    create function auth.uid() returns uuid language sql stable as $$select nullif(auth.jwt()->>'sub','')::uuid$$;
    create table public.admin_users(user_id uuid primary key,role text,is_active boolean);
    revoke all on public.admin_users from public,anon,authenticated,service_role;
    insert into public.admin_users values('22222222-2222-4222-8222-222222222222','admin',true);
    create table public.writing_articles(id uuid primary key,slug text,title text,deck text,excerpt text,body text,body_json jsonb,content_type text,topics text[],status text,published_at timestamptz,source_locale text,source_revision int);
    create table public.writing_article_translations(article_id uuid references public.writing_articles(id),locale text,title text,deck text,excerpt text,body text,body_json jsonb,status text,source_revision int,generated_at timestamptz);
    insert into public.writing_articles values('11111111-1111-4111-8111-111111111111','local-insights-evidence','Local Insights Evidence — synthetic','Isolated test only','This is isolated synthetic content, never Production.','A sufficiently long isolated article used only for local browser and publication validation.',null,'essay',array['Ideas'],'published','2026-01-01T00:00:00Z','de',1);`);
  const migrationName = "20261125194242_insights_v1_aggregates.sql";
  sql(readFileSync(resolve(root, "supabase/pending-migrations/20261125112325_global_reach_live_pipeline.sql"), "utf8"));
  sql(readFileSync(resolve(root, "supabase/migrations", migrationName), "utf8"));
  sql(readFileSync(resolve(root, "supabase/migrations/20261127205336_server_public_document_aggregates.sql"), "utf8"));
  const secret = randomBytes(48).toString("base64url"), encode = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const jwt = (claims) => { const text = encode({ alg: "HS256", typ: "JWT" }) + "." + encode({ exp: Math.floor(Date.now() / 1000) + 3600, ...claims }); return text + "." + createHmac("sha256", secret).update(text).digest("base64url"); };
  const serviceToken = jwt({ role: "service_role" });
  const envFile = resolve(temp, "rest.env");
  writeFileSync(envFile, `PGRST_DB_URI=postgres://authenticator@${pg}:5432/postgres\nPGRST_DB_SCHEMAS=public\nPGRST_DB_ANON_ROLE=anon\nPGRST_JWT_SECRET=${secret}\n`, { mode: 0o600 });
  docker(["run", "-d", "--pull=never", "--network", network, "--name", rest, "-p", "127.0.0.1::3000", "--env-file", envFile, "postgrest/postgrest:v14.18"]); containers.push(rest);
  let restUrl;
  for (let i = 0; ; i++) { try { const port = docker(["port", rest, "3000/tcp"]).split(":").at(-1); restUrl = "http://127.0.0.1:" + port; if ((await fetch(restUrl)).ok) break; } catch { /* startup */ } if (i > 100) throw new Error("Local PostgREST not ready"); await sleep(200); }
  const dashboards = {};
  const gateway = createServer(async (req, res) => {
    try {
      if (req.url?.startsWith("/fixture/")) { res.setHeader("content-type", "text/html; charset=utf-8"); res.end(dashboards[req.url] ?? "Fixture unavailable"); return; }
      if (!req.url?.startsWith("/rest/v1/")) { res.writeHead(404); res.end(); return; }
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const response = await fetch(restUrl + req.url.replace(/^\/rest\/v1/u, ""), { method: req.method, headers: Object.fromEntries(Object.entries(req.headers).filter(([key]) => !["host", "connection", "content-length"].includes(key))), ...(chunks.length ? { body: Buffer.concat(chunks) } : {}) });
      res.writeHead(response.status, Object.fromEntries([...response.headers].filter(([key]) => !["content-length", "content-encoding", "transfer-encoding"].includes(key)))); res.end(Buffer.from(await response.arrayBuffer()));
    } catch { res.writeHead(503); res.end(); }
  }); servers.push(gateway); await new Promise((r) => gateway.listen(0, "127.0.0.1", r));
  const databaseUrl = "http://127.0.0.1:" + gateway.address().port;
  Object.assign(environment, { SUPABASE_URL: databaseUrl, SUPABASE_SECRET_KEY: serviceToken, SUPABASE_PUBLISHABLE_KEY: jwt({ role: "anon" }) });
  const actualServer = load("lib/supabase/server.ts", { "server-only": {}, "@supabase/supabase-js": { createClient } }, { process: { env: environment } });
  const runtimeGate = load("lib/analytics/first-party-config.ts", { "server-only": {} }, { process: { env: environment } });
  const catalog = load("lib/insights/catalog.ts", { "server-only": {}, "node:crypto": cryptoModule,
    "@/data/discovery-index": require("../data/discovery-index.ts"), "@/data/projects": require("../data/projects.ts"), "@/data/spotlights": require("../data/spotlights.ts"),
    "@/lib/i18n/config": require("../lib/i18n/config.ts"), "@/lib/i18n/routing": require("../lib/i18n/routing.ts") });
  const writing = load("lib/writing/queries.ts", { react: React, "@/lib/public-content-hygiene": require("../lib/public-content-hygiene.ts"), "@/lib/writing/domain": require("../lib/writing/domain.ts"), "@/lib/writing/read-deadline": require("../lib/writing/read-deadline.ts"), "@/lib/supabase/server": actualServer });
  const service = createClient(databaseUrl, serviceToken, { auth: { persistSession: false, autoRefreshToken: false } });
  const founder = createClient(databaseUrl, jwt({ role: "authenticated", sub: "22222222-2222-4222-8222-222222222222", aal: "aal2" }), { auth: { persistSession: false, autoRefreshToken: false } });
  const views = () => Number(sql("select coalesce(sum(event_count),0) from public.insights_daily_counts;"));
  const seen = () => Number(sql("select count(*) from public.insights_seen_events;"));
  const metric = (name) => Number(sql("select coalesce(sum(event_count),0) from public.insights_daily_counts where event_name='" + name + "';"));
  for (const role of ["anon", "authenticated", "service_role"]) for (const table of ["insights_daily_counts", "insights_seen_events", "insights_state"]) {
    ok(role + " denied direct access to " + table, sql(`select has_table_privilege('${role}','public.${table}','SELECT,INSERT,UPDATE,DELETE,TRUNCATE');`) === "f");
  }
  ok("All new tables have RLS", sql("select count(*) from pg_class where relnamespace='public'::regnamespace and relname in ('insights_daily_counts','insights_seen_events','insights_state') and relrowsecurity;") === "3");
  ok("No PUBLIC execute grants on Insights RPCs", sql("select count(*) from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where p.pronamespace='public'::regnamespace and p.proname in ('record_insight_event','maintain_insights_aggregates','read_founder_insights') and a.grantee=0;") === "0");
  ok("All Insights SECURITY DEFINER functions use fixed pg_catalog search_path", sql("select count(*) from pg_proc where pronamespace='public'::regnamespace and proname in ('record_insight_event','maintain_insights_aggregates','read_founder_insights') and prosecdef and proconfig=array['search_path=pg_catalog'];") === "3");
  ok("Replay storage cannot retain a content/navigation history", sql("select string_agg(column_name,',' order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='insights_seen_events';") === "event_id,issued_at");
  for (const claims of [{ role: "anon" }, { role: "authenticated", aal: "aal1", sub: "22222222-2222-4222-8222-222222222222" }, { role: "authenticated", aal: "aal2", sub: "33333333-3333-4333-8333-333333333333" }, { role: "service_role" }]) {
    const client = createClient(databaseUrl, jwt(claims), { auth: { persistSession: false, autoRefreshToken: false } });
    ok("Founder read rejects " + claims.role + "/" + (claims.aal ?? "none"), Boolean((await client.rpc("read_founder_insights", { p_period: "7d" })).error));
  }
  ok("AAL2 active Founder can read empty real aggregate", (await founder.rpc("read_founder_insights", { p_period: "7d" })).data?.metrics.length === 0);
  sql("update public.admin_users set is_active=false where user_id='22222222-2222-4222-8222-222222222222';");
  ok("Current admin revocation defeats an unchanged valid AAL2 JWT", Boolean((await founder.rpc("read_founder_insights", { p_period: "7d" })).error));
  sql("update public.admin_users set is_active=true where user_id='22222222-2222-4222-8222-222222222222';");
  const source = load("lib/analytics/public-view-source.ts", { "server-only": {}, "./first-party-config": runtimeGate }, { process: { env: environment } });
  const adapter = load("lib/analytics/server-documents.ts", { "server-only": {}, "node:crypto": { randomUUID },
    "@/lib/i18n/routing": require("../lib/i18n/routing.ts"), "@/lib/insights/catalog": catalog,
    "@/lib/writing/queries": writing, "@/lib/supabase/server": actualServer,
    "./country-reach": require("../lib/analytics/country-reach.ts"), "./public-view-source": source });
  const reach = () => Number(sql("select coalesce(sum(page_views),0) from public.reach_daily_country_views;"));
  const args = { p_name: "community_view", p_content_id: "community:overview", p_country: "DE", p_event_id: randomUUID(), p_issued_at: new Date().toISOString() };
  ok("Server source starts inactive and cannot insert before cutover", (await service.rpc("record_server_public_document", args)).data === "inactive" && views() === 0 && reach() === 0);
  const anon = createClient(databaseUrl, jwt({ role: "anon" }), { auth: { persistSession: false } });
  for (const client of [anon, founder]) {
    ok("Non-service role cannot activate source", Boolean((await client.rpc("activate_server_document_source")).error));
    ok("Non-service role cannot write server metrics", Boolean((await client.rpc("record_server_public_document", args)).error));
  }
  for (const role of ["anon", "authenticated", "service_role"]) ok(role + " denied direct source state access", sql(`select has_table_privilege('${role}','public.public_view_source_state','SELECT,INSERT,UPDATE,DELETE,TRUNCATE');`) === "f");
  ok("New source state has RLS", sql("select relrowsecurity from pg_class where oid='public.public_view_source_state'::regclass;") === "t");
  const activated = await service.rpc("activate_server_document_source");
  ok("Exact cutover succeeds once and repeat preserves provenance timestamp", !activated.error && (await service.rpc("activate_server_document_source")).data === activated.data);
  ok("One actual RPC atomically writes both counters", (await service.rpc("record_server_public_document", args)).data === "recorded" && views() === 1 && reach() === 1);
  await Promise.all(Array.from({ length: 5 }, () => service.rpc("record_server_public_document", args)));
  ok("Concurrent retries cannot duplicate either aggregate", views() === 1 && reach() === 1);
  await service.rpc("record_reach_pageview", { p_country: "DE", p_event_id: randomUUID(), p_issued_at: args.p_issued_at });
  await service.rpc("record_insight_event", { p_name: args.p_name, p_content_id: args.p_content_id, p_event_id: randomUUID(), p_issued_at: args.p_issued_at });
  ok("Stale first-party clients cannot double count after source cutover", views() === 1 && reach() === 1);
  for (const values of [{ p_name: "tool_complete" }, { p_country: "ZZ" }, { p_name: null, p_content_id: "private:answer" }, { p_issued_at: new Date(Date.now() - 25 * 3600000).toISOString() }]) {
    ok("Invalid server event rejected atomically: " + Object.keys(values).join(), Boolean((await service.rpc("record_server_public_document", { ...args, p_event_id: randomUUID(), ...values })).error) && views() === 1 && reach() === 1);
  }
  const tool = catalog.staticInsightsCatalog().find((t) => t.lifecycle);
  await service.rpc("record_insight_event", { p_name: "tool_start", p_content_id: tool.id, p_event_id: randomUUID(), p_issued_at: args.p_issued_at });
  ok("Consented lifecycle class survives cutover without becoming automatic", metric("tool_start") === 1 && reach() === 1);
  const unknownBefore = views(), unknownReach = reach();
  ok("Unknown country preserves content totals without inventing geography", (await service.rpc("record_server_public_document", { ...args, p_country: null, p_event_id: randomUUID() })).data === "recorded" && views() === unknownBefore + 1 && reach() === unknownReach);
  ok("Server records use the request's actual UTC day", sql("select count(distinct utc_day)=1 and min(utc_day)=(now() at time zone 'UTC')::date from public.insights_daily_counts;") === "t");

  // Actual localhost browser documents; only canonical host/country are fixture platform boundaries.
  const tasks = [], captured = [];
  const documents = createServer(async (req, res) => {
    const headers = { ...req.headers, "x-vercel-ip-country": req.url?.includes("no-country") ? "ZZ" : "DE" };
    const request = new Request("https://btshq.online" + req.url, { method: req.method, headers });
    const event = adapter.eligibleServerDocument(request, 200);
    if (event) { captured.push(event); const task = adapter.recordServerDocument(event); tasks.push(task); await task; }
    res.setHeader("content-type", "text/html"); res.end("<!doctype html><html lang='de'><p>ISOLATED LOCAL PUBLIC DOCUMENT FIXTURE — NOT PRODUCTION</p></html>");
  }); servers.push(documents); await new Promise((r) => documents.listen(0, "127.0.0.1", r));
  const origin = "http://127.0.0.1:" + documents.address().port;
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  await context.route("**/*", (r) => r.request().url().startsWith(origin) ? r.continue() : r.abort());
  const page = await context.newPage(); const before = views(), beforeReach = reach();
  await page.goto(origin + "/community"); await page.goto(origin + "/writing/local-insights-evidence");
  ok("Real eligible browser documents persist Reach and Insights without opt-in, SDK or cookie", views() === before + 2 && reach() === beforeReach + 2 && (await context.cookies()).length === 0);
  ok("Actual fresh published Writing slug resolves its stable database UUID", metric("article_view") === 1 && sql("select content_id from public.insights_daily_counts where event_name='article_view';") === "article:11111111-1111-4111-8111-111111111111");
  sql("update public.writing_articles set status='draft' where id='11111111-1111-4111-8111-111111111111';");
  await page.reload(); ok("Withdrawal prevents another count through fresh actual publication query", metric("article_view") === 1);
  const afterPublic = views();
  for (const path of ["/admin", "/account", "/community?token=local-only", "/unknown", "/privacy"]) await page.goto(origin + path);
  await page.evaluate(() => fetch('/community', { headers: { rsc: '1', purpose: 'prefetch' } }));
  ok("Private/query/prefetch/fetch and unknown requests never become views", views() === afterPublic);
  for (const header of ["DNT", "Sec-GPC"]) {
    const negative = await browser.newContext({ extraHTTPHeaders: { [header]: "1" } }); const p = await negative.newPage();
    await p.goto(origin + "/community"); await negative.close();
    ok(header + " takes precedence for automatic server requests", views() === afterPublic);
  }
  await context.close();
  ok("Captured operational data excludes cookies, IP, referrer and answers", captured.every((e) => Object.keys(e).sort().join() === "at,country,id,path,target"));
  const snapshot = await founder.rpc("read_founder_insights", { p_period: "7d" });
  ok("Actual authenticated AAL2 RPC reads exact persisted totals", !snapshot.error && snapshot.data.metrics.reduce((n, m) => n + m.count, 0) === views());
  const { InsightsDashboard } = require("../components/admin/insights-dashboard.tsx");
  const markup = renderToStaticMarkup(React.createElement(InsightsDashboard, { state: { status: "available", ...snapshot.data }, catalog: catalog.staticInsightsCatalog(), period: "7d", collecting: true, serverDocuments: true }));
  ok("Existing Founder component renders automatic coverage and actual counters", markup.includes("Server-Dokumentabrufe") && markup.includes("Einwilligung"));
  // Historical fixtures only in this isolated database. Test existing closed-day projection/expiry.
  sql("update public.reach_collection_state set started_at=now()-interval '1 day' where singleton;insert into public.reach_daily_country_views values((now() at time zone 'UTC')::date-1,'ES',5),((now() at time zone 'UTC')::date-1,'FR',4);insert into public.insights_seen_events values(gen_random_uuid(),now()-interval '25 hours');");
  const total = views(), replayBefore = seen();
  await service.rpc("maintain_insights_aggregates"); await service.rpc("maintain_reach_aggregates");
  ok("Existing maintenance expires only old replay evidence and preserves Insights counts", seen() === replayBefore - 1 && views() === total);
  const projection = await service.rpc("read_public_reach_periods");
  ok("Real public projection suppresses closed small country cells and publishes eligible cells", !projection.error && projection.data.since.some((c) => c.countryCode === "ES" && c.pageViews === 5) && !projection.data.since.some((c) => c.countryCode === "FR"));
  await service.rpc("maintain_insights_aggregates"); await service.rpc("maintain_reach_aggregates");
  ok("Daily projection/maintenance retries are idempotent; no import double-addition", views() === total && (await service.rpc("read_public_reach_periods")).data.since.find((c) => c.countryCode === "ES").pageViews === 5);
  const reader = load("lib/analytics/first-party-reach.ts", { "server-only": {}, "@/lib/supabase/server": actualServer, "./country-reach": require("../lib/analytics/country-reach.ts"), "./first-party-config": runtimeGate, "./reach-periods": require("../lib/analytics/reach-periods.ts") });
  const dataset = reader.prepareFirstPartyReach(projection.data);
  ok("Real public RPC passes the existing strict dataset validator", dataset.since.status === "available" && dataset.since.displayedViews === 5);
  const geometry = load("lib/analytics/reach-geometry.ts", { "server-only": {}, "d3-geo": require("d3-geo"), "topojson-client": require("topojson-client"), "world-atlas/countries-50m.json": require("world-atlas/countries-50m.json"), "world-atlas/countries-110m.json": require("world-atlas/countries-110m.json"), "@/data/reach-country-codes": require("../data/reach-country-codes.ts") });
  const { ReachDashboard } = require("../components/community/reach-dashboard.tsx");
  const reachMarkup = renderToStaticMarkup(React.createElement(ReachDashboard, { locale: "de", shapes: geometry.getReachShapes(true), dataset }));
  ok("Actual existing public map component renders published Spain only, with exact five views", reachMarkup.includes("Spanien: 5") && !reachMarkup.includes("Frankreich: 4"));
  const css = readdirSync(resolve(root, ".next/static"), { recursive: true }).filter((p) => p.endsWith(".css")).map((p) => readFileSync(resolve(root, ".next/static", p), "utf8")).join("\n");
  const document = (content) => "<!doctype html><html lang='de'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><style>" + css + "</style></head><body style='background:#071522;padding:24px;color:#e2e8f0'><p style='background:#723b00;padding:12px'>ISOLIERTE SYNTHETISCHE LOKALE TESTDATEN — KEINE PRODUCTION-NUTZUNG</p>" + content + "</body></html>";
  dashboards["/fixture/reach"] = document(reachMarkup); dashboards["/fixture/insights"] = document(markup);
  const evidenceContext = await browser.newContext();
  await evidenceContext.route("**/*", (r) => r.request().url().startsWith(databaseUrl) ? r.continue() : r.abort());
  const evidencePage = await evidenceContext.newPage();
  for (const [label, width] of [["desktop", 1440], ["mobile", 390]]) {
    await evidencePage.setViewportSize({ width, height: 1000 });
    for (const view of ["reach", "insights"]) {
      await evidencePage.goto(databaseUrl + "/fixture/" + view);
      await evidencePage.screenshot({ path: resolve(out, view + "-local-" + label + ".png"), fullPage: true });
    }
  }
  await evidenceContext.close();
  ok("Request replay storage has no linkable content or session columns", sql("select string_agg(column_name,',' order by ordinal_position) from information_schema.columns where table_name='insights_seen_events';") === "event_id,issued_at");
  writeFileSync(resolve(out, "server-document-e2e.json"), JSON.stringify({ status: "PASS", checks, postgres: "17.12", postgrest: "14.18", browser: await browser.version(), productionRequests: 0, scope: "Real local browser -> actual adapter/publication query -> real PostgREST/PG -> existing public projection and authenticated AAL2 read/component. Canonical host/country and JWT identity are explicit isolated platform fixtures; no live Vercel or MFA claim." }, null, 2));
  console.log(JSON.stringify({ status: "PASS", checks: checks.length }));
} catch (error) {
  console.error(error.stack?.split("\n").slice(0, 6).join("\n")); process.exitCode = 1;
} finally {
  await browser?.close(); for (const child of children) child.kill(); for (const server of servers) await new Promise((r) => server.close(r));
  for (const container of containers.reverse()) docker(["rm", "-f", "-v", container]); if (networkCreated) docker(["network", "rm", network]);
  assert.equal(dirname(temp), tmpdir()); assert.ok(temp.includes(prefix)); rmSync(temp, { recursive: true });
}
