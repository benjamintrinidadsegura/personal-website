/** One disposable local integration: real UI -> handler -> PostgREST14/PG17.
 * Run with node --import tsx. All credentials and data are synthetic, local only.
 * No hosted requests, downloads, Production credentials or remote mutations.
 */
import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import * as cryptoModule from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
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
const prefix = "btshq-insights-" + randomUUID().slice(0, 8), pg = prefix + "-pg", rest = prefix + "-rest", network = prefix + "-net";
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
Object.assign(environment, { SITE_URL: "https://btshq.online", VERCEL: "1", VERCEL_ENV: "production", NODE_ENV: "production", BTS_INSIGHTS_MODE: "collect", BTS_REACH_ENABLED: "true", NEXT_TELEMETRY_DISABLED: "1" });
try {
  mkdirSync(out, { recursive: true });
  docker(["network", "create", "--subnet", "10.253.25.0/28", network]); networkCreated = true;
  docker(["run", "-d", "--pull=never", "--network", network, "--name", pg, "--user", "100:101", "--entrypoint", "/bin/sh", "public.ecr.aws/supabase/postgres:17.12.0.000", "-c", "initdb -D /tmp/insights-db --auth=trust -U postgres >/dev/null && printf 'host postgres authenticator 10.253.25.0/28 trust\n' >> /tmp/insights-db/pg_hba.conf && exec postgres -D /tmp/insights-db -c listen_addresses='*' -c unix_socket_directories=/tmp"]); containers.push(pg);
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
  sql(readFileSync(resolve(root, "supabase/migrations", migrationName), "utf8"));
  const secret = randomBytes(48).toString("base64url"), encode = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const jwt = (claims) => { const text = encode({ alg: "HS256", typ: "JWT" }) + "." + encode({ exp: Math.floor(Date.now() / 1000) + 3600, ...claims }); return text + "." + createHmac("sha256", secret).update(text).digest("base64url"); };
  const serviceToken = jwt({ role: "service_role" });
  const envFile = resolve(temp, "rest.env");
  writeFileSync(envFile, `PGRST_DB_URI=postgres://authenticator@${pg}:5432/postgres\nPGRST_DB_SCHEMAS=public\nPGRST_DB_ANON_ROLE=anon\nPGRST_JWT_SECRET=${secret}\n`, { mode: 0o600 });
  docker(["run", "-d", "--pull=never", "--network", network, "--name", rest, "-p", "127.0.0.1::3000", "--env-file", envFile, "postgrest/postgrest:v14.18"]); containers.push(rest);
  let restUrl;
  for (let i = 0; ; i++) { try { const port = docker(["port", rest, "3000/tcp"]).split(":").at(-1); restUrl = "http://127.0.0.1:" + port; if ((await fetch(restUrl)).ok) break; } catch { /* startup */ } if (i > 100) throw new Error("Local PostgREST not ready"); await sleep(200); }
  let dashboards = {}, css = "";
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
  const insightGate = load("lib/insights/config.ts", { "server-only": {}, "@/lib/analytics/first-party-config": runtimeGate }, { process: { env: environment } });
  const catalog = load("lib/insights/catalog.ts", { "server-only": {}, "node:crypto": cryptoModule,
    "@/data/discovery-index": require("../data/discovery-index.ts"), "@/data/projects": require("../data/projects.ts"), "@/data/spotlights": require("../data/spotlights.ts"),
    "@/lib/i18n/config": require("../lib/i18n/config.ts"), "@/lib/i18n/routing": require("../lib/i18n/routing.ts") });
  const contract = require("../lib/insights/contract.ts");
  const writing = load("lib/writing/queries.ts", { react: React, "@/lib/public-content-hygiene": require("../lib/public-content-hygiene.ts"), "@/lib/writing/domain": require("../lib/writing/domain.ts"), "@/lib/writing/read-deadline": require("../lib/writing/read-deadline.ts"), "@/lib/supabase/server": actualServer });
  const diagnostic = load("lib/insights/diagnostics.ts", {});
  const handler = load("app/api/insights/event/route.ts", { "@/lib/insights/config": insightGate, "@/lib/insights/catalog": catalog, "@/lib/insights/contract": contract, "@/lib/writing/queries": writing, "@/lib/supabase/server": actualServer, "@/lib/insights/diagnostics": diagnostic });
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
  const origin = "http://127.0.0.1:3320";
  const next = spawn(process.execPath, [resolve(root, "node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", "3320"], { cwd: root, env: environment, stdio: "ignore", windowsHide: true }); children.push(next);
  for (let i = 0; ; i++) { if (next.exitCode !== null) throw new Error("Local app exited"); try { if ((await fetch(origin + "/privacy")).ok) break; } catch { /* startup */ } if (i > 100) throw new Error("App not ready"); await sleep(150); }
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const requests = [], errors = []; let reachRequests = 0;
  const canonicalRequest = (body, additional = {}) => new Request("https://btshq.online/api/insights/event", { method: "POST", body, headers: { origin: "https://btshq.online", referer: "https://btshq.online/", "sec-fetch-site": "same-origin", "x-btshq-insights-consent": "v1", "content-type": "text/plain;charset=UTF-8", ...additional } });
  async function context(signal) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    if (signal) await ctx.addInitScript((key) => Object.defineProperty(navigator, key, { get: () => key === "doNotTrack" ? "1" : true }), signal);
    await ctx.route("**/*", async (route) => {
      try {
        const req = route.request(), url = new URL(req.url());
        if (![origin, databaseUrl].includes(url.origin)) return await route.abort();
        if (url.pathname === "/api/reach/view") { reachRequests++; return await route.abort(); }
        if (url.pathname !== "/api/insights/event") return await route.continue();
        const headers = await req.allHeaders(), body = req.postData();
        assert.equal(headers.cookie, undefined); assert.equal(headers.authorization, undefined); assert.equal(headers.referer, origin + "/");
        assert.deepEqual(Object.keys(JSON.parse(body)).sort(), ["at", "contentId", "eventId", "name"]);
        const response = await handler.POST(canonicalRequest(body)); requests.push(body);
        await route.fulfill({ status: response.status, body: "", headers: { "cache-control": "no-store" } });
      } catch (error) { errors.push(error.message); await route.abort().catch(() => {}); }
    });
    return ctx;
  }
  const settle = async (page) => { await page.waitForTimeout(600); assert.deepEqual(errors, []); };
  const consent = async (page) => { await page.goto(origin + "/privacy"); await page.getByRole("button", { name: "Insights in diesem Tab erlauben", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Insights erlaubt." }).waitFor(); await settle(page); };
  const ctx = await context(), page = await ctx.newPage();
  await page.goto(origin + "/community"); await settle(page); ok("No Insights without consent", views() === 0 && requests.length === 0);
  await consent(page); ok("Privacy consent page does not itself count", views() === 0);
  await page.goto(origin + "/community#global-reach"); await settle(page); ok("Real consent + navigation persists Community and explicit section open", metric("community_view") === 1 && metric("public_content_open") === 1 && seen() === 2);
  await page.locator('a[href="/world"]:visible').first().click(); await page.waitForURL(origin + "/world"); await settle(page); ok("Next.js SPA navigation records public content open", metric("public_content_open") === 2);
  await page.goto(origin + "/writing/local-insights-evidence"); await settle(page); ok("Real published article UI and fresh actual query record article ID", metric("article_view") === 1);
  const articleRequest = requests.find((body) => JSON.parse(body).name === "article_view");
  sql("update public.writing_articles set status='draft' where id='11111111-1111-4111-8111-111111111111';");
  ok("Withdrawn/draft article cannot be recorded through stale content identity", (await handler.POST(canonicalRequest(articleRequest))).status === 400 && metric("article_view") === 1);
  sql("update public.writing_articles set status='published' where id='11111111-1111-4111-8111-111111111111';");
  for (const event of ["interview_view", "project_view"]) {
    const target = catalog.staticInsightsCatalog().find((item) => item.event === event), beforeEvent = metric(event);
    await page.goto(origin + target.href); await settle(page);
    ok(event + " records the actual existing public detail page with opaque stable identity", metric(event) === beforeEvent + 1);
  }
  const before = views();
  await page.goto(origin + "/account"); await settle(page); await page.goto(origin + "/community?private=local-fixture"); await settle(page); ok("Private and query routes create no Insights", views() === before);
  const replay = requests[0]; await Promise.all(Array.from({ length: 5 }, () => handler.POST(canonicalRequest(replay))));
  ok("Concurrent identical requests are persisted exactly once", views() === before);
  const otherTarget = catalog.staticInsightsCatalog().find(({ area }) => area === "Projects");
  await handler.POST(canonicalRequest(JSON.stringify({ ...JSON.parse(replay), name: "project_view", contentId: otherTarget.id })));
  ok("A replay cannot move an event into another content category", views() === before);
  await page.goto(origin + "/admin/insights"); await settle(page); ok("Actual unauthenticated admin route exposes no metrics dashboard", !new URL(page.url()).pathname.startsWith("/admin/insights") && !(await page.locator('h1').allTextContents()).includes("BTSHQ Insights"));
  const unsupported = catalog.staticInsightsCatalog().find((item) => item.href === "/find-your-next-step");
  assert.ok(unsupported && !unsupported.lifecycle);
  const unsupportedBefore = metric("tool_view");
  await page.goto(origin + unsupported.href); await settle(page);
  ok("A view-only tool has a real view source without invented start/completion signals", metric("tool_view") === unsupportedBefore + 1);
  for (const tool of ["money-profile", "personal-advantage"]) {
    await page.goto(origin + "/tools/" + tool); await settle(page);
    const ui = require("../data/" + tool + "-locales.ts")[tool === "money-profile" ? "getMoneyProfileUiCopy" : "getPersonalAdvantageUiCopy"]("de");
    const starts = metric("tool_start"), completions = metric("tool_complete");
    await page.getByRole("button", { name: new RegExp("^" + (ui.cta ?? ui.start)) }).click(); await settle(page);
    ok(tool + " actual start signal persists without answer payload", metric("tool_start") === starts + 1 && metric("tool_complete") === completions);
    let completed = false;
    for (let step = 0; step < 180; step++) {
      const reveal = page.getByRole("button", { name: new RegExp("^" + ui.reveal) });
      if (await reveal.isVisible()) { await reveal.click(); await settle(page); completed = true; break; }
      const calibrations = await page.getByRole("radio", { name: ui.veryTrue, exact: true }).all();
      if (await page.getByRole("heading", { name: ui.calibrationTitle, exact: true }).isVisible()) { for (const answer of calibrations) await answer.click(); await page.getByRole("button", { name: new RegExp("^" + ui.connecting.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click(); continue; }
      const radios = page.getByRole("radio");
      if (await radios.count()) await radios.first().click();
      const checkboxes = await page.getByRole("checkbox").all();
      const nextButton = page.getByRole("button", { name: new RegExp("^" + ui.next + "(?: |$)") });
      if (await page.locator("textarea").isVisible()) await page.locator("textarea").fill("Isolated local workflow fixture only");
      for (const checkbox of checkboxes) { if (await nextButton.isEnabled()) break; if (await checkbox.isEnabled()) await checkbox.click(); }
      if (await nextButton.isVisible() && await nextButton.isEnabled()) await nextButton.click();
      else throw new Error("Actual tool workflow has no verified forward action: " + tool + " step " + step);
    }
    ok(tool + " completion occurs only after actual questionnaire/probe/calibration/reveal flow", completed && metric("tool_complete") === completions + 1);
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange"))); await settle(page);
    ok(tool + " result rerender/visibility does not count another completion", metric("tool_complete") === completions + 1);
  }
  for (const locale of ["de", "en", "es", "tr", "pl", "el", "ru"]) {
    const localized = await context(), p = await localized.newPage(), prefix = locale === "de" ? "" : "/" + locale;
    const beforeLocale = metric("community_view");
    await p.goto(origin + prefix + "/privacy"); await p.locator("#insights-privacy button").first().click();
    await p.goto(origin + prefix + "/community"); await settle(p);
    ok(locale + " separate consent + localized public navigation share canonical content identity", metric("community_view") === beforeLocale + 1 && await p.evaluate(() => document.documentElement.lang.split("-")[0]) === locale);
    await localized.close();
  }
  const total = views();
  await page.goto(origin + "/privacy"); await page.getByRole("button", { name: "Insights stoppen", exact: true }).click(); await page.goto(origin + "/community"); await settle(page); ok("Opt-out stops future views without blocking content", views() === total && await page.locator('h1').count() === 1);
  await ctx.close();
  for (const signal of ["doNotTrack", "globalPrivacyControl"]) { const negative = await context(signal), p = await negative.newPage(); await consent(p); await p.goto(origin + "/community"); await settle(p); ok(signal + " takes precedence over separate opt-in", views() === total); await negative.close(); }
  const expired = { ...JSON.parse(replay), eventId: randomUUID(), at: new Date(Date.now() - 25 * 3600000).toISOString() };
  ok("Expired event rejected before database write", (await handler.POST(canonicalRequest(JSON.stringify(expired)))).status === 400 && views() === total);
  const anonymous = createClient(databaseUrl, jwt({ role: "anon" }), { auth: { persistSession: false } });
  ok("Anonymous cannot call ingest RPC directly", Boolean((await anonymous.rpc("record_insight_event", { p_name: "community_view", p_content_id: "community:overview", p_event_id: randomUUID(), p_issued_at: new Date().toISOString() })).error));
  ok("Founder session cannot bypass the server ingestion boundary", Boolean((await founder.rpc("record_insight_event", { p_name: "community_view", p_content_id: "community:overview", p_event_id: randomUUID(), p_issued_at: new Date().toISOString() })).error));
  ok("Database independently rejects an expired service-role event", Boolean((await service.rpc("record_insight_event", { p_name: "community_view", p_content_id: "community:overview", p_event_id: randomUUID(), p_issued_at: expired.at })).error) && views() === total);
  const originalSeen = seen(); sql("insert into public.insights_seen_events values(gen_random_uuid(),statement_timestamp()-interval '25 hours');");
  ok("Real maintenance removes only expired replay ID and preserves aggregates", !(await service.rpc("maintain_insights_aggregates")).error && seen() === originalSeen && views() === total);
  const target = catalog.staticInsightsCatalog().find(({ area }) => area === "Tools");
  // Explicit isolated historical aggregate fixtures for UTC-window checks; no simulated Production history.
  sql(`insert into public.insights_daily_counts values((now() at time zone 'UTC')::date-8,'tool_view','${target.id}',7),((now() at time zone 'UTC')::date-31,'tool_view','${target.id}',11);update public.insights_state set started_at=statement_timestamp()-interval '33 days' where singleton;`);
  const reader = load("lib/insights/read.ts", { "server-only": {}, "./contract": contract });
  const { InsightsDashboard } = require("../components/admin/insights-dashboard.tsx");
  const published = await writing.getPublishedWritingInsightTarget("11111111-1111-4111-8111-111111111111");
  assert.equal(published.status, "data");
  const dashboardCatalog = [...catalog.staticInsightsCatalog(), { id: "article:" + published.article.id, title: published.article.title, href: "/writing/" + published.article.slug, event: "article_view", area: "Writing", lifecycle: false }];
  for (const period of ["7d", "30d", "all"]) {
    const result = await founder.rpc("read_founder_insights", { p_period: period }); assert.equal(result.error, null);
    const parsed = reader.parseInsights(result.data); assert.equal(parsed.status, "available");
    const expected = total + (period === "7d" ? 0 : period === "30d" ? 7 : 18);
    const actual = result.data.metrics.reduce((sum, row) => sum + row.count, 0);
    ok(period + " UTC aggregate window matches exact persisted totals", actual === expected);
    const component = renderToStaticMarkup(React.createElement(InsightsDashboard, { state: parsed, catalog: dashboardCatalog, period, collecting: true }));
    dashboards["/fixture/" + period] = "<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><link rel='stylesheet' href='" + origin + css + "'></head><body style='margin:0;background:#04111b'><p style='margin:0;padding:12px;background:#463719;color:#fff2cf;font:600 14px sans-serif'>ISOLATED SYNTHETIC EVIDENCE — NOT PRODUCTION</p>" + component + "</body></html>";
  }
  const body = await (await fetch(origin + "/privacy")).text(); css = body.match(/href="([^"]+\.css[^"]*)"/u)?.[1] ?? "";
  for (const key of Object.keys(dashboards)) dashboards[key] = dashboards[key].replace(origin + "'", origin + css + "'");
  const visuals = await context(), dashboard = await visuals.newPage();
  await dashboard.goto(databaseUrl + "/fixture/7d"); await dashboard.screenshot({ path: resolve(out, "insights-desktop.png"), fullPage: true });
  ok("View-only tool ranking honestly marks unsupported lifecycle metrics unavailable", await dashboard.getByText("Unavailable", { exact: true }).count() >= 2);
  await dashboard.keyboard.press("Tab"); await dashboard.keyboard.press("Tab"); await dashboard.keyboard.press("Tab");
  ok("Native keyboard navigation reaches the period links in reading order", await dashboard.evaluate(() => document.activeElement?.getAttribute("href") === "/admin/insights?period=30d"));
  await dashboard.emulateMedia({ reducedMotion: "reduce" });
  ok("Reduced-motion dashboard has no running decorative animations", await dashboard.evaluate(() => document.getAnimations().filter((animation) => animation.playState === "running").length === 0));
  const contrast = await dashboard.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1; const ctx = canvas.getContext("2d");
    const rgba = (color) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
    const luminance = (rgb) => rgb.slice(0, 3).map((x) => { const s = x / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; }).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
    return Math.min(...[...document.querySelectorAll("h1,h2,p,th,td,dt,dd,a")].filter((element) => element.getBoundingClientRect().width > 1 && element.textContent.trim()).map((element) => {
      const foreground = rgba(getComputedStyle(element).color); let ancestor = element, background = rgba("#04111b");
      while (ancestor) { const candidate = rgba(getComputedStyle(ancestor).backgroundColor); if (candidate[3] === 255) { background = candidate; break; } ancestor = ancestor.parentElement; }
      const a = luminance(foreground), b = luminance(background); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    }));
  });
  ok("Rendered dashboard text meets at least 4.5:1 contrast", contrast >= 4.5);
  for (const width of [320, 390, 768, 1440]) { await dashboard.setViewportSize({ width, height: 900 }); ok("Founder dashboard no document overflow at " + width, await dashboard.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); }
  await dashboard.setViewportSize({ width: 390, height: 844 }); await dashboard.screenshot({ path: resolve(out, "insights-mobile.png"), fullPage: true });
  await visuals.close();
  ok("All browser requests exclude answers/results/names and use only explicit catalog fields", requests.every((text) => Object.keys(JSON.parse(text)).sort().join() === "at,contentId,eventId,name"));
  ok("Insights consent never silently grants Global Reach consent or sends its collector", reachRequests === 0);
  writeFileSync(resolve(out, "insights-e2e-results.json"), JSON.stringify({ status: "PASS", postgres: sql("show server_version;"), postgrest: "14.18", browser: await browser.version(), checks, requests: requests.length, minimumDashboardContrast: contrast,
    productionRequests: 0, scope: "Real local UI/navigation/tool lifecycles, actual handler + publication query + real PostgREST/PG + Founder AAL2 RPC. Canonical origin and JWT/MFA identity are isolated platform fixtures; no live Production/MFA proof." }, null, 2));
  console.log(JSON.stringify({ status: "PASS", checks: checks.length, productionRequests: 0 }));
} catch (error) {
  writeFileSync(resolve(out, "insights-e2e-failure.json"), JSON.stringify({ status: "FAIL", completed: checks, message: error.message.slice(0, 1500) }, null, 2));
  console.error(error.stack?.split("\n").slice(0, 4).join("\n")); process.exitCode = 1;
} finally {
  await browser?.close(); for (const child of children) child.kill(); for (const server of servers) await new Promise((r) => server.close(r));
  for (const container of containers.reverse()) docker(["rm", "-f", "-v", container]); if (networkCreated) docker(["network", "rm", network]);
  assert.equal(dirname(temp), tmpdir()); assert.ok(temp.includes(prefix)); rmSync(temp, { recursive: true });
}
