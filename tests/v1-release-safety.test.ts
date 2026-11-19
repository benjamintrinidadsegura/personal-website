import assert from "node:assert/strict";
import { test } from "node:test";
import { loadSource } from "./helpers/load-source";
import * as security from "../lib/echowall/security";
import * as validation from "../lib/echowall/validation";

function actions(enabled?: string) {
  let headerReads = 0;
  let databaseReads = 0;
  const api = loadSource<{
    issueEchoFormToken: () => Promise<string | null>;
    submitEchoAction: (state: null, data: FormData) => Promise<{ ok: boolean; code?: string }>;
  }>("app/echowall/actions.ts", {
    "next/headers": { headers: async () => { headerReads++; throw new Error("No request context should be read while disabled"); } },
    "next/cache": { revalidatePath() {} },
    "@/lib/echowall/security": security,
    "@/lib/echowall/validation": validation,
    "@/lib/i18n/server": { getLocale: async () => "en" },
    "@/lib/supabase/server": { getSupabaseServerClient: () => { databaseReads++; throw new Error("No database I/O allowed"); } },
  }, { process: { env: {
    ECHOWALL_SUBMISSIONS_ENABLED: enabled,
    ECHOWALL_FORM_TOKEN_SECRET: "isolated-unit-form-material-only",
    ECHOWALL_IP_HASH_SECRET: "isolated-unit-network-material-only",
    SITE_URL: "http://localhost:3000",
  } } });
  return { api, counts: () => ({ headerReads, databaseReads }) };
}

test("EchoWall defaults closed despite complete database/form configuration", async () => {
  for (const value of [undefined, "", "false", "TRUE", "1"]) {
    const { api, counts } = actions(value);
    assert.equal(await api.issueEchoFormToken(), null);
    const data = new Proxy(new FormData(), { get() { throw new Error("Disabled submission must not inspect answer/contact payload"); } });
    assert.deepEqual(await api.submitEchoAction(null, data), { ok: false, code: "SERVICE_UNAVAILABLE" });
    assert.deepEqual(counts(), { headerReads: 0, databaseReads: 0 });
  }
});

test("Explicit EchoWall activation permits issuing a token without bypassing request authorization", async () => {
  const { api, counts } = actions("true");
  assert.equal(typeof await api.issueEchoFormToken(), "string");
  await assert.rejects(api.submitEchoAction(null, new FormData()), /No request context/);
  assert.deepEqual(counts(), { headerReads: 1, databaseReads: 0 });
});
