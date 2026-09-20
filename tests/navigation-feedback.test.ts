import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getSectionNavigationPlan,
  sectionScrollBehavior,
  shouldHandleSectionNavigation,
  shouldStartNavigationFeedback,
  type NavigationFeedbackIntent,
} from "../components/navigation/navigation-feedback";

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

test("section navigation keeps semantic hashes while reserving interception for same-document targets", () => {
  const samePage = { ...ordinaryIntent, currentHref: "https://bts.online/", targetHref: "https://bts.online/#feedback" };
  assert.deepEqual(getSectionNavigationPlan(samePage.currentHref, samePage.targetHref), {
    id: "feedback",
    sameDocument: true,
  });
  assert.equal(shouldHandleSectionNavigation(samePage), true);
  assert.equal(shouldHandleSectionNavigation({ ...samePage, modified: true }), false);
  assert.equal(shouldHandleSectionNavigation({ ...samePage, target: "_blank" }), false);

  const crossRoute = { ...samePage, currentHref: "https://bts.online/about" };
  assert.deepEqual(getSectionNavigationPlan(crossRoute.currentHref, crossRoute.targetHref), {
    id: "feedback",
    sameDocument: false,
  });
  assert.equal(shouldHandleSectionNavigation(crossRoute), false);
  assert.equal(shouldStartNavigationFeedback(crossRoute), true);
  assert.equal(getSectionNavigationPlan("https://bts.online/", "https://example.com/#feedback"), null);
});

test("long and reduced-motion section jumps are immediate while nearby jumps may stay brief", () => {
  assert.equal(sectionScrollBehavior(641, false), "auto");
  assert.equal(sectionScrollBehavior(-2000, false), "auto");
  assert.equal(sectionScrollBehavior(320, false), "smooth");
  assert.equal(sectionScrollBehavior(0, false), "smooth");
  assert.equal(sectionScrollBehavior(120, true), "auto");
});

test("feedback is layout-neutral, reduced-motion safe and covers full-document locale changes", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const layout = readFileSync("app/layout.tsx", "utf8");
  const loading = readFileSync("app/loading.tsx", "utf8");
  const switcher = readFileSync("components/i18n/language-switcher.tsx", "utf8");

  assert.match(css, /\.navigation-feedback\s*\{[\s\S]*position:\s*fixed/u);
  assert.match(css, /html\s*\{[\s\S]*scroll-behavior:\s*auto/u);
  assert.match(css, /main \[id\]\s*\{\s*scroll-margin-top:\s*6rem/u);
  assert.match(css, /data-section-navigation-target/u);
  assert.match(css, /data-navigation-settling/u);
  assert.match(css, /navigation-feedback-sheen/u);
  assert.match(
    css,
    /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.navigation-feedback[\s\S]*animation:\s*none;[\s\S]*transform:\s*scaleX\(0\.82\)/u,
  );
  assert.match(layout, /<NavigationFeedback\s*\/>/u);
  assert.match(loading, /data-navigation-loading/u);
  const feedback = readFileSync("components/navigation/navigation-feedback.tsx", "utf8");
  assert.match(feedback, /addEventListener\("click", handleClick, true\)/u);
  assert.equal((feedback.match(/addEventListener\("click", handleClick, true\)/gu) ?? []).length, 1);
  assert.match(feedback, /window\.history\.pushState/u);
  assert.match(feedback, /addEventListener\("hashchange", handleHashChange\)/u);
  assert.match(feedback, /focus\(\{ preventScroll: true \}\)/u);
  assert.match(feedback, /requestAnimationFrame\(\(\) => \{[\s\S]*requestAnimationFrame/u);
  assert.match(feedback, /attempt >= 120/u);
  assert.match(feedback, /cancelled \|\| revealCurrentHash\(\)/u);
  assert.match(feedback, /prefers-reduced-motion: reduce/u);
  assert.match(feedback, /NEARBY_SECTION_DISTANCE_PX = 640/u);
  assert.match(feedback, /event\.defaultPrevented\) stopNavigationFeedback\(\)/u);
  assert.match(feedback, /setAttribute\(SETTLING_ATTRIBUTE, "true"\)/u);
  assert.match(switcher, /startNavigationFeedback\(\);[\s\S]*window\.location\.assign/u);
  assert.doesNotMatch(switcher, /router\.(?:push|replace)/u);
});
