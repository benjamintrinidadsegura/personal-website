// Local production-build geometry regression. No backend writes or remote targets.
// Uses an existing Playwright installation; never installs a dependency.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)(process.env.BTS_BROWSER_MODULE || "playwright");
const origin = new URL(process.env.BTS_TEST_ORIGIN || "http://localhost:3572");
assert.ok(["localhost", "127.0.0.1"].includes(origin.hostname));
assert.equal(origin.protocol, "http:");
const output = process.env.BTS_EVIDENCE_DIR || ".bts-engineering/explore-cls";
const missingGuards = process.env.BTS_SIMULATE_MISSING_GUARDS === "true";
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BTS_CHROME_PATH, headless: true });
const rows = [], errors = [], network = [], interactions = [], failures = [];
const check = (label, assertion) => { try { assertion(); } catch (error) { failures.push({ label, message: error.message }); } };
const maxSessionCLS = shifts => {
  let max = 0, sum = 0, start = 0, last = -1;
  for (const e of shifts.filter(e => !e.recent)) {
    if (last < 0 || e.t - last >= 1000 || e.t - start >= 5000) { sum = 0; start = e.t; }
    sum += e.v; max = Math.max(max, sum); last = e.t;
  }
  return max;
};
try {
  const cases = [[320, 844, 20, "en"], [390, 844, 10, "en"], [1440, 1000, 10, "en"], [320, 568, 4, "en"]];
  for (const locale of ["de", "es", "pl", "ru", "tr", "el"]) cases.push([320, 568, 1, locale]);
  for (const [width, height, count, locale] of cases) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
    await context.addInitScript(() => {
      localStorage.setItem("btshq:home-view:v1", "explore");
      const d = new Date();
      localStorage.setItem("btshq:welcome-dismissed:v1", [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-"));
      window.qaCLS = []; window.qaLayout = [];
      new PerformanceObserver(list => window.qaCLS.push(...list.getEntries().map(e => ({ v: e.value, t: e.startTime, recent: e.hadRecentInput, sources: e.sources.map(s => ({ tag: s.node?.tagName, id: s.node?.id, previous: s.previousRect.toJSON(), current: s.currentRect.toJSON() })) })))).observe({ type: "layout-shift", buffered: true });
      let previous = "";
      const sample = () => {
        const main = document.getElementById("main-content"), footer = document.querySelector("body>footer"), loading = document.querySelector("[data-navigation-loading]");
        const x = { main: main?.getBoundingClientRect().toJSON(), footer: footer?.getBoundingClientRect().toJSON(), loading: loading?.getBoundingClientRect().toJSON(), minHeight: loading && getComputedStyle(loading).minHeight, inlineMinHeight: loading?.style.minHeight, explore: !!document.querySelector("#home-view-explore:checked"), fonts: document.fonts.status, ready: document.readyState };
        const serialized = JSON.stringify(x);
        if (serialized !== previous) { window.qaLayout.push({ t: performance.now(), ...x }); previous = serialized; }
        if (performance.now() < 6000) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await context.route("**/*", async route => {
      const request = route.request(), url = new URL(request.url());
      network.push({ origin: url.origin, path: url.pathname, method: request.method() });
      if (url.origin !== origin.origin || request.method() !== "GET") return route.abort();
      // Explicit fault injection reproduces the guards absent from the failed hosted CSS.
      // Normal assertions and CLS collection stay identical; the component must stand alone.
      if (missingGuards && url.pathname.endsWith(".css")) {
        const response = await route.fetch();
        const body = (await response.text())
          .replace(/#main-content\s*>\s*\[data-navigation-loading\]\s*\{\s*min-height:\s*100svh;?\s*\}/gu, "")
          .replace(/@media\s*\(scripting:\s*enabled\)\s*\{\s*body\s*>\s*footer\s*\{[^}]*\}\s*body:has\(#main-content\s*>\s*\[data-navigation-loading\]\)\s*>\s*footer\s*\{[^}]*\}\s*\}/gu, "");
        return route.fulfill({ response, body });
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 80, downloadThroughput: 500000, uploadThroughput: 500000 });
    const url = new URL(locale === "de" ? "/" : "/" + locale, origin).href;
    await page.goto(url);
    await page.waitForTimeout(1400);
    for (let trial = 1; trial <= count; trial++) {
      // Also exercise native restoration; no application scroll correction is introduced.
      if (height === 568) await page.evaluate(() => scrollTo(0, 400));
      const response = await page.reload();
      await page.locator("#home-view-explore:checked").waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1400);
      const state = await page.evaluate(() => ({ shifts: window.qaCLS, sequence: window.qaLayout, overflow: document.documentElement.scrollWidth > innerWidth + 1, overflowNodes: [...document.querySelectorAll("body *")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1); }).slice(0, 20).map(e => ({ tag: e.tagName, id: e.id, className: e.className?.toString().slice(0, 120), rect: e.getBoundingClientRect().toJSON() })), selected: document.getElementById("home-view-explore").checked, footerBelowMain: document.querySelector("body>footer").getBoundingClientRect().top >= document.getElementById("main-content").getBoundingClientRect().bottom - 1 }));
      const cls = maxSessionCLS(state.shifts);
      rows.push({ width, height, locale, trial, http: response.status(), cls, ...state });
      console.log(JSON.stringify({ width, height, locale, trial, cls }));
      if (trial === 1) await page.screenshot({ path: path.join(output, `explore-${locale}-${width}-${height}.png`) });
      const label = `${locale}/${width}/${height}/${trial}`;
      check(label + "/http", () => assert.equal(response.status(), 200));
      check(label + "/cls", () => assert.ok(cls <= 0.1, String(cls)));
      check(label + "/overflow", () => assert.equal(state.overflow, false));
      check(label + "/footer", () => assert.equal(state.footerBelowMain, true));
      check(label + "/preference", () => assert.equal(state.selected, true));
    }
    // Both switch directions and persistence without clearing answers/search state.
    await page.locator("label:has(#home-view-discover)").click();
    await page.waitForFunction(() => document.querySelector("#universe-search")?.getClientRects().length > 0);
    assert.equal(await page.locator("#home-explore-panel").isVisible(), false);
    await page.locator("label:has(#home-view-explore)").click();
    assert.equal(await page.locator("#home-explore-panel").isVisible(), true);
    assert.equal(await page.evaluate(() => localStorage.getItem("btshq:home-view:v1")), "explore");
    interactions.push({ locale, width, height, switchBothWays: true });
    await context.close();
  }
  assert.equal(errors.length, 0, errors.join("\n"));
  assert.ok(network.every(r => r.origin === origin.origin && r.method === "GET"));
  assert.equal(failures.length, 0, JSON.stringify(failures));
} finally {
  fs.writeFileSync(path.join(output, "cls-results.json"), JSON.stringify({ missingGuards, conditions: "80ms/500000Bps, reduced motion, saved Explore, 1.4s after fonts ready", rows, interactions, errors, failures, unexpectedRequests: network.filter(r => r.origin !== origin.origin || r.method !== "GET"), requests: network.length }, null, 2));
  await browser.close();
}
