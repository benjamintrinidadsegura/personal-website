/** Isolated local presentation evidence only. No authentication bypass or remote requests. */
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const { InsightsDashboard } = require("../components/admin/insights-dashboard.tsx");
const { empty, populated, catalog } = require("../tests/fixtures/insights-founder.ts");
const out = resolve(process.argv[2] ?? "../evidence"); mkdirSync(out, { recursive: true });
const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? files(resolve(dir, e.name)) : [resolve(dir, e.name)]);
const css = files(resolve(".next/static")).filter((p) => p.endsWith(".css")).map((p) => readFileSync(p, "utf8")).join("\n");
const states = { empty, populated, disabled: { status: "disabled" }, unavailable: { status: "unavailable" }, zero: { ...empty, startedAt: populated.startedAt }, paused: populated };
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost"), name = url.pathname.slice(1), state = states[name] ?? empty;
  const period = ["7d", "30d", "all"].includes(url.searchParams.get("period")) ? url.searchParams.get("period") : "7d";
  res.setHeader("content-type", "text/html;charset=utf-8");
  res.end(`<!doctype html><html lang="de"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body style="margin:0;background:#06131e"><p style="padding:12px;margin:0;color:#fff2cf;background:#463719;font:600 14px sans-serif">LOKALE SYNTHETISCHE ANSICHT – KEINE PRODUCTION-DATEN</p>${renderToStaticMarkup(React.createElement(InsightsDashboard, { state, catalog, period, collecting: !["disabled", "paused"].includes(name) }))}</body></html>`);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`, checks = [];
let browser;
const check = (name, pass) => { assert.ok(pass, name); checks.push({ name, status: "PASS" }); };
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await context.route("**/*", (r) => r.request().url().startsWith(origin) ? r.continue() : r.abort());
  const page = await context.newPage();
  for (const name of Object.keys(states)) for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto(origin + "/" + name);
    check(`${name} ${width}: document containment`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    check(`${name} ${width}: complete product structure`, await page.locator('section[aria-labelledby^="ranking-"]').count() === 5 && await page.locator('section[aria-label="Kennzahlen"] dt').count() === 4);
    check(`${name} ${width}: tables fit without hidden columns`, await page.locator("table").evaluateAll((tables) => tables.every((t) => t.getBoundingClientRect().right <= innerWidth && t.scrollWidth <= t.clientWidth + 1)));
    check(`${name} ${width}: no decorative motion`, await page.evaluate(() => document.getAnimations().every((a) => a.playState !== "running")));
    if (["empty", "populated"].includes(name) && [390, 1440].includes(width)) await page.screenshot({ path: resolve(out, `${name}-${width}.png`), fullPage: true });
  }
  for (const period of ["30d", "all"]) { await page.goto(origin + "/populated?period=" + period); check("selected period " + period, await page.locator("a[aria-current=page]").getAttribute("href") === "/admin/insights?period=" + period); }
  await page.goto(origin + "/populated");
  check("long published title fully available", await page.getByRole("link", { name: catalog[0].title }).isVisible());
  check("unsupported lifecycle is unavailable", await page.getByText("Nicht verfügbar", { exact: true }).count() === 2);
  await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
  check("keyboard period focus", await page.evaluate(() => document.activeElement?.getAttribute("aria-current") === "page"));
  const details = page.locator("details"); check("metadata initially collapsed", !(await details.getAttribute("open")) && !await details.evaluate((e) => e.open));
  await page.locator("summary").focus(); await page.keyboard.press("Enter"); check("metadata keyboard disclosure", await details.evaluate((e) => e.open));
  // Computed colours against each nearest opaque panel (no decorative text overlay).
  const contrast = await page.evaluate(() => {
    const luminance = (rgb) => rgb.map((v) => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
    const ctx = document.createElement("canvas").getContext("2d"); const rgb = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const a = [...ctx.getImageData(0, 0, 1, 1).data]; return [...a.slice(0, 3), a[3] / 255]; };
    return Math.min(...[...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().height && [...e.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())).map((e) => {
      let parent = e, background = [6, 19, 30];
      while (parent) { const c = rgb(getComputedStyle(parent).backgroundColor); if (c.length === 3 || c[3] === 1) { background = c.slice(0, 3); break; } parent = parent.parentElement; }
      const a = luminance(rgb(getComputedStyle(e).color).slice(0, 3)), b = luminance(background); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    }));
  }); check("rendered text contrast >= 4.5", contrast >= 4.5);
  writeFileSync(resolve(out, "visual-results.json"), JSON.stringify({ checks, minimumContrast: contrast, remoteRequestsAllowed: false, browser: await browser.version() }, null, 2));
  console.log(JSON.stringify({ status: "PASS", checks: checks.length, minimumContrast: contrast }));
} finally { await browser?.close(); await new Promise((r) => server.close(r)); }
