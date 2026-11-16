// Controlled provider-payload test. No network: the unmodified public collector is
// supplied explicitly, byte-pinned, and runs in a synthetic VM with captured fetch.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { gzipSync } from "node:zlib";
import ts from "typescript";

const file = process.argv[2];
assert.ok(file, "Usage: node scripts/test-public-analytics.mjs <downloaded public collector script>");
const collector = readFileSync(file, "utf8");
const digest = createHash("sha256").update(collector).digest("hex");
assert.equal(digest, "050e35bf7e6e96590f2a9de114c14ff792806ed28457b3248762944350c0ba4c", "Re-review any changed provider script before using these findings");
const sdkPath = "node_modules/@vercel/analytics/dist/index.js";
const sdk = readFileSync(sdkPath, "utf8");
assert.equal(JSON.parse(readFileSync("node_modules/@vercel/analytics/package.json", "utf8")).version, "2.0.1");

function loadTs(path, imports) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = createContext({ exports, require(name) { assert.ok(name in imports); return imports[name]; }, URL, process });
  runInContext(code, context);
  return exports;
}
const config = loadTs("lib/analytics/configuration.ts", {});
const i18n = loadTs("lib/i18n/config.ts", {});
const routing = loadTs("lib/i18n/routing.ts", { "@/lib/i18n/config": i18n });
const pageViews = loadTs("lib/analytics/public-page-view.ts", { "@/lib/i18n/config": i18n, "@/lib/i18n/routing": routing });
const allowlist = pageViews.createPublicPageViewAllowlist();
const adapter = loadTs("lib/analytics/vercel-adapter.ts", {
  "@/lib/analytics/configuration": config,
  "@/lib/analytics/public-page-view": pageViews,
});
const origin = "https://fixture.invalid";
const flush = () => new Promise((resolve) => setImmediate(resolve));

function fixture({ path = "/world?q=SYNTHETIC_SEARCH#SYNTHETIC_FRAGMENT", referrer = "", attribution = null, filter = adapter.createPublicBeforeSend(origin, allowlist) } = {}) {
  const requests = [];
  const location = new URL(origin + path);
  let script;
  const document = { referrer, currentScript: null, querySelectorAll: () => [],
    createElement: () => ({ dataset: {} }), head: { querySelector: () => null, appendChild(value) { script = value; document.currentScript = value; runInContext(collector, context); } } };
  // This is a VM fixture, not a real visitor or an attempt to send automated traffic.
  const context = createContext({ window: { addEventListener() {} }, document, location, navigator: { webdriver: false, userAgent: "Synthetic VM" },
    history: { pushState(_state, _unused, url) { const next = new URL(url, location); location.href = next.href; } },
    localStorage: { getItem() { return attribution; }, setItem() {}, removeItem() {} },
    fetch: async (url, init) => { requests.push({ url, method: init?.method, body: init?.body ? JSON.parse(init.body) : null }); return { ok: true }; },
    process: { env: { NODE_ENV: "production" } }, URL, console: { log() {} }, module: { exports: {} }, exports: {} });
  context.window.window = context.window;
  context.exports = context.module.exports;
  runInContext(sdk, context);
  context.module.exports.inject({ mode: "production", debug: false, beforeSend: filter });
  return { requests, context, script: () => script };
}

const clean = fixture(); await flush();
assert.equal(clean.requests.length, 1);
const serialized = JSON.stringify(clean.requests[0].body);
assert.equal(clean.requests[0].body.o, origin + "/world");
assert.doesNotMatch(serialized, /SYNTHETIC|\?|#/u);
assert.equal(clean.requests[0].body.sdkv, "2.0.1");

const privateRoute = fixture({ path: "/life-alignment/invite/SYNTHETIC_TOKEN" }); await flush();
assert.equal(privateRoute.requests.length, 0);
clean.context.window.va("event", { name: "SYNTHETIC_ANSWER", data: { answer: "SYNTHETIC_ANSWER" } }); await flush();
assert.equal(clean.requests.length, 1);
runInContext('history.pushState(null, "", "/writing?q=SYNTHETIC_SEARCH")', clean.context); await flush();
assert.equal(clean.requests.length, 2);
runInContext('history.pushState(null, "", "/writing?mode=explore#welcome")', clean.context); await flush();
assert.equal(clean.requests.length, 2, "same-path changes must not invent another page view");
runInContext('history.pushState(null, "", "/tools/personal-advantage?answer=SYNTHETIC_ANSWER")', clean.context); await flush();
assert.equal(clean.requests.length, 2);

const referrer = fixture({ referrer: "https://external.invalid/invite/SYNTHETIC_REFERRER?token=SYNTHETIC" }); await flush();
assert.match(JSON.stringify(referrer.requests[0].body), /SYNTHETIC_REFERRER/u, "Documented blocker must remain reproducible");
const attributed = fixture({ attribution: JSON.stringify({ userId: "SYNTHETIC_ATTRIBUTION", traits: { answer: "SYNTHETIC_TRAIT" } }) }); await flush();
assert.match(JSON.stringify(attributed.requests[0].body), /SYNTHETIC_ATTRIBUTION/u);
const denyAll = fixture({ filter: () => null, referrer: "https://external.invalid/SYNTHETIC" }); await flush();
assert.equal(denyAll.requests.length, 0);
assert.equal(config.isPublicAnalyticsEnabled({ BTS_PUBLIC_ANALYTICS_ENABLED: "true", VERCEL_ENV: "production", NODE_ENV: "production", SITE_URL: "https://btshq.online" }), false);

console.log(JSON.stringify({ status: "PASS", actualCollectorSerialization: true, networkRequestsSent: 0,
  collectorSha256: digest, sdk: "2.0.1", collectorBytes: Buffer.byteLength(collector), collectorGzipBytes: gzipSync(collector).length,
  sdkBytes: Buffer.byteLength(sdk), sdkGzipBytes: gzipSync(sdk).length,
  cases: ["sanitized public view", "private route excluded", "custom event excluded", "SPA public navigation", "same-path mode/welcome no duplicate", "assessment excluded", "URL-only external-referrer blocker reproduced", "URL-only attribution blocker reproduced", "deny-all stops serialization", "application activation blocked"],
  activationReadiness: "BLOCKED", limitation: "URL-only SDK beforeSend is not a full serialized-payload boundary" }, null, 2));
