import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { discoveryIndex } from "../data/discovery-index";
import { getHomeCopy } from "../data/i18n/home";
import { getProjectPageCopy } from "../data/i18n/project-page";
import { getLocalizedProjects } from "../data/i18n/projects";
import { getProject } from "../data/projects";
import { siteConfig } from "../data/site";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("project ecosystem exposes only the approved official destinations", () => {
  assert.equal(getProject("goatrecrutainer")?.externalUrl, "https://www.goatrec.com");
  assert.equal(getProject("ratecom")?.externalUrl, "https://www.ratecom.online");

  const detail = source("../components/projects/project-detail.tsx");
  assert.equal(detail.includes("project.externalUrl"), true);
  assert.equal(detail.includes('target="_blank"'), true);
  assert.equal(detail.includes('rel="noopener noreferrer"'), true);
  assert.equal(detail.includes("copy.externalWebsite"), true);
  assert.equal(getProjectPageCopy("de").externalWebsite, "Externe Website ↗");
  assert.equal(getProjectPageCopy("en").externalWebsite, "External website ↗");
  assert.equal(detail.includes("[overflow-wrap:anywhere]"), true);
});

test("English project presentation preserves canonical slugs and verified destinations", () => {
  const german = getLocalizedProjects("de");
  const english = getLocalizedProjects("en");

  assert.deepEqual(english.map(({ slug }) => slug), german.map(({ slug }) => slug));
  assert.deepEqual(english.map(({ externalUrl }) => externalUrl), german.map(({ externalUrl }) => externalUrl));
  assert.equal(english.length, 6);
  assert.notEqual(english.find(({ slug }) => slug === "bts-online")?.description, german.find(({ slug }) => slug === "bts-online")?.description);
});

test("social presence uses the four approved profiles with accessible external links", () => {
  assert.deepEqual(siteConfig.socialLinks.map(({ label, url }) => ({ label, url })), [
    { label: "TikTok", url: "https://www.tiktok.com/@goatrecrutainer" },
    { label: "Instagram", url: "https://www.instagram.com/goatrecrutainer" },
    { label: "YouTube", url: "https://www.youtube.com/@goatrecrutainer" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/benjamín-trinidad-segura-590760158/" },
  ]);

  const contact = source("../components/sections/contact.tsx");
  assert.equal(contact.includes("social.context"), true);
  assert.equal(contact.includes("copy.externalLabel"), true);
  assert.equal(getHomeCopy("de").contact.externalLabel, "externe Website, öffnet in neuem Tab");
  assert.equal(contact.includes('rel="noopener noreferrer"'), true);
  assert.equal(contact.includes("mailto:"), false);
});

test("booking stays non-interactive until a public destination is verified", () => {
  assert.equal(siteConfig.booking.url, null);
  const combined = [
    source("../data/site.ts"),
    source("../components/sections/contact.tsx"),
    source("../components/layout/footer.tsx"),
  ].join("\n");

  assert.equal(combined.includes("calendly.com/app/scheduling/meeting_types/user/me"), false);
  assert.match(getHomeCopy("de").contact.bookingUnavailable, /^Öffentlicher Link in Verifizierung/u);
  assert.equal(combined.includes("copy.bookingUnavailable"), true);
  assert.match(combined, /siteConfig\.booking\.url \? <a/u);
});

test("projects and contact remain discoverable through navigation and Discovery", () => {
  const header = source("../components/layout/header.tsx");
  const footer = source("../components/layout/footer.tsx");
  assert.equal(header.includes('{ id: "goatrecrutainer", label: "GOATRECRUTAINER", href: localizedHref("/projects/goatrecrutainer") }'), true);
  assert.equal(header.includes('{ id: "ratecom", label: "RateCom", href: localizedHref("/projects/ratecom") }'), true);
  assert.equal(footer.includes('href={href("/#contact")}'), true);

  assert.equal(discoveryIndex.find(({ id }) => id === "project-goatrecrutainer")?.href, "/projects/goatrecrutainer");
  assert.equal(discoveryIndex.find(({ id }) => id === "project-ratecom")?.href, "/projects/ratecom");
  const contact = discoveryIndex.find(({ id }) => id === "page-contact");
  assert.equal(contact?.href, "/#contact");
  assert.deepEqual(["LinkedIn", "TikTok", "Instagram", "YouTube"].every((name) => contact?.keywords.includes(name)), true);
});

test("the single-column mobile pulse grid cannot expand the page beyond its viewport", () => {
  const pulse = source("../components/sections/hq-pulse.tsx");
  assert.equal(pulse.includes("grid grid-cols-1"), true);
  assert.equal(pulse.includes("min-w-0 border-b"), true);
});
