import assert from "node:assert/strict";
import { test } from "node:test";
import { echoCountryName, echoCountryOptions, isEchoCountry, summarizeEchoCountries } from "../lib/echowall/countries";
import { validateEchoSubmission } from "../lib/echowall/validation";
import { locales } from "../lib/i18n/config";
import { isPublicEchoReady } from "../lib/public-content-hygiene";
import { echoCategories, type PublicEcho, type PublicEchoQueryResult } from "../types/echowall";
import { loadSource } from "./helpers/load-source";

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
    "next/cache": { unstable_cache: (fn: EchoQuery) => fn },
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
