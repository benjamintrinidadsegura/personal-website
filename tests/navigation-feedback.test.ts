import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { shouldStartNavigationFeedback, type NavigationFeedbackIntent } from "../components/navigation/navigation-feedback";

const ordinaryIntent: NavigationFeedbackIntent = {
  currentHref: "https://bts.online/about",
  targetHref: "https://bts.online/projects/goatrecrutainer",
  button: 0,
  defaultPrevented: false,
  modified: false,
  target: "",
  download: false,
};

test("ordinary internal route navigation receives immediate feedback", () => {
  assert.equal(shouldStartNavigationFeedback(ordinaryIntent), true);
  assert.equal(shouldStartNavigationFeedback({ ...ordinaryIntent, targetHref: "https://bts.online/about?view=compact" }), true);
});

test("native browser and non-route navigation semantics remain untouched", () => {
  assert.equal(shouldStartNavigationFeedback({ ...ordinaryIntent, modified: true }), false);
  assert.equal(shouldStartNavigationFeedback({ ...ordinaryIntent, button: 1 }), false);
  assert.equal(shouldStartNavigationFeedback({ ...ordinaryIntent, target: "_blank" }), false);
  assert.equal(shouldStartNavigationFeedback({ ...ordinaryIntent, download: true }), false);
  assert.equal(shouldStartNavigationFeedback({ ...ordinaryIntent, defaultPrevented: true }), false);
  assert.equal(shouldStartNavigationFeedback({ ...ordinaryIntent, targetHref: "https://example.com/about" }), false);
  assert.equal(shouldStartNavigationFeedback({ ...ordinaryIntent, targetHref: "https://bts.online/about#evidence" }), false);
});

test("feedback is layout-neutral, reduced-motion safe and covers full-document locale changes", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const layout = readFileSync("app/layout.tsx", "utf8");
  const loading = readFileSync("app/loading.tsx", "utf8");
  const switcher = readFileSync("components/i18n/language-switcher.tsx", "utf8");

  assert.match(css, /\.navigation-feedback\s*\{[\s\S]*position:\s*fixed/u);
  assert.match(
    css,
    /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.navigation-feedback[\s\S]*animation:\s*none;[\s\S]*transform:\s*scaleX\(0\.82\)/u,
  );
  assert.match(layout, /<NavigationFeedback\s*\/>/u);
  assert.match(loading, /data-navigation-loading/u);
  const feedback = readFileSync("components/navigation/navigation-feedback.tsx", "utf8");
  assert.match(feedback, /addEventListener\("click", handleClick, true\)/u);
  assert.match(feedback, /event\.defaultPrevented\) stopNavigationFeedback\(\)/u);
  assert.match(switcher, /startNavigationFeedback\(\);[\s\S]*window\.location\.assign/u);
  assert.doesNotMatch(switcher, /router\.(?:push|replace)/u);
});
