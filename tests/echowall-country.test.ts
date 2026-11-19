import assert from "node:assert/strict";
import { test } from "node:test";
import { echoCountryName, echoCountryOptions, isEchoCountry, summarizeEchoCountries } from "../lib/echowall/countries";
import { validateEchoSubmission } from "../lib/echowall/validation";
import { locales } from "../lib/i18n/config";
import { isPublicEchoReady } from "../lib/public-content-hygiene";
import { echoCategories, type PublicEcho, type PublicEchoQueryResult } from "../types/echowall";
import { loadSource } from "./helpers/load-source";
import * as security from "../lib/echowall/security";
import { readFileSync } from "node:fs";
import type { EchoActionState } from "../types/echowall";

const valid = { displayName: "Synthetic reader", message: "Synthetic text for validation only.",
  category: "", email: "", consent: "true", website: "", formToken: "synthetic-form" };

test("country omission is valid and never opts into community counts", () => {
  const result = validateEchoSubmission({ ...valid, countryCode: "", includeInCommunityMap: "true" });
  assert.ok(result.success);
  assert.equal(result.data.countryCode, undefined);
  assert.equal(result.data.includeInCommunityMap, undefined);
});

test("country is user-selected, and aggregation requires separate opt-in", () => {
  const without = validateEchoSubmission({ ...valid, countryCode: "DE" });
  const withOptIn = validateEchoSubmission({ ...valid, countryCode: "DE", includeInCommunityMap: "true" });
  assert.ok(without.success && withOptIn.success);
  assert.equal(without.data.countryCode, "DE");
  assert.equal(without.data.includeInCommunityMap, false);
  assert.equal(withOptIn.data.includeInCommunityMap, true);
});

test("localized options and validation cover seven locales and reject non-country values", () => {
  for (const locale of locales) {
    const countries = echoCountryOptions(locale);
    assert.equal(countries.length, 249);
    assert.equal(new Set(countries.map(({ code }) => code)).size, 249);
    assert.equal(countries.find(({ code }) => code === "DE")?.label, echoCountryName("DE", locale));
    for (const countryCode of ["XX", "EU", "de", "Berlin", "DE/secret"]) {
      assert.equal(isEchoCountry(countryCode), false);
      const rejected = validateEchoSubmission({ ...valid, countryCode }, locale);
      assert.equal(rejected.success, false);
      if (!rejected.success) assert.ok(rejected.fieldErrors.countryCode);
    }
  }
});

test("country totals contain no names or messages and suppress small groups and omitted consent", () => {
  const echo = (id: string, countryCode: string, includeInCommunityMap: boolean): PublicEcho => ({
    id, countryCode, includeInCommunityMap, displayName: "Synthetic reader",
    message: "Synthetic text", category: null, publishedAt: "2026-11-11",
  });
  const rows = [
    echo("1", "DE", true), echo("2", "DE", true), echo("3", "DE", true),
    echo("4", "ES", false), echo("5", "ES", true), echo("6", "ES", true),
    echo("7", "XX", true), echo("8", "XX", true), echo("9", "XX", true),
  ];
  assert.deepEqual(summarizeEchoCountries(rows), [{ countryCode: "DE", contributions: 3 }]);
});

type EchoQuery = (limit: number, countryContext?: boolean) => Promise<PublicEchoQueryResult>;

function loadEchoQuery(flag: boolean, hasColumns: boolean) {
  const calls: string[] = [];
  const row = {
    id: "reviewed-fixture", display_name: "Reviewed fixture reader", message: "Synthetic local acceptance text.",
    category: "thought", approved_at: "2026-11-11T10:00:00Z",
  };
  const read = {
    select(columns: string) {
      calls.push(columns);
      const expanded = columns.includes("country_code");
      const filter = {
        eq(column: string, value: string) { assert.equal(column + ":" + value, "status:approved"); return filter; },
        not(column: string, operation: string, value: unknown) {
          assert.deepEqual([column, operation, value], ["approved_at", "is", null]); return filter;
        },
        order() { return filter; },
        limit() { return filter; },
        async overrideTypes() {
          if (expanded && !hasColumns) return { data: null, error: { code: "42703" } };
          return { data: [expanded ? { ...row, country_code: "DE", include_in_community_map: true } : row], error: null };
        },
      };
      return filter;
    },
  };
  const query = loadSource<{ getApprovedEchoes: EchoQuery }>("lib/echowall/queries.ts", {
    "server-only": {},
    "react": { cache: (fn: EchoQuery) => fn },
    "@/lib/echowall/country-configuration": { isEchoCountryContextEnabled: () => flag },
    "@/lib/echowall/countries": { isEchoCountry },
    "@/lib/public-content-hygiene": { isPublicEchoReady },
    "@/lib/supabase/server": { getSupabaseServerClient: () => ({ from: () => read }) },
    "@/types/echowall": { echoCategories },
  });
  return { readEchoes: query.getApprovedEchoes, calls };
}

