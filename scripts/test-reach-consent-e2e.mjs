/** Synthetic, local-only browser -> production handler -> real PostgREST/PG.
 * Requires cached PG17.12/PostgREST14.18 images and Playwright (no downloads).
 * No production credentials, hosted requests, migration creation or remote writes.
 * Canonical host and Vercel country are explicitly fixture platform boundaries.
 */
import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { compileFunction } from "node:vm";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(process.argv[2] ?? resolve(root, "../evidence"));
const baseline = process.argv[3];
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const prefix = "btshq-reach-e2e-" + randomUUID().slice(0, 8);
const pg = prefix + "-pg", rest = prefix + "-rest", network = prefix + "-net";
const temporary = mkdtempSync(resolve(tmpdir(), prefix));
const checks = [], children = [], containers = [];
let browser, networkCreated = false;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function docker(args, input) {
  return execFileSync("docker", args, { input, encoding: "utf8", timeout: 60000, stdio: ["pipe", "pipe", "pipe"] }).trim();
}
function sql(query) { return docker(["exec", "-i", pg, "psql", "-h", "/tmp", "-X", "-U", "postgres", "-qAt", "-v", "ON_ERROR_STOP=1"], query); }
function ok(label, condition) { assert.ok(condition, label); checks.push({ case: label, status: "PASS" }); console.log("PASS: " + label); }
function load(path, dependencies, globals = {}) {
  const code = ts.transpileModule(readFileSync(resolve(root, path), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const exports = {};
  compileFunction(code, ["require", "exports", ...Object.keys(globals)], { filename: path })(
    (name) => { assert.ok(Object.hasOwn(dependencies, name), "Unlisted module: " + name); return dependencies[name]; },
    exports, ...Object.values(globals),
  );
  return exports;
}
const cleanEnvironment = () => Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(?:SUPABASE_|NEXT_PUBLIC_SUPABASE_|CRON_SECRET|OPENAI_API_KEY|BTS_PUBLIC_ANALYTICS|BTS_REACH_)/u.test(key)));
const environment = { ...cleanEnvironment(), SITE_URL: "https://btshq.online", VERCEL: "1", VERCEL_ENV: "production", NODE_ENV: "production", BTS_REACH_ENABLED: "true", NEXT_TELEMETRY_DISABLED: "1" };
async function serve(checkout, port) {
  const child = spawn(process.execPath, [resolve(checkout, "node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(port)], { cwd: checkout, env: environment, stdio: "pipe", windowsHide: true });
  children.push(child);
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error("Local Next server exited");
    try { if ((await fetch(`http://127.0.0.1:${port}/privacy`)).ok) return `http://127.0.0.1:${port}`; } catch { /* startup */ }
    await sleep(150);
  }
  throw new Error("Local Next readiness timeout");
}
try {
  mkdirSync(out, { recursive: true });
  // Explicit unused fixture subnet avoids Docker's exhausted default pools.
  // Docker rejects overlap; never remove or alter another project's networks.
  docker(["network", "create", "--subnet", "10.253.25.0/28", network]); networkCreated = true;
  docker(["run", "-d", "--pull=never", "--network", network, "--name", pg, "--user", "100:101", "--entrypoint", "/bin/sh", "public.ecr.aws/supabase/postgres:17.12.0.000", "-c", "initdb -D /tmp/reach-db --auth=trust -U postgres >/dev/null && printf 'host postgres authenticator 10.253.25.0/28 trust\n' >> /tmp/reach-db/pg_hba.conf && exec postgres -D /tmp/reach-db -c listen_addresses='*' -c unix_socket_directories=/tmp"]); containers.push(pg);
  for (let i = 0; ; i++) { try { sql("select 1;"); break; } catch { if (i > 100) throw new Error("Local PG readiness timeout"); await sleep(200); } }
  sql("create role anon;create role authenticated;create role service_role bypassrls;create role authenticator login noinherit;grant anon,authenticated,service_role to authenticator;alter default privileges in schema public grant all on tables to anon,authenticated,service_role;alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;");
  const migration = readFileSync(resolve(root, "supabase/pending-migrations/20261125112325_global_reach_live_pipeline.sql"), "utf8");
  sql(migration);
  const secret = randomBytes(48).toString("base64url");
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = encode({ alg: "HS256", typ: "JWT" }) + "." + encode({ role: "service_role", exp: Math.floor(Date.now() / 1000) + 3600 });
  const token = unsigned + "." + createHmac("sha256", secret).update(unsigned).digest("base64url");
  const envFile = resolve(temporary, "postgrest.env");
  writeFileSync(envFile, `PGRST_DB_URI=postgres://authenticator@${pg}:5432/postgres\nPGRST_DB_SCHEMAS=public\nPGRST_DB_ANON_ROLE=anon\nPGRST_JWT_SECRET=${secret}\n`, { mode: 0o600 });
  docker(["run", "-d", "--pull=never", "--network", network, "--name", rest, "-p", "127.0.0.1::3000", "--env-file", envFile, "postgrest/postgrest:v14.18"]); containers.push(rest);
  let port;
  for (let i = 0; ; i++) {
    try { port = docker(["port", rest, "3000/tcp"]).split(":").at(-1); if (port) break; } catch { /* startup */ }
    if (i > 30) throw new Error("Local PostgREST port unavailable: " + docker(["logs", rest]).slice(-600));
    await sleep(200);
  }
  const restUrl = "http://127.0.0.1:" + port;
  let restStatus = "unreachable";
  for (let i = 0; ; i++) {
    try { const response = await fetch(restUrl); restStatus = String(response.status); if (response.ok) break; } catch { /* startup */ }
    if (i > 100) {
      const log = spawnSync("docker", ["logs", rest], { encoding: "utf8" });
      throw new Error("Local PostgREST readiness timeout (HTTP " + restStatus + "): " + log.stderr.replaceAll(secret, "[fixture-secret]").slice(0, 2500));
    }
    await sleep(200);
  }
  const transport = (input, init) => {
    const url = new URL(typeof input === "string" ? input : input.url ?? input.toString());
    assert.equal(url.origin, restUrl, "RPC must stay local");
    url.pathname = url.pathname.replace(/^\/rest\/v1/u, "");
    return fetch(url, init);
  };
  const actualServer = load("lib/supabase/server.ts", { "server-only": {}, "@supabase/supabase-js": { createClient } },
    { process: { env: { SUPABASE_URL: restUrl, SUPABASE_SECRET_KEY: token } } });
  const config = load("lib/analytics/first-party-config.ts", { "server-only": {} }, { process: { env: environment } });
  const locales = load("lib/i18n/config.ts", {});
  const routing = load("lib/i18n/routing.ts", { "@/lib/i18n/config": locales });
  const allowlist = load("lib/analytics/public-page-view.ts", { "@/lib/i18n/config": locales, "@/lib/i18n/routing": routing });
  const countries = load("lib/analytics/country-reach.ts", {});
  const outcomes = [];
  const handler = load("app/api/reach/view/route.ts", {
    "@/lib/supabase/server": actualServer, "@/lib/analytics/country-reach": countries,
    "@/lib/analytics/first-party-config": config, "@/lib/analytics/public-page-view": allowlist,
    "@/lib/analytics/reach-diagnostics": { reachDiagnostic: (outcome) => outcomes.push(outcome) },
  }, { fetch: transport });
  const db = createClient(restUrl, token, { global: { fetch: transport }, auth: { persistSession: false, autoRefreshToken: false } });
  async function rpc(name, parameters) { const result = await db.rpc(name, parameters); assert.equal(result.error, null, "real RPC must succeed"); return result.data; }
  const count = () => Number(sql("select coalesce(sum(page_views),0) from public.reach_daily_country_views;"));
  const seen = () => Number(sql("select count(*) from public.reach_seen_events;"));
  const requests = [], failures = [];
  function canonicalRequest(body, overrides = {}) {
    // Explicit test platform metadata, not a claim about hosted Vercel geography.
    const headers = { origin: "https://btshq.online", referer: "https://btshq.online/", "sec-fetch-site": "same-origin", "x-btshq-reach-consent": "v1", "content-type": "text/plain;charset=UTF-8", "x-vercel-ip-country": "DE", "user-agent": "Synthetic local integration browser", ...overrides };
    for (const key of Object.keys(headers)) if (headers[key] === null) delete headers[key];
    return new Request("https://btshq.online/api/reach/view", { method: "POST", headers, body });
  }
  browser = await chromium.launch({ channel: "chrome", headless: true });
  async function contextFor(origin, signal) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    if (signal) await context.addInitScript((which) => Object.defineProperty(navigator, which, { get: () => which === "doNotTrack" ? "1" : true }), signal);
    await context.route("**/*", async (route) => {
      try {
        const request = route.request(), url = new URL(request.url());
        if (url.origin !== origin) return await route.abort();
        if (url.pathname !== "/api/reach/view") return await route.continue();
        assert.equal(request.method(), "POST");
        const headers = await request.allHeaders();
        assert.equal(headers["x-btshq-reach-consent"], "v1");
        assert.equal(headers.cookie, undefined);
        assert.equal(headers.authorization, undefined);
        assert.equal(headers.referer, origin + "/");
        const body = request.postData();
        assert.deepEqual(Object.keys(JSON.parse(body)).sort(), ["at", "eventId", "pathname"]);
        assert.doesNotMatch(body, /[?#]/u);
        const response = await handler.POST(canonicalRequest(body));
        requests.push(body);
        await route.fulfill({ status: response.status, headers: { "cache-control": "no-store" }, body: "" });
      } catch (error) { failures.push(error.message); await route.abort().catch(() => {}); }
    });
    return context;
  }
  async function settle(page) { await page.waitForTimeout(700); assert.deepEqual(failures, []); }
  async function consent(page, origin) {
    await page.goto(origin + "/privacy");
    await page.getByRole("button", { name: "In diesem Tab erlauben", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Messung erlaubt." }).waitFor();
    await settle(page);
  }
  if (baseline) {
    const origin = await serve(resolve(baseline), 3317), context = await contextFor(origin), page = await context.newPage();
    await consent(page, origin);
    await page.goto(origin + "/community#global-reach"); await settle(page);
    ok("BEFORE: approved anchored Community entry silently produces zero requests and zero stored views", requests.length === 0 && count() === 0 && seen() === 0);
    await page.screenshot({ path: resolve(out, "before-community-desktop.png"), fullPage: true });
    await context.close();
  }
  const origin = await serve(root, 3316), context = await contextFor(origin), page = await context.newPage();
  await consent(page, origin);
  ok("Consent privacy page itself never counts", count() === 0 && requests.length === 0);
  await page.goto(origin + "/community#global-reach"); await settle(page);
  ok("AFTER: same anchored entry persists one real RPC event and daily counter", count() === 1 && seen() === 1 && requests.length === 1 && outcomes.includes("rpc_succeeded"));
  await page.screenshot({ path: resolve(out, "after-community-desktop.png"), fullPage: true });
  await page.locator('a[href="/world"]:visible').first().click(); await page.waitForURL(origin + "/world"); await settle(page);
  ok("Next.js client navigation counts a new eligible view", count() === 2 && seen() === 2);
  await page.goBack(); await settle(page);
  ok("Back navigation to anchored Community counts once", count() === 3 && seen() === 3);
  await page.evaluate(() => { location.hash = "another-local-anchor"; document.dispatchEvent(new Event("visibilitychange")); }); await settle(page);
  ok("Fragment and visibility events never double count the same navigation", count() === 3 && requests.length === 3);
  await page.reload(); await settle(page);
  ok("Reload counts a new view", count() === 4 && seen() === 4);
  const replay = requests[0];
  ok("Identical retry acknowledged by real RPC without duplicate increment", (await handler.POST(canonicalRequest(replay))).status === 204 && count() === 4 && seen() === 4);
  await page.goto(origin + "/community?private=local-fixture"); await settle(page);
  await page.goto(origin + "/account"); await settle(page);
  ok("Query URLs and private routes never collect", count() === 4 && requests.length === 4);
  await page.goto(origin + "/community"); await settle(page);
  ok("Returning from excluded route creates one new public view", count() === 5 && seen() === 5);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(out, "after-community-mobile.png"), fullPage: true });
  await page.goto(origin + "/privacy");
  await page.getByRole("button", { name: "Messung stoppen", exact: true }).click();
  await page.goto(origin + "/world"); await settle(page);
  ok("Explicit opt-out prevents subsequent views", count() === 5 && requests.length === 5);
  await context.close();
  for (const signal of [null, "doNotTrack", "globalPrivacyControl"]) {
    const ctx = await contextFor(origin, signal), negative = await ctx.newPage();
    if (signal) await consent(negative, origin);
    await negative.goto(origin + "/community#global-reach"); await settle(negative);
    ok(signal ? signal + " overrides consent without network collection" : "No consent means no network collection", count() === 5 && requests.length === 5);
    await ctx.close();
  }
  for (const [label, headers, status] of [
    ["Missing country", { "x-vercel-ip-country": null }, 503], ["Invalid country", { "x-vercel-ip-country": "XX" }, 503],
    ["Bot", { "user-agent": "crawler" }, 202], ["Absent consent header", { "x-btshq-reach-consent": null }, 403],
    ["Server DNT", { dnt: "1" }, 403], ["Server GPC", { "sec-gpc": "1" }, 403],
  ]) ok(label + " is not a stored-event success", (await handler.POST(canonicalRequest(replay, headers))).status === status && count() === 5 && seen() === 5);
  const expired = { ...JSON.parse(replay), eventId: randomUUID(), at: new Date(Date.now() - 25 * 3600000).toISOString() };
  ok("Expired event rejected by production handler", (await handler.POST(canonicalRequest(JSON.stringify(expired)))).status === 400 && count() === 5);
  const rejected = await db.rpc("record_reach_pageview", { p_country: "DE", p_event_id: expired.eventId, p_issued_at: expired.at });
  ok("Expired event independently rejected by real database function", rejected.error?.code === "P0001" && count() === 5 && seen() === 5);
  await rpc("maintain_reach_aggregates");
  const unpublished = await rpc("read_public_reach_periods");
  ok("Five current-day views remain publicly suppressed until UTC day closes", unpublished.since.length === 0 && unpublished.daily.length === 0);
  // Projection/retention fixtures only in this disposable database, not clock manipulation.
  sql("update public.reach_collection_state set started_at=statement_timestamp()-interval '2 days';update public.reach_daily_country_views set utc_day=(now() at time zone 'UTC')::date-1;insert into public.reach_daily_country_views values((now() at time zone 'UTC')::date-1,'FR',4);insert into public.reach_seen_events values(gen_random_uuid(),statement_timestamp()-interval '25 hours');");
  await rpc("maintain_reach_aggregates");
  const published = await rpc("read_public_reach_periods");
  ok("Closed synthetic day publishes five eligible views through real public projection RPC", published.since.length === 1 && published.since[0].countryCode === "DE" && published.since[0].pageViews === 5);
  ok("Low-volume country cell removed and expired replay fixture deleted", sql("select count(*) from public.reach_daily_country_views where country_code='FR';") === "0" && seen() === 5);
  ok("Browser request payload contains no query, fragment, identifier other than per-view replay UUID, props or answers", requests.every((body) => Object.keys(JSON.parse(body)).sort().join() === "at,eventId,pathname"));
  const result = { status: "PASS", postgres: sql("show server_version;"), postgrest: "14.18", browser: await browser.version(), checks,
    scope: "Real browser consent/navigation and real application handler/Supabase client/PostgREST/PG persistence. Local transport maps platform host and country fixtures. No hosted geography or real Production traffic claim.",
    outcomes: [...new Set(outcomes)], requests: requests.length, syntheticPersistedViews: count() };
  writeFileSync(resolve(out, "browser-rpc-results.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ status: "PASS", checks: checks.length, realRpc: true, productionRequests: 0 }));
} catch (error) {
  // Assertion text contains case labels only; never dump request or JWT values.
  writeFileSync(resolve(out, "browser-rpc-failure.json"), JSON.stringify({ status: "FAIL", completedChecks: checks, message: error.message.slice(0, 1000) }, null, 2));
  console.error(error.stack?.split("\n").slice(0, 4).join("\n")); process.exitCode = 1;
} finally {
  await browser?.close();
  for (const child of children) child.kill();
  for (const container of containers.reverse()) docker(["rm", "-f", "-v", container]);
  if (networkCreated) docker(["network", "rm", network]);
  rmSync(temporary, { recursive: true });
}
