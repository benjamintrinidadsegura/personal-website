import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AdvantageEvidence } from "../components/personal-advantage/advantage-evidence";
import { getPersonalAdvantageDisplayLabels, getPersonalAdvantageEvidenceDisclosureLabel, getPersonalAdvantageUiCopy } from "../data/personal-advantage-locales";
import { locales } from "../lib/i18n/config";

test("evidence stays complete, escaped and collapsed in a native localized disclosure", () => {
  const items = [
    { label: "Synthetic recurrence", detail: "Repeated in separate contexts." },
    { label: "Synthetic confidence", detail: "A hypothesis, not a verdict. <private-placeholder>" },
  ];
  for (const locale of locales) {
    const copy = getPersonalAdvantageUiCopy(locale);
    const html = renderToStaticMarkup(createElement(AdvantageEvidence, {
      copy, items, label: getPersonalAdvantageEvidenceDisclosureLabel(locale), transparency: getPersonalAdvantageDisplayLabels(locale).transparency,
    }));
    assert.match(html, /^<details id="advantage-evidence"/);
    assert.doesNotMatch(html, /<details[^>]*\sopen(?:[\s=>])/);
    assert.match(html, /<summary[^>]*><span/);
    assert.doesNotMatch(html, /<summary[^>]*>[\s\S]*?<h[1-6][\s\S]*?<\/summary>/);
    assert.match(html, /<h2[^>]*>/);
    assert.ok(html.includes(getPersonalAdvantageEvidenceDisclosureLabel(locale)));
    assert.ok(html.includes(copy.evidence));
    assert.equal((html.match(/<h3 /g) ?? []).length, items.length);
    for (const item of items) assert.equal(html.split(item.label).length - 1, 1);
    assert.ok(html.includes("Repeated in separate contexts."));
    assert.ok(html.includes("&lt;private-placeholder&gt;"));
    assert.doesNotMatch(html, /<private-placeholder>/);
  }
  assert.equal(getPersonalAdvantageEvidenceDisclosureLabel("de"), "Wie wurde mein Ergebnis ermittelt?");
  assert.equal(new Set(locales.map(locale => getPersonalAdvantageEvidenceDisclosureLabel(locale))).size, 7);
});

test("result transparency follows the one-pager and recommendations, with its stable anchor last in navigation", () => {
  const source = readFileSync(new URL("../components/personal-advantage/personal-advantage-experience.tsx", import.meta.url), "utf8");
  assert.ok(source.indexOf("<AdvantageEvidence ") > source.indexOf('id="advantage-onepager"'));
  assert.ok(source.indexOf("<AdvantageEvidence ") > source.indexOf("<ResultFeedback "));
  assert.match(source, /items=\{map\.evidenceSummary\}/);
  const navigation = source.slice(source.indexOf("function ResultNavigation"), source.indexOf("function PortfolioCard"));
  assert.ok(navigation.indexOf('["advantage-evidence"') > navigation.indexOf('["advantage-onepager"'));
  assert.match(navigation, /href=\{`#\$\{id\}`\}/);
});