test("unapplied country migration leaves approved EchoWall readable with the capability disabled", async () => {
  const { readEchoes, calls } = loadEchoQuery(true, false);
  const result = await readEchoes(50, true);
  assert.equal(result.status, "data");
  assert.equal(result.countryContextAvailable, false);
  assert.equal(result.echoes[0].countryCode, undefined);
  assert.equal(calls.length, 2);
  assert.match(calls[0], /country_code/u);
  assert.doesNotMatch(calls[1], /country_code|email/u);
});

test("country data is selected only on an opted-in surface with the server switch enabled", async () => {
  const inactive = loadEchoQuery(false, true);
  assert.equal((await inactive.readEchoes(50, true)).countryContextAvailable, false);
  assert.doesNotMatch(inactive.calls[0], /country_code/u);
  const enabled = loadEchoQuery(true, true);
  assert.equal((await enabled.readEchoes(3)).countryContextAvailable, false, "home teaser keeps the legacy public read");
  const extended = await enabled.readEchoes(50, true);
  assert.equal(extended.countryContextAvailable, true);
  assert.equal(extended.echoes[0].countryCode, "DE");
  assert.equal(extended.echoes[0].includeInCommunityMap, true);
});

function submission(flag: boolean, failCountry = false) {
  const calls: { name: string; country?: unknown; aggregate?: unknown }[] = [];
  const formSecret = "isolated-unit-form-key";
  const siteUrl = "http://localhost:3292";
  const api = loadSource<{ submitEchoAction: (state: EchoActionState, form: FormData) => Promise<EchoActionState> }>("app/echowall/actions.ts", {
    "next/headers": { headers: async () => new Headers({ origin: siteUrl, host: "localhost:3292", "x-real-ip": "192.0.2.1" }) },
    "@/lib/echowall/security": security,
    "@/lib/echowall/validation": { validateEchoSubmission },
    "@/lib/i18n/server": { getLocale: async () => "en" },
    "@/lib/supabase/server": { getSupabaseServerClient: () => ({ rpc: async (name: string, payload: Record<string,unknown>) => {
      calls.push({ name, country: payload.p_country_code, aggregate: payload.p_include_in_community_map });
      return failCountry ? { data: null, error: { message: "private upstream detail" } } : { data: "isolated-pending-id", error: null };
    } }) },
  }, { process: { env: { SITE_URL: siteUrl, ECHOWALL_SUBMISSIONS_ENABLED: "true", ECHOWALL_FORM_TOKEN_SECRET: formSecret, ECHOWALL_IP_HASH_SECRET: "isolated-unit-hash-key", ECHOWALL_COUNTRY_CONTEXT_ENABLED: String(flag) } } });
  const form = (country?: string) => {
    const data = new FormData();
    for (const [key,value] of Object.entries({ ...valid, formToken: security.createFormToken(formSecret, Date.now()-4_000), ...(country ? {countryCode:country,includeInCommunityMap:"true"} : {}) })) data.set(key,value);
    return data;
  };
  return { calls, send: (country?: string) => api.submitEchoAction(null,form(country)) };
}

test("server country switch rejects forged declarations and preserves the legacy submission path", async () => {
  const disabled=submission(false);
  assert.deepEqual(await disabled.send("DE"),{ok:false,code:"SERVICE_UNAVAILABLE"});
  assert.equal(disabled.calls.length,0);
  assert.equal((await disabled.send())?.ok,true);
  assert.equal(disabled.calls[0].name,"submit_echo");
});

test("country submissions use the service wrapper once and never silently retry without the declaration", async () => {
  const enabled=submission(true);
  assert.equal((await enabled.send("DE"))?.ok,true);
  assert.deepEqual(enabled.calls,[{name:"submit_echo_with_country",country:"DE",aggregate:true}]);
  const missing=submission(true,true);
  assert.deepEqual(await missing.send("DE"),{ok:false,code:"SERVICE_UNAVAILABLE"});
  assert.equal(missing.calls.length,1);
  assert.equal(missing.calls[0].name,"submit_echo_with_country");
});

test("invalid country is localized and rejected before any submission RPC", async () => {
  const enabled=submission(true);
  const result=await enabled.send("XX");
  assert.ok(result && !result.ok && result.code==="INVALID_INPUT" && result.fieldErrors?.countryCode);
  assert.equal(enabled.calls.length,0);
});

test("pending SQL and localized country inputs accept exactly the same ISO country set", () => {
  const sql=readFileSync("supabase/pending-migrations/20261111190134_echowall_voluntary_country.sql","utf8");
  const codes=[...sql.matchAll(/'([A-Z]{2})'/gu)].map(match=>match[1]);
  assert.deepEqual(codes.sort(),echoCountryOptions("en").map(({code})=>code).sort());
});
