import assert from "node:assert/strict";
import { test } from "node:test";
import { getPublicPageView } from "../lib/analytics/public-page-view";
import { locales } from "../lib/i18n/config";
import { localizeHref } from "../lib/i18n/routing";

test("page-view preparation drops queries and fragments for exact editorial pages in all locales", () => {
  for (const locale of locales) {
    for (const path of ["/", "/about", "/people", "/world", "/writing"]) {
      const pathname = localizeHref(path, locale);
      const payload = getPublicPageView(pathname + "?token=synthetic-token&email=private%40example.test#answer");
      assert.deepEqual(payload, { type: "pageview", pathname });
    }
  }
});

test("sensitive workflows, unknown content, external URLs and encoded paths are excluded", () => {
  for (const locale of locales) {
    for (const path of ["/admin/login", "/account", "/life-alignment", "/life-alignment/invite/secret",
      "/life-alignment/session/private", "/tools/personal-advantage", "/echowall", "/writing/unverified-slug",
      "/people/unknown", "/writing/../account", "/api", "/%77riting", "/writing/"]) {
      assert.equal(getPublicPageView(localizeHref(path, locale)), null);
    }
  }
  for (const path of ["https://btshq.online/writing", "//external.example/writing", "writing", "#fragment", "/writing\\secret"]) {
    assert.equal(getPublicPageView(path), null);
  }
});
