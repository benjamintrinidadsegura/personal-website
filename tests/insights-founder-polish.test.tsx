import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { InsightsDashboard } from "../components/admin/insights-dashboard";
import { empty, populated, catalog } from "./fixtures/insights-founder";
import type { InsightsState } from "../lib/insights/read";
const render = (state: InsightsState, collecting = true) => renderToStaticMarkup(<InsightsDashboard state={state} collecting={collecting} catalog={catalog} period="7d" />);
test("all states retain four KPIs and all five content regions without invented charts", () => {
  for (const state of [empty, { status: "disabled" }, { status: "unavailable" }] as InsightsState[]) {
    const html = render(state);
    for (const label of ["Seitenaufrufe", "Tool-Starts", "Tool-Abschlüsse", "Interaktionen", "Writing", "Tools", "People / Interviews", "Projects", "Community"]) assert.ok(html.includes(label));
    assert.ok((html.match(/>—</g) ?? []).length >= 9);
    assert.ok(!html.includes("Interesse im Zeitverlauf"));
    assert.ok(!html.includes('aria-hidden="true" style="width:'));
  }
});
test("real categories produce exact pageview/start/complete/open totals without double counting", () => {
  const html = render(populated);
  for (const value of [45, 4, 2, 6]) assert.match(html, new RegExp('>' + value + '</span>'));
  assert.ok(html.indexOf(catalog[0].title) < html.indexOf(catalog[1].title));
  assert.match(html, /Nicht verfügbar/); assert.ok(!html.includes("article:fixture"));
});
test("a known measurement history permits genuine zero; absent history uses dashes", () => {
  assert.match(render({ ...empty, startedAt: populated.startedAt }), />0<\/span>/);
  assert.doesNotMatch(render(empty), />0<\/span>/);
});
test("disabled, unavailable, no consented history and paused history remain distinct", () => {
  assert.match(render({ status: "disabled" }, false), /Messung deaktiviert/);
  assert.match(render({ status: "unavailable" }), /Messwerte nicht verfügbar/);
  assert.match(render(empty), /Noch keine freigegebenen Ereignisse/);
  assert.match(render(populated, false), /Bereits gemessene Werte bleiben sichtbar/);
});
test("technical information is collapsed by default; unsupported labels remain honest", () => {
  const html = render({ ...populated, metrics: [{ name: "article_view", contentId: "unknown", count: 2 }] });
  assert.match(html, /<details class=/); assert.doesNotMatch(html, /<details[^>]* open/);
  assert.match(html, /Inhaltstitel nicht verfügbar/); assert.doesNotMatch(html, />unknown</);
  assert.match(html, /Messbeginn/); assert.match(html, /Letzte Wartung/);
});
test("period selection remains native navigation with German labels", () => {
  const html = render(empty); assert.match(html.match(/<a[^>]*href="\/admin\/insights\?period=7d"[^>]*>/)![0], /aria-current="page"/);
  for (const label of ["Letzte 7 Tage", "Letzte 30 Tage", "Seit Messbeginn"]) assert.match(html, new RegExp(label));
});
