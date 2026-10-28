import assert from "node:assert/strict";
import { test } from "node:test";

import { nextStepJourneys } from "../data/find-your-next-step";
import { lifeAlignmentModules } from "../data/life-alignment-modules";
import { locales } from "../lib/i18n/config";
import { canonicalBtsShareUrl, webShareDestinations } from "../lib/sharing/destinations";

const origin = "https://btshq.online";
const prefixes = ["", ...locales.map((locale) => `/${locale}`)];

test("share allowlist denies every private Life Alignment route in every locale, including invitation tokens", () => {
  for (const prefix of prefixes) {
    for (const path of [
      "/life-alignment/invite", "/life-alignment/invite/private-token",
      "/life-alignment/session", "/life-alignment/session/private-id", "/life-alignment/sessions",
      "/life-alignment/partner/shared-device", "/life-alignment/self/private-id",
      "/life-alignment/auth", "/life-alignment/login", "/life-alignment/internal",
      "/life-alignment/unknown-module",
    ]) {
      for (const input of [`${prefix}${path}`, `${origin}${prefix}${path}/`]) {
        assert.equal(canonicalBtsShareUrl(input, origin), null, input);
        assert.equal(webShareDestinations({ text: "Must not leave the site", url: input }, origin), null, input);
      }
    }
  }
});

test("share allowlist denies authentication, internal and unknown routes instead of accepting arbitrary descendants", () => {
  for (const prefix of prefixes) {
    for (const path of [
      "/account", "/account/login", "/admin", "/admin/writing/id", "/api/private",
      "/auth/callback", "/login", "/invite/private-token", "/session/private-id", "/_next/internal",
      "/newsletter/confirm", "/newsletter/unsubscribe", "/find-your-next-step/invite",
      "/find-your-next-step/login", "/find-your-next-step/unknown", "/tools/money-profile/private-id",
    ]) assert.equal(canonicalBtsShareUrl(`${prefix}${path}`, origin), null, `${prefix}${path}`);
  }
});

test("share allowlist rejects URL parsing tricks, private queries/fragments and malformed article identities", () => {
  for (const input of [
    "//btshq.online/writing/story", "//evil.example/writing/story", "https://evil.example/writing/story",
    "https://btshq.online.evil.example/writing/story", "http://btshq.online/writing/story",
    "https://user:password@btshq.online/writing/story", "/writing/story?token=secret", "/writing/story?",
    "/writing/story#invite-token", "/life-alignment/self#writing-thought-id", "/#writing-thought-id",
    "/writing/../admin", "/life-alignment/self/../../admin", "/writing/%2e%2e/admin",
    "/life-alignment/%69nvite/private-token", "/life-alignment/invite%2fprivate-token",
    "/life-alignment/invite%252fprivate-token", "/life-alignment\\invite\\private-token",
    "/life-alignment//invite/private-token", "/EN/life-alignment/self", "/fr/life-alignment/self",
    "/writing/-story", "/writing/story-", "/writing/two--hyphens", `/writing/${"a".repeat(97)}`,
    "/writing/story\u0000", "/writing/story\u0001", "/writing/story\n", "/writing/story\t",
  ]) assert.equal(canonicalBtsShareUrl(input, origin), null, JSON.stringify(input));
});

test("share allowlist preserves home quotes, every existing public journey/module, tools and valid article thought links", () => {
  const publicPaths = [
    "/", "/writing", "/writing/a-public-article", "/writing/a-public-article#writing-thought-block_1",
    "/find-your-next-step", ...nextStepJourneys.map(({ href }) => href), "/life-alignment",
    ...lifeAlignmentModules.flatMap((module) => module.status === "available" ? [module.href] : []),
    "/tools/personal-advantage", "/tools/money-profile",
  ];
  for (const prefix of prefixes) {
    for (const path of publicPaths) {
      const input = `${prefix}${path === "/" ? "" : path}` || "/";
      const expected = `${origin}${prefix === "/de" ? "" : prefix}${path === "/" ? (prefix && prefix !== "/de" ? "" : "/") : path}`;
      assert.equal(canonicalBtsShareUrl(input, origin), expected, input);
      assert.equal(canonicalBtsShareUrl(`${origin}${input}`, origin), expected, `absolute ${input}`);
      assert.equal(webShareDestinations({ text: "Public authored thought", url: input }, origin)?.source, expected, input);
    }
  }
});

test("share allowlist is portable across configured origins without accepting unvalidated URL objects", () => {
  assert.equal(canonicalBtsShareUrl("/writing/story", "https://preview.example"), "https://preview.example/writing/story");
  assert.equal(canonicalBtsShareUrl("/", "http://localhost:3103"), "http://localhost:3103/");
  assert.equal(canonicalBtsShareUrl("/", new URL(origin)), `${origin}/`);
  for (const invalid of ["javascript:alert(1)", "http://external.example", "https://user:password@example.com", "https://example.com/private", "https://example.com/?secret=1"]) {
    assert.equal(canonicalBtsShareUrl("/writing/story", invalid), null, invalid);
    assert.equal(canonicalBtsShareUrl("/writing/story", new URL(invalid)), null, `URL object ${invalid}`);
  }
});
