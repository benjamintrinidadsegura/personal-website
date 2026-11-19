// Local-only regression: no credentials, backend writes or Production targets.
// Uses an existing Playwright installation; it does not install dependencies.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BTS_BROWSER_MODULE || "playwright");
const origin = new URL(process.env.BTS_TEST_ORIGIN || "http://localhost:3562");
assert.ok(["localhost", "127.0.0.1"].includes(origin.hostname), "Only an isolated loopback target is permitted");
assert.equal(origin.protocol, "http:");
const output = process.env.BTS_EVIDENCE_DIR || ".bts-engineering/v1-browser";
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BTS_CHROME_PATH, headless: true });
const rows = [], network = [], errors = [];
try {
  for (const reducedMotion of ["reduce", "no-preference"]) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1000 }, reducedMotion });
    await context.addInitScript(() => localStorage.setItem("btshq:welcome-dismissed:v1", [new Date().getFullYear(), String(new Date().getMonth() + 1).padStart(2, "0"), String(new Date().getDate()).padStart(2, "0")].join("-")));
    await context.route("**/*", route => {
      const request = route.request(), url = new URL(request.url());
      network.push({ origin: url.origin, path: url.pathname, method: request.method() });
      return url.origin === origin.origin && request.method() === "GET" ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    for (const locale of ["de", "en", "es", "pl", "ru", "tr", "el"]) {
      assert.equal((await page.goto(new URL(locale === "de" ? "/" : "/" + locale, origin).href)).status(), 200);
      await page.locator("#universe-search").waitFor();
      await page.waitForFunction(() => Object.entries(document.getElementById("universe-search")).some(([key, value]) => key.startsWith("__reactProps") && typeof value?.onChange === "function"));
      for (const width of [320, 390, 768, 1280, 1440, 1920, 320, 1920, 320]) {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
        const samples = await page.evaluate(async () => {
          const result = [];
          for (let frame = 0; frame < 6; frame++) {
            if (frame) await new Promise(requestAnimationFrame);
            const introduction = document.getElementById("discover-human");
            result.push({ frame, width: innerWidth, scroll: document.documentElement.scrollWidth, introductionWidth: introduction?.getBoundingClientRect().width });
          }
          return result;
        });
        rows.push({ locale, reducedMotion, width, samples });
        assert.ok(samples.every(sample => sample.scroll <= sample.width + 1), JSON.stringify(rows.at(-1)));
      }
      if (locale === "tr" && reducedMotion === "reduce") {
        await page.screenshot({ path: path.join(output, "after-tr320.png") });
      }
      console.log(JSON.stringify({ locale, reducedMotion, resizeCases: 9, status: "PASS" }));
    }
    await context.close();
  }
  assert.equal(errors.length, 0);
  assert.ok(network.every(request => request.origin === origin.origin && request.method === "GET"));
} finally {
  fs.writeFileSync(path.join(output, "resize-regression.json"), JSON.stringify({ rows, errors, requests: network.length, unexpectedRequests: network.filter(request => request.origin !== origin.origin || request.method !== "GET"), realDevice: false }, null, 2));
  await browser.close();
}
