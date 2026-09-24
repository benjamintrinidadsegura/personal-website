import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { canonicalBtsShareUrl, webShareDestinations } from "../lib/sharing/destinations";

function source(relative: string): string {
  return readFileSync(new URL(relative, import.meta.url), "utf8");
}

test("Money Profile is a first-class Tools route with metadata, discovery, sitemap and privacy disclosure", () => {
  const route = source("../app/tools/money-profile/page.tsx");
  const discovery = source("../data/discovery-index.ts");
  const curation = source("../data/discovery-curation.ts");
  const header = source("../components/layout/header.tsx");
  const sitemap = source("../app/sitemap.ts");
  const privacy = source("../app/privacy/page.tsx");
  assert.match(route, /pathname: "\/tools\/money-profile"/u);
  assert.match(route, /issueFeedbackFormToken/u);
  assert.match(discovery, /id: "tool-money-profile"[\s\S]*href: "\/tools\/money-profile"/u);
  assert.match(curation, /"tool-money-profile"/u);
  assert.match(header, /id: "money-profile"[\s\S]*\/tools\/money-profile/u);
  assert.match(sitemap, /"\/tools\/money-profile"/u);
  assert.match(privacy, /id="money-profile"/u);
  assert.match(privacy, /does not ask for income|fragt nicht nach Einkommen/iu);
});

test("Money One-Pager and share composer reuse the accepted safe BTS sharing foundation", () => {
  const experience = source("../components/money-profile/money-profile-experience.tsx");
  const card = source("../components/money-profile/money-profile-share-card.tsx");
  const dialog = source("../components/money-profile/money-profile-share-dialog.tsx");
  assert.match(experience, /MoneyOnePager/u);
  assert.match(dialog, /ShareFileActions/u);
  assert.match(dialog, /writingShareFormats/u);
  assert.match(dialog, /screenshotMode/u);
  assert.deepEqual(canonicalBtsShareUrl("/tools/money-profile"), "https://bts.online/tools/money-profile");
  assert.deepEqual(canonicalBtsShareUrl("/tr/tools/money-profile"), "https://bts.online/tr/tools/money-profile");
  assert.equal(canonicalBtsShareUrl("/tools/money-profile?result=private"), null);
  const destinations = webShareDestinations({ text: "My Money Profile", url: "/tools/money-profile" });
  assert.ok(destinations?.whatsapp.startsWith("https://wa.me/"));
  assert.ok(destinations?.linkedin.startsWith("https://www.linkedin.com/sharing/share-offsite/"));
  assert.doesNotMatch(card, /raw answers|account balance|net worth|debt amount|credit score/iu);
  assert.doesNotMatch(dialog, /stress\.description|blindSpots|frictionIds|answers/iu);
  assert.match(`${experience}\n${card}\n${dialog}`, /story|portrait|square/u);
});

test("Money result keeps progressive sections, Baseline and Stress visibly separate, and no score dashboard", () => {
  const experience = source("../components/money-profile/money-profile-experience.tsx");
  for (const section of ["money-profile", "money-meaning", "money-baseline", "money-tradeoffs", "money-playbook", "money-onepager"]) assert.equal(experience.includes(`id="${section}"`), true, section);
  assert.match(experience, /Baseline → Stress/u);
  assert.match(experience, /ResultFeedback[\s\S]*product="money-profile"/u);
  assert.doesNotMatch(experience, /radar|wealth meter|financial health|maturity score/iu);
});

test("share content is user-selected and private stress/friction sections are excluded by default", () => {
  const dialog = source("../components/money-profile/money-profile-share-dialog.tsx");
  assert.match(dialog, /new Set\(\["profile"\]\)/u);
  assert.match(dialog, /"profile", "meaning", "strength", "reminder"/u);
  assert.doesNotMatch(dialog, /MoneyShareSection.*stress|MoneyShareSection.*friction/iu);
});
