import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsxRuntime from "react/jsx-runtime";
import { getErrorDictionary } from "../data/i18n/errors";
import { locales } from "../lib/i18n/config";
import { loadSource } from "./helpers/load-source";

test("streamed loading reserves the first viewport without an external stylesheet in all seven locales", async () => {
  for (const locale of locales) {
    const { default: Loading } = loadSource<{ default: () => Promise<React.ReactElement> }>("app/loading.tsx", {
      "react/jsx-runtime": jsxRuntime,
      "@/lib/i18n/server": { getLocale: async () => locale },
      "@/data/i18n/errors": { getErrorDictionary },
    });
    const html = renderToStaticMarkup(await Loading());
    assert.match(html, /role="status"/u);
    assert.match(html, /data-navigation-loading/u);
    assert.match(html, /style="min-height:100svh"/u, "the initial streamed geometry must not depend on a later CSS asset");
    assert.ok(html.includes(getErrorDictionary(locale).loading));
    assert.doesNotMatch(html, /min-h-\[60svh\]|opacity:|visibility:|height:100svh;/u);
  }
});
